# Implementation Plan: Google Sign-In Integration

## Overview

This implementation plan focuses on the minimal changes needed to complete the Google Sign-In integration. The analysis reveals that most of the infrastructure is already in place - the OAuth routes, frontend handlers, and auth context all exist and function correctly. The primary task is updating the `generateToken` function signature for consistency and adding comprehensive tests.

## Tasks

- [ ] 1. Update auth utility function signature
  - Modify `generateToken` in `backend/utils/auth.js` to accept an object parameter instead of separate parameters
  - Update function to handle both `{ id, email }` and `{ userId, email }` formats for backward compatibility
  - Ensure existing callers continue to work
  - _Requirements: 5.1, 5.2, 8.2_

- [ ] 2. Write property tests for OAuth URL generation
  - **Property 1: OAuth URL Generation**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - Generate random valid requests to `/api/auth/google`
  - Verify all generated URLs contain correct client ID, redirect URI, and scopes
  - Run 100+ iterations

- [ ] 3. Write property tests for user creation idempotency
  - **Property 2: User Creation Idempotency**
  - **Validates: Requirements 3.1, 3.5, 4.2**
  - Generate random Google profiles
  - Authenticate multiple times with same profile
  - Verify only one user account exists in database

- [ ] 4. Write property tests for OAuth user account structure
  - **Property 3: OAuth User Account Structure**
  - **Validates: Requirements 3.2, 3.3, 3.4**
  - Generate random Google profiles
  - Create users via OAuth flow
  - Verify password is null, email matches profile, name is valid

- [ ] 5. Write property tests for JWT token consistency
  - **Property 4: JWT Token Consistency**
  - **Validates: Requirements 5.1, 5.2, 5.4, 8.2**
  - Generate random user data
  - Create JWT tokens via OAuth flow
  - Verify tokens are valid and contain correct payload

- [ ] 6. Write property tests for session persistence
  - **Property 5: Session Persistence**
  - **Validates: Requirements 5.5, 5.6**
  - Generate random authentication sessions
  - Store and retrieve tokens from localStorage mock
  - Verify session restoration works correctly

- [ ] 7. Write property tests for error handling
  - **Property 6: Error Handling Completeness**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
  - Generate random error scenarios (missing code, token failure, etc.)
  - Verify all errors result in proper redirects with error codes
  - Verify no user sessions are created on errors

- [ ] 8. Write property tests for cross-authentication compatibility
  - **Property 7: Cross-Authentication Compatibility**
  - **Validates: Requirements 4.3, 4.4**
  - Generate random user accounts (OAuth and email/password)
  - Authenticate via OAuth
  - Verify authentication succeeds for all account types

- [ ] 9. Write unit tests for OAuth URL generation
  - Test URL contains correct client ID
  - Test URL contains correct redirect URI
  - Test URL contains required scopes (userinfo.email, userinfo.profile)
  - Test error handling when environment variables are missing
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 10. Write unit tests for user creation logic
  - Test creating user with full Google profile (email + name)
  - Test creating user with email only (name derived from email)
  - Test handling of existing user (no duplicate creation)
  - Test password field is null for OAuth users
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Write unit tests for JWT token generation
  - Test token contains correct payload (userId, email)
  - Test token is verifiable with JWT secret
  - Test token expiration is set correctly
  - Test token format matches email/password auth tokens
  - _Requirements: 5.1, 5.2, 5.4, 8.2_

- [ ] 12. Write unit tests for error handling
  - Test redirect with missing authorization code
  - Test redirect with token exchange failure
  - Test redirect with missing email in profile
  - Test redirect with database error
  - Verify error messages are logged
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Write integration tests for full OAuth flow
  - Mock Google OAuth endpoints
  - Test complete flow from button click to authenticated session
  - Verify user is created/retrieved correctly
  - Verify JWT token is generated and stored
  - Test with new user (signup flow)
  - Test with existing user (login flow)
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.1, 5.5, 5.6_

- [ ] 14. Write integration tests for error flows
  - Mock OAuth failures (token exchange, profile retrieval)
  - Test error handling and redirect behavior
  - Verify no partial state is created (no user without token, etc.)
  - Verify error parameters are passed correctly to frontend
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Update documentation
  - Add Google Sign-In feature to README
  - Document OAuth flow in architecture docs
  - Add troubleshooting guide for common OAuth errors
  - Document environment variable requirements

- [ ] 17. Final checkpoint - Verify feature completeness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each property test should run minimum 100 iterations
- Integration tests should mock Google OAuth endpoints to avoid external dependencies
- The feature is already functional - these tasks add robustness and test coverage
