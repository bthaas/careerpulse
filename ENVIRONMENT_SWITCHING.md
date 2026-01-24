# Environment Switching Guide

Quick reference for switching between localhost and production environments.

## Overview

Your app has two environments:
- **Localhost**: For local development and testing
- **Production**: Deployed on Railway (backend) and Cloudflare (frontend)

## Backend Environment Files

### File Structure
```
backend/
├── .env                    # Active environment (gitignored)
├── .env.local             # Localhost template
├── .env.production        # Production template
└── .env.example           # Example for reference
```

### Quick Switch

**Switch to Localhost:**
```bash
cd backend
cp .env.local .env
npm start
```

**Switch to Production (for testing):**
```bash
cd backend
cp .env.production .env
npm start
```

**Note**: Production backend is deployed on Railway, so you rarely need to run production env locally.

## Key Differences

| Setting | Localhost | Production |
|---------|-----------|------------|
| **Backend URL** | `http://localhost:3001` | `https://api.jobfetch.app` |
| **Frontend URL** | `http://localhost:5173` | `https://jobfetch.app` |
| **Google Redirect** | `http://localhost:3001/api/auth/google/callback` | `https://api.jobfetch.app/api/auth/google/callback` |
| **Database Path** | `./database/careerpulse.db` | `/app/database/jobfetch.db` |
| **Port** | `3001` | `8080` (Railway assigns) |
| **NODE_ENV** | `development` | `production` |

## Frontend Environment (When You Get Access)

### File Structure
```
frontend/
├── .env.local             # Localhost (gitignored)
├── .env.production        # Production (gitignored)
└── .env.example           # Example
```

### Localhost (.env.local)
```env
VITE_API_URL=http://localhost:3001
```

### Production (Cloudflare Pages Dashboard)
```env
VITE_API_URL=https://api.jobfetch.app
```

### How Vite Handles Environments

Vite automatically uses the correct file:
- `npm run dev` → Uses `.env.local`
- `npm run build` → Uses `.env.production`
- Cloudflare Pages → Uses environment variables from dashboard

## Testing Locally

### 1. Start Backend (Localhost)
```bash
cd backend
cp .env.local .env
npm start
```

Backend runs at: `http://localhost:3001`

### 2. Test Backend
```bash
# Run automated tests
chmod +x backend/test-local.sh
./backend/test-local.sh

# Or test manually
curl http://localhost:3001/api/health
```

### 3. Start Frontend (When Available)
```bash
cd frontend  # or root directory
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Testing Production

### Backend (Railway)
```bash
# Test production backend
curl https://api.jobfetch.app/api/health
```

### Frontend (Cloudflare)
```bash
# Visit in browser
open https://jobfetch.app
```

## Google OAuth Configuration

### Important: Redirect URIs

Your Google Cloud Console must have BOTH redirect URIs configured:

1. **Localhost**: `http://localhost:3001/api/auth/google/callback`
2. **Production**: `https://api.jobfetch.app/api/auth/google/callback`

To add these:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add both URLs
6. Click **Save**

## Common Workflows

### Workflow 1: Local Development
```bash
# 1. Start backend locally
cd backend
cp .env.local .env
npm start

# 2. In another terminal, start frontend
npm run dev

# 3. Open browser
open http://localhost:5173
```

### Workflow 2: Test Backend Only (No Frontend)
```bash
# 1. Start backend
cd backend
cp .env.local .env
npm start

# 2. Run test script
./test-local.sh

# 3. Or use curl/Postman to test endpoints
curl http://localhost:3001/api/health
```

### Workflow 3: Deploy to Production
```bash
# Backend (Railway auto-deploys from GitHub)
git add .
git commit -m "Your changes"
git push origin main
# Railway automatically deploys

# Frontend (Cloudflare auto-deploys from GitHub)
# Same push triggers Cloudflare deployment
```

## Environment Variable Checklist

### Backend Localhost
- [ ] `PORT=3001`
- [ ] `API_URL=http://localhost:3001`
- [ ] `FRONTEND_URL=http://localhost:5173`
- [ ] `GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback`
- [ ] `NODE_ENV=development`
- [ ] `DATABASE_PATH=./database/careerpulse.db`

### Backend Production (Railway)
- [ ] `PORT=8080` (or Railway assigned)
- [ ] `API_URL=https://api.jobfetch.app`
- [ ] `FRONTEND_URL=https://jobfetch.app`
- [ ] `GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/google/callback`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_PATH=/app/database/jobfetch.db`

### Frontend Localhost
- [ ] `VITE_API_URL=http://localhost:3001`

### Frontend Production (Cloudflare)
- [ ] `VITE_API_URL=https://api.jobfetch.app`

## Troubleshooting

### Issue: "CORS error"
**Cause**: Frontend URL doesn't match backend's allowed origins

**Solution**: 
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS configuration in `backend/server.js`
- For localhost: Should allow `http://localhost:5173`
- For production: Should allow `https://jobfetch.app`

### Issue: "OAuth redirect mismatch"
**Cause**: Google redirect URI doesn't match environment

**Solution**:
- Check `GOOGLE_REDIRECT_URI` in `.env`
- Verify it matches Google Cloud Console configuration
- Localhost: `http://localhost:3001/api/auth/google/callback`
- Production: `https://api.jobfetch.app/api/auth/google/callback`

### Issue: "Cannot connect to backend"
**Cause**: Frontend is using wrong API URL

**Solution**:
- Localhost: Check `.env.local` has `VITE_API_URL=http://localhost:3001`
- Production: Check Cloudflare has `VITE_API_URL=https://api.jobfetch.app`
- Remember: Vite requires rebuild after env var changes

### Issue: "Database not found"
**Cause**: Wrong database path for environment

**Solution**:
- Localhost: `DATABASE_PATH=./database/careerpulse.db`
- Production: `DATABASE_PATH=/app/database/jobfetch.db`

## Quick Reference Commands

```bash
# Switch to localhost
cd backend && cp .env.local .env && npm start

# Test backend
./backend/test-local.sh

# Check backend health
curl http://localhost:3001/api/health

# Check production health
curl https://api.jobfetch.app/api/health

# Deploy to production
git push origin main

# View Railway logs
# Go to Railway dashboard → Your project → Deployments → View logs

# View Cloudflare logs
# Go to Cloudflare dashboard → Workers & Pages → Your project → Logs
```

## Summary

**For Local Development:**
1. Copy `backend/.env.local` to `backend/.env`
2. Start backend: `npm start`
3. Test with `./test-local.sh` or curl
4. When you get frontend: Create `.env.local` with `VITE_API_URL=http://localhost:3001`

**For Production:**
1. Backend: Push to GitHub, Railway auto-deploys
2. Frontend: Set `VITE_API_URL=https://api.jobfetch.app` in Cloudflare dashboard
3. Trigger rebuild in Cloudflare

**Key Rule**: Always match the environment:
- Localhost backend → Localhost frontend
- Production backend → Production frontend
- Never mix environments!
