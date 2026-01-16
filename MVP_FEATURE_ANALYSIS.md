# CareerPulse MVP Feature Analysis & Implementation Plan

## Current Feature Status

### ✅ **Features Present (Partial/UI Only)**

1. **Application Table (MVP)** - ~60% Complete
   - ✅ Spreadsheet-style table view
   - ✅ Columns: Company, Role, Status, Date Applied, Source
   - ❌ Missing: "Last Update" column
   - ❌ Missing: Inline editing of fields
   - ❌ Missing: Sort functionality
   - ❌ Missing: Filter by status and date

2. **Basic Insights (MVP)** - ~50% Complete
   - ✅ Total applications count (hardcoded: 42)
   - ✅ Status breakdown (Interviews: 8, Offers: 2, Rejected: 12)
   - ❌ Missing: Dynamic calculation from actual data
   - ❌ Missing: Applications over time chart

3. **Manual Controls (MVP)** - ~30% Complete
   - ✅ UI for notes editing (in drawer)
   - ✅ UI for edit status button
   - ❌ Missing: "Add Application" button/functionality
   - ❌ Missing: Inline table editing
   - ❌ Missing: Save functionality for edits

4. **Simple UX Requirements (MVP)** - ✅ 100% Complete
   - ✅ Clean, minimal UI (Airtable-like)
   - ✅ Desktop-first layout
   - ✅ Fast table interactions
   - ❌ Missing: Empty-state onboarding

5. **View Original Email** - ✅ 100% Complete
   - ✅ Drawer shows email content
   - ✅ Email subject and body displayed

---

### ❌ **Features Completely Missing**

1. **Email Connection (MVP)** - 0% Complete
   - ❌ No OAuth connection to Gmail
   - ❌ No read-only inbox access
   - ❌ No "Sync Emails" functionality (button exists but non-functional)
   - ❌ No keyword-based detection of job-related emails

2. **Auto Extraction (MVP)** - 0% Complete
   - ❌ No email parsing
   - ❌ No extraction of: company name, job title, application date, status
   - ❌ No confidence scoring
   - ❌ No duplicate detection

3. **Status Automation (MVP)** - 0% Complete
   - ❌ No automatic status updates based on email content
   - ❌ No status change timestamps
   - ❌ Manual status override UI exists but not functional

4. **Privacy & Transparency (MVP)** - 0% Complete
   - ❌ No explanation of email access
   - ❌ No disconnect email functionality
   - ❌ No privacy settings/onboarding

---

## Implementation Plan

### Phase 1: Backend Infrastructure & Email Integration
**Priority: Critical** | **Estimated Time: 3-4 days**

#### 1.1 Backend Setup
- [ ] Create backend server (Node.js/Express or Python/FastAPI)
- [ ] Set up database (SQLite for MVP, PostgreSQL for production)
- [ ] Create API endpoints for applications CRUD
- [ ] Set up authentication middleware

#### 1.2 Gmail OAuth Integration
- [ ] Set up Google OAuth 2.0 credentials
- [ ] Implement OAuth flow (frontend + backend)
- [ ] Store refresh tokens securely
- [ ] Create email service to connect to Gmail API
- [ ] Implement read-only inbox access
- [ ] Add "Sync Emails" button functionality

#### 1.3 Email Detection & Parsing
- [ ] Implement keyword-based email detection
  - Keywords: "application", "interview", "rejected", "offer", "thank you for applying", etc.
- [ ] Create email parser service
- [ ] Extract: company name, job title, application date, status
- [ ] Implement basic confidence scoring (0-100%)
- [ ] Add duplicate detection logic

---

### Phase 2: Data Management & State
**Priority: Critical** | **Estimated Time: 2-3 days**

#### 2.1 Application Data Model
- [ ] Update `Application` type to include:
  - `lastUpdate: string` (timestamp)
  - `statusHistory: Array<{status, timestamp}>`
  - `confidenceScore: number`
  - `emailId: string` (link to original email)
  - `isDuplicate: boolean`
- [ ] Create database schema/migrations
- [ ] Set up data persistence layer

#### 2.2 State Management
- [ ] Replace mock data with real state management
- [ ] Implement application CRUD operations
- [ ] Add loading states
- [ ] Add error handling

---

### Phase 3: Table Enhancements
**Priority: High** | **Estimated Time: 2-3 days**

#### 3.1 Table Features
- [ ] Add "Last Update" column
- [ ] Implement inline editing for all fields
- [ ] Add sort functionality (by date, status, company)
- [ ] Add filter functionality (by status, date range)
- [ ] Add search functionality (already has UI, needs implementation)

