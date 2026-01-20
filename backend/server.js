import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { loadSecrets } from './config/secrets.js';

// Load environment variables
dotenv.config();

// Global secrets storage
let secrets = {};

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Railway/production environments behind reverse proxies
// This allows rate limiters and security features to work correctly
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// ====================
// Security Middleware
// ====================

// 1. Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
}));

// 2. Request Logging (Morgan)
if (process.env.NODE_ENV === 'production') {
  // Production: Log only errors
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
} else {
  // Development: Log all requests
  app.use(morgan('dev'));
}

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.use('/api/user/login', authLimiter);
app.use('/api/user/signup', authLimiter);

// ====================
// CORS Configuration
// ====================

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://jobfetch.app', 'https://www.jobfetch.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like OAuth callbacks, mobile apps, Postman)
    // OAuth redirects from Google don't include an Origin header
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ====================
// Body Parsing & Cookies
// ====================

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ====================
// Session Configuration
// ====================

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' allows cross-site cookies (required for subdomain setup)
    domain: process.env.NODE_ENV === 'production' ? '.jobfetch.app' : undefined, // Share cookies across subdomains
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import routes
import applicationsRouter from './routes/applications.js';
import authRouter from './routes/auth.js';
import googleAuthRouter from './routes/googleAuth.js';
import emailRouter from './routes/email.js';
import userRouter from './routes/user.js';

// Register routes
app.use('/api/user', userRouter); // Public routes (signup/login)
app.use('/api/auth', authRouter); // Gmail OAuth routes (protected)
app.use('/api/auth', googleAuthRouter); // Google Sign-In OAuth (public callback)
app.use('/api/applications', applicationsRouter); // Application routes (protected)
app.use('/api/email', emailRouter); // Email sync routes (protected)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server with secrets
async function startServer() {
  try {
    // Load secrets from Google Cloud Secret Manager or .env
    console.log('🔐 Loading application secrets...');
    secrets = await loadSecrets();
    
    // Make secrets available globally
    global.appSecrets = secrets;
    
    // Update process.env with loaded secrets (for backward compatibility)
    Object.assign(process.env, secrets);
    
    app.listen(PORT, () => {
      console.log(`🚀 JobFetch backend running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 Secrets loaded from: ${process.env.USE_SECRET_MANAGER === 'true' ? 'Google Cloud' : '.env file'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export secrets getter for other modules
export function getSecrets() {
  return global.appSecrets || {};
}

startServer();

export default app;
