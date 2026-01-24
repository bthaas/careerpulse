# Vercel Environment Variable Setup

## Issue
Google Sign-In is failing because the frontend doesn't know the backend API URL.

## Solution
Set the `VITE_API_URL` environment variable in Vercel.

## Steps

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your `jobfetch` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add a new environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://api.jobfetch.app`
   - **Environments**: Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click the **...** menu on the latest deployment
9. Click **Redeploy**

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://api.jobfetch.app

# Also set for preview and development
vercel env add VITE_API_URL preview
# Enter: https://api.jobfetch.app

vercel env add VITE_API_URL development
# Enter: http://localhost:3001

# Redeploy
vercel --prod
```

## Verification

After redeployment:

1. Go to https://jobfetch.app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Click "Sign in with Google"
5. Check the Network tab for the request to `/api/auth/google`
6. It should return a JSON response with `authUrl`
7. You should be redirected to Google's OAuth consent screen

## Important Notes

- **VITE_API_URL** must NOT have a trailing slash
- **VITE_API_URL** must NOT include `/api` at the end
- Correct: `https://api.jobfetch.app`
- Wrong: `https://api.jobfetch.app/`
- Wrong: `https://api.jobfetch.app/api`

The code adds `/api/auth/google` to the URL automatically.

## Testing Locally

For local development:

1. Create `.env.local` file in project root:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Test Google Sign-In at http://localhost:5173

## Troubleshooting

**"Failed to initiate Google sign-in"**
- Check browser console for actual error
- Verify VITE_API_URL is set in Vercel
- Verify backend is running at https://api.jobfetch.app
- Test backend directly: `curl https://api.jobfetch.app/api/auth/google`

**CORS errors**
- Backend already allows https://jobfetch.app
- Make sure you're accessing via https://jobfetch.app (not www subdomain)

**"Cannot read properties of undefined"**
- Environment variable not set or not loaded
- Redeploy after setting environment variables
- Vite requires restart to pick up new env vars