#### 3.2 Manual Add Application
- [ ] Create "Add Application" modal/form
- [ ] Allow manual entry of all fields
- [ ] Save to database
- [ ] Update stats in real-time

---

### Phase 4: Status Automation
**Priority: High** | **Estimated Time: 2 days**

#### 4.1 Automatic Status Detection
- [ ] Implement status detection from email content:
  - "Applied" - confirmation emails
  - "Interview" - interview invitations
  - "Rejected" - rejection emails
  - "Offer" - offer letters
- [ ] Create status change timestamp tracking
- [ ] Update status history on changes

#### 4.2 Manual Status Override
- [ ] Make "Edit Status" button functional
- [ ] Allow manual status selection
- [ ] Save status changes
- [ ] Update activity log

---

### Phase 5: Insights & Analytics
**Priority: Medium** | **Estimated Time: 2 days**

#### 5.1 Dynamic Stats
- [ ] Calculate stats from actual data (not hardcoded)
- [ ] Update stats in real-time when applications change
- [ ] Add loading states for stats

#### 5.2 Applications Over Time Chart
- [ ] Install charting library (recharts or chart.js)
- [ ] Create line/bar chart component
- [ ] Show applications count over time (daily/weekly)
- [ ] Add to insights section

---

### Phase 6: Privacy & Onboarding
**Priority: Medium** | **Estimated Time: 1-2 days**

#### 6.1 Privacy Features
- [ ] Create onboarding modal explaining email access
- [ ] Add privacy policy/explanation page
- [ ] Implement "Disconnect Email" functionality
- [ ] Add email connection status indicator

#### 6.2 Empty State
- [ ] Create empty state component
- [ ] Show when no applications exist
- [ ] Guide users to connect email or add manually

---

### Phase 7: Polish & Testing
**Priority: Medium** | **Estimated Time: 2-3 days**

#### 7.1 UI/UX Improvements
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add success notifications
- [ ] Test responsive design
- [ ] Add keyboard shortcuts

#### 7.2 Testing
- [ ] Test email sync functionality
- [ ] Test duplicate detection
- [ ] Test status automation
- [ ] Test manual add/edit
- [ ] Test filtering and sorting

---

## Technical Stack Recommendations

### Backend Options:
1. **Node.js + Express** (Recommended - same language as frontend)
   - Gmail API client library
   - SQLite/PostgreSQL with Prisma or TypeORM
   - JWT for auth

2. **Python + FastAPI** (Alternative)
   - Gmail API client library
   - SQLite/PostgreSQL with SQLAlchemy
   - OAuth2 for auth

### Database:
- **SQLite** for MVP (easy setup, no server needed)
- **PostgreSQL** for production (better performance, scalability)

### Email Parsing:
- **Regex patterns** for basic extraction (MVP)
- **NLP libraries** (spaCy, NLTK) for better extraction (future)

### Charting:
- **Recharts** (React-friendly, good TypeScript support)
- **Chart.js** (alternative)

---

## File Structure to Add

```
careerpulse/
├── backend/                    # New backend directory
│   ├── server.js              # Express server
│   ├── routes/
│   │   ├── applications.js    # CRUD endpoints
│   │   ├── email.js           # Email sync endpoints
│   │   └── auth.js            # OAuth endpoints
│   ├── services/
│   │   ├── gmailService.js    # Gmail API integration
│   │   ├── emailParser.js     # Email parsing logic
│   │   └── duplicateDetector.js
│   ├── models/
│   │   └── Application.js     # Database model
│   └── config/
│       └── database.js        # DB connection
├── components/
│   ├── AddApplicationModal.tsx    # New
│   ├── EmailConnectionModal.tsx   # New
│   ├── PrivacyModal.tsx           # New
│   ├── EmptyState.tsx             # New
│   ├── ApplicationsChart.tsx       # New
│   └── StatusEditModal.tsx        # New
├── hooks/
│   ├── useApplications.ts         # New - data fetching
│   └── useEmailSync.ts            # New - email sync
├── services/
│   └── api.ts                     # New - API client
└── utils/
    └── emailParser.ts             # New - client-side parsing helpers
```

---

## Next Steps

1. **Start with Phase 1** - Backend infrastructure is critical
2. **Set up development environment** - Backend server, database
3. **Implement Gmail OAuth** - Core functionality
4. **Build incrementally** - Test each phase before moving to next
5. **Keep UI responsive** - Add loading states early

---

## Estimated Total Time: 14-20 days

This plan prioritizes core functionality (email connection, auto-extraction) before polish features (charts, advanced filtering).
