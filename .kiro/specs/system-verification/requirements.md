# Requirements Document: System Verification and Health Check

## Introduction

This specification defines the requirements for verifying all connections, configurations, and integrations in the CareerPulse application after the merge of test-suite-clean into main. This ensures the entire system is properly configured and all components are working together.

## Glossary

- **Health Check**: Verification that a service/component is operational
- **Integration Point**: Where two systems/services connect
- **Environment Variable**: Configuration value stored outside code
- **OAuth Flow**: Authentication process with external provider
- **API Endpoint**: URL that accepts requests and returns responses

## Requirements

### Requirement 1: Environment Configuration Verification

**User Story**: As a developer, I want to verify all environment variables are properly configured so that the application can run correctly.

#### Acceptance Criteria

1.1. WHEN checking backend .env, THE system SHALL verify all required variables are present

1.2. WHEN checking frontend .env, THE system SHALL verify API_URL is correctly set

1.3. WHEN checking Railway environment, THE system SHALL verify all production variables are set

1.4. WHEN variables are missing, THE system SHALL list which ones are required

1.5. WHEN variables are present, THE system SHALL verify they are in correct format

### Requirement 2: Database Connection Verification

**User Story**: As a developer, I want to verify the database is accessible and properly structured.

#### Acceptance Criteria

2.1. WHEN checking database file, THE system SHALL verify it exists at configured path

2.2. WHEN checking schema, THE system SHALL verify all required tables exist

2.3. WHEN checking tables, THE system SHALL verify all required columns exist

2.4. WHEN checking indexes, THE system SHALL verify performance indexes are present

2.5. WHEN running queries, THE system SHALL verify database is readable and writable

### Requirement 3: Google OAuth Configuration Verification

**User Story**: As a developer, I want to verify Google OAuth is properly configured for both Sign-In and Gmail.

#### Acceptance Criteria

3.1. WHEN checking Google Sign-In, THE system SHALL verify client ID and secret are set

3.2. WHEN checking Gmail OAuth, THE system SHALL verify redirect URI is correct

3.3. WHEN checking OAuth scopes, THE system SHALL verify all required scopes are requested

3.4. WHEN checking OAuth state, THE system SHALL verify state parameter is generated correctly

3.5. WHEN testing OAuth flow, THE system SHALL verify tokens can be exchanged

### Requirement 4: Gemini LLM Integration Verification

**User Story**: As a developer, I want to verify Gemini LLM is properly configured and accessible.

#### Acceptance Criteria

4.1. WHEN checking API key, THE system SHALL verify GOOGLE_AI_API_KEY is set

4.2. WHEN checking model name, THE system SHALL verify it's set to "gemini-2.0-flash-exp"

4.3. WHEN testing API connection, THE system SHALL verify Gemini API is accessible

4.4. WHEN testing parsing, THE system SHALL verify LLM can extract job data

4.5. WHEN checking cache, THE system SHALL verify caching mechanism works

### Requirement 5: Gmail API Integration Verification

**User Story**: As a developer, I want to verify Gmail API is properly configured and can fetch emails.

#### Acceptance Criteria

5.1. WHEN checking Gmail scopes, THE system SHALL verify readonly scope is requested

5.2. WHEN checking OAuth client, THE system SHALL verify it's properly initialized

5.3. WHEN testing email fetch, THE system SHALL verify emails can be retrieved

5.4. WHEN checking query, THE system SHALL verify job-related keywords are used

5.5. WHEN testing with real account, THE system SHALL verify connection works end-to-end

### Requirement 6: API Endpoints Verification

**User Story**: As a developer, I want to verify all API endpoints are accessible and working.

#### Acceptance Criteria

6.1. WHEN checking auth endpoints, THE system SHALL verify signup, login, logout work

6.2. WHEN checking Google Sign-In endpoints, THE system SHALL verify OAuth flow works

6.3. WHEN checking Gmail endpoints, THE system SHALL verify connect, sync, disconnect work

6.4. WHEN checking application endpoints, THE system SHALL verify CRUD operations work

6.5. WHEN checking health endpoint, THE system SHALL verify server status is reported

### Requirement 7: Frontend-Backend Connection Verification

**User Story**: As a developer, I want to verify the frontend can communicate with the backend.

#### Acceptance Criteria

7.1. WHEN checking API_URL, THE system SHALL verify it points to correct backend

7.2. WHEN checking CORS, THE system SHALL verify frontend origin is allowed

7.3. WHEN checking credentials, THE system SHALL verify cookies/tokens are sent

7.4. WHEN testing requests, THE system SHALL verify API calls succeed

7.5. WHEN checking errors, THE system SHALL verify error messages are displayed

### Requirement 8: Authentication Flow Verification

**User Story**: As a developer, I want to verify all authentication flows work correctly.

#### Acceptance Criteria

8.1. WHEN testing email/password signup, THE system SHALL create user and return token

8.2. WHEN testing email/password login, THE system SHALL verify credentials and return token

8.3. WHEN testing Google Sign-In, THE system SHALL complete OAuth and return token

8.4. WHEN testing JWT validation, THE system SHALL verify tokens are validated correctly

8.5. WHEN testing logout, THE system SHALL clear session and invalidate token

### Requirement 9: Email Sync Flow Verification

**User Story**: As a developer, I want to verify the complete email sync flow works end-to-end.

#### Acceptance Criteria

9.1. WHEN user connects Gmail, THE system SHALL save connection with correct userId

9.2. WHEN user syncs emails, THE system SHALL fetch emails from Gmail API

9.3. WHEN parsing emails, THE system SHALL use Gemini LLM to extract data

9.4. WHEN saving applications, THE system SHALL check for duplicates

