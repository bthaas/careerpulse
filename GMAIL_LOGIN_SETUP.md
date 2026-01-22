# Gmail Login Setup Guide

## 🚀 Production Setup (Your Live Site)

Your app is deployed at:
- **Frontend**: https://jobfetch.app
- **Backend**: https://api.jobfetch.app

## Quick Start - Production

### Step 1: Add Google OAuth Credentials to Railway

1. Go to your [Railway dashboard](https://railway.app)
2. Click on your backend service
3. Go to **Variables** tab
4. Add these variables:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/gmail/callback
GOOGLE_AI_API_KEY=your-gemini-api-key-here
```

5. Railway will auto-redeploy (takes 2-3 minutes)

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://api.jobfetch.app/api/auth/gmail/callback
   ```
4. Click **Save**

### Step 3: Test Gmail Login on Production

1. Go to **https://jobfetch.app**
2. Sign up or log in
3. Click "Connect Gmail" button
4. Complete Google OAuth flow
5. Done! 🎉

---

## 💻 Local Development Setup (Optional)

If you want to test locally before deploying:

### Step 1: Start the Backend Server

```bash
cd backend
npm install  # if not already done
npm start
```

The backend should start on `http://localhost:3001`

### Step 2: Start the Frontend

```bash
# In a new terminal, from the project root
npm install  # if not already done
npm run dev
```

The frontend should start on `http://localhost:5173`

### Step 3: Test Gmail Login Locally

1. Open your browser to `http://localhost:5173`
2. Click the "Connect Gmail" or "Sign in with Google" button
3. You'll be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant permissions to access Gmail
6. You'll be redirected back to your app

## Current OAuth Configuration

### Production (Railway)
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/gmail/callback
```

### Local Development
Your `.env` file has these credentials for local testing:
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback
```

## How It Works

### Backend Flow

1. **Initiate OAuth**: `GET /api/auth/gmail`
   - Generates OAuth URL with required scopes
   - Redirects user to Google consent screen

2. **Handle Callback**: `GET /api/auth/gmail/callback`
   - Receives authorization code from Google
   - Exchanges code for access/refresh tokens
   - Saves tokens to database
   - Creates/updates user account
   - Redirects to frontend with success

3. **Check Status**: `GET /api/auth/gmail/status`
   - Returns current connection status
   - Shows connected email address

4. **Disconnect**: `POST /api/auth/gmail/disconnect`
   - Removes Gmail connection
   - Keeps user account

### Frontend Flow

The frontend should have a button that triggers the OAuth flow:

```javascript
// Example: Connect Gmail button
const handleConnectGmail = async () => {
  // Redirect to backend OAuth endpoint
  window.location.href = 'http://localhost:3001/api/auth/gmail';
};
```

## Testing the Setup

### Option 1: Using the Frontend UI

1. Start both servers (backend and frontend)
2. Navigate to `http://localhost:5173`
3. Click "Connect Gmail" button
4. Complete OAuth flow

### Option 2: Direct Backend Testing

You can test the backend directly:

```bash
# Open this URL in your browser
open http://localhost:3001/api/auth/gmail
```

This will:
1. Redirect you to Google's consent screen
2. After approval, redirect back to `/api/auth/gmail/callback`
3. Save your credentials
4. Redirect to frontend

### Option 3: Using the Test Script

There's a helper script for testing:

```bash
cd backend
node scripts/quick-connect-gmail.js
```

This will:
- Start a temporary server
- Open OAuth URL in your browser
- Handle the callback
- Display connection status

## Verifying the Connection

### Production (Live Site)

After connecting on https://jobfetch.app, verify it worked:

```bash
# Check API status (replace YOUR_JWT_TOKEN with your actual token from login)
curl https://api.jobfetch.app/api/auth/gmail/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should return:
```json
{
  "connected": true,
  "email": "your-email@gmail.com"
}
```

### Local Development

After connecting locally, you can verify:

```bash
# Check database
cd backend
sqlite3 database/careerpulse.db "SELECT * FROM email_connections;"

# Check API status
curl http://localhost:3001/api/auth/gmail/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: "Redirect URI mismatch"

**Problem**: Google shows error about redirect URI not matching

**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add `http://localhost:3001/api/auth/gmail/callback` to Authorized redirect URIs
4. Save changes

### Issue: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured

**Solution**:
1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Configure the consent screen
3. Add your email as a test user (for development)
4. Save changes

### Issue: "Insufficient permissions"

**Problem**: Required Gmail API scopes not enabled

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Search for "Gmail API"
3. Click "Enable"
4. Wait a few minutes for propagation

### Issue: Backend not starting

**Problem**: Missing dependencies or environment variables

**Solution**:
```bash
cd backend
npm install
# Make sure .env file exists with all required variables
npm start
```

### Issue: "Cannot read property 'setCredentials'"

**Problem**: GmailService not properly initialized

**Solution**: The container should auto-initialize. Check:
```bash
# In backend/services/container.js
# Make sure gmailService is exported and initialized
```

## Required Google Cloud Setup

If you need to create new OAuth credentials:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Note the project ID

### 2. Enable Gmail API

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search for "Gmail API"
3. Click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type
3. Fill in app information:
   - App name: "CareerPulse" (or your app name)
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (your Gmail address)
6. Save

### 4. Create OAuth 2.0 Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/gmail/callback`
   - `http://localhost:3000/api/auth/gmail/callback` (if using different port)
5. Click "Create"
6. Copy Client ID and Client Secret
7. Update `backend/.env` with these values

## Security Notes

### Development vs Production

**Development** (current setup):
- Uses `http://localhost` URLs
- OAuth app in "Testing" mode
- Limited to test users only

**Production** (when deploying):
- Must use `https://` URLs
- OAuth app must be verified by Google (for public use)
- Update redirect URIs in Google Cloud Console
- Update `GOOGLE_REDIRECT_URI` in production environment

### Protecting Credentials

- ✅ `.env` is in `.gitignore` (credentials not committed)
- ✅ Use environment variables in production
- ✅ Rotate secrets regularly
- ✅ Use different credentials for dev/staging/production

## Next Steps

After Gmail login works:

1. **Test Email Fetching**:
   ```bash
   # After connecting Gmail
   curl http://localhost:3001/api/email/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **View Fetched Applications**:
   ```bash
   curl http://localhost:3001/api/applications \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Check Email Parsing**:
   - The system will automatically parse job-related emails
   - Uses LLM (Gemini) for intelligent extraction
   - Creates application records in database

## Support

If you encounter issues:

1. Check backend logs for errors
2. Verify all environment variables are set
3. Ensure Google Cloud APIs are enabled
4. Check OAuth consent screen configuration
5. Verify redirect URIs match exactly

For more details, see:
- `backend/OOP_ARCHITECTURE.md` - Service architecture
- `backend/GEMINI_SETUP.md` - LLM configuration
- `backend/routes/googleAuth.js` - OAuth implementation
