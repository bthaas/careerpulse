# 🚀 JobFetch Deployment Guide

Deploy JobFetch to **jobfetch.app** in 30 minutes!

---

## 📋 Prerequisites

- [ ] Domain: jobfetch.app (configured)
- [ ] GitHub repo pushed with latest changes
- [ ] Google OAuth credentials ready
- [ ] Railway account (railway.app)
- [ ] Vercel account (vercel.com)

---

## 🎯 Architecture

```
jobfetch.app (Frontend - Vercel)
    ↓
api.jobfetch.app (Backend - Railway)
    ↓
SQLite Database (Railway Persistent Volume)
```

---

## 📦 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli
railway login
```

**Or use Railway Dashboard:**
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `careerpulse` repository
5. Click "Add variables" to configure

### 1.2 Configure Environment Variables

Add these in Railway → Variables:

```env
NODE_ENV=production
PORT=3001

# Google OAuth (update redirect URI in Google Console first!)
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_secret
GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/gmail/callback

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret

# URLs
FRONTEND_URL=https://jobfetch.app

# Database
DATABASE_PATH=./database/jobfetch.db
```

### 1.3 Configure Build Settings

In Railway → Settings:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Watch Paths:** `backend/**`

### 1.4 Add Persistent Volume (for SQLite)

1. Railway → Add Volume
2. Mount Path: `/app/database`
3. This ensures your database persists between deployments

### 1.5 Set Up Custom Domain

1. Railway → Settings → Networking
2. Click "Generate Domain" (you'll get: `xxx.up.railway.app`)
3. Click "Add Custom Domain"
4. Enter: `api.jobfetch.app`
5. Railway will show you DNS records:

```
Type: CNAME
Name: api
Value: [your-app].up.railway.app
TTL: 3600
```

**Add this to your DNS provider (Namecheap/GoDaddy/Cloudflare)**

### 1.6 Update Google OAuth

**CRITICAL:** Update redirect URI in Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Select your OAuth 2.0 Client ID
4. Add Authorized redirect URI:
   ```
   https://api.jobfetch.app/api/auth/gmail/callback
   ```
5. Save

### 1.7 Test Backend

```bash
curl https://api.jobfetch.app/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy to Vercel

```bash
# Install Vercel CLI (optional)
npm install -g vercel
vercel login
vercel
```

**Or use Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import `careerpulse` from GitHub
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.2 Configure Environment Variables

Add in Vercel → Settings → Environment Variables:

```env
VITE_API_URL=https://api.jobfetch.app/api
```

### 2.3 Set Up Custom Domain

1. Vercel → Settings → Domains
2. Add domain: `jobfetch.app`
3. Add domain: `www.jobfetch.app` (will redirect to main)
4. Vercel will provide DNS records:

**For apex domain (jobfetch.app):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 2.4 SSL Certificate

Vercel automatically provisions SSL certificates. Wait 1-2 minutes after DNS propagation.

---

## 🌐 Step 3: Configure DNS

### In Your Domain Registrar

Add these DNS records:

```dns
# Backend API (Railway)
Type: CNAME
Name: api
Value: [your-railway-app].up.railway.app
TTL: 3600

# Frontend (Vercel)
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**DNS Propagation:** Wait 5-30 minutes for DNS to propagate worldwide.

Check propagation: [dnschecker.org](https://dnschecker.org)

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend
```bash
curl https://api.jobfetch.app/api/health
# Expected: {"status":"ok",...}
```

### 4.2 Test Frontend
1. Open https://jobfetch.app
2. Should see JobFetch login page
3. Click "Sign Up"
4. Create test account
5. Add an application
6. Try "Sync Gmail" button

### 4.3 Test Full Flow
- [ ] Signup works
- [ ] Login works
- [ ] Can add applications
- [ ] Applications persist after logout/login
- [ ] Gmail OAuth flow works
- [ ] Each user sees only their data
- [ ] Logout works
- [ ] HTTPS is enabled (green lock icon)

---

## 🔧 Troubleshooting

### Backend Issues

**"CORS Error" in browser console:**
- Check `FRONTEND_URL` in Railway env vars
- Verify CORS settings in `server.js`
- Clear browser cache

**"Database not persisting:"**
- Ensure Railway persistent volume is mounted
- Check `DATABASE_PATH` env var

**"Gmail OAuth fails:"**
- Verify redirect URI in Google Console matches exactly
- Check `GOOGLE_REDIRECT_URI` env var
- Ensure OAuth consent screen is configured

### Frontend Issues

**"Cannot connect to API:"**
- Check browser console for errors
- Verify `VITE_API_URL` in Vercel
- Test backend health endpoint directly

**"Builds failing:"**
- Check Vercel build logs
- Ensure `package.json` scripts are correct
- Try building locally: `npm run build`

### DNS Issues

**"Domain not resolving:"**
- Wait 5-30 minutes for DNS propagation
- Check DNS with: `nslookup jobfetch.app`
- Verify DNS records in your registrar

---

## 📊 Post-Deployment

### Monitoring

**Set up monitoring:**
1. **Uptime:** [UptimeRobot](https://uptimerobot.com) (free)
   - Monitor: https://jobfetch.app
   - Monitor: https://api.jobfetch.app/api/health

2. **Error Tracking:** [Sentry](https://sentry.io) (free tier)
   ```bash
   npm install @sentry/react @sentry/node
   ```

3. **Analytics:** [Plausible](https://plausible.io) or Google Analytics

### Backups

**Automated database backups:**
```bash
# Add to Railway cron job or GitHub Actions
sqlite3 database/jobfetch.db ".backup jobfetch-backup-$(date +%Y%m%d).db"
```

### Security

**Add to production:**
- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet.js for security headers
- [ ] Environment variable validation
- [ ] Regular security audits: `npm audit`

---

## 💰 Costs

**Estimated Monthly Costs:**

| Service | Plan | Cost |
|---------|------|------|
| Railway | Hobby | $5/month |
| Vercel | Hobby | $0 (free) |
| Domain | Annual | $12/year |
| **Total** | | **~$6/month** |

**Free tier limits:**
- Railway: $5 credit/month (enough for small apps)
- Vercel: 100GB bandwidth/month
- Both scale up as you grow

---

## 🚀 Going Live Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Custom domains configured
- [ ] DNS records added and propagated
- [ ] SSL certificates active (green lock)
- [ ] Google OAuth updated with production URLs
- [ ] Environment variables set correctly
- [ ] Test user signup/login
- [ ] Test application CRUD
- [ ] Test Gmail sync
- [ ] Set up monitoring
- [ ] Announce to users! 🎉

---

## 📞 Support

If you encounter issues:
1. Check Railway/Vercel logs
2. Review browser console for errors
3. Test API endpoints directly
4. Verify all environment variables

---

**Congratulations! JobFetch is now live at https://jobfetch.app! 🎉**