9.5. WHEN sync completes, THE system SHALL return summary of results

### Requirement 10: Secret Manager Integration Verification

**User Story**: As a developer, I want to verify Secret Manager integration works when enabled.

#### Acceptance Criteria

10.1. WHEN USE_SECRET_MANAGER is true, THE system SHALL load secrets from GCP

10.2. WHEN USE_SECRET_MANAGER is false, THE system SHALL load secrets from .env

10.3. WHEN secrets are missing, THE system SHALL fall back gracefully

10.4. WHEN testing in production, THE system SHALL verify secrets are loaded correctly

10.5. WHEN checking permissions, THE system SHALL verify service account has access

### Requirement 11: Test Suite Verification

**User Story**: As a developer, I want to verify the test suite runs successfully.

#### Acceptance Criteria

11.1. WHEN running unit tests, THE system SHALL pass all tests

11.2. WHEN running integration tests, THE system SHALL pass all tests

11.3. WHEN running property tests, THE system SHALL pass all tests

11.4. WHEN running E2E tests, THE system SHALL pass all tests

11.5. WHEN checking coverage, THE system SHALL report 85%+ coverage

### Requirement 12: Security Configuration Verification

**User Story**: As a developer, I want to verify all security measures are properly configured.

#### Acceptance Criteria

12.1. WHEN checking Helmet, THE system SHALL verify security headers are set

12.2. WHEN checking rate limiting, THE system SHALL verify limits are enforced

12.3. WHEN checking CORS, THE system SHALL verify only allowed origins can access

12.4. WHEN checking JWT, THE system SHALL verify tokens are signed with secret

12.5. WHEN checking OAuth state, THE system SHALL verify CSRF protection is active

### Requirement 13: Production Deployment Verification

**User Story**: As a developer, I want to verify the production deployment is healthy.

#### Acceptance Criteria

13.1. WHEN checking Railway deployment, THE system SHALL verify app is running

13.2. WHEN checking environment variables, THE system SHALL verify all are set

13.3. WHEN checking logs, THE system SHALL verify no critical errors

13.4. WHEN testing endpoints, THE system SHALL verify all routes are accessible

13.5. WHEN checking database, THE system SHALL verify production DB is accessible

## Verification Checklist

### Environment Variables

**Backend (.env)**:
- [ ] PORT
- [ ] DATABASE_PATH
- [ ] JWT_SECRET
- [ ] SESSION_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GOOGLE_REDIRECT_URI
- [ ] GOOGLE_AI_API_KEY
- [ ] USE_SECRET_MANAGER
- [ ] SECRET_MANAGER_PROJECT_ID (if using Secret Manager)
- [ ] FRONTEND_URL

**Frontend (.env)**:
- [ ] VITE_API_URL

**Railway Environment**:
- [ ] All backend variables
- [ ] GOOGLE_AI_API_KEY (critical!)

### Database Tables

- [ ] users
- [ ] applications
- [ ] status_history
- [ ] email_connections

### API Endpoints

**Auth**:
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/google
- [ ] GET /api/auth/google/callback
- [ ] GET /api/auth/gmail
- [ ] GET /api/auth/gmail/callback
- [ ] GET /api/auth/status
- [ ] POST /api/auth/disconnect

**Applications**:
- [ ] GET /api/applications
- [ ] POST /api/applications
- [ ] PUT /api/applications/:id
- [ ] DELETE /api/applications/:id

**Email**:
- [ ] POST /api/email/sync

**User**:
- [ ] GET /api/user/me

### OAuth Flows

- [ ] Google Sign-In (user authentication)
- [ ] Gmail OAuth (email sync)
- [ ] OAuth state parameter generation
- [ ] OAuth state parameter validation
- [ ] Token exchange
- [ ] Token refresh

### Integrations

- [ ] Gmail API connection
- [ ] Gemini LLM API connection
- [ ] Secret Manager (if enabled)
- [ ] Database connection
- [ ] Frontend-backend communication

### Security

- [ ] Helmet security headers
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] JWT token validation
- [ ] OAuth CSRF protection
- [ ] Password hashing

### Tests

- [ ] Unit tests (backend/tests/unit/)
- [ ] Integration tests (backend/tests/integration/)
- [ ] Property tests (backend/tests/properties/)
- [ ] E2E tests (backend/tests/e2e/)
- [ ] Code coverage report

## Success Criteria

The system verification is successful when:

1. ✅ All environment variables are present and valid
2. ✅ Database is accessible and properly structured
3. ✅ All API endpoints respond correctly
4. ✅ Google Sign-In OAuth flow works
5. ✅ Gmail OAuth flow works
6. ✅ Gemini LLM can parse emails
7. ✅ Email sync flow works end-to-end
8. ✅ All 397 tests pass
9. ✅ Frontend can communicate with backend
10. ✅ Production deployment is healthy
11. ✅ No critical errors in logs
12. ✅ All security measures are active

## Out of Scope

- Performance optimization
- Load testing
- Penetration testing
- UI/UX improvements
- New feature development
- Database migrations
- Scaling configuration

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing environment variables | Medium | High | Automated verification script |
| OAuth misconfiguration | Low | High | Test with real accounts |
| Gemini API key invalid | Medium | High | Test API connection |
| Database corruption | Very Low | Critical | Backup before verification |
| Production deployment failure | Low | High | Test in staging first |
| Test failures | Low | Medium | Fix before deploying |

## Validation Plan

1. **Local Verification**: Run all checks on local development environment
2. **Staging Verification**: Run all checks on staging environment (if available)
3. **Production Verification**: Run non-destructive checks on production
4. **Automated Monitoring**: Set up continuous health checks
5. **Manual Testing**: Test critical user flows manually
