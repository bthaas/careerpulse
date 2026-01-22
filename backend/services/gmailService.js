/**
 * GmailService Class - OOP Implementation
 * 
 * Encapsulates Gmail API operations and OAuth credential management including:
 * - Email fetching with query support
 * - Automatic token refresh
 * - Gmail profile retrieval
 * - OAuth2 credential management
 * 
 * @class GmailService
 * @example
 * const gmailService = new GmailService({
   *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   redirectUri: process.env.GOOGLE_REDIRECT_URI
 * });
 * 
 * gmailService.setCredentials(userCredentials);
 * const emails = await gmailService.fetchEmails({ maxResults: 10 });
 * 
 * **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.7**
 */

import { google } from 'googleapis';
import { getEmailConnection } from '../database/db.js';

/**
 * Custom error class for Gmail API errors
 */
export class GmailAPIError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'GmailAPIError';
    this.originalError = originalError;
  }
}

/**
 * GmailService Class
 * 
 * Manages Gmail API operations with OAuth2 authentication, including automatic
 * token refresh and comprehensive error handling.
 * 
 * @class
 */
export class GmailService {
  /**
   * Create a GmailService instance
   * 
   * @param {Object} config - OAuth2 configuration
   * @param {string} config.clientId - Google OAuth2 client ID from Google Cloud Console
   * @param {string} config.clientSecret - Google OAuth2 client secret
   * @param {string} config.redirectUri - OAuth2 redirect URI (must match Google Cloud Console)
   * @example
   * const gmailService = new GmailService({
   *   clientId: 'your-client-id.apps.googleusercontent.com',
   *   clientSecret: 'your-client-secret',
   *   redirectUri: 'http://localhost:3000/api/auth/google/callback'
   * });
   */
  constructor(config) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    this.gmail = null;
    this.credentials = null;
  }

  /**
   * Set OAuth2 credentials for API requests
   * 
   * Configures the OAuth2 client with user credentials and initializes
   * the Gmail API client.
   * 
   * @param {Object} credentials - OAuth2 credentials from Google
   * @param {string} credentials.access_token - Current access token
   * @param {string} credentials.refresh_token - Refresh token for obtaining new access tokens
   * @param {number} credentials.expiry_date - Token expiry timestamp (milliseconds since epoch)
   * @example
   * gmailService.setCredentials({
   *   access_token: 'ya29.a0...',
   *   refresh_token: '1//0g...',
   *   expiry_date: Date.now() + 3600000
   * });
   */
  setCredentials(credentials) {
    this.credentials = credentials;
    this.oauth2Client.setCredentials(credentials);
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Check if credentials need refresh
   * 
   * Determines if the access token is expired or will expire soon (within 5 minutes).
   * This provides a buffer to avoid API calls with expired tokens.
   * 
   * @returns {boolean} True if credentials need refresh, false otherwise
   * @example
   * if (gmailService.needsRefresh()) {
   *   await gmailService.refreshCredentials();
   * }
   */
  needsRefresh() {
    if (!this.credentials || !this.credentials.expiry_date) {
      return false;
    }
    
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= (this.credentials.expiry_date - bufferTime);
  }

  /**
   * Refresh OAuth2 credentials
   * 
   * Uses the refresh token to obtain a new access token from Google.
   * Automatically updates the internal credentials and Gmail API client.
   * 
   * @async
   * @returns {Promise<Object>} New credentials object with updated access_token and expiry_date
   * @throws {GmailAPIError} If refresh token is missing or refresh fails
   * @example
   * try {
   *   const newCredentials = await gmailService.refreshCredentials();
   *   // Save newCredentials to database
   * } catch (error) {
   *   console.error('Token refresh failed:', error.message);
   * }
   */
  async refreshCredentials() {
    if (!this.credentials || !this.credentials.refresh_token) {
      throw new GmailAPIError('No refresh token available');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.setCredentials({
        ...this.credentials,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date
      });
      return this.credentials;
    } catch (error) {
      throw new GmailAPIError('Failed to refresh credentials', error);
    }
  }

  /**
   * Ensure Gmail client is initialized and credentials are valid
   * @throws {GmailAPIError} If not initialized or refresh fails
   */
  async ensureInitialized() {
    if (!this.gmail) {
      throw new GmailAPIError('GmailService not initialized. Call setCredentials() first.');
    }

    if (this.needsRefresh()) {
      await this.refreshCredentials();
    }
  }

  /**
   * Parse Gmail message into email object
   * @param {Object} message - Gmail message data
   * @returns {Object} Parsed email object
   */
  parseGmailMessage(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    // Extract body
    let body = '';
    if (message.payload.body && message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      // Handle multipart messages
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
      
      // If no plain text, try HTML and strip tags
      if (!body) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/html' && part.body && part.body.data) {
            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
            body = html.replace(/<[^>]*>/g, ''); // Simple HTML strip
            break;
          }
        }
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body: body,
      snippet: message.snippet || '',
      labels: message.labelIds || []
    };
  }

  /**
   * Fetch emails from Gmail
   * @param {Object} options - Fetch options
   * @param {string} options.query - Gmail search query (default: 'in:inbox')
   * @param {number} options.maxResults - Maximum results (default: 50)
   * @param {string} options.afterDate - Fetch after date (YYYY/MM/DD)
   * @returns {Promise<Array>} Array of email objects
   * @throws {GmailAPIError} If fetch fails
   */
  async fetchEmails(options = {}) {
    await this.ensureInitialized();

    const {
      query = 'in:inbox',
      maxResults = 50,
      afterDate = null
    } = options;

    try {
      // Build search query
      let searchQuery = query;
      if (afterDate) {
        searchQuery += ` after:${afterDate}`;
      }

      // List messages
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        return [];
      }

      // Fetch full message details
      const emails = [];
      for (const message of response.data.messages) {
        try {
          const fullMessage = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const email = this.parseGmailMessage(fullMessage.data);
          emails.push(email);
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error.message);
          // Continue with other messages
        }
      }

      return emails;
    } catch (error) {
      throw new GmailAPIError('Failed to fetch emails', error);
    }
  }

  /**
   * Fetch job-related emails
   * @param {Object} options - Fetch options
   * @param {number} options.maxResults - Maximum results (default: 100)
   * @param {string} options.afterDate - Fetch after date
   * @returns {Promise<Array>} Array of job-related emails
   * @throws {GmailAPIError} If fetch fails
   */
  async fetchJobEmails(options = {}) {
    const defaultAfterDate = this.getDefaultAfterDate();
    
    const jobQuery = '(application OR interview OR offer OR rejected OR "thank you for applying")';
    
    return await this.fetchEmails({
      query: jobQuery,
      maxResults: options.maxResults || 100,
      afterDate: options.afterDate || defaultAfterDate
    });
  }

  /**
   * Get default after date (6 months ago)
   * @returns {string} Date in YYYY/MM/DD format
   */
  getDefaultAfterDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Get Gmail profile
   * @returns {Promise<Object>} Gmail profile
   * @throws {GmailAPIError} If fetch fails
   */
  async getGmailProfile() {
    await this.ensureInitialized();

    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });

      return {
        email: response.data.emailAddress,
        messagesTotal: response.data.messagesTotal,
        threadsTotal: response.data.threadsTotal
      };
    } catch (error) {
      throw new GmailAPIError('Failed to fetch Gmail profile', error);
    }
  }

  /**
   * Initialize from database connection
   * Helper method for backward compatibility
   * @param {string} userId - User ID
   * @throws {GmailAPIError} If no connection found
   */
  async initializeFromDatabase(userId) {
    const connection = await getEmailConnection(userId);
    
    if (!connection) {
      throw new GmailAPIError('No Gmail connection found. Please connect your Gmail account first.');
    }

    this.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: new Date(connection.expiresAt).getTime()
    });
  }
}

