# Quick Start - Local Testing (No Frontend Required)

Get the backend running and test everything locally in 5 minutes.

## Prerequisites

- Node.js installed
- Backend code downloaded
- Terminal/command line access

## Step 1: Setup Environment (30 seconds)

```bash
cd backend
cp .env.local .env
npm install
```

## Step 2: Start Backend (10 seconds)

```bash
npm start
```

You should see:
```
🚀 JobFetch backend running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health
```

## Step 3: Run Automated Tests (1 minute)

In a new terminal:

```bash
cd backend
../test-local.sh
```

This will test:
- ✅ Health check
- ✅ User signup
- ✅ User login
- ✅ Protected endpoints
- ✅ Google OAuth URL generation
- ✅ Gmail OAuth URL generation
- ✅ Application CRUD operations

## Step 4: Connect Gmail (2 minutes)

The test script will output a Gmail OAuth URL. Copy it and:

1. Open the URL in your browser
2. Sign in with Google
3. Grant Gmail permissions
4. You'll see "✅ Gmail Connected!"

## Step 5: Sync Emails (1 minute)

Use the token from the test script:

```bash
# The test script outputs: export TOKEN="..."
# Copy and run that command, then:

curl -X POST http://localhost:3001/api/email/sync \
  -H "Authorization: Bearer $TOKEN"
```

## Step 6: View Applications

```bash
curl http://localhost:3001/api/applications \
  -H "Authorization: Bearer $TOKEN"
```

## Done! 🎉

Your backend is fully functional locally. When you get frontend access:

1. Set `VITE_API_URL=http://localhost:3001` in frontend `.env.local`
2. Run `npm run dev` in frontend
3. Open `http://localhost:5173`

## Switching to Production

When ready to test production:

1. **Backend**: Already deployed on Railway at `https://api.jobfetch.app`
2. **Frontend**: Set `VITE_API_URL=https://api.jobfetch.app` in Cloudflare Pages
3. **Rebuild**: Trigger rebuild in Cloudflare dashboard

See `ENVIRONMENT_SWITCHING.md` for detailed instructions.

## Need Help?

- Full testing guide: `LOCAL_TESTING_GUIDE.md`
- Environment switching: `ENVIRONMENT_SWITCHING.md`
- Cloudflare setup: `CLOUDFLARE_ENV_SETUP.md`
- Gmail setup: `GMAIL_LOGIN_SETUP.md`
