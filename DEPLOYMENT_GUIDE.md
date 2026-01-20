# CareerPulse Deployment Guide

Complete guide for deploying CareerPulse to production.

## Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Security Hardening](#security-hardening)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Pre-Deployment Checklist

### ✅ Code Preparation

- [ ] All tests passing (`npm test` in both frontend and backend)
- [ ] No console.log statements in production code
- [ ] Environment variables documented
- [ ] API keys secured (not in code)
- [ ] Database migrations tested
- [ ] Error handling implemented
- [ ] Logging configured

### ✅ Security Review

- [ ] OAuth redirect URIs updated for production domain
- [ ] CORS configured for production frontend URL
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers configured
- [ ] Session secrets are strong random strings
- [ ] JWT secrets are strong random strings
- [ ] API keys rotated from development keys
- [ ] HTTPS enforced

### ✅ Performance Optimization

- [ ] Frontend built for production (`npm run build`)
- [ ] Static assets optimized
- [ ] Database indexes created
- [ ] LLM cache configured
- [ ] API response caching considered

---

## Environment Setup

### Production Environment Variables

Create `backend/.env.production`:

```env
# Server
NODE_ENV=production
PORT=3001

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/gmail/callback

# Google AI
GOOGLE_AI_API_KEY=your_production_gemini_key

# Security (MUST be different from development)
SESSION_SECRET=<generate-strong-random-string>
JWT_SECRET=<generate-strong-random-string>

# Database
DATABASE_PATH=./database/careerpulse.db

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Optional: Monitoring
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_if_using
```

**Generate strong secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Google Cloud Console Setup

1. **Update OAuth Redirect URIs**:
   - Go to Google Cloud Console → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add production redirect URI: `https://yourdomain.com/api/auth/gmail/callback`
   - Keep localhost URI for development

2. **Verify Domain**:
   - Add your production domain to authorized domains
   - Configure OAuth consent screen with production details

3. **API Quotas**:
   - Review Gmail API quotas
   - Review Gemini API quotas
   - Set up billing alerts if needed

---

## Deployment Options

### Option 1: Railway (Recommended for Quick Deploy)

**Pros**: Easy setup, automatic HTTPS, good free tier  
**Cons**: Limited free tier, can be expensive at scale

#### Steps:

1. **Prepare for Railway**:
   ```bash
   # Add Procfile for backend
   echo "web: cd backend && npm start" > Procfile
   ```

2. **Deploy**:
   - Connect GitHub repository to Railway
   - Add environment variables in Railway dashboard
   - Deploy backend and frontend as separate services

3. **Configure**:
   - Set custom domain (optional)
   - Configure environment variables
   - Enable automatic deployments

### Option 2: Heroku

**Pros**: Mature platform, good documentation  
**Cons**: No free tier anymore, can be expensive

#### Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Apps**:
   ```bash
   # Backend
   heroku create careerpulse-api
   
   # Frontend
   heroku create careerpulse-app
   ```

3. **Configure Backend**:
   ```bash
   cd backend
   heroku config:set GOOGLE_CLIENT_ID=xxx
   heroku config:set GOOGLE_CLIENT_SECRET=xxx
   heroku config:set GOOGLE_AI_API_KEY=xxx
   heroku config:set SESSION_SECRET=xxx
   heroku config:set JWT_SECRET=xxx
   git push heroku main
   ```

4. **Configure Frontend**:
   ```bash
   # Update API_URL in services/api.ts to point to backend
   heroku config:set VITE_API_URL=https://careerpulse-api.herokuapp.com
   git push heroku main
   ```

### Option 3: VPS (DigitalOcean, Linode, AWS EC2)

**Pros**: Full control, cost-effective at scale  
**Cons**: More setup required, need to manage server

#### Steps:

1. **Provision Server**:
   - Ubuntu 22.04 LTS recommended
   - Minimum: 1GB RAM, 1 CPU
   - Recommended: 2GB RAM, 2 CPU

