# 🔒 JobFetch API Security

This document explains the security measures protecting your JobFetch API.

---

## 🛡️ Security Features

### 1. **Rate Limiting**

**General API Endpoints:**
- 100 requests per 15 minutes per IP address
- Prevents spam and DoS attacks
- Returns HTTP 429 if exceeded

**Authentication Endpoints:**
- 5 login/signup attempts per 15 minutes per IP
- Prevents brute force attacks
- Only counts failed attempts
- Returns HTTP 429 if exceeded

### 2. **CORS (Cross-Origin Resource Sharing)**

**Production:**
- Only allows requests from `jobfetch.app` and `www.jobfetch.app`
- Blocks all other domains
- Requires Origin header (blocks direct API tools in production)

**Development:**
- Allows `localhost:5173` and `localhost:3000`
- Allows requests without Origin (for testing with Postman/curl)

**Allowed Methods:**
- GET, POST, PUT, DELETE, PATCH

### 3. **Security Headers (Helmet)**

Automatically adds these HTTP headers:

```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'...
```

**Protection Against:**
- ✅ Clickjacking attacks
- ✅ Cross-site scripting (XSS)
- ✅ MIME type sniffing
- ✅ Man-in-the-middle attacks

### 4. **Authentication (JWT)**

**Token-Based Auth:**
- JWT tokens with expiration
- HTTP-only cookies (can't be accessed by JavaScript)
- Secure flag in production (HTTPS only)
- SameSite strict in production

**Protected Routes:**
- All `/api/applications/*` routes require authentication
- All `/api/email/*` routes require authentication
- `/api/user/me` requires authentication

**Public Routes:**
- `/api/health` - Health check
- `/api/user/login` - Login endpoint
- `/api/user/signup` - Signup endpoint
- `/api/auth/google/*` - Google OAuth callbacks

### 5. **Request Logging (Morgan)**

**Production:**
- Logs only errors (status code >= 400)
- Helps identify attack patterns
- Track failed requests

**Development:**
- Logs all requests
- Helps with debugging

### 6. **Input Validation**

**Request Body Limits:**
- Maximum 10MB per request
- Prevents memory exhaustion attacks

**Database:**
- SQL injection protection (parameterized queries)
- Input sanitization on user data

### 7. **Session Security**

**Cookies:**
- HTTP-only (prevents XSS theft)
- Secure flag in production (HTTPS only)
- SameSite strict (prevents CSRF)
- 24-hour expiration

---

## 🚨 Attack Vectors Blocked

| Attack Type | Protection | Status |
|-------------|------------|--------|
| **Brute Force Login** | Rate limiting (5/15min) | ✅ Protected |
| **DoS/DDoS** | Rate limiting (100/15min) | ✅ Protected |
| **CORS Bypass** | Origin validation | ✅ Protected |
| **XSS Attacks** | Helmet + HTTP-only cookies | ✅ Protected |
| **CSRF Attacks** | SameSite cookies | ✅ Protected |
| **SQL Injection** | Parameterized queries | ✅ Protected |
| **Clickjacking** | X-Frame-Options header | ✅ Protected |
| **MIME Sniffing** | X-Content-Type-Options | ✅ Protected |
| **Man-in-the-Middle** | HTTPS + HSTS header | ✅ Protected |
| **Session Hijacking** | Secure cookies + expiry | ✅ Protected |

---

## 🔍 Monitoring & Logging

### What's Logged:

**Production:**
- Failed requests (4xx, 5xx errors)
- Authentication failures
- Rate limit violations
- Server errors

**Development:**
- All HTTP requests
- Response times
- Status codes

### Where to View Logs:

**Railway:**
- Dashboard → Your Service → Logs tab
- Real-time log streaming
- Filter by severity

---

## ⚡ Rate Limit Examples

### Normal User:
```
Request 1-100: ✅ Allowed (within 15 minutes)
Request 101: ❌ Blocked (HTTP 429)
Wait 15 minutes: ✅ Reset
```

### Login Attempts:
```
Failed Login 1-5: ✅ Allowed (within 15 minutes)
Failed Login 6: ❌ Blocked (HTTP 429)
Successful Login: ✅ Doesn't count toward limit
```

---

## 🧪 Testing Security

### Test Rate Limiting:

```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl https://api.jobfetch.app/api/health
done

# Request 101 should return:
# {"error": "Too many requests from this IP, please try again later."}
```

### Test CORS:

```bash
# From random domain (should fail in production)
curl -H "Origin: https://evil.com" https://api.jobfetch.app/api/health
# Returns: CORS error

# From allowed domain (should work)
curl -H "Origin: https://jobfetch.app" https://api.jobfetch.app/api/health
# Returns: {"status":"ok",...}
```

### Test Authentication:

```bash
# Access protected endpoint without auth (should fail)
curl https://api.jobfetch.app/api/applications
# Returns: {"error": "Not authenticated"}

# With valid token (should work)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.jobfetch.app/api/applications
# Returns: [applications array]
```

---

## 🔧 Configuration

### Environment Variables:

```env
# Production mode enables stricter security
NODE_ENV=production

# Strong secrets for JWT and sessions
JWT_SECRET=<strong-random-string>
SESSION_SECRET=<strong-random-string>

# Allowed frontend origins
FRONTEND_URL=https://jobfetch.app
```

### Adjust Rate Limits:

Edit `backend/server.js`:

```javascript
// Increase general limit to 200 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Changed from 100
  // ...
});

// Increase login attempts to 10 per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Changed from 5
  // ...
});
```

---

## 📊 Security Checklist

- [x] Rate limiting enabled
- [x] CORS configured
- [x] Security headers (Helmet)
- [x] HTTPS enforced (production)
- [x] JWT authentication
- [x] HTTP-only cookies
- [x] Session security
- [x] Request logging
- [x] Input validation
- [x] SQL injection protection
- [x] XSS protection
- [x] CSRF protection
- [ ] Two-factor authentication (future)
- [ ] API key rotation (future)
- [ ] IP whitelisting (if needed)

---

## 🚀 Production Checklist

Before going live:

1. ✅ Set `NODE_ENV=production`
2. ✅ Use strong `JWT_SECRET` and `SESSION_SECRET`
3. ✅ Configure `FRONTEND_URL` to production domain
4. ✅ Enable HTTPS (automatic on Railway)
5. ✅ Review rate limits (adjust if needed)
6. ✅ Test CORS from production domain
7. ✅ Monitor logs for suspicious activity

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## 🆘 Security Issues?

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email: bthaas15@gmail.com
3. Include details about the vulnerability
4. We'll respond within 48 hours

---

**Your API is now enterprise-grade secure!** 🔒✨
