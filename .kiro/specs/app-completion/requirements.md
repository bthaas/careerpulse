# Requirements Document: CareerPulse/JobFetch App Completion

## Introduction

This specification defines the requirements for completing the CareerPulse/JobFetch application to make it fully functional for end-to-end testing with real Gmail data. The app is mostly complete but has critical OAuth flow issues that prevent proper Gmail connection and email syncing.

## Current State Analysis

### ✅ What's Working

**Backend (Fully Implemented)**:
- User authentication (signup/login with JWT)
- Google Sign-In OAuth for user authentication
- Application CRUD operations (create, read, update, delete)
- Status history tracking
- Email parsing service (extracts job data from emails)
- Duplicate detection service
- Gmail API service (fetches emails)
- Database schema with proper relationships
- Security middleware (helmet, rate limiting, CORS)
- Comprehensive test suite (397 tests passing, 85% coverage)

**Frontend (Fully Implemented)**:
- Login/Signup UI with Google Sign-In
- Dashboard with applications table
- Add application modal
- Application drawer (details view)
- Search and filtering
- Dark mode
- Empty state with Gmail connection button
- Auth context with token management

### ❌ What's Broken

**Critical Issue: Gmail OAuth Flow**:
1. **Problem**: When user clicks "Connect Gmail" → OAuth callback saves connection with `userId: 'pending'`
2. **Root Cause**: OAuth callback endpoint (`/api/auth/gmail/callback`) doesn't have access to authenticated user session
3. **Impact**: User can't sync emails because connection isn't linked to their account
4. **Current Code**:
   ```javascript
   // backend/routes/auth.js line 48
   await saveEmailConnection({
     userId: 'pending', // ❌ WRONG - not linked to actual user
     email: tokens.email || 'unknown@email.com',
     accessToken: tokens.access_token,
     refreshToken: tokens.refresh_token,
     expiresAt: expiresAt.toISOString()
   });
   ```

**Secondary Issues**:
1. No visual feedback for Gmail connection status in UI
2. No way to disconnect Gmail from UI
3. No error handling for expired OAuth tokens in UI
4. OAuth state parameter not used to preserve user context

## Glossary

- **OAuth State Parameter**: A security token passed through OAuth flow to maintain user context
- **Gmail Connection**: Link between user account and Gmail OAuth tokens
- **Email Sync**: Process of fetching emails from Gmail, parsing them, and saving as applications
- **JWT Token**: JSON Web Token used for user authentication
- **OAuth Callback**: Endpoint that receives authorization code from Google after user grants permission

## Requirements

### Requirement 1: Fix Gmail OAuth Flow with State Parameter

**User Story**: As a logged-in user, I want to connect my Gmail account so that I can sync my job application emails.

#### Acceptance Criteria

1.1. WHEN user clicks "Connect Gmail", THE system SHALL generate a secure state parameter containing the user's JWT token

1.2. WHEN the OAuth URL is generated, THE system SHALL include the state parameter in the authorization URL

1.3. WHEN Google redirects to the callback endpoint, THE system SHALL extract and validate the state parameter

1.4. WHEN the state parameter is valid, THE system SHALL decode the JWT token to get the userId

1.5. WHEN saving the Gmail connection, THE system SHALL use the actual userId from the decoded token (not 'pending')

1.6. WHEN the state parameter is invalid or missing, THE system SHALL return an error and not save the connection

1.7. WHEN the OAuth callback completes successfully, THE system SHALL redirect to frontend with success message

### Requirement 2: Add Gmail Connection Status UI

**User Story**: As a user, I want to see my Gmail connection status so that I know if email sync is available.

#### Acceptance Criteria

2.1. WHEN user is on the dashboard, THE UI SHALL display Gmail connection status in the header or settings area

2.2. WHEN Gmail is connected, THE UI SHALL show the connected email address and a "Disconnect" button

2.3. WHEN Gmail is not connected, THE UI SHALL show a "Connect Gmail" button

2.4. WHEN user clicks "Disconnect", THE system SHALL call the disconnect API and update the UI

2.5. WHEN Gmail connection status changes, THE UI SHALL update automatically without page refresh

2.6. WHEN checking connection status fails, THE UI SHALL display an appropriate error message

### Requirement 3: Improve Error Handling for OAuth

**User Story**: As a user, I want clear error messages when Gmail connection fails so that I can troubleshoot the issue.

#### Acceptance Criteria

3.1. WHEN OAuth callback receives an error from Google, THE system SHALL display a user-friendly error message

3.2. WHEN OAuth tokens are expired, THE system SHALL attempt automatic refresh before showing error

3.3. WHEN token refresh fails, THE system SHALL prompt user to reconnect Gmail

3.4. WHEN network errors occur during OAuth, THE system SHALL display a retry option

3.5. WHEN user denies Gmail permissions, THE system SHALL explain what permissions are needed and why

### Requirement 4: Add Gmail Connection Management UI

**User Story**: As a user, I want to manage my Gmail connection from the app so that I can reconnect or disconnect as needed.

#### Acceptance Criteria

4.1. WHEN user opens settings/profile menu, THE UI SHALL show Gmail connection section

4.2. WHEN Gmail is connected, THE section SHALL display:
   - Connected email address
   - Connection date
   - Last sync timestamp
   - "Disconnect" button
   - "Sync Now" button

4.3. WHEN Gmail is not connected, THE section SHALL display:
   - Explanation of Gmail sync feature
   - "Connect Gmail" button
   - List of required permissions

