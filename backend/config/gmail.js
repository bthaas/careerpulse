/**
 * Gmail API Configuration
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// OAuth2 configuration
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes required for Gmail API
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // Read-only access to Gmail
  'https://www.googleapis.com/auth/userinfo.email'  // Get user's email address
];

/**
 * Generate Gmail OAuth URL for user authorization
 * @param {string} state - Optional OAuth state parameter for security
 */
export function getAuthUrl(state = null) {
  const config = {
    access_type: 'offline', // Get refresh token
    scope: GMAIL_SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  };
  
  // Add state parameter if provided
  if (state) {
    config.state = state;
  }
  
  return oauth2Client.generateAuthUrl(config);
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Set credentials for oauth2Client
 */
export function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Get Gmail API client
 */
export function getGmailClient() {
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export default {
  oauth2Client,
  GMAIL_SCOPES,
  getAuthUrl,
  getTokensFromCode,
  setCredentials,
  refreshAccessToken,
  getGmailClient
};
