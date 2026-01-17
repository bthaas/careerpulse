import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { loadSecrets } from './config/secrets.js';

// Load environment variables
dotenv.config();

// Global secrets storage
let secrets = {};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://jobfetch.app', 'https://www.jobfetch.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
