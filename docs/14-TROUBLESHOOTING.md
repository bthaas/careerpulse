# CareerPulse Troubleshooting Guide

Common issues and solutions for CareerPulse setup and usage.

## Table of Contents
- [Gmail OAuth Issues](#gmail-oauth-issues)
- [Email Sync Problems](#email-sync-problems)
- [LLM/Gemini Issues](#llmgemini-issues)
- [Database Issues](#database-issues)
- [Frontend Issues](#frontend-issues)

---

## Gmail OAuth Issues

### "Missing authorization code" Error

**Symptoms**: OAuth callback shows "Missing authorization code"

**Causes**:
- Closed authorization window too early
- Clicked "Cancel" or "Deny" in Google's consent screen
- Authorization request timed out

**Solutions**:
1. Close the error window
2. Try connecting Gmail again from CareerPulse
3. Make sure to click "Allow" when Google asks for permissions
4. Don't close the authorization window until you see "Gmail Connected!"

### "Invalid or expired state parameter" Error

**Symptoms**: OAuth callback shows state parameter error

**Causes**:
- OAuth state token expired (5-minute timeout)
- State parameter not preserved by Google OAuth

**Solutions**:
1. Try connecting again (don't wait too long on the consent screen)
2. If problem persists, the app has a fallback that retrieves email from OAuth tokens
3. Check backend logs for more details

### "Failed to get authorization URL" Error

**Symptoms**: Can't initiate OAuth flow

**Causes**:
- Missing or invalid Google OAuth credentials
- Backend not running
- Network issues

**Solutions**:
1. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `backend/.env`
2. Verify credentials are correct in Google Cloud Console
3. Make sure backend is running on port 3001
4. Check backend logs for detailed error messages

---

## Email Sync Problems

### "Gmail not connected" Error

**Symptoms**: Clicking "Sync Gmail" shows "Gmail not connected"

**Causes**:
- Haven't connected Gmail yet
- Gmail connection expired
- OAuth tokens invalid

**Solutions**:
1. Click "OK" when prompted to connect Gmail
2. Complete the OAuth flow
3. If already connected, try disconnecting and reconnecting
4. Check `/api/auth/status` endpoint to verify connection

### "No emails found" or "0 applications extracted"

**Symptoms**: Sync completes but no applications added

**Causes**:
- No job-related emails in inbox
- Emails older than 30 days (default filter)
- Keyword filter too strict
- LLM classifying emails as non-job-related

**Solutions**:
1. Check that you have job application emails in your inbox
2. Make sure emails are from the last 30 days
3. Try the debug endpoint: `GET /api/email/debug` to see raw email data
4. Check backend logs to see which emails were processed
5. Verify `GOOGLE_AI_API_KEY` is set correctly

### "Invalid Credentials" Error During Sync

**Symptoms**: Sync fails with "Invalid Credentials" or 401 error

**Causes**:
- OAuth tokens expired
- Refresh token invalid
- Gmail connection needs to be renewed

**Solutions**:
1. Disconnect Gmail from CareerPulse
2. Reconnect Gmail (this will get fresh tokens)
3. Try syncing again
4. If problem persists, check Google Cloud Console for API quota limits

---

## LLM/Gemini Issues

### "Gemini not available" Warning

**Symptoms**: Backend logs show "Gemini not available, skipping LLM extraction"

**Causes**:
- `GOOGLE_AI_API_KEY` not set in `.env`
- Invalid API key
- Gemini API not accessible

**Solutions**:
1. Get API key from https://aistudio.google.com/apikey
2. Add to `backend/.env`: `GOOGLE_AI_API_KEY=your_key_here`
3. Restart backend server
4. Test with: `node backend/test-gemini.js`

### "Failed to parse Gemini response" Errors

**Symptoms**: Backend logs show JSON parsing errors

**Causes**:
- Gemini returning truncated JSON
- Unexpected response format
- API rate limiting

**Solutions**:
1. Check if `maxOutputTokens` is set to 1000 in `llmParser.js`
2. Verify API key has sufficient quota
3. Check Gemini API status: https://status.cloud.google.com/
4. Review backend logs for the actual response content

### High LLM Costs

**Symptoms**: Concerned about API costs

**Expected Costs**:
- ~$0.01 per 100 emails synced
- ~$0.30 per month for typical usage (10 syncs)

**Solutions to Reduce Costs**:
1. Sync less frequently
2. Use `maxResults` parameter to limit emails per sync
3. Adjust `afterDate` to only sync recent emails
4. Cache is enabled by default (avoids duplicate API calls)

---

## Database Issues

### "Database locked" Error

**Symptoms**: Operations fail with "database is locked"

**Causes**:
- Multiple processes accessing database
- Long-running transaction
- Database file permissions

**Solutions**:
1. Make sure only one backend instance is running
2. Restart backend server
3. Check file permissions on `backend/database/careerpulse.db`
4. If problem persists, delete database and restart (will lose data)

### "No such table" Error

**Symptoms**: Database operations fail with table not found

**Causes**:
- Database not initialized
- Schema not created
- Wrong database file

**Solutions**:
1. Check that `backend/database/careerpulse.db` exists
2. Restart backend (will auto-initialize database)
3. If problem persists, delete database file and restart
4. Check `DATABASE_PATH` in `.env` is correct

---

## Frontend Issues

### "Failed to load applications" Error

**Symptoms**: Frontend shows error loading applications

**Causes**:
- Backend not running
- Wrong backend URL
- CORS issues
- Network problems

**Solutions**:
1. Make sure backend is running on port 3001
2. Check `API_URL` in `services/api.ts` is correct
3. Verify CORS is enabled in backend
4. Check browser console for detailed errors
5. Try accessing `http://localhost:3001/api/health` directly

### "Authentication required" or Login Loop

**Symptoms**: Can't stay logged in or constant login prompts

**Causes**:
- JWT token expired
- Token not stored correctly
- Backend session issues

**Solutions**:
1. Clear browser localStorage
2. Log out and log in again
3. Check that `JWT_SECRET` is set in backend `.env`
4. Verify `auth_token` is being stored in localStorage
5. Check backend logs for authentication errors

### Dark Mode Not Working

**Symptoms**: Theme toggle doesn't work

**Causes**:
- Tailwind dark mode not configured
- CSS not loading
- Browser cache

**Solutions**:
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Check that `dark` class is being added to `<html>` element
4. Verify Tailwind CSS is loaded

---

## General Debugging Tips

### Enable Verbose Logging

Add to `backend/.env`:
```env
DEBUG=*
LOG_LEVEL=debug
```

### Check Backend Health

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T..."
}
```

### Test Gemini Integration

```bash
cd backend
node test-gemini.js
```

Should show successful extraction from test email.

### Check Database Contents

```bash
cd backend
sqlite3 database/careerpulse.db "SELECT * FROM applications LIMIT 5;"
```

### View Backend Logs

Backend logs show detailed information about:
- OAuth flow
- Email sync progress
- LLM extraction results
- Database operations
- Errors and warnings

### Test OAuth Flow

```bash
cd backend
node test-oauth-url.js
```

Shows the generated OAuth URL and verifies state parameter.

---

## Still Having Issues?

1. **Check the logs**: Backend logs contain detailed error messages
2. **Review documentation**: See [GEMINI_SETUP.md](backend/GEMINI_SETUP.md) and [LLM_PARSING_GUIDE.md](backend/services/LLM_PARSING_GUIDE.md)
3. **Test components individually**: Use test scripts to isolate the problem
4. **Check API quotas**: Verify you haven't exceeded Google API limits
5. **Open an issue**: If you found a bug, please report it on GitHub

---

## Known Limitations

1. **Email Age**: Only syncs emails from last 30 days by default
2. **Gmail Only**: Currently only supports Gmail (not Outlook, Yahoo, etc.)
3. **English Only**: LLM trained primarily on English emails
4. **ATS Platforms**: Sometimes extracts ATS platform name instead of company (Gemini usually gets this right)
5. **Status Detection**: May misclassify status in ambiguous emails
6. **Rate Limits**: Google APIs have rate limits (usually not an issue for personal use)

---

## Performance Optimization

### Slow Email Sync

**If sync takes too long**:
1. Reduce `maxResults` (default: 100)
2. Use `afterDate` to limit date range
3. Check internet connection speed
4. Verify Gemini API response times

### High Memory Usage

**If backend uses too much memory**:
1. Reduce `maxResults` per sync
2. Clear LLM cache: restart backend
3. Check for memory leaks in logs
4. Limit concurrent operations

---

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Rotate API keys regularly** - Especially if exposed
3. **Use strong secrets** - For `SESSION_SECRET` and `JWT_SECRET`
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Review OAuth scopes** - Only request necessary permissions
6. **Monitor API usage** - Check Google Cloud Console for unusual activity

---

**Last Updated**: January 19, 2026