2. **Install Dependencies**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx for reverse proxy
   sudo apt install -y nginx
   ```

3. **Deploy Application**:
   ```bash
   # Clone repository
   git clone https://github.com/bthaas/careerpulse.git
   cd careerpulse
   
   # Install dependencies
   npm install
   cd backend && npm install && cd ..
   
   # Build frontend
   npm run build
   
   # Configure environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with production values
   ```

4. **Configure PM2**:
   ```bash
   # Start backend
   cd backend
   pm2 start server.js --name careerpulse-api
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**:
   ```nginx
   # /etc/nginx/sites-available/careerpulse
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Frontend
       location / {
           root /path/to/careerpulse/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable HTTPS with Let's Encrypt**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 4: Docker

**Pros**: Consistent environment, easy scaling  
**Cons**: Requires Docker knowledge

#### Dockerfile (Backend):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

EXPOSE 3001

CMD ["node", "server.js"]
```

#### Dockerfile (Frontend):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### docker-compose.yml:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/database:/app/database
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## Security Hardening

### 1. Environment Variables

**Never commit secrets to git**:
```bash
# Add to .gitignore
backend/.env
backend/.env.production
.env.local
```

### 2. Rate Limiting

Already configured in `backend/server.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

Update for production in `backend/server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 4. Helmet Security Headers

Already configured:
```javascript
import helmet from 'helmet';
app.use(helmet());
```

### 5. Database Security

- Regular backups
- Encrypted at rest (if using cloud storage)
- Access controls
- Connection pooling

### 6. API Key Rotation

- Rotate keys every 90 days
- Use different keys for dev/staging/production
- Monitor API usage for anomalies

---

## Monitoring and Maintenance

### Logging

**Production logging setup**:
```javascript
// backend/server.js
import morgan from 'morgan';

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### Health Checks

Already implemented at `/api/health`:
```bash
curl https://yourdomain.com/api/health
```

### Monitoring Services (Optional)

1. **Sentry** - Error tracking
2. **LogRocket** - Session replay
3. **Datadog** - Infrastructure monitoring
4. **UptimeRobot** - Uptime monitoring

### Database Backups

**Automated backup script**:
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_PATH="/path/to/careerpulse/backend/database/careerpulse.db"

# Create backup
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/careerpulse_$DATE.db'"

# Keep only last 30 days
find $BACKUP_DIR -name "careerpulse_*.db" -mtime +30 -delete

echo "Backup completed: careerpulse_$DATE.db"
```

**Schedule with cron**:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

### Performance Monitoring

**Key metrics to track**:
- API response times
- Email sync duration
- LLM API latency
- Database query performance
- Error rates
- User activity

### Cost Monitoring

**Gemini API costs**:
- Monitor usage in Google Cloud Console
- Set up billing alerts
- Expected: ~$0.30/month per active user

**Infrastructure costs**:
- Server/hosting fees
- Database storage
- Bandwidth usage

---

## Rollback Plan

### Quick Rollback

**If using Git-based deployment**:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

**If using PM2**:
```bash
# Restart with previous version
pm2 stop careerpulse-api
git checkout <previous-commit>
npm install
pm2 start server.js --name careerpulse-api
```

### Database Rollback

```bash
# Restore from backup
sqlite3 careerpulse.db < backup_file.sql
```

---

## Post-Deployment Checklist

- [ ] All services running
- [ ] Health check endpoint responding
- [ ] OAuth flow working with production domain
- [ ] Email sync working
- [ ] LLM extraction working
- [ ] Database backups configured
- [ ] Monitoring/logging active
- [ ] SSL certificate valid
- [ ] Error tracking configured
- [ ] Performance acceptable
- [ ] Documentation updated

---

## Troubleshooting Production Issues

### Check Logs

```bash
# PM2 logs
pm2 logs careerpulse-api

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u careerpulse-api -f
```

### Common Issues

1. **OAuth redirect mismatch**: Update redirect URI in Google Cloud Console
2. **CORS errors**: Check FRONTEND_URL in backend .env
3. **Database locked**: Ensure only one backend instance running
4. **High memory usage**: Check LLM cache size, restart if needed
5. **Slow email sync**: Check Gemini API latency, consider reducing maxResults

---

## Support

For deployment issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review server logs
3. Test components individually
4. Open GitHub issue with deployment details

---

**Last Updated**: January 19, 2026
