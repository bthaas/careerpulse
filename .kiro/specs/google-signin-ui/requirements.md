# Requirements Document

## Introduction

This document specifies the requirements for fixing and properly configuring Google Sign-In functionality on the JobFetch application's login and signup pages. The feature enables users to authenticate using their Google accounts as an alternative to traditional email/password authentication. 

**Current State:** The UI components for Google Sign-In exist but the feature is non-functional due to OAuth configuration issues. The application has two separate OAuth flows that need distinct configuration:
1. User authentication OAuth (login/signup) - `/api/auth/google`
2. Gmail API OAuth (email syncing) - `/api/auth/gmail`

**Problem:** The redirect URI mismatch and potential OAuth client configuration issues prevent successful authentication. The backend route exists at `/api/auth/google/callback` but the environment configuration and Google Cloud Console may be set up for the Gmail OAuth flow instead.

## Glossary

- **OAuth_Client**: The Google OAuth2 client configured in the backend for user authentication
- **Auth_Context**: React context managing authentication state and user session
- **Login_Component**: The LoginSignup React component containing authentication forms
- **OAuth_Flow**: The complete authentication process from initiation to callback handling
- **Auth_Token**: JWT token generated after successful authentication
- **User_Session**: The authenticated user's state stored in AuthContext and localStorage

## Requirements

### Requirement 1: OAuth Configuration Setup

**User Story:** As a developer, I want the Google OAuth credentials properly configured for user authentication, so that the Sign-In flow can complete successfully.

#### Acceptance Criteria

1. THE OAuth_Client SHALL use a redirect URI that matches the callback route `/api/auth/google/callback`
2. THE OAuth_Client SHALL be configured in Google Cloud Console with the correct redirect URI for both development and production environments
3. WHEN the backend constructs the OAuth client, THE OAuth_Client SHALL use environment variables GOOGLE_AUTH_CLIENT_ID and GOOGLE_AUTH_CLIENT_SECRET (separate from Gmail OAuth credentials)
4. THE OAuth_Client SHALL request scopes 'userinfo.email' and 'userinfo.profile' for user authentication
5. IF separate OAuth credentials are not available, THEN THE OAuth_Client SHALL use the same credentials as Gmail OAuth but with both redirect URIs registered in Google Cloud Console

### Requirement 2: Google Sign-In Button Display

**User Story:** As a user, I want to see a "Sign in with Google" button on both login and signup forms, so that I can easily identify the Google authentication option.

#### Acceptance Criteria

