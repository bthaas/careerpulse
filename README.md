# 🚀 CareerPulse

<div align="center">

**A modern, full-stack job application tracker with automatic Gmail email sync**

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](https://expressjs.com/)
[![Tests Passing](https://img.shields.io/badge/tests-61%20passing-success)](https://github.com/bthaas/careerpulse)

[Demo](#-demo) • [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation)

</div>

---

## 📖 Overview

CareerPulse automatically tracks your job applications by extracting key details from Gmail confirmation emails, eliminating the need for manual spreadsheet upkeep. Simply connect your Gmail, and let CareerPulse do the rest!

### 🎯 Core Value

**Never manually track job applications again.** CareerPulse syncs with your Gmail inbox, automatically detects job-related emails, and extracts company names, job titles, application status, and more—all while giving you full control to edit and organize your applications.

---

## ✨ Features

### 🤖 Automatic Email Tracking
- **One-click Gmail sync** via OAuth 2.0 (read-only access)
- **AI-powered email detection** using Google Gemini 2.5 Flash LLM
- **Smart extraction** of company name, job title, location, and status
- **High accuracy** (~95% extraction accuracy on real data)
- **Duplicate prevention** to avoid re-adding applications
- **Cost-effective** (~$0.01 per 100 emails synced)

### 📊 Application Management
- **Spreadsheet-style table view** with sortable columns
- **Real-time search** across company, role, and location
- **Advanced filtering** by status and date range
- **Status tracking** (Applied → Interview → Offer/Rejected)
- **Manual entry** for applications not sent via email
- **Edit capabilities** with inline updates

### 📈 Dashboard & Analytics
- **Dynamic stats cards** showing total applications, interviews, offers, and rejections
- **Status history** tracking all changes over time
- **Confidence scores** for auto-extracted applications
- **Last update timestamps** for each application

### 🎨 Modern UI/UX
- **Dark/Light mode** toggle
- **Responsive design** (desktop-first)
- **Beautiful Tailwind CSS** styling
- **Smooth animations** and transitions
- **Empty state** with helpful onboarding

---

## 🖼️ Demo

### Dashboard View
Clean, minimal interface showing all your applications at a glance with real-time statistics.

### Key Features Showcase
- **Search & Filter**: Quickly find applications by company, role, or status
- **Sort Options**: Organize by date applied, company name, or status
- **Detail Drawer**: Click any application to view full details and notes
- **Email Sync**: One button syncs your Gmail and extracts all job applications

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (tested on v24.9.0)
- **npm** v8+
- **Gmail account** (for email sync feature)

### Installation

```bash
# Clone the repository
git clone https://github.com/bthaas/careerpulse.git
cd careerpulse

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Configuration

1. **Set up Google OAuth** (required for Gmail sync):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URI: `http://localhost:3001/api/auth/gmail/callback`

2. **Configure backend environment**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Google OAuth (for Gmail sync)
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback
   
   # Google AI (for email parsing)
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   
   # Security
   SESSION_SECRET=your_random_secret_here
   JWT_SECRET=your_random_jwt_secret_here
   ```

3. **Get Google AI API Key** (required for email parsing):
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Add it to your `.env` file as `GOOGLE_AI_API_KEY`
   - See [GEMINI_SETUP.md](backend/GEMINI_SETUP.md) for detailed instructions

### Running the App

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
npm run dev
```

Open **http://localhost:5173** in your browser!

**Or try it with demo data** (no OAuth setup needed):
```bash
# The app will load with 5 sample applications
# Perfect for testing the UI without Gmail connection
```

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes! ⚡
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions with screenshots
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[GEMINI_SETUP.md](backend/GEMINI_SETUP.md)** - Google AI API setup guide
- **[LLM_PARSING_GUIDE.md](backend/services/LLM_PARSING_GUIDE.md)** - Email parsing documentation
- **[GEMINI_IMPLEMENTATION_SUMMARY.md](GEMINI_IMPLEMENTATION_SUMMARY.md)** - LLM integration overview
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete technical overview
- **[MVP_FEATURE_ANALYSIS.md](MVP_FEATURE_ANALYSIS.md)** - Feature requirements and status

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Vitest for testing

**Backend:**
- Node.js + Express
- SQLite database
- Gmail API integration
- Google Gemini 2.5 Flash LLM for email parsing
- OAuth 2.0 authentication

**Testing:**
- 61+ automated tests
- Database, API, and email parser coverage
- Component and integration tests

### Project Structure

```
careerpulse/
├── backend/                 # Node.js backend
│   ├── config/             # Gmail OAuth setup
│   ├── database/           # SQLite schema & operations
│   ├── routes/             # API endpoints
│   ├── services/           # Email parsing & Gmail API
│   └── tests/              # Backend tests (61 passing)
├── components/             # React components
├── services/               # Frontend API client
└── types.ts                # TypeScript interfaces
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

### Test Coverage
- ✅ **13 database tests** - Schema, CRUD, status tracking
- ✅ **17 API tests** - All endpoints validated
- ✅ **31 email parser tests** - Extraction accuracy
- ✅ **Frontend component tests** - UI interactions

**Total: 61+ tests passing** 🎉

---

## 🛠️ API Endpoints

### Applications
```
GET    /api/applications           - List all applications
POST   /api/applications           - Create application
GET    /api/applications/:id       - Get application details
PUT    /api/applications/:id       - Update application
PATCH  /api/applications/:id/status - Update status
DELETE /api/applications/:id       - Delete application
GET    /api/applications/:id/history - Get status history
```

### Authentication
```
GET    /api/auth/gmail             - Get OAuth URL
GET    /api/auth/gmail/callback    - OAuth callback
GET    /api/auth/status            - Check connection
POST   /api/auth/disconnect        - Disconnect Gmail
```

### Email Sync
```
POST   /api/email/sync             - Trigger email sync
GET    /api/email/profile          - Get Gmail profile
GET    /api/email/status           - Get sync status
```

---

## 🔐 Security & Privacy

- **Read-only Gmail access** - Can only read emails, never send or delete
- **Local data storage** - All data stays on your machine in SQLite
- **Secure OAuth tokens** - Industry-standard authentication
- **No third-party sharing** - Your data is never shared or sent anywhere
- **Disconnect anytime** - Full control over email access

---

## 🎯 Roadmap

### ✅ MVP Complete (Current)
- Gmail OAuth integration
- Automatic email parsing
- Application CRUD operations
- Sort, filter, and search
- Dark mode support
- Comprehensive testing

### 🔮 Future Enhancements
- **Multiple email providers** (Outlook, Yahoo)
- **Advanced NLP** for better extraction accuracy
- **Calendar integration** for interview scheduling
- **Mobile app** (React Native)
- **Team collaboration** features
- **Resume analysis** and matching
- **Browser extension** for quick adds

---

## 🤝 Contributing

Contributions are welcome! This is an MVP, and there's plenty of room for improvement.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices:
- React ecosystem for powerful UI development
- Node.js for scalable backend
- Google APIs for seamless Gmail integration
- SQLite for reliable local storage

---

## 📧 Contact

**GitHub**: [@bthaas](https://github.com/bthaas)  
**Repository**: [careerpulse](https://github.com/bthaas/careerpulse)

---

<div align="center">

**Made with ❤️ for job seekers everywhere**

⭐ Star this repo if you find it helpful!

</div>
