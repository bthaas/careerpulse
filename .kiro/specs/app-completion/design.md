# Design Document: CareerPulse/JobFetch App Completion

## Overview

This design document outlines the technical approach for completing the CareerPulse/JobFetch application by fixing the Gmail OAuth flow and adding necessary UI components for Gmail connection management. The primary focus is on properly linking Gmail connections to user accounts using OAuth state parameters.

## Architecture

### Current Architecture (Working)

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ LoginSignup  │  │  Dashboard   │  │   Header     │     │
│  │  Component   │  │  Component   │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  AuthContext   │                       │
│                    │  (JWT Tokens)  │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTP + JWT
                             │
┌────────────────────────────▼──────────────────────────────┐
│                     Backend (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ User Routes  │  │  App Routes  │  │ Email Routes │   │
│  │ (Auth)       │  │  (CRUD)      │  │ (Sync)       │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                  │           │
│         └──────────────────┴──────────────────┘           │
│                            │                              │
│                    ┌───────▼────────┐                     │
│                    │   Database     │                     │
│                    │   (SQLite)     │                     │
│                    └────────────────┘                     │
└───────────────────────────────────────────────────────────┘
```

### Problem: Broken Gmail OAuth Flow

```
Current Flow (BROKEN):
1. User clicks "Connect Gmail" → Opens OAuth popup
2. User grants permissions → Google redirects to callback
3. Callback receives code → Exchanges for tokens
4. Saves connection with userId: 'pending' ❌
5. User tries to sync → No connection found ❌

Why it's broken:
- OAuth callback has no access to user session
- No way to know which user initiated the OAuth flow
- Connection saved with 'pending' instead of actual userId
```

### Solution: OAuth State Parameter

```
Fixed Flow (WORKING):
1. User clicks "Connect Gmail" → Generate state with JWT
2. Open OAuth with state parameter → User grants permissions
3. Google redirects with code + state → Callback validates state
4. Extract userId from state → Exchange code for tokens
5. Save connection with actual userId ✅
6. User syncs emails → Connection found ✅

How it works:
- State parameter carries encrypted user context
- Callback decodes state to get userId
- Connection properly linked to user account
```

## Components and Interfaces

### 1. OAuth State Manager (New)

**Purpose**: Generate and validate OAuth state parameters with user context

**Location**: `backend/utils/oauthState.js`

**Interface**:
```javascript
/**
 * Generate OAuth state parameter with user context
 * @param {string} userId - User ID to encode in state
 * @param {string} jwtToken - User's JWT token
 * @returns {string} Encrypted state parameter
 */
function generateOAuthState(userId, jwtToken): string

/**
 * Validate and decode OAuth state parameter
 * @param {string} state - State parameter from OAuth callback
 * @returns {Object} { valid: boolean, userId: string, email: string }
 */
function validateOAuthState(state): { valid, userId, email }

/**
 * Create state with expiration (5 minutes)
 * @param {Object} payload - Data to encode
 * @returns {string} Base64 encoded state
 */
function createState(payload): string

/**
 * Verify state hasn't expired
 * @param {Object} decoded - Decoded state payload
 * @returns {boolean} True if valid and not expired
 */
function verifyStateExpiration(decoded): boolean
```

**Implementation Details**:
- Use JWT to encode state (reuse existing JWT_SECRET)
- Include: userId, email, timestamp, random nonce
- Set expiration to 5 minutes
- Validate signature and expiration on decode

### 2. Updated Gmail Auth Routes

**Purpose**: Modify auth routes to use state parameter

**Location**: `backend/routes/auth.js`

**Changes**:

```javascript
// GET /api/auth/gmail (MODIFIED)
router.get('/gmail', authMiddleware, (req, res) => {
  // Generate state with user context
  const state = generateOAuthState(req.user.userId, req.headers.authorization);
  
  // Generate OAuth URL with state
  const authUrl = getAuthUrl(state);
  
  res.json({ authUrl });
});

// GET /api/auth/gmail/callback (MODIFIED)
router.get('/gmail/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Validate state parameter
  const stateData = validateOAuthState(state);
  if (!stateData.valid) {
    return res.status(400).send('Invalid or expired state');
  }
  
  // Exchange code for tokens
  const tokens = await getTokensFromCode(code);
  
  // Save connection with ACTUAL userId (not 'pending')
  await saveEmailConnection({
    userId: stateData.userId, // ✅ FIXED
    email: tokens.email || stateData.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expiry_date).toISOString()
  });
  
  // Success response
  res.send('✅ Gmail Connected Successfully!');
});
```

### 3. Gmail Connection Status Component (New)

**Purpose**: Display Gmail connection status and management UI

**Location**: `components/GmailConnectionStatus.tsx`

**Interface**:
```typescript
interface GmailConnectionStatusProps {
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

interface ConnectionState {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
  isLoading: boolean;
  error: string | null;
}
```

**UI Design**:
```
┌─────────────────────────────────────────────────┐
│  Gmail Connection                               │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Connected: user@gmail.com              │ │
│  │ Last sync: 2 hours ago                    │ │
│  │                                           │ │
│  │ [Sync Now]  [Disconnect]                 │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

OR (when not connected):

┌─────────────────────────────────────────────────┐
│  Gmail Connection                               │
│  ┌───────────────────────────────────────────┐ │
│  │ ❌ Not Connected                          │ │
│  │                                           │ │
│  │ Connect your Gmail to automatically      │ │
│  │ import job applications from your inbox. │ │
│  │                                           │ │
│  │ [Connect Gmail]                          │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4. Updated Gmail Config

**Purpose**: Support state parameter in OAuth URL generation

**Location**: `backend/config/gmail.js`

**Changes**:
```javascript
/**
 * Generate Gmail OAuth URL with state parameter
 * @param {string} state - OAuth state parameter
 * @returns {string} Authorization URL
 */
export function getAuthUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
    state: state // ✅ ADD STATE PARAMETER
  });
}
```

### 5. Frontend OAuth Handler (Updated)

**Purpose**: Handle OAuth popup and state management

**Location**: `App.tsx` (handleConnectGmail function)

**Changes**:
```typescript
const handleConnectGmail = async () => {
  try {
    setIsSyncing(true);
    
    // Get OAuth URL with state from backend
    const response = await fetch(`${api.API_URL}/api/auth/gmail`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    
    // Open OAuth in popup
    const popup = window.open(
      data.authUrl,
      'Gmail OAuth',
      'width=600,height=700'
    );
    
    // Poll for popup close
    const pollTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollTimer);
        // Check connection status
        checkGmailConnection();
      }
    }, 1000);
    
  } catch (err) {
    console.error('Error connecting Gmail:', err);
    alert('Failed to connect Gmail');
  } finally {
    setIsSyncing(false);
  }
};

const checkGmailConnection = async () => {
  try {
    const status = await api.getAuthStatus();
    if (status.connected) {
      alert('✅ Gmail connected successfully!');
      // Refresh UI
    }
  } catch (err) {
    console.error('Error checking connection:', err);
  }
};
```

## Data Models

### OAuth State Payload

```javascript
{
  userId: string,        // User ID from JWT
  email: string,         // User email
  timestamp: number,     // Unix timestamp
  nonce: string,         // Random value for uniqueness
  expiresAt: number      // Expiration timestamp (5 min)
}
```

### Gmail Connection (Database)

```sql
CREATE TABLE email_connections (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,           -- ✅ FIXED: actual userId
  email TEXT NOT NULL,             -- Gmail address
  accessToken TEXT NOT NULL,       -- OAuth access token
  refreshToken TEXT NOT NULL,      -- OAuth refresh token
  expiresAt TEXT NOT NULL,         -- Token expiration
  connected INTEGER DEFAULT 1,     -- Connection status
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Connection Status Response

```typescript
interface ConnectionStatus {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
}
```

## Error Handling

### OAuth Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Invalid state | State tampered or expired | Show error, prompt reconnect |
| Missing code | User denied permissions | Explain permissions needed |
| Token exchange failed | Network or Google API error | Show retry option |
| Connection save failed | Database error | Log error, show generic message |
| Popup blocked | Browser blocked popup | Fall back to redirect flow |

### Error Response Format

```javascript
{
  error: string,           // Error type
  message: string,         // User-friendly message
  details?: object,        // Additional context
  retryable: boolean       // Can user retry?
}
```

### Frontend Error Handling

```typescript
try {
  await connectGmail();
} catch (error) {
  if (error.message.includes('popup blocked')) {
    // Fall back to redirect
    window.location.href = authUrl;
  } else if (error.message.includes('denied')) {
    showError('Gmail permissions are required to sync emails');
  } else {
    showError('Failed to connect Gmail. Please try again.');
  }
}
```

## Security Considerations

### OAuth State Security

1. **Encryption**: State is JWT-signed with server secret
2. **Expiration**: State expires after 5 minutes
3. **Nonce**: Random value prevents replay attacks
4. **Validation**: Server validates signature and expiration
5. **One-time use**: State invalidated after successful use

### Token Storage

1. **Access tokens**: Stored in database, never exposed to frontend
2. **Refresh tokens**: Stored in database, used for automatic renewal
3. **JWT tokens**: Stored in localStorage, used for API authentication
4. **Session cookies**: HttpOnly, Secure in production

### CSRF Protection

1. OAuth state parameter acts as CSRF token
2. JWT signature prevents tampering
3. Expiration prevents replay attacks
4. Origin validation in CORS middleware

## Testing Strategy

### Unit Tests

```javascript
describe('OAuth State Manager', () => {
  test('generates valid state with user context', () => {
    const state = generateOAuthState('user-123', 'jwt-token');
    expect(state).toBeTruthy();
    expect(typeof state).toBe('string');
  });
  
  test('validates state and extracts userId', () => {
    const state = generateOAuthState('user-123', 'jwt-token');
    const result = validateOAuthState(state);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-123');
  });
  
  test('rejects expired state', () => {
    // Create state with past expiration
    const expiredState = createExpiredState();
    const result = validateOAuthState(expiredState);
    expect(result.valid).toBe(false);
  });
  
  test('rejects tampered state', () => {
    const state = generateOAuthState('user-123', 'jwt-token');
    const tampered = state + 'extra';
    const result = validateOAuthState(tampered);
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests

```javascript
describe('Gmail OAuth Flow', () => {
  test('complete OAuth flow with state parameter', async () => {
    // 1. Get OAuth URL with state
    const response = await request(app)
      .get('/api/auth/gmail')
      .set('Authorization', 'Bearer valid-jwt-token');
    
    expect(response.body.authUrl).toContain('state=');
    
    // 2. Extract state from URL
    const url = new URL(response.body.authUrl);
    const state = url.searchParams.get('state');
    
    // 3. Simulate callback with code and state
    const callbackResponse = await request(app)
      .get('/api/auth/gmail/callback')
      .query({ code: 'mock-code', state });
    
    expect(callbackResponse.status).toBe(200);
    
    // 4. Verify connection saved with correct userId
    const connection = await getEmailConnection('user-123');
    expect(connection).toBeTruthy();
    expect(connection.userId).toBe('user-123');
    expect(connection.userId).not.toBe('pending');
  });
});
```

### E2E Tests

```javascript
describe('Gmail Connection E2E', () => {
  test('user can connect Gmail and sync emails', async () => {
    // 1. Login
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Click Connect Gmail
    await page.click('text=Connect Gmail');
    
    // 3. Handle OAuth popup (mock)
    // ... OAuth flow simulation ...
    
    // 4. Verify connection status
    await page.waitForSelector('text=Connected: test@gmail.com');
    
    // 5. Sync emails
    await page.click('text=Sync Now');
    await page.waitForSelector('text=Sync complete');
    
    // 6. Verify applications appear
    const apps = await page.$$('[data-testid="application-row"]');
    expect(apps.length).toBeGreaterThan(0);
  });
});
```

## Implementation Plan

### Phase 1: Backend OAuth State (Priority: Critical)

1. Create `backend/utils/oauthState.js` with state generation/validation
2. Update `backend/routes/auth.js` to use state parameter
3. Update `backend/config/gmail.js` to accept state in OAuth URL
4. Add unit tests for state manager
5. Add integration tests for OAuth flow

### Phase 2: Frontend OAuth Handling (Priority: High)

1. Update `App.tsx` handleConnectGmail to use new OAuth flow
2. Add popup close detection and status polling
3. Add error handling for popup blockers
4. Add loading states during OAuth
5. Test with real Gmail account

### Phase 3: Gmail Connection UI (Priority: Medium)

1. Create `components/GmailConnectionStatus.tsx`
2. Add connection status display to Header or Settings
3. Add disconnect functionality
4. Add last sync timestamp display
5. Style components to match existing design

### Phase 4: Testing and Validation (Priority: High)

1. Test complete flow with r.w.chen88@gmail.com
2. Verify emails sync correctly
3. Verify applications appear in dashboard
4. Test disconnect and reconnect
5. Test error scenarios (denied permissions, network errors)

### Phase 5: Polish and Documentation (Priority: Low)

1. Add user-facing documentation for Gmail connection
2. Add developer documentation for OAuth flow
3. Add logging for debugging
4. Add analytics events for monitoring
5. Update README with setup instructions

## Performance Considerations

- OAuth state generation: < 10ms
- State validation: < 5ms
- OAuth callback processing: < 500ms
- Popup detection polling: 1 second intervals
- Connection status check: < 200ms

## Deployment Considerations

### Environment Variables

```bash
# Required for OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Required for JWT
JWT_SECRET=your-jwt-secret

# Required for frontend
VITE_API_URL=http://localhost:3001
```

### Production Checklist

- [ ] Update GOOGLE_REDIRECT_URI to production URL
- [ ] Use secure JWT_SECRET (32+ characters)
- [ ] Enable HTTPS for OAuth callback
- [ ] Configure CORS for production domain
- [ ] Test OAuth flow in production environment
- [ ] Monitor OAuth error rates
- [ ] Set up alerts for failed OAuth attempts

## Appendix: Code Examples

### Example: OAuth State Generation

```javascript
// backend/utils/oauthState.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const STATE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

export function generateOAuthState(userId, jwtToken) {
  // Decode JWT to get email
  const decoded = jwt.verify(jwtToken.replace('Bearer ', ''), JWT_SECRET);
  
  // Create state payload
  const payload = {
    userId,
    email: decoded.email,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + STATE_EXPIRATION
  };
  
  // Sign with JWT
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });
}

export function validateOAuthState(state) {
  try {
    const decoded = jwt.verify(state, JWT_SECRET);
    
    // Check expiration
    if (Date.now() > decoded.expiresAt) {
      return { valid: false, error: 'State expired' };
    }
    
    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### Example: Frontend OAuth Handler

```typescript
// App.tsx
const handleConnectGmail = async () => {
  try {
    setIsConnecting(true);
    
    // Get OAuth URL from backend (includes state)
    const response = await fetch(`${API_URL}/api/auth/gmail`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get OAuth URL');
    
    const { authUrl } = await response.json();
    
    // Open OAuth in popup
    const popup = window.open(authUrl, 'Gmail OAuth', 'width=600,height=700');
    
    if (!popup) {
      // Popup blocked - fall back to redirect
      window.location.href = authUrl;
      return;
    }
    
    // Poll for popup close
    const pollTimer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(pollTimer);
        
        // Check if connection succeeded
        const status = await api.getAuthStatus();
        if (status.connected) {
          setGmailConnected(true);
          setGmailEmail(status.email);
          showSuccess('Gmail connected successfully!');
        }
      }
    }, 1000);
    
  } catch (error) {
    console.error('OAuth error:', error);
    showError('Failed to connect Gmail');
  } finally {
    setIsConnecting(false);
  }
};
```
