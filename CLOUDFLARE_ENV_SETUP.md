# Cloudflare Pages Environment Variable Setup

## Issue
The frontend needs to know where the backend API is located.

## Solution
Set the `VITE_API_URL` environment variable in Cloudflare Pages.

## Steps

### Via Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Click on **Workers & Pages** in the left sidebar
3. Find and click on your **jobfetch** project
4. Click on **Settings** tab
5. Scroll down to **Environment Variables** section
6. Click **Add variable** or **Edit variables**
7. Add the following:
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://api.jobfetch.app`
   - **Environment**: Production (and Preview if you want)
8. Click **Save**
9. Go back to **Deployments** tab
10. Click **Retry deployment** on the latest deployment (or push a new commit to trigger rebuild)

### Important Notes

- **VITE_API_URL** must NOT have a trailing slash
- **VITE_API_URL** must NOT include `/api` at the end
- ✅ Correct: `https://api.jobfetch.app`
- ❌ Wrong: `https://api.jobfetch.app/`
- ❌ Wrong: `https://api.jobfetch.app/api`

The frontend code automatically adds `/api/auth/google` to the URL.

## After Setting Environment Variable

**Important**: Cloudflare Pages needs to rebuild the site to pick up the new environment variable.

### Option 1: Trigger Rebuild via Dashboard
1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment

### Option 2: Push a New Commit
```bash
# Make a small change and push
git commit --allow-empty -m "Trigger Cloudflare rebuild"
git push origin main
```

## Verification

After the rebuild completes:

1. Go to https://jobfetch.app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Type: `import.meta.env.VITE_API_URL`
5. Press Enter
6. It should show: `"https://api.jobfetch.app"`

If it shows `undefined`, the environment variable wasn't set correctly or the site wasn't rebuilt.

## Testing the Full Flow

Once the environment variable is set and site is rebuilt:

### Test 1: Google Sign-In
1. Go to https://jobfetch.app
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, you should be logged in

### Test 2: Gmail Connection (After Logging In)
1. Log in with email/password or Google
2. Click "Connect Gmail" or similar button
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, Gmail should be connected
5. You should see "Gmail Connected!" message

## Troubleshooting

**"Failed to initiate Google sign-in"**
- Check browser console for the actual error
- Verify `VITE_API_URL` is set in Cloudflare Pages
- Verify the site was rebuilt after setting the variable
- Test backend directly: `curl https://api.jobfetch.app/api/auth/google`

**Environment variable not working**
- Cloudflare Pages requires a rebuild to pick up new environment variables
- Unlike server-side variables, Vite environment variables are baked into the build
- You must trigger a new deployment after changing them

**CORS errors**
- Backend already allows `https://jobfetch.app`
- Make sure you're accessing via the correct domain
- Check if Cloudflare is proxying correctly

## Local Development

For local development, create `.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Then restart your dev server:
```bash
npm run dev
```

## Current Deployment Status

- ✅ Backend: Railway at https://api.jobfetch.app
- ✅ Frontend: Cloudflare Pages at https://jobfetch.app
- ⏳ Environment Variable: Needs to be set in Cloudflare Pages
- ⏳ Rebuild: Required after setting environment variable
