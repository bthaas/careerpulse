# 🔐 Google Cloud Secret Manager Setup Guide

Store your API keys securely in Google Cloud Secret Manager instead of `.env` files.

---

## 🎯 Why Use Secret Manager?

✅ **More Secure** - Keys never stored in code or config files  
✅ **Access Control** - Fine-grained permissions  
✅ **Audit Logs** - Track who accessed what and when  
✅ **Easy Rotation** - Update secrets without redeploying  
✅ **Automatic in Production** - Seamless integration

---

## 📋 Prerequisites

- Google Cloud Project created
- `gcloud` CLI installed ([Download here](https://cloud.google.com/sdk/docs/install))
- Backend `.env` file with your secrets

---

## 🚀 Setup Instructions

### Step 1: Enable Secret Manager API

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
export GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
gcloud config set project $GOOGLE_CLOUD_PROJECT_ID

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

### Step 2: Authenticate for Local Development

```bash
# This creates application default credentials
gcloud auth application-default login
```

### Step 3: Set Project ID in Environment

Add to your `backend/.env` file:

```env
# Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here

# Enable Secret Manager (set to 'true' for production, leave unset for local dev)
# USE_SECRET_MANAGER=true
```

### Step 4: Upload Secrets to Google Cloud

Run the setup script:

```bash
cd backend
node scripts/setup-secrets.js
```

This will:
- Read secrets from your `.env` file
- Create secrets in Google Cloud Secret Manager
- Store: `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Step 5: Verify Secrets in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Security** → **Secret Manager**
3. You should see your secrets listed:
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 🧪 Testing Locally

### Development Mode (uses `.env` file):

```bash
# Default behavior - uses .env file
npm start
```

### Test Secret Manager Mode:

```bash
# Enable Secret Manager for testing
export USE_SECRET_MANAGER=true
npm start
```

You should see: `🔐 Secrets loaded from: Google Cloud`

---

## 🚀 Production Deployment

### Railway Deployment:

1. **Set Environment Variables** in Railway dashboard:
   ```env
   NODE_ENV=production
   USE_SECRET_MANAGER=true
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   
   # Non-secret config
   GOOGLE_REDIRECT_URI=https://api.jobfetch.app/api/auth/gmail/callback
   FRONTEND_URL=https://jobfetch.app
   API_URL=https://api.jobfetch.app
   ```

2. **Set up Service Account** (for Railway to access secrets):
   
   ```bash
   # Create service account
   gcloud iam service-accounts create jobfetch-backend \
     --display-name="JobFetch Backend Service Account"
   
   # Grant Secret Manager access
   gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT_ID \
     --member="serviceAccount:jobfetch-backend@$GOOGLE_CLOUD_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   
   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=jobfetch-backend@$GOOGLE_CLOUD_PROJECT_ID.iam.gserviceaccount.com
   ```

3. **Add Service Account Key to Railway**:
   - Copy the contents of `key.json`
   - In Railway, add environment variable:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste key.json contents>
     ```
   - Or upload `key.json` as a file and set:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS=/app/key.json
     ```

---

## 🔄 Updating Secrets

### Via Console (Easy):

1. Go to [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Click on the secret name
3. Click **"New Version"**
4. Enter new value
5. Restart your application

### Via CLI:

```bash
# Update a secret
echo -n "new-secret-value" | gcloud secrets versions add JWT_SECRET --data-file=-

# Restart your app to pick up changes
```

---

## 🛠️ Troubleshooting

### Error: "Permission denied"

```bash
# Make sure you're authenticated
gcloud auth application-default login

# Check your project is set
gcloud config get-value project
```

### Error: "Secret Manager API not enabled"

```bash
gcloud services enable secretmanager.googleapis.com
```

### Falls back to .env file

This is normal for local development. To force Secret Manager:

```bash
export USE_SECRET_MANAGER=true
export GOOGLE_CLOUD_PROJECT_ID=your-project-id
npm start
```

### Railway can't access secrets

- Make sure service account is created
- Check IAM permissions include `roles/secretmanager.secretAccessor`
- Verify `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set

---

## 📊 Cost

Google Cloud Secret Manager pricing:
- **6 active secret versions**: Free
- **10,000 access operations per month**: Free
- Additional versions: $0.06/version/month
- Additional accesses: $0.03 per 10,000 operations

**For JobFetch**: Essentially **FREE** (4 secrets, low access volume)

---

## 🔒 Best Practices

✅ **Use Secret Manager in production** - Set `USE_SECRET_MANAGER=true`  
✅ **Keep `.env` for local dev** - Faster development  
✅ **Never commit `.env` or `key.json`** - Already in `.gitignore`  
✅ **Rotate secrets regularly** - Use version system  
✅ **Use service accounts** - Don't use personal credentials in production  
✅ **Audit access** - Review logs in Cloud Console  

---

## 📚 Additional Resources

- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

---

## ✨ What's Configured

Your backend now:
- ✅ Loads secrets from Google Cloud in production
- ✅ Falls back to `.env` for local development
- ✅ Automatically manages secret versions
- ✅ Provides secure access to API keys
- ✅ Works seamlessly with your existing code

**No code changes needed in your routes or services!** 🎉
