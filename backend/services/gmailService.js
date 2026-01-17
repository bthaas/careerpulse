/**
 * Gmail Service
 * Fetches and processes emails from Gmail API
 */

import { getGmailClient, setCredentials } from '../config/gmail.js';
import { getEmailConnection } from '../database/db.js';

/**
 * Initialize Gmail client with stored credentials
 */
async function initializeGmailClient() {
  const connection = await getEmailConnection();
  
  if (!connection) {
    throw new Error('No Gmail connection found. Please connect your Gmail account first.');
  }
  
  // Set credentials
  setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: new Date(connection.expiresAt).getTime()
  });
  
  return getGmailClient();
}

/**
 * Fetch emails from Gmail
 * @param {Object} options - Search options
 * @param {string} options.query - Gmail search query
 * @param {number} options.maxResults - Maximum number of results (default: 50)
 * @param {string} options.afterDate - Fetch emails after this date (YYYY/MM/DD)
 * @returns {Array} Array of email objects
 */
export async function fetchEmails(options = {}) {
  const {
    query = 'in:inbox',
    maxResults = 50,
    afterDate = null
  } = options;
  
  try {
    const gmail = await initializeGmailClient();
    
    // Build search query
    let searchQuery = query;
    if (afterDate) {
      searchQuery += ` after:${afterDate}`;
    }
    
    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }
    
    // Fetch full message details for each message
    const emails = [];
    for (const message of response.data.messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const email = parseGmailMessage(fullMessage.data);
        emails.push(email);
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error.message);
        // Continue with other messages
      }
    }
    
    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

/**
 * Search for job-related emails
 * @param {Object} options - Search options
 * @returns {Array} Array of job-related emails
 */
export async function fetchJobEmails(options = {}) {
  const defaultOptions = {
    query: '(application OR interview OR offer OR rejected OR "thank you for applying") in:inbox',
    maxResults: 100,
    afterDate: options.afterDate || getDefaultAfterDate()
  };
  
  return await fetchEmails({ ...defaultOptions, ...options });
}

/**
 * Get user's Gmail profile
 */
export async function getGmailProfile() {
  try {
    const gmail = await initializeGmailClient();
    
    const response = await gmail.users.getProfile({
      userId: 'me'
    });
    
    return {
      email: response.data.emailAddress,
      messagesTotal: response.data.messagesTotal,
      threadsTotal: response.data.threadsTotal
    };
  } catch (error) {
    console.error('Error fetching Gmail profile:', error);
    throw new Error(`Failed to fetch Gmail profile: ${error.message}`);
  }
}

/**
 * Parse Gmail API message into simplified email object
 */
function parseGmailMessage(message) {
  const headers = message.payload.headers;
  
  // Extract headers
  const from = getHeader(headers, 'From');
  const to = getHeader(headers, 'To');
  const subject = getHeader(headers, 'Subject');
  const date = getHeader(headers, 'Date');
  
  // Extract body
  const body = extractBody(message.payload);
  
  return {
    id: message.id,
    from: from || '',
    to: to || '',
    subject: subject || '',
    body: body || '',
    date: date || new Date().toISOString(),
    snippet: message.snippet || '',
    threadId: message.threadId,
    labels: message.labelIds || []
  };
}

/**
 * Get header value from headers array
 */
function getHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}

/**
 * Extract email body from message payload
 */
function extractBody(payload) {
  let body = '';
  
  // If payload has body data
  if (payload.body && payload.body.data) {
    body = decodeBase64(payload.body.data);
  }
  // If payload has parts (multipart message)
  else if (payload.parts) {
    for (const part of payload.parts) {
      // Prefer text/plain
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        body = decodeBase64(part.body.data);
        break;
      }
      // Fall back to text/html
      else if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const htmlBody = decodeBase64(part.body.data);
        body = stripHtml(htmlBody);
      }
      // Check nested parts
      else if (part.parts) {
        body = extractBody(part);
        if (body) break;
      }
    }
  }
  
  return body;
}

/**
 * Decode base64url encoded string
 */
function decodeBase64(data) {
  try {
    // Replace URL-safe characters
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Decode
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

/**
 * Simple HTML tag stripper
 */
function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get default "after date" (30 days ago)
 */
function getDefaultAfterDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0].replace(/-/g, '/');
}

export default {
  fetchEmails,
  fetchJobEmails,
  getGmailProfile
};
