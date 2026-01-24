# Gemini Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Google AI API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### Step 2: Add API Key to Environment

Open `backend/.env` and add:

```bash
GOOGLE_AI_API_KEY=AIza-paste-your-key-here
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

That's it! The system will now use Gemini 2.0 Flash-Lite for email parsing.

## Verify It's Working

### Check Logs

When you sync emails, you should see:
```
🔍 Gemini extracting from: "Application Received - Software Engineer at Google"
✅ Gemini result: Google, Software Engineer, Applied, Mountain View, CA
```

### Test with Debug Endpoint

```bash
curl http://localhost:3001/api/email/debug \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Free Tier Limits

- **1,000 requests per day** (plenty for testing)
- **15 requests per minute**
- **1M tokens per minute**

For typical usage (50 emails/day), you'll stay well within the free tier!

## Cost Breakdown

### Free Tier (Testing)
- First 1,000 requests/day: **FREE**
- Perfect for development and testing

### Paid Tier (Production)
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- **~$0.10/month** for 1,500 emails

### Comparison
- Gemini 2.0 Flash-Lite: $0.10/month ✅
- GPT-4o-mini: $0.20/month (2x more)
- Gemini 2.5 Pro: $1.85/month (18x more)

## Troubleshooting

### "Gemini not available"
- Check that `GOOGLE_AI_API_KEY` is in `.env`
- Verify the key starts with `AIza`
- Restart the backend server

### "API key not valid"
- Go back to https://aistudio.google.com/apikey
- Create a new key
- Make sure you copied the entire key

### "Rate limit exceeded"
- Free tier: 1,000 requests/day
- Wait a few minutes or upgrade to paid tier
- Check usage at https://aistudio.google.com/

## Monitoring Usage

1. Go to https://aistudio.google.com/
2. Click on your API key
3. View usage statistics

## Next Steps

Once setup is complete:
1. Login to your app with r.w.chen88@gmail.com
2. Click "Sync Gmail"
3. Check the applications table for accurate data
4. Compare to the old inaccurate results!

## Support

- Google AI Studio: https://aistudio.google.com/
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Pricing: https://ai.google.dev/pricing
