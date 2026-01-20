# CareerPulse Quick Start Guide

Get CareerPulse up and running in 5 minutes!

## Prerequisites

- Node.js v18+ installed
- Gmail account
- 5 minutes of your time

## Step 1: Clone and Install (1 minute)

```bash
# Clone the repository
git clone https://github.com/bthaas/careerpulse.git
cd careerpulse

# Install all dependencies
npm install
cd backend && npm install && cd ..
```

## Step 2: Get API Keys (2 minutes)

### Google OAuth (for Gmail sync)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add redirect URI: `http://localhost:3001/api/auth/gmail/callback`
7. Copy your **Client ID** and **Client Secret**

### Google AI API Key (for email parsing)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy your API key

## Step 3: Configure Environment (1 minute)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your keys:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Google AI
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Security (generate random strings)
SESSION_SECRET=your_random_secret_here
JWT_SECRET=your_random_jwt_secret_here
```

**Tip**: Generate random secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Validate Setup (30 seconds)

```bash
cd backend
npm run validate
```

This will test:
- ✅ Gemini API connection
- ✅ OAuth URL generation
- ✅ Environment configuration

## Step 5: Start the App (30 seconds)

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend (new terminal)
npm run dev
```

Open **http://localhost:3000** in your browser!

## Step 6: Connect Gmail and Sync

1. **Sign up** or **log in** to CareerPulse
2. Click **"Sync Gmail"** button
3. Authorize Gmail access (read-only)
4. Wait for sync to complete
5. See your job applications! 🎉

---

## Troubleshooting

### "Gemini not available" error

- Make sure `GOOGLE_AI_API_KEY` is set in `backend/.env`
- Verify the API key is valid at https://aistudio.google.com/apikey
- Restart the backend server

### "Failed to get authorization URL" error

- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify credentials in Google Cloud Console
- Make sure redirect URI matches exactly

### "No emails found" after sync

- Check that you have job application emails in your Gmail inbox
- Emails must be from the last 30 days (default)
- Try the debug endpoint: `GET http://localhost:3001/api/email/debug`

### More help?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions.

---

## What's Next?

### Explore Features

- **Search**: Find applications by company or role
- **Filter**: View by status (Applied, Interview, Offer, Rejected)
- **Sort**: Organize by date, company, or status
- **Edit**: Click any application to view/edit details
- **Manual Add**: Add applications that weren't sent via email

### Customize

- **Dark Mode**: Toggle theme in the header
- **Sync Frequency**: Sync as often as you like (costs ~$0.01 per 100 emails)
- **Date Range**: Adjust `afterDate` in sync request to control how far back to search

### Learn More

- [README.md](README.md) - Full documentation
- [GEMINI_SETUP.md](backend/GEMINI_SETUP.md) - Detailed AI setup
- [LLM_PARSING_GUIDE.md](backend/services/LLM_PARSING_GUIDE.md) - How email parsing works
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

---

## Quick Commands Reference

```bash
# Backend
npm start              # Start server
npm run dev            # Start with auto-reload
npm test               # Run all tests
npm run test:gemini    # Test Gemini integration
npm run validate       # Validate setup

# Frontend
npm run dev            # Start development server
npm run build          # Build for production
npm test               # Run frontend tests
```

---

## Need Help?

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review backend logs for detailed errors
3. Test components individually with test scripts
4. Open an issue on GitHub

---

**Estimated Setup Time**: 5 minutes  
**Difficulty**: Easy  
**Cost**: Free (Gemini API has generous free tier)

Happy job hunting! 🚀
