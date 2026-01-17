# JobFetch Setup Guide

A full-stack job application tracker with automatic email sync powered by Gmail API.

## 🎯 Features

- ✅ **Google Sign-In**: Quick authentication with your Google account
- ✅ **Multi-User Support**: Each user has their own secure account
- ✅ **Automatic Email Tracking**: Sync job application emails from Gmail
- ✅ **Smart Parsing**: Extract company, role, status from emails using keyword detection
- ✅ **Manual Entry**: Add applications manually with full details
- ✅ **Real-time Stats**: Dynamic dashboard with application metrics
- ✅ **Sort & Filter**: Organize applications by status, date, company
- ✅ **Status History**: Track application status changes over time
- ✅ **Dark Mode**: Beautiful UI with light/dark theme support

## 📋 Prerequisites

- **Node.js** v18+ (currently using v24.9.0)
- **npm** v8+
- **Gmail Account** (for email sync feature)
- **Google Cloud Console Access** (to set up OAuth credentials)

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd /Users/bretthaas/careerpulse

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Set Up Google OAuth (Required for Email Sync)

#### a) Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

#### b) Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen if prompted:
   - User Type: External
   - Add your email as test user
   - Scopes: Add `gmail.readonly`, `userinfo.email`, and `userinfo.profile`
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: JobFetch
   - Authorized redirect URIs (add both):
     ```
     http://localhost:3001/api/auth/gmail/callback
     http://localhost:3001/api/auth/google/callback
     ```
     > **Note**: The first is for Gmail sync, the second is for Google Sign-In
5. Copy your **Client ID** and **Client Secret**

#### c) Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS and OAuth callbacks)
FRONTEND_URL=http://localhost:5173

# Backend API URL (for OAuth redirects)
API_URL=http://localhost:3001

# Google OAuth Credentials (used for both Gmail sync AND Google Sign-In)
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# JWT Secret (for user authentication)
JWT_SECRET=your_random_jwt_secret_here_change_this

# Session Secret (for session management)
SESSION_SECRET=your_random_session_secret_here_change_this

# Database
DATABASE_PATH=./database/careerpulse.db
```

💡 **Tip**: Generate secure secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

### 3. Start the Application

#### Terminal 1: Backend Server

```bash
cd backend
npm start
```

Backend will run on **http://localhost:3001**

Check health: http://localhost:3001/api/health

#### Terminal 2: Frontend Dev Server

```bash
# From project root
npm run dev
```

Frontend will run on **http://localhost:5173**

## 🎮 Using JobFetch

### First Time Setup

1. **Open** http://localhost:5173 in your browser
2. **Sign Up** with one of these options:
   - **Google Sign-In** (recommended): Click "Sign in with Google" for instant access
   - **Email/Password**: Create an account with email and password
3. Once logged in, **click "Sync Gmail"** button in header
4. **Authorize** JobFetch to read your Gmail (read-only access)
5. **Wait** for sync to complete (checks last 30 days of emails)
6. **View** automatically extracted applications!

### Authentication Options

**Google Sign-In** (No password required):
- Quick one-click authentication
- Uses your existing Google account
- Secure OAuth 2.0 flow

**Email/Password** (Traditional):
- Create account with email and password (min 8 characters)
- Login anytime with your credentials
- Password securely hashed with bcrypt

### Manual Entry

- Click **"Add Application"** button
- Fill in company, role, status, etc.
- Applications save to database automatically

### Features

- **Search**: Type in search bar to filter by company/role/location
- **Sort**: Click column headers or use Sort dropdown
- **Filter**: Filter by status (Applied, Interview, Offer, Rejected) or date range
- **Details**: Click any application row to view full details in drawer
- **Dark Mode**: Toggle with moon/sun icon

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test tests/database.test.js
npm test tests/emailParser.test.js
npm test tests/api.test.js
```

**Current Status**: 61 backend tests passing ✅

### Frontend Tests

```bash
# From project root
npm test
```

**Current Status**: Frontend component tests passing ✅

## 📁 Project Structure

```
careerpulse/
├── backend/                    # Node.js + Express backend
│   ├── config/
│   │   └── gmail.js           # Gmail OAuth configuration
│   ├── database/
│   │   ├── schema.sql         # SQLite database schema
│   │   └── db.js              # Database operations
│   ├── routes/
│   │   ├── applications.js    # CRUD API endpoints
│   │   ├── auth.js            # OAuth flow endpoints
│   │   └── email.js           # Email sync endpoints
│   ├── services/
│   │   ├── gmailService.js    # Gmail API integration
│   │   ├── emailParser.js     # Email parsing logic
│   │   └── duplicateDetector.js
│   ├── tests/                 # Backend test suites
│   └── server.js              # Express server
│
├── components/                # React components
│   ├── Header.tsx
│   ├── StatsCards.tsx
│   ├── ApplicationsTable.tsx
│   ├── ApplicationDrawer.tsx
│   ├── AddApplicationModal.tsx
│   └── EmptyState.tsx
│
├── services/
│   └── api.ts                 # Frontend API client
│
├── types.ts                   # TypeScript interfaces
├── App.tsx                    # Main React component
└── index.tsx                  # React entry point
```

## 🔧 API Endpoints

### Applications

- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create application
- `GET /api/applications/:id` - Get single application
- `PUT /api/applications/:id` - Update application
- `PATCH /api/applications/:id/status` - Update status only
- `DELETE /api/applications/:id` - Delete application
- `GET /api/applications/:id/history` - Get status history

### Authentication

- `GET /api/auth/gmail` - Get Gmail OAuth URL
- `GET /api/auth/gmail/callback` - OAuth callback
- `GET /api/auth/status` - Check connection status
- `POST /api/auth/disconnect` - Disconnect Gmail
- `POST /api/auth/refresh` - Refresh access token

### Email Sync

- `POST /api/email/sync` - Trigger email sync
- `GET /api/email/profile` - Get Gmail profile
- `GET /api/email/status` - Get sync status

## 🐛 Troubleshooting

### Backend won't start

- Check if port 3001 is available
- Verify `.env` file exists in `backend/` directory
- Make sure all environment variables are set

### Gmail sync fails

- Verify OAuth credentials are correct in `.env`
- Check redirect URI matches exactly (including protocol)
- Ensure Gmail API is enabled in Google Cloud Console
- Check if you're added as a test user in OAuth consent screen

### Frontend shows "Failed to load applications"

- Make sure backend server is running
- Check browser console for errors
- Verify API_BASE_URL in `services/api.ts` matches backend URL

### Database errors

- Delete `backend/database/careerpulse.db` to reset
- Restart backend server to recreate schema

## 📊 Database Schema

### Applications Table
- id, company, role, location
- dateApplied, lastUpdate, createdAt
- status, source, salary, remotePolicy, notes
- emailId, confidenceScore, isDuplicate

### Email Connections Table
- userId, email, accessToken, refreshToken
- expiresAt, connected

### Status History Table
- applicationId, oldStatus, newStatus, changedAt

## 🔐 Security & Privacy

- **Read-only Gmail access**: Can only read emails, never send or delete
- **Local storage**: All data stored in local SQLite database
- **Secure tokens**: OAuth tokens stored with encryption
- **No data sharing**: Your data never leaves your machine

## 🚢 Next Steps

- Connect your Gmail and sync emails
- Review extracted applications and fix any parsing errors
- Add more applications manually as needed
- Use filters and search to manage your job search
- Track status changes and monitor progress

## 📝 License

MIT

---

**Built with**: React, TypeScript, Node.js, Express, SQLite, Gmail API, Tailwind CSS
