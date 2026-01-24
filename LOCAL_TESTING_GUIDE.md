# Local Testing Guide - Backend Only

This guide shows you how to test the entire backend locally without needing frontend access, and how to easily switch between localhost and production.

## Table of Contents
1. [Setup Local Environment](#setup-local-environment)
2. [Test Authentication Flow](#test-authentication-flow)
3. [Test Google Sign-In OAuth](#test-google-sign-in-oauth)
4. [Test Gmail Connection OAuth](#test-gmail-connection-oauth)
5. [Test Email Syncing](#test-email-syncing)
6. [Switching Between Localhost and Production](#switching-between-localhost-and-production)

---

## Setup Local Environment

### 1. Configure Environment Variables

Edit `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./database/careerpulse.db

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Google AI (for LLM parsing)
GOOGLE_AI_API_KEY=your-gemini-api-key

# URLs
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

### 2. Start the Backend

```bash
cd backend
npm install
npm start
```

You should see:
```
🚀 JobFetch backend running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health
```

### 3. Verify Backend is Running

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-22T...",
  "version": "1.0.0"
}
```

---

## Test Authentication Flow

### 1. Create a Test User (Signup)

```bash
curl -X POST http://localhost:3001/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-1234567890",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Save the token** - you'll need it for authenticated requests!

### 2. Test Login

```bash
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Expected response: Same as signup (with token)

### 3. Test Protected Endpoint

```bash
# Replace YOUR_TOKEN with the token from signup/login
curl http://localhost:3001/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "id": "user-1234567890",
  "email": "test@example.com",
  "name": "Test User"
}
```

---

## Test Google Sign-In OAuth

### 1. Get OAuth URL

```bash
curl http://localhost:3001/api/auth/google
```

Expected response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=..."
}
```

### 2. Test OAuth Flow (Browser Required)

1. Copy the `authUrl` from the response
2. Open it in your browser
3. Sign in with Google
4. You'll be redirected to: `http://localhost:5173?token=...`
5. Extract the token from the URL

**Note**: The redirect goes to localhost:5173 (frontend), but you can extract the token from the URL and use it directly.

### 3. Alternative: Manual OAuth Testing

If you want to test without a browser, you can use the callback directly:

```bash
# This won't work directly because you need a valid OAuth code from Google
# But this shows the endpoint structure
curl "http://localhost:3001/api/auth/google/callback?code=OAUTH_CODE"
```

---

## Test Gmail Connection OAuth

This is the main flow you want to test!

### 1. Get Gmail OAuth URL (Authenticated)

```bash
# Replace YOUR_TOKEN with your JWT token
curl http://localhost:3001/api/auth/gmail \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/gmail.readonly..."
}
```

### 2. Complete OAuth Flow (Browser Required)

1. Copy the `authUrl` from the response
2. Open it in your browser
3. Sign in with Google
4. Grant Gmail permissions
5. You'll be redirected to the callback URL
6. You should see: "✅ Gmail Connected!"

### 3. Verify Gmail Connection

```bash
curl http://localhost:3001/api/auth/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "connected": true,
  "email": "your-gmail@gmail.com"
}
```

### 4. Test Gmail Disconnection

```bash
curl -X POST http://localhost:3001/api/auth/disconnect \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Email disconnected successfully"
}
```

---

## Test Email Syncing

### 1. Sync Emails from Gmail

```bash
curl -X POST http://localhost:3001/api/email/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "emailsProcessed": 15,
  "applicationsCreated": 3,
  "duplicatesSkipped": 2,
  "message": "Email sync completed successfully"
}
```

### 2. Get All Applications

```bash
curl http://localhost:3001/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
[
  {
    "id": "app-123",
    "company": "Google",
    "role": "Software Engineer",
    "status": "Applied",
    "dateApplied": "2024-01-15",
    "source": "Email",
    "confidenceScore": 95
  },
  ...
]
```

### 3. Create Manual Application

```bash
curl -X POST http://localhost:3001/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Microsoft",
    "role": "Senior Developer",
    "status": "Applied",
    "location": "Seattle, WA",
    "dateApplied": "2024-01-22",
    "source": "Manual"
  }'
```

---

## Switching Between Localhost and Production

### Environment Variables to Change

| Variable | Localhost | Production |
|----------|-----------|------------|
| `API_URL` | `http://localhost:3001` | `https://api.jobfetch.app` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://jobfetch.app` |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3001/api/auth/google/callback` | `https://api.jobfetch.app/api/auth/google/callback` |
| `NODE_ENV` | `development` | `production` |

### Quick Switch Script

Create `backend/switch-env.sh`:

```bash
#!/bin/bash

if [ "$1" == "local" ]; then
  echo "Switching to LOCAL environment..."
  export API_URL="http://localhost:3001"
  export FRONTEND_URL="http://localhost:5173"
  export GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
  export NODE_ENV="development"
  echo "✅ Switched to LOCAL"
elif [ "$1" == "prod" ]; then
  echo "Switching to PRODUCTION environment..."
  export API_URL="https://api.jobfetch.app"
  export FRONTEND_URL="https://jobfetch.app"
  export GOOGLE_REDIRECT_URI="https://api.jobfetch.app/api/auth/google/callback"
  export NODE_ENV="production"
  echo "✅ Switched to PRODUCTION"
else
  echo "Usage: ./switch-env.sh [local|prod]"
fi
```

Usage:
```bash
chmod +x backend/switch-env.sh
source backend/switch-env.sh local   # Switch to localhost
source backend/switch-env.sh prod    # Switch to production
```

### Frontend Environment Variables

When you get frontend access, create these files:

**`.env.local`** (for localhost):
```env
VITE_API_URL=http://localhost:3001
```

**`.env.production`** (for production):
```env
VITE_API_URL=https://api.jobfetch.app
```

Vite automatically uses:
- `.env.local` when running `npm run dev`
- `.env.production` when running `npm run build`

---

## Testing Checklist

Use this checklist to verify everything works:

### Backend Setup
- [ ] Backend starts without errors
- [ ] Health check endpoint responds
- [ ] Database initializes successfully

### Authentication
- [ ] Can create new user (signup)
- [ ] Can login with email/password
- [ ] JWT token is generated correctly
- [ ] Protected endpoints require authentication
- [ ] Invalid tokens are rejected

### Google Sign-In OAuth
- [ ] Can get Google OAuth URL
- [ ] OAuth flow redirects correctly
- [ ] User is created/logged in after OAuth
- [ ] JWT token is generated after OAuth

### Gmail Connection OAuth
- [ ] Can get Gmail OAuth URL (requires auth)
- [ ] OAuth flow redirects correctly
- [ ] Gmail connection is saved to database
- [ ] Connection status endpoint works
- [ ] Can disconnect Gmail

### Email Syncing
- [ ] Can sync emails from Gmail
- [ ] Job emails are parsed correctly
- [ ] Applications are created in database
- [ ] Duplicates are detected and skipped
- [ ] Can retrieve all applications

### CRUD Operations
- [ ] Can create manual application
- [ ] Can read all applications
- [ ] Can update application
- [ ] Can delete application

---

## Common Issues and Solutions

### Issue: "Authentication required"
**Solution**: Make sure you're including the JWT token in the Authorization header:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Invalid or expired token"
**Solution**: Get a fresh token by logging in again:
```bash
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

### Issue: "No Gmail connection found"
**Solution**: Complete the Gmail OAuth flow first:
1. Get OAuth URL: `GET /api/auth/gmail`
2. Open URL in browser
3. Authorize Gmail access
4. Verify connection: `GET /api/auth/status`

### Issue: "Failed to sync emails"
**Solution**: Check that:
- Gmail is connected (`GET /api/auth/status`)
- Token hasn't expired
- Gmail API credentials are correct in `.env`

### Issue: OAuth redirect goes to wrong URL
**Solution**: Check `GOOGLE_REDIRECT_URI` in `.env` matches your environment:
- Local: `http://localhost:3001/api/auth/google/callback`
- Production: `https://api.jobfetch.app/api/auth/google/callback`

---

## Next Steps

Once you have frontend access:

1. **Set frontend environment variable**:
   - Cloudflare Pages: Set `VITE_API_URL` in dashboard
   - Local: Create `.env.local` with `VITE_API_URL=http://localhost:3001`

2. **Test full integration**:
   - Frontend can call backend APIs
   - OAuth flows work end-to-end
   - User can see their applications

3. **Deploy**:
   - Backend is already on Railway
   - Frontend needs `VITE_API_URL` set in Cloudflare
   - Trigger rebuild after setting environment variable

---

## Quick Reference: API Endpoints

### Public Endpoints (No Auth Required)
- `POST /api/user/signup` - Create account
- `POST /api/user/login` - Login
- `GET /api/auth/google` - Get Google Sign-In OAuth URL
- `GET /api/auth/google/callback` - Google Sign-In callback
- `GET /api/health` - Health check

### Protected Endpoints (Auth Required)
- `GET /api/user/me` - Get current user
- `GET /api/auth/gmail` - Get Gmail OAuth URL
- `GET /api/auth/gmail/callback` - Gmail OAuth callback
- `GET /api/auth/status` - Check Gmail connection status
- `POST /api/auth/disconnect` - Disconnect Gmail
- `POST /api/email/sync` - Sync emails from Gmail
- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

---

## Testing with Postman/Insomnia

If you prefer a GUI, import this collection:

1. Create a new request collection
2. Set base URL: `http://localhost:3001`
3. Create an environment variable: `token`
4. After login, save the token to the environment
5. Use `{{token}}` in Authorization headers

Example requests are in the API Endpoints section above.
