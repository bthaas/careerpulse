/**
 * Mock Gmail API Helper
 * 
 * This mock is ONLY for simulating specific error scenarios (rate limits, network failures).
 * Most tests should use the REAL Gmail API with r.w.chen88@gmail.com.
 * 
 * The mock matches the Gmail API interface used in backend/services/gmailService.js
 * and tracks API calls for verification in tests.
 */

/**
 * MockGmailAPI class for simulating Gmail API responses and errors
 */
export class MockGmailAPI {
  constructor() {
    this.reset();
  }

  /**
   * Reset mock state to initial values
   */
  reset() {
    this.messages = [];
    this.error = null;
    this.rateLimitEnabled = false;
    this.callHistory = [];
    this.profile = {
      emailAddress: 'test@example.com',
      messagesTotal: 0,
      threadsTotal: 0
    };
  }

  /**
   * Set mock messages to be returned by the API
   * @param {Array} messages - Array of Gmail message objects
   * 
   * Each message should have the structure:
   * {
   *   id: string,
   *   threadId: string,
   *   labelIds: Array<string>,
   *   snippet: string,
   *   payload: {
   *     headers: Array<{name: string, value: string}>,
   *     body: {data: string} | undefined,
   *     parts: Array<{mimeType: string, body: {data: string}}> | undefined
   *   }
   * }
   */
  setMessages(messages) {
    this.messages = messages;
    this.profile.messagesTotal = messages.length;
    this.profile.threadsTotal = new Set(messages.map(m => m.threadId)).size;
  }

  /**
   * Set an error to be thrown by the API
   * @param {Error} error - Error object to throw
   */
  setError(error) {
    this.error = error;
  }

  /**
   * Simulate Gmail API rate limiting
   * When enabled, API calls will throw a rate limit error
   */
  simulateRateLimit() {
    this.rateLimitEnabled = true;
    this.error = new Error('Rate limit exceeded');
    this.error.code = 429;
    this.error.errors = [{
      domain: 'usageLimits',
      reason: 'rateLimitExceeded',
      message: 'Rate Limit Exceeded'
    }];
  }

  /**
   * Get history of all API calls made
   * @returns {Array} Array of call records
   * 
   * Each record contains:
   * {
   *   method: string,      // e.g., 'users.messages.list'
   *   params: object,      // parameters passed to the method
   *   timestamp: Date      // when the call was made
   * }
   */
  getCallHistory() {
    return this.callHistory;
  }

  /**
   * Record an API call in the history
   * @private
   */
  _recordCall(method, params) {
    this.callHistory.push({
      method,
      params,
      timestamp: new Date()
    });
  }

  /**
   * Check if an error should be thrown
   * @private
   */
  _checkError() {
    if (this.error) {
      throw this.error;
    }
  }

  /**
   * Create a mock Gmail client that matches the googleapis Gmail API interface
   * @returns {Object} Mock Gmail client
   */
  createClient() {
    return {
      users: {
        messages: {
          /**
           * List messages matching query
           * @param {Object} params
           * @param {string} params.userId - User ID (usually 'me')
           * @param {string} params.q - Search query
           * @param {number} params.maxResults - Maximum results to return
           */
          list: async (params) => {
            this._recordCall('users.messages.list', params);
            this._checkError();

            const { q, maxResults = 50 } = params;

            // Return message IDs (limited by maxResults)
            const messageList = this.messages
              .slice(0, maxResults)
              .map(msg => ({
                id: msg.id,
                threadId: msg.threadId
              }));

            return {
              data: {
                messages: messageList.length > 0 ? messageList : undefined,
                resultSizeEstimate: messageList.length
              }
            };
          },

          /**
           * Get full message details
           * @param {Object} params
           * @param {string} params.userId - User ID (usually 'me')
           * @param {string} params.id - Message ID
           * @param {string} params.format - Message format (usually 'full')
           */
          get: async (params) => {
            this._recordCall('users.messages.get', params);
            this._checkError();

            const { id } = params;

            // Find message by ID
            const message = this.messages.find(msg => msg.id === id);

            if (!message) {
              const error = new Error(`Message not found: ${id}`);
              error.code = 404;
              throw error;
            }

            return {
              data: message
            };
          }
        },

        /**
         * Get user profile
         * @param {Object} params
         * @param {string} params.userId - User ID (usually 'me')
         */
        getProfile: async (params) => {
          this._recordCall('users.getProfile', params);
          this._checkError();

          return {
            data: this.profile
          };
        }
      }
    };
  }

  /**
   * Set mock profile data
   * @param {Object} profile - Profile object
   * @param {string} profile.emailAddress - Email address
   * @param {number} profile.messagesTotal - Total message count
   * @param {number} profile.threadsTotal - Total thread count
   */
  setProfile(profile) {
    this.profile = { ...this.profile, ...profile };
  }
}

/**
 * Create a new mock Gmail API instance
 * @returns {MockGmailAPI} New mock instance
 */
export function createMockGmailAPI() {
  return new MockGmailAPI();
}

export default MockGmailAPI;