// ==========================================
// Backward Compatible Functional Exports
// ==========================================

// Create singleton instance for backward compatibility
// This avoids circular dependency with container.js
import { DatabaseService } from './DatabaseService.js';
import dotenv from 'dotenv';

dotenv.config();

let _gmailServiceInstance = null;
let _databaseServiceInstance = null;

function getGmailServiceInstance() {
  if (!_gmailServiceInstance) {
    if (!_databaseServiceInstance) {
      _databaseServiceInstance = new DatabaseService();
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    _gmailServiceInstance = new GmailService(oauth2Client, _databaseServiceInstance);
  }
  return _gmailServiceInstance;
}

/**
 * Fetch job-related emails (functional wrapper)
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of email objects
 */
export async function fetchJobEmails(options = {}) {
  const gmailService = getGmailServiceInstance();
  
  // Initialize from database if userId provided
  if (options.userId) {
    await gmailService.initializeFromDatabase(options.userId);
  }
  
  return gmailService.fetchJobEmails(options);
}

/**
 * Get Gmail profile information (functional wrapper)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Profile information
 */
export async function getGmailProfile(userId) {
  const gmailService = getGmailServiceInstance();
  
  // Initialize from database
  await gmailService.initializeFromDatabase(userId);
  
  return gmailService.getGmailProfile();
}
