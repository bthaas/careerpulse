# CareerPulse MVP Implementation Checklist

## Quick Reference: Feature Status

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| **Email Connection** | ❌ Missing | 🔴 Critical | OAuth + Gmail API needed |
| **Auto Extraction** | ❌ Missing | 🔴 Critical | Email parsing + confidence scoring |
| **Application Table** | 🟡 Partial | 🟠 High | Needs: inline edit, sort, filter, Last Update column |
| **Status Automation** | ❌ Missing | 🟠 High | Auto-detect status from emails |
| **Manual Controls** | 🟡 Partial | 🟠 High | Needs: Add button, save functionality |
| **Basic Insights** | 🟡 Partial | 🟡 Medium | Needs: dynamic stats, chart |
| **Privacy & Transparency** | ❌ Missing | 🟡 Medium | Onboarding, disconnect email |
| **Empty State** | ❌ Missing | 🟡 Medium | Onboarding UX |

---

## Implementation Order (Recommended)

### 🔴 **Week 1: Core Backend & Email Integration**

#### Day 1-2: Backend Setup
- [ ] Initialize backend project (Node.js + Express recommended)
- [ ] Set up database (SQLite for MVP)
- [ ] Create database schema for applications
- [ ] Set up API structure (routes, controllers, services)
- [ ] Create basic CRUD endpoints for applications
- [ ] Test API with Postman/Thunder Client

#### Day 3-4: Gmail OAuth
- [ ] Create Google Cloud Project
- [ ] Enable Gmail API
- [ ] Set up OAuth 2.0 credentials
- [ ] Implement OAuth flow (frontend + backend)
- [ ] Store tokens securely
- [ ] Test OAuth connection

#### Day 5: Email Sync
- [ ] Implement Gmail API client
- [ ] Create "Sync Emails" endpoint
- [ ] Fetch emails from inbox (read-only)
- [ ] Filter emails by keywords
- [ ] Connect sync button to backend
- [ ] Test email fetching

---

### 🟠 **Week 2: Email Parsing & Data Management**

#### Day 6-7: Email Parsing
- [ ] Create email parser service
- [ ] Extract company name (from sender/domain)
- [ ] Extract job title (from subject/body)
- [ ] Extract application date (from email date)
- [ ] Extract status (keyword matching)
- [ ] Implement confidence scoring (0-100%)
- [ ] Test parsing with sample emails

#### Day 8: Duplicate Detection
- [ ] Implement duplicate detection logic
- [ ] Compare: company + job title + date
- [ ] Mark duplicates in database
- [ ] Handle duplicate resolution UI

#### Day 9-10: Data Integration
- [ ] Replace mock data with API calls
- [ ] Implement state management (Context API or Zustand)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Update all components to use real data

---

### 🟡 **Week 3: UI Enhancements**

#### Day 11-12: Table Features
- [ ] Add "Last Update" column to table
- [ ] Implement inline editing
- [ ] Add sort functionality (date, status, company)
- [ ] Add filter functionality (status, date range)
- [ ] Implement search (already has UI)
- [ ] Save edits to backend

#### Day 13: Manual Add Application
- [ ] Create "Add Application" modal
- [ ] Form with all required fields
- [ ] Validation
- [ ] Save to backend
- [ ] Update table immediately

#### Day 14: Status Automation
- [ ] Implement automatic status detection
- [ ] Create status history tracking
- [ ] Make "Edit Status" button functional
- [ ] Update activity log with status changes
- [ ] Add status change timestamps

---

### 🟢 **Week 4: Polish & Insights**

#### Day 15-16: Insights
- [ ] Make stats dynamic (calculate from data)
- [ ] Install charting library (recharts)
- [ ] Create applications over time chart
- [ ] Add to insights section
- [ ] Update stats in real-time

#### Day 17: Privacy & Onboarding
- [ ] Create email connection onboarding modal
- [ ] Add privacy explanation
- [ ] Implement "Disconnect Email" functionality
- [ ] Add connection status indicator
- [ ] Create empty state component

#### Day 18-20: Testing & Polish
- [ ] Test all features end-to-end
- [ ] Fix bugs
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add success notifications
- [ ] Final UI polish

---

## Quick Wins (Can Start Immediately)

These can be implemented without backend:

1. **Add "Last Update" column to table** (30 min)
   - Add to types.ts
   - Add to table header
   - Display in table rows

2. **Create "Add Application" modal** (2 hours)
   - Modal component
   - Form with validation
   - For now, add to local state (mock data)

3. **Make stats dynamic** (1 hour)
   - Calculate from MOCK_APPLICATIONS
   - Update StatsCards component

4. **Add sort/filter UI** (2 hours)
   - Add sort dropdown
   - Add filter dropdowns
   - Implement client-side sorting/filtering on mock data

5. **Empty state component** (1 hour)
   - Show when applications.length === 0
   - Guide to connect email or add manually

---

## Backend Technology Stack (Recommended)

### Option 1: Node.js (Recommended)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "googleapis": "^126.0.0",
    "sqlite3": "^5.1.6",
    "better-sqlite3": "^9.2.2",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Option 2: Python (Alternative)
```txt
fastapi==0.104.1
google-api-python-client==2.100.0
sqlalchemy==2.0.23
python-dotenv==1.0.0
```

---

## Environment Variables Needed

```env
# Backend
PORT=3001
DATABASE_URL=./careerpulse.db
JWT_SECRET=your-secret-key

# Gmail OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Frontend
VITE_API_URL=http://localhost:3001
```

---

## Key Files to Create/Modify

### New Backend Files:
- `backend/server.js` - Main server
- `backend/routes/applications.js` - CRUD routes
- `backend/routes/email.js` - Email sync routes
- `backend/routes/auth.js` - OAuth routes
- `backend/services/gmailService.js` - Gmail API
- `backend/services/emailParser.js` - Email parsing
- `backend/models/Application.js` - Database model

### New Frontend Files:
- `components/AddApplicationModal.tsx`
- `components/EmailConnectionModal.tsx`
- `components/EmptyState.tsx`
- `components/ApplicationsChart.tsx`
- `hooks/useApplications.ts`
- `hooks/useEmailSync.ts`
- `services/api.ts`

### Files to Modify:
- `types.ts` - Add lastUpdate, statusHistory, confidenceScore
- `App.tsx` - Replace mock data with API calls
- `components/ApplicationsTable.tsx` - Add inline edit, sort, filter
- `components/StatsCards.tsx` - Make dynamic
- `components/ApplicationDrawer.tsx` - Make edit functional

---

## Testing Checklist

- [ ] OAuth flow works end-to-end
- [ ] Email sync fetches and parses emails correctly
- [ ] Duplicate detection works
- [ ] Status automation detects correctly
- [ ] Manual add/edit saves correctly
- [ ] Sort and filter work
- [ ] Stats update in real-time
- [ ] Chart displays correctly
- [ ] Empty state shows when no data
- [ ] Privacy modal explains access
- [ ] Disconnect email works

---

## Notes

- Start with backend infrastructure - everything depends on it
- Test email parsing with real Gmail emails early
- Keep UI responsive with loading states
- Use SQLite for MVP (easy, no setup needed)
- Consider using a state management library (Zustand is lightweight)
- Add error boundaries for better error handling