4.4. WHEN user clicks "Sync Now", THE system SHALL trigger email sync and show progress

4.5. WHEN sync completes, THE UI SHALL display sync results (new applications, duplicates, errors)

### Requirement 5: Test End-to-End Gmail Flow

**User Story**: As a developer, I want to verify the complete Gmail flow works with real data so that I can confidently deploy the app.

#### Acceptance Criteria

5.1. WHEN testing with r.w.chen88@gmail.com account, THE system SHALL successfully connect Gmail

5.2. WHEN syncing emails, THE system SHALL fetch real job application emails from the inbox

5.3. WHEN parsing emails, THE system SHALL correctly extract company, role, status, and other fields

5.4. WHEN saving applications, THE system SHALL link them to the correct user account

5.5. WHEN checking for duplicates, THE system SHALL prevent duplicate applications from being saved

5.6. WHEN displaying applications, THE UI SHALL show all synced applications with correct data

5.7. WHEN disconnecting Gmail, THE system SHALL remove the connection but keep existing applications

### Requirement 6: Add OAuth Security Enhancements

**User Story**: As a security-conscious developer, I want the OAuth flow to be secure against CSRF and token theft attacks.

#### Acceptance Criteria

6.1. WHEN generating OAuth state, THE system SHALL use a cryptographically secure random value

6.2. WHEN storing state, THE system SHALL include an expiration timestamp (5 minutes)

6.3. WHEN validating state, THE system SHALL check expiration and reject expired states

6.4. WHEN state validation fails, THE system SHALL log the security event for monitoring

6.5. WHEN OAuth callback completes, THE system SHALL invalidate the used state parameter

### Requirement 7: Improve User Experience During OAuth

**User Story**: As a user, I want a smooth experience when connecting Gmail so that I don't get confused by popup windows or redirects.

#### Acceptance Criteria

7.1. WHEN user clicks "Connect Gmail", THE system SHALL open OAuth in a popup window (not new tab)

7.2. WHEN OAuth completes, THE popup SHALL automatically close

7.3. WHEN popup closes, THE main window SHALL detect the connection and update UI

7.4. WHEN popup is blocked by browser, THE system SHALL fall back to redirect flow

7.5. WHEN OAuth is in progress, THE "Connect Gmail" button SHALL show loading state

7.6. WHEN OAuth completes successfully, THE system SHALL show a success notification

### Requirement 8: Add Logging and Monitoring

**User Story**: As a developer, I want detailed logs of the OAuth flow so that I can debug issues in production.

#### Acceptance Criteria

8.1. WHEN OAuth flow starts, THE system SHALL log the user ID and timestamp

8.2. WHEN state parameter is generated, THE system SHALL log the state value (hashed)

8.3. WHEN OAuth callback is received, THE system SHALL log the code and state parameters

8.4. WHEN token exchange succeeds, THE system SHALL log success with email address

8.5. WHEN any OAuth step fails, THE system SHALL log detailed error information

8.6. WHEN Gmail connection is saved, THE system SHALL log the userId and email

## Success Criteria

The app completion is successful when:

1. ✅ User can sign up/login with email or Google Sign-In
2. ✅ User can connect Gmail account via OAuth
3. ✅ Gmail connection is properly linked to user account (not 'pending')
4. ✅ User can sync emails and see job applications appear in dashboard
5. ✅ User can see Gmail connection status in UI
6. ✅ User can disconnect Gmail from UI
7. ✅ Duplicate applications are detected and skipped
8. ✅ Email parsing correctly extracts job data from real emails
9. ✅ All OAuth security measures are in place
10. ✅ End-to-end flow works with r.w.chen88@gmail.com test account

## Out of Scope

The following are explicitly out of scope for this completion phase:

- Email notifications or reminders
- Calendar integration
- Resume/cover letter management
- Job search features
- Analytics dashboard
- Mobile app
- Multi-language support
- Advanced filtering beyond current implementation
- Export to CSV/PDF
- Sharing applications with others
- Interview scheduling
- Salary negotiation tools

## Technical Constraints

1. Must use existing OAuth 2.0 implementation with Google APIs
2. Must maintain backward compatibility with existing database schema
3. Must not break existing test suite (397 tests)
4. Must work with existing JWT authentication system
5. Must support both development (localhost) and production environments
6. Must handle OAuth popup blockers gracefully
7. Must work with existing CORS configuration

## Dependencies

- Google OAuth 2.0 API (already configured)
- Gmail API (already configured)
- Existing backend services (emailParser, duplicateDetector, gmailService)
- Existing database schema
- Existing frontend components

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth state parameter breaks existing flow | High | Thorough testing with real Gmail account |
| Popup blockers prevent OAuth | Medium | Implement fallback to redirect flow |
| Token refresh fails in production | High | Add comprehensive error handling and logging |
| User confusion during OAuth | Medium | Add clear UI feedback and instructions |
| Security vulnerabilities in state handling | High | Use crypto-secure random values and expiration |

## Validation Plan

1. **Unit Tests**: Add tests for state parameter generation and validation
2. **Integration Tests**: Test complete OAuth flow with mocked Google responses
3. **E2E Tests**: Test with real Gmail account (r.w.chen88@gmail.com)
4. **Manual Testing**: Complete user journey from signup to email sync
5. **Security Review**: Verify OAuth security measures are properly implemented
6. **Performance Testing**: Ensure OAuth flow completes within 10 seconds