1. WHEN a user views the login form, THE Login_Component SHALL display a Google Sign-In button below the email/password form
2. WHEN a user views the signup form, THE Login_Component SHALL display a Google Sign-In button below the email/password form
3. THE Login_Component SHALL display the Google logo using the official Google brand colors (blue #4285F4, green #34A853, yellow #FBBC05, red #EA4335)
4. THE Login_Component SHALL display button text "Sign in with Google" on the login form
5. THE Login_Component SHALL display button text "Sign up with Google" on the signup form
6. THE Login_Component SHALL separate the Google button from email/password form with a visual divider containing "Or continue with" text

### Requirement 2: Google Sign-In Button Display

**User Story:** As a user, I want to see a "Sign in with Google" button on both login and signup forms, so that I can easily identify the Google authentication option.

#### Acceptance Criteria

1. WHEN a user views the login form, THE Login_Component SHALL display a Google Sign-In button below the email/password form
2. WHEN a user views the signup form, THE Login_Component SHALL display a Google Sign-In button below the email/password form
3. THE Login_Component SHALL display the Google logo using the official Google brand colors (blue #4285F4, green #34A853, yellow #FBBC05, red #EA4335)
4. THE Login_Component SHALL display button text "Sign in with Google" on the login form
5. THE Login_Component SHALL display button text "Sign up with Google" on the signup form
6. THE Login_Component SHALL separate the Google button from email/password form with a visual divider containing "Or continue with" text

### Requirement 3: OAuth Flow Initiation

**User Story:** As a user, I want to click the Google Sign-In button and be taken through Google's authentication, so that I can authenticate using my Google account.

#### Acceptance Criteria

1. WHEN a user clicks the Google Sign-In button, THE Login_Component SHALL fetch the authorization URL from the backend endpoint /api/auth/google
2. WHEN the authorization URL is received, THE Login_Component SHALL redirect the browser to the Google OAuth consent screen
3. IF the authorization URL fetch fails, THEN THE Login_Component SHALL display an error message "Failed to initiate Google sign-in"
4. WHILE the OAuth flow is initiating, THE Login_Component SHALL display a loading state on the Google Sign-In button
5. WHILE the OAuth flow is initiating, THE Login_Component SHALL disable the Google Sign-In button to prevent duplicate requests

### Requirement 3: OAuth Flow Initiation

**User Story:** As a user, I want to click the Google Sign-In button and be taken through Google's authentication, so that I can authenticate using my Google account.

#### Acceptance Criteria

1. WHEN a user clicks the Google Sign-In button, THE Login_Component SHALL fetch the authorization URL from the backend endpoint /api/auth/google
2. WHEN the backend receives the request, THE OAuth_Client SHALL generate a valid authorization URL with the correct redirect URI
3. WHEN the authorization URL is received, THE Login_Component SHALL redirect the browser to the Google OAuth consent screen
4. IF the authorization URL fetch fails, THEN THE Login_Component SHALL display an error message "Failed to initiate Google sign-in"
5. WHILE the OAuth flow is initiating, THE Login_Component SHALL display a loading state on the Google Sign-In button
6. WHILE the OAuth flow is initiating, THE Login_Component SHALL disable the Google Sign-In button to prevent duplicate requests

### Requirement 4: OAuth Callback Handling

**User Story:** As a user, I want the application to automatically log me in after I authorize with Google, so that I can access my account without additional steps.

#### Acceptance Criteria

1. WHEN the OAuth callback redirects to the application with a token parameter, THE Auth_Context SHALL extract the token from the URL query string
2. WHEN a valid token is extracted, THE Auth_Context SHALL store the token in localStorage with key 'auth_token'
3. WHEN a valid token is extracted, THE Auth_Context SHALL fetch user data from /api/user/me using the token
4. WHEN user data is successfully fetched, THE Auth_Context SHALL update the user state and store user data in localStorage with key 'user'
5. WHEN the OAuth callback processing is complete, THE Auth_Context SHALL remove the token parameter from the URL without page reload
6. IF the OAuth callback contains an error parameter, THEN THE Auth_Context SHALL log the error and display it to the user
7. WHEN an OAuth error occurs, THE Auth_Context SHALL clean up the URL parameters

### Requirement 4: OAuth Callback Handling

**User Story:** As a user, I want the application to automatically log me in after I authorize with Google, so that I can access my account without additional steps.

#### Acceptance Criteria

1. WHEN Google redirects to /api/auth/google/callback with an authorization code, THE OAuth_Client SHALL exchange the code for access tokens
2. WHEN tokens are received, THE OAuth_Client SHALL fetch user profile information from Google's userinfo API
3. WHEN user profile is fetched, THE OAuth_Client SHALL check if a user with that email exists in the database
4. IF the user does not exist, THEN THE OAuth_Client SHALL create a new user account with the Google profile information
5. WHEN user lookup or creation completes, THE OAuth_Client SHALL generate a JWT token for the session
6. WHEN the JWT token is generated, THE OAuth_Client SHALL redirect to the frontend URL with the token as a query parameter
7. WHEN the frontend receives the redirect with token parameter, THE Auth_Context SHALL extract and store the token
8. WHEN a valid token is extracted, THE Auth_Context SHALL fetch user data from /api/user/me using the token
9. WHEN user data is successfully fetched, THE Auth_Context SHALL update the user state and store user data in localStorage
10. WHEN the OAuth callback processing is complete, THE Auth_Context SHALL remove the token parameter from the URL without page reload
11. IF the OAuth callback contains an error parameter, THEN THE Auth_Context SHALL log the error and display it to the user
12. WHEN an OAuth error occurs, THE Auth_Context SHALL clean up the URL parameters

### Requirement 5: Loading State Management

**User Story:** As a user, I want to see visual feedback during the authentication process, so that I know the system is working and I should wait.

#### Acceptance Criteria

1. WHEN the Google Sign-In button is clicked, THE Login_Component SHALL display a loading indicator on the button
2. WHILE the OAuth flow is in progress, THE Login_Component SHALL disable all form inputs and buttons
3. WHEN the OAuth callback is being processed, THE Auth_Context SHALL maintain the loading state until user data is fetched
4. WHEN authentication completes successfully, THE Login_Component SHALL remove all loading indicators
5. WHEN authentication fails, THE Login_Component SHALL remove loading indicators and enable form inputs

### Requirement 5: Loading State Management

**User Story:** As a user, I want to see visual feedback during the authentication process, so that I know the system is working and I should wait.

#### Acceptance Criteria

1. WHEN the Google Sign-In button is clicked, THE Login_Component SHALL display a loading indicator on the button
2. WHILE the OAuth flow is in progress, THE Login_Component SHALL disable all form inputs and buttons
3. WHEN the OAuth callback is being processed, THE Auth_Context SHALL maintain the loading state until user data is fetched
4. WHEN authentication completes successfully, THE Login_Component SHALL remove all loading indicators
5. WHEN authentication fails, THE Login_Component SHALL remove loading indicators and enable form inputs

### Requirement 6: Error Handling

**User Story:** As a user, I want to see clear error messages if Google Sign-In fails, so that I understand what went wrong and can try alternative authentication methods.

#### Acceptance Criteria

1. IF the authorization URL fetch fails, THEN THE Login_Component SHALL display error message "Failed to initiate Google sign-in"
2. IF the OAuth callback contains error=missing_code, THEN THE Auth_Context SHALL log "OAuth error: missing_code"
3. IF the OAuth callback contains error=no_email, THEN THE Auth_Context SHALL log "OAuth error: no_email"
4. IF the OAuth callback contains error=auth_failed, THEN THE Auth_Context SHALL log the error message from the message parameter
5. WHEN any OAuth error occurs, THE Login_Component SHALL allow users to retry with email/password authentication
6. WHEN an error is displayed, THE Login_Component SHALL show it in a red-colored alert box above the form buttons

### Requirement 6: Error Handling

**User Story:** As a user, I want to see clear error messages if Google Sign-In fails, so that I understand what went wrong and can try alternative authentication methods.

#### Acceptance Criteria

1. IF the authorization URL fetch fails with a network error, THEN THE Login_Component SHALL display error message "Failed to initiate Google sign-in"
2. IF the backend fails to generate the authorization URL, THEN THE OAuth_Client SHALL return a 500 error with message "Failed to generate authorization URL"
3. IF the OAuth callback contains error=missing_code, THEN THE Auth_Context SHALL log "OAuth error: missing_code"
4. IF the OAuth callback contains error=no_email, THEN THE Auth_Context SHALL log "OAuth error: no_email"
5. IF the OAuth callback contains error=auth_failed, THEN THE Auth_Context SHALL log the error message from the message parameter
6. WHEN any OAuth error occurs, THE Login_Component SHALL allow users to retry with email/password authentication
7. WHEN an error is displayed, THE Login_Component SHALL show it in a red-colored alert box above the form buttons
8. IF the token exchange fails in the callback, THEN THE OAuth_Client SHALL redirect to frontend with error=auth_failed and a descriptive message

### Requirement 7: Email/Password Authentication Preservation

**User Story:** As a user, I want to continue using email/password authentication, so that I have multiple options for accessing my account.

#### Acceptance Criteria

1. WHEN Google Sign-In is added, THE Login_Component SHALL maintain all existing email/password form fields
2. WHEN Google Sign-In is added, THE Login_Component SHALL maintain all existing email/password validation logic
3. WHEN a user submits the email/password form, THE Login_Component SHALL process it independently of Google Sign-In state
4. WHEN Google Sign-In fails, THE Login_Component SHALL allow immediate use of email/password authentication without page reload
5. THE Login_Component SHALL display both authentication methods with equal visual prominence

### Requirement 7: User Account Creation and Linking

**User Story:** As a new user, I want my Google account to automatically create a user account in the system, so that I can start using the application immediately.

#### Acceptance Criteria

1. WHEN a user authenticates with Google for the first time, THE OAuth_Client SHALL create a new user record with email from Google
2. WHEN creating a new user via Google OAuth, THE OAuth_Client SHALL set the password field to null
3. WHEN creating a new user via Google OAuth, THE OAuth_Client SHALL use the name from Google profile or derive it from the email
4. WHEN a user authenticates with Google and already has an account, THE OAuth_Client SHALL return the existing user data
5. WHEN user creation or lookup completes, THE OAuth_Client SHALL generate a JWT token for the user session

### Requirement 8: Session Persistence

**User Story:** As a user, I want to remain logged in after authenticating with Google, so that I don't have to sign in repeatedly.

#### Acceptance Criteria

1. WHEN a user successfully authenticates with Google, THE Auth_Context SHALL store the auth token in localStorage
2. WHEN a user successfully authenticates with Google, THE Auth_Context SHALL store the user object in localStorage
3. WHEN the application loads, THE Auth_Context SHALL check localStorage for existing auth_token and user data
4. WHEN valid session data exists in localStorage, THE Auth_Context SHALL restore the user session without requiring re-authentication
5. WHEN a user logs out, THE Auth_Context SHALL remove both auth_token and user data from localStorage
