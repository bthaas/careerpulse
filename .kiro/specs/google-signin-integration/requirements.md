# Requirements Document: Google Sign-In Integration

## Introduction

This feature adds Google OAuth authentication to the JobFetch/CareerPulse application, allowing users to sign up and log in using their Google accounts. The feature leverages the existing Google OAuth infrastructure currently used for Gmail connection, extending it to support user authentication flows.

## Glossary

- **OAuth_Client**: The Google OAuth2 client configured for user authentication
- **Auth_System**: The application's authentication and authorization system
- **User_Account**: A user record in the application database
- **JWT_Token**: JSON Web Token used for maintaining user sessions
- **Google_Profile**: User profile information retrieved from Google (email, name)
- **Login_Flow**: The process of authenticating an existing user
- **Signup_Flow**: The process of creating a new user account
- **OAuth_Callback**: The endpoint that receives the authorization code from Google

## Requirements

### Requirement 1: Google OAuth Initialization

**User Story:** As a user, I want to click a "Sign in with Google" button, so that I can initiate the OAuth flow without entering credentials manually.

#### Acceptance Criteria

1. WHEN a user clicks the "Sign in with Google" button on the login page, THE Auth_System SHALL redirect the user to Google's OAuth consent screen
2. WHEN a user clicks the "Sign in with Google" button on the signup page, THE Auth_System SHALL redirect the user to Google's OAuth consent screen
3. THE OAuth_Client SHALL request the userinfo.email and userinfo.profile scopes
4. THE OAuth_Client SHALL use the existing Google OAuth infrastructure from googleAuth.js
5. IF the OAuth URL generation fails, THEN THE Auth_System SHALL display an error message to the user

### Requirement 2: OAuth Callback Handling

**User Story:** As a user, I want the system to automatically process my Google authentication, so that I can access my account without additional steps.

#### Acceptance Criteria

1. WHEN Google redirects to the OAuth_Callback with an authorization code, THE Auth_System SHALL exchange the code for access tokens
2. WHEN the token exchange succeeds, THE Auth_System SHALL retrieve the user's Google_Profile information
3. IF the token exchange fails, THEN THE Auth_System SHALL redirect to the login page with an error message
4. IF the Google_Profile does not contain an email address, THEN THE Auth_System SHALL redirect to the login page with an error message

### Requirement 3: User Account Creation (Signup Flow)

**User Story:** As a new user, I want my account to be automatically created when I sign in with Google, so that I can start using the application immediately.

#### Acceptance Criteria

1. WHEN a user completes Google OAuth and no User_Account exists for their email, THE Auth_System SHALL create a new User_Account
2. THE Auth_System SHALL store the user's email from the Google_Profile
3. THE Auth_System SHALL store the user's name from the Google_Profile, or derive it from the email if not provided
4. THE Auth_System SHALL set the password field to null for OAuth-created accounts
5. THE Auth_System SHALL generate a unique user ID for the new account

### Requirement 4: User Authentication (Login Flow)

**User Story:** As an existing user, I want to log in using my Google account, so that I can access my existing application data.

#### Acceptance Criteria

1. WHEN a user completes Google OAuth and a User_Account exists for their email, THE Auth_System SHALL authenticate the user
2. THE Auth_System SHALL NOT create a duplicate User_Account if one already exists
3. THE Auth_System SHALL support OAuth login for accounts originally created with email/password
4. THE Auth_System SHALL support OAuth login for accounts originally created with Google OAuth

### Requirement 5: Session Management

**User Story:** As a user, I want to remain logged in after Google authentication, so that I don't have to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN a user successfully authenticates via Google OAuth, THE Auth_System SHALL generate a JWT_Token
2. THE JWT_Token SHALL contain the user's ID and email
3. THE Auth_System SHALL redirect the user to the frontend with the JWT_Token as a URL parameter
4. THE Auth_System SHALL use the same JWT_Token format and expiration as email/password authentication
5. WHEN the frontend receives the JWT_Token, THE Auth_System SHALL store it in localStorage
6. WHEN the frontend receives the JWT_Token, THE Auth_System SHALL fetch and store the user's profile data

### Requirement 6: Error Handling

**User Story:** As a user, I want to see clear error messages if Google authentication fails, so that I understand what went wrong and can try again.

#### Acceptance Criteria

1. IF the OAuth flow is cancelled by the user, THEN THE Auth_System SHALL redirect to the login page without an error message
2. IF the authorization code is missing from the callback, THEN THE Auth_System SHALL redirect to the login page with a "missing_code" error
3. IF the token exchange fails, THEN THE Auth_System SHALL redirect to the login page with an "auth_failed" error and error message
4. IF the Google_Profile retrieval fails, THEN THE Auth_System SHALL redirect to the login page with an "auth_failed" error
5. WHEN an error occurs, THE Auth_System SHALL log the error details for debugging purposes

### Requirement 7: UI Integration

**User Story:** As a user, I want the Google sign-in button to be visually distinct and recognizable, so that I can easily identify the OAuth option.

#### Acceptance Criteria

1. THE Login_Page SHALL display a "Sign in with Google" button below the email/password form
2. THE Signup_Page SHALL display a "Sign up with Google" button below the email/password form
3. THE Google_Button SHALL display the official Google logo
4. THE Google_Button SHALL be separated from the email/password form by a visual divider with "Or continue with" text
5. WHEN the OAuth flow is in progress, THE Google_Button SHALL be disabled and show a loading state

### Requirement 8: Security and Data Privacy

**User Story:** As a user, I want my Google authentication to be secure, so that my account and data are protected.

#### Acceptance Criteria

1. THE OAuth_Client SHALL use HTTPS for all OAuth redirects in production
2. THE OAuth_Client SHALL use the same JWT_Secret as email/password authentication
3. THE Auth_System SHALL NOT store Google access tokens or refresh tokens for authentication purposes
4. THE Auth_System SHALL only request the minimum required OAuth scopes (email and profile)
5. THE Auth_System SHALL validate that the OAuth callback originates from Google
