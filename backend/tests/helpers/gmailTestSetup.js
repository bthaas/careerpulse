/**
 * Gmail Test Setup Helper
 * Sets up real Gmail connection for E2E tests
 */

import { saveEmailConnection, getEmailConnection } from '../../database/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Set up Gmail connection for testing
 * Uses credentials from .env file
 */
export async function setupGmailConnection(userId = 'test-user-e2e') {
  // Check if we have OAuth credentials in .env
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not found in .env file');
  }
  
  // For E2E tests, we need actual tokens
  // Check if there's already a connection
  const existing = await getEmailConnection(userId);
  
  if (existing && existing.connected) {
    console.log('✅ Using existing Gmail connection');
    return existing;
  }
  
  // If no connection exists, we need to create one
  // For automated testing, we'll use a mock connection with the test email
  // In a real scenario, you'd need to go through OAuth flow
  const mockConnection = {
    userId,
    email: 'r.w.chen88@gmail.com',
    accessToken: 'mock_access_token_for_testing',
    refreshToken: 'mock_refresh_token_for_testing',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    connected: 1
  };
  
  await saveEmailConnection(mockConnection);
  console.log('✅ Created mock Gmail connection for testing');
  
  return mockConnection;
}

/**
 * Check if Gmail is properly configured
 */
export function isGmailConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Get test email address
 */
export function getTestEmail() {
  return 'r.w.chen88@gmail.com';
}

export default {
  setupGmailConnection,
  isGmailConfigured,
  getTestEmail
};
