# 🚀 Deployment Checklist for JobFetch

## Current Status:
- ✅ Frontend deployed to Netlify (jobfetch.app works!)
- ❌ Backend NOT deployed or not accessible
- ⚠️  DNS configured but connection failing

---

## 🔧 Fix Your Deployment - Step by Step

### Step 1: Deploy Backend to Railway

1. **Go to Railway**: https://railway.app/new
2. **Click "Deploy from GitHub repo"**
3. **Select your `careerpulse` repository**
4. **Configure Build Settings**:
   - Click on your service → Settings
   - **Root Directory**: `backend`
   - **Build Command**: Leave blank (auto-detected)
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`

5. **Add Environment Variables**:
   Click Variables tab and add:
   ```
   NODE_ENV=production
   PORT=3001
   
   # URLs
   FRONTEND_URL=https://jobfetch.app
   API_URL=https://api.jobfetch.app
   
   # Generate these with: openssl rand -base64 32
   JWT_SECRET=<your-generated-jwt-secret>
   SESSION_SECRET=<your-generated-session-secret>
   
   # Your Google OAuth credentials
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/gmail/callback
   
   # Database
   DATABASE_PATH=/app/database/jobfetch.db
   ```

6. **Wait for deployment** (2-3 minutes)
   - You'll see build logs
   - Wait for "✅ Deployment successful"

---

### Step 2: Get Your Railway URL

After deployment, Railway gives you a URL like:
```
https://your-app-name.up.railway.app
```

**Test it works**:
```bash
curl https://your-app-name.up.railway.app/api/health
```

You should see: `{"status":"ok", ...}`

---

### Step 3: Add Custom Domain in Railway

1. **In Railway** → Your Service → Settings → Networking
2. **Click "Add Custom Domain"**
3. **Enter**: `api.jobfetch.app`
4. **Railway will show you DNS records** like:
   ```
   Type: CNAME
   Name: api
   Value: your-app-name.up.railway.app
   ```

---

### Step 4: Update DNS Records

Go to your domain provider (GoDaddy/Namecheap/Cloudflare):

1. **Add CNAME record**:
   ```
   Type: CNAME
   Name: api
   Value: <your-railway-url>.up.railway.app
   TTL: 3600 or Auto
   ```

2. **Wait 5-10 minutes** for DNS to propagate

---

### Step 5: Test Your Backend

```bash
# Test health endpoint
curl https://api.jobfetch.app/api/health

# Should return:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

### Step 6: Update Google OAuth Redirect URIs

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click your OAuth client**
3. **Add Authorized redirect URIs**:
   ```
   https://api.jobfetch.app/api/auth/gmail/callback
   https://api.jobfetch.app/api/auth/google/callback
   ```
4. **Save**

---

### Step 7: Test Your Live Site

1. **Go to**: https://jobfetch.app
2. **Click "Sign Up"**
3. **Try creating an account**
4. **Should work!** 🎉

---

## 🔍 Troubleshooting

### Backend Still Not Working?

**Check Railway Logs**:
1. Railway → Your Service → Deployments
2. Click latest deployment
3. View logs for errors

**Common Issues**:

❌ **"Cannot find module"**
- Solution: Set Root Directory to `backend` in Railway settings

❌ **"Port already in use"**
- Solution: Make sure PORT=3001 in environment variables

❌ **"GOOGLE_CLIENT_ID not defined"**
- Solution: Add all environment variables in Railway

❌ **DNS not resolving**
- Solution: Wait 10-30 minutes for DNS propagation
- Check CNAME record is correct

### Frontend Can't Connect?

**Check CORS**:
Your backend should allow `https://jobfetch.app`

File: `backend/server.js`
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://jobfetch.app', 'https://www.jobfetch.app']
  : ['http://localhost:5173', 'http://localhost:3000'];
```

This is already configured! ✅

---

## 🎯 Quick Test Commands

```bash
# Test frontend
curl -I https://jobfetch.app
# Should return: HTTP/2 200

# Test backend
curl https://api.jobfetch.app/api/health
# Should return: {"status":"ok",...}

# Test DNS
nslookup api.jobfetch.app
# Should show IP addresses

# Test full flow
curl -X POST https://api.jobfetch.app/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test"}'
# Should return user and token
```

---

## 📋 Deployment Summary

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://jobfetch.app | ✅ LIVE |
| Backend | https://api.jobfetch.app | ❌ NOT DEPLOYED |
| Database | Railway SQLite | ⏳ PENDING |

---

## 🚀 Next Steps After Deployment

1. ✅ Test signup/login
2. ✅ Test Google Sign-In
3. ✅ Test Gmail sync
4. ✅ Add some test applications
5. ✅ Share with friends!
6. 🎉 Launch!

---

## ℹ️ Getting Help

If you're stuck:
1. Check Railway logs for errors
2. Make sure all environment variables are set
3. Wait for DNS propagation (10-30 mins)
4. Test the Railway URL directly (before custom domain)

**Your Railway URL should work immediately even if api.jobfetch.app doesn't yet!**
