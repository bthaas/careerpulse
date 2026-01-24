# Google Sign-In Troubleshooting

## Error: "Failed to initiate Google sign-in"

This error means the backend couldn't generate the Google OAuth URL. Here's how to fix it:

## ✅ Solution: Add Environment Variables to Railway

### Step 1: Check if Variables are Set

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your **backend service**
3. Go to **Variables** tab
4. Check if these exist:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Step 2: Add Missing Variables

If they're missing, add them:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Important**: After adding variables, Railway will automatically redeploy. Wait 2-3 minutes.

### Step 3: Verify Backend is Running

Test the endpoint directly:

```bash
curl https://api.jobfetch.app/api/auth/google
```

**Expected response** (if working):
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Error response** (if not working):
```json
{
  "error": "Failed to generate authorization URL"
}
```

### Step 4: Check Railway Logs

If still not working:

1. Railway Dashboard → Your Service → **Deployments**
2. Click latest deployment
3. View **Logs**
4. Look for errors like:
   - `GOOGLE_CLIENT_ID is not defined`
   - `Error generating Google auth URL`

## Common Issues

### Issue 1: Variables Not Set

**Symptom**: Error immediately when clicking "Sign in with Google"

**Solution**: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Railway Variables

### Issue 2: Wrong Redirect URI

**Symptom**: Google shows "redirect_uri_mismatch" error

**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth client
3. Add to **Authorized redirect URIs**:
   ```
   https://api.jobfetch.app/api/auth/google/callback
   ```
4. Save

### Issue 3: API_URL Not Set

**Symptom**: Redirect goes to wrong URL

**Solution**: Add to Railway Variables:
```bash
API_URL=https://api.jobfetch.app
```

### Issue 4: CORS Error

**Symptom**: Browser console shows CORS error

**Solution**: Check `FRONTEND_URL` in Railway:
```bash
FRONTEND_URL=https://jobfetch.app
```

## Testing Checklist

- [ ] `GOOGLE_CLIENT_ID` set in Railway
- [ ] `GOOGLE_CLIENT_SECRET` set in Railway
- [ ] `API_URL=https://api.jobfetch.app` set in Railway
- [ ] `FRONTEND_URL=https://jobfetch.app` set in Railway
- [ ] Redirect URI added to Google Cloud Console
- [ ] Railway deployment completed (check Deployments tab)
- [ ] Backend health check works: `curl https://api.jobfetch.app/api/health`
- [ ] Google auth endpoint works: `curl https://api.jobfetch.app/api/auth/google`

## Quick Fix Commands

```bash
# Test backend health
curl https://api.jobfetch.app/api/health

# Test Google auth endpoint
curl https://api.jobfetch.app/api/auth/google

# Should return JSON with authUrl, not an error
```

## Still Not Working?

1. **Check Railway Logs**: Look for specific error messages
2. **Verify Variables**: Make sure no typos in variable names
3. **Wait for Deployment**: Railway takes 2-3 minutes to redeploy after adding variables
4. **Clear Browser Cache**: Sometimes old errors are cached
5. **Try Incognito Mode**: Rules out browser extension issues

## Expected Flow

When working correctly:

1. User clicks "Sign in with Google" on https://jobfetch.app
2. Frontend calls `https://api.jobfetch.app/api/auth/google`
3. Backend returns `{ "authUrl": "https://accounts.google.com/..." }`
4. Frontend redirects to Google
5. User signs in and grants permissions
6. Google redirects to `https://api.jobfetch.app/api/auth/google/callback`
7. Backend creates/logs in user
8. Backend redirects to `https://jobfetch.app?token=...`
9. Frontend saves token and shows dashboard

## Need More Help?

Check Railway logs for the exact error message and share it for more specific help.
