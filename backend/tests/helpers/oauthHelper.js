/**
 * OAuth Test Helper
 * 
 * This helper is for testing OAuth flow scenarios.
 * Most tests will use REAL OAuth, but this helper is for specific test scenarios
 * where we need to simulate OAuth tokens, callbacks, and refresh flows.
 * 
 * Generates realistic OAuth tokens matching Google's format.
 */

/**
 * OAuthTestHelper class for simulating OAuth flows
 */
export class OAuthTestHelper {
  constructor() {
    this.baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    this.tokenEndpoint = 'https://oauth2.googleapis.com/token';
  }

  /**
   * Generate a mock OAuth authorization URL
   * Matches the format returned by Google OAuth
   * 
   * @returns {string} Mock authorization URL
   */
  getMockAuthUrl() {
    const params = new URLSearchParams({
      client_id: 'mock_client_id_123456789.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:5000/api/auth/gmail/callback',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      state: this._generateRandomString(32)
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Generate mock OAuth tokens
   * Matches Google's token response format
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} options.expired - Whether the access token should be expired
   * @param {boolean} options.missingRefresh - Whether to omit the refresh token
   * @param {string} options.email - Email address for the token
   * @param {number} options.expiresIn - Seconds until token expires (default: 3600)
   * @returns {Object} Mock OAuth tokens
   * 
   * Token structure matches Google OAuth2 response:
   * {
   *   access_token: string,
   *   refresh_token: string,
   *   scope: string,
   *   token_type: string,
   *   expiry_date: number,
   *   id_token: string (optional)
   * }
   */
  generateMockTokens(options = {}) {
    const {
      expired = false,
      missingRefresh = false,
      email = 'test@example.com',
      expiresIn = 3600 // 1 hour in seconds
    } = options;

    // Generate realistic-looking tokens
    const accessToken = this._generateAccessToken();
    const refreshToken = missingRefresh ? undefined : this._generateRefreshToken();
    const idToken = this._generateIdToken(email);

    // Calculate expiry date
    let expiryDate;
    if (expired) {
      // Token expired 1 hour ago
      expiryDate = Date.now() - 3600000;
    } else {
      // Token expires in the future
      expiryDate = Date.now() + (expiresIn * 1000);
    }

    const tokens = {
      access_token: accessToken,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      expiry_date: expiryDate,
      id_token: idToken
    };

    // Add refresh token if not missing
    if (!missingRefresh) {
      tokens.refresh_token = refreshToken;
    }

    // Add email if provided
    if (email) {
      tokens.email = email;
    }

    return tokens;
  }

  /**
   * Simulate OAuth token refresh
   * Returns new tokens as if refresh was successful
   * 
   * @param {string} refreshToken - The refresh token to use
   * @param {Object} options - Configuration options
   * @param {boolean} options.shouldFail - Whether the refresh should fail
   * @param {string} options.email - Email address for the new token
   * @returns {Promise<Object>} New OAuth tokens
   * @throws {Error} If shouldFail is true or refresh token is invalid
   */
  async simulateTokenRefresh(refreshToken, options = {}) {
    const { shouldFail = false, email = 'test@example.com' } = options;

    // Simulate network delay
    await this._delay(50);

    // Check if refresh should fail
    if (shouldFail) {
      const error = new Error('invalid_grant');
      error.code = 400;
      error.errors = [{
        domain: 'global',
        reason: 'invalid_grant',
        message: 'Token has been expired or revoked.'
      }];
      throw error;
    }

    // Validate refresh token format
    if (!refreshToken || !refreshToken.startsWith('1//')) {
      const error = new Error('Invalid refresh token');
      error.code = 400;
      throw error;
    }

    // Generate new tokens (refresh token stays the same)
    const newAccessToken = this._generateAccessToken();
    const newIdToken = this._generateIdToken(email);
    const expiryDate = Date.now() + 3600000; // 1 hour from now

    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      expiry_date: expiryDate,
      id_token: newIdToken
      // Note: refresh_token is NOT returned in refresh response (it stays the same)
    };
  }

  /**
   * Simulate OAuth callback with authorization code
   * Returns tokens as if code was successfully exchanged
   * 
   * @param {string} code - Authorization code from OAuth callback
   * @param {Object} options - Configuration options
   * @param {boolean} options.shouldFail - Whether the exchange should fail
   * @param {string} options.email - Email address for the token
   * @returns {Promise<Object>} OAuth tokens
   * @throws {Error} If shouldFail is true or code is invalid
   */
  async simulateCallback(code, options = {}) {
    const { shouldFail = false, email = 'test@example.com' } = options;

    // Simulate network delay
    await this._delay(100);

    // Check if callback should fail
    if (shouldFail) {
      const error = new Error('invalid_grant');
      error.code = 400;
      error.errors = [{
        domain: 'global',
        reason: 'invalid_grant',
        message: 'Malformed auth code.'
      }];
      throw error;
    }

    // Validate authorization code format
    if (!code || code.length < 10) {
      const error = new Error('Invalid authorization code');
      error.code = 400;
      throw error;
    }

    // Generate full token set (including refresh token)
    return this.generateMockTokens({ email });
  }

  /**
   * Generate a mock authorization code
   * Used for testing OAuth callback flow
   * 
   * @returns {string} Mock authorization code
   */
  generateAuthCode() {
    // Google auth codes are typically 4/0A... format
    return `4/0A${this._generateRandomString(60)}`;
  }

  /**
   * Generate a mock state parameter for OAuth flow
   * Used to prevent CSRF attacks
   * 
   * @returns {string} Random state string
   */
  generateState() {
    return this._generateRandomString(32);
  }

  /**
   * Validate OAuth token structure
   * Useful for testing that tokens have the correct format
   * 
   * @param {Object} tokens - Token object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateTokenStructure(tokens) {
    if (!tokens || typeof tokens !== 'object') {
      return false;
    }

    // Check required fields
    const hasAccessToken = typeof tokens.access_token === 'string' && tokens.access_token.length > 0;
    const hasTokenType = tokens.token_type === 'Bearer';
    const hasExpiryDate = typeof tokens.expiry_date === 'number';
    const hasScope = typeof tokens.scope === 'string';

    return hasAccessToken && hasTokenType && hasExpiryDate && hasScope;
  }

  /**
   * Check if a token is expired
   * 
   * @param {Object} tokens - Token object with expiry_date
   * @returns {boolean} True if expired, false otherwise
   */
  isTokenExpired(tokens) {
    if (!tokens || !tokens.expiry_date) {
      return true;
    }

    return Date.now() >= tokens.expiry_date;
  }

  // Private helper methods

  /**
   * Generate a realistic-looking access token
   * Google access tokens are typically JWT format or opaque tokens
   * @private
   */
  _generateAccessToken() {
    // Generate a token that looks like Google's format
    // Format: ya29.{random_string}
    return `ya29.${this._generateRandomString(120)}`;
  }

  /**
   * Generate a realistic-looking refresh token
   * Google refresh tokens start with "1//"
   * @private
   */
  _generateRefreshToken() {
    // Format: 1//{random_string}
    return `1//${this._generateRandomString(80)}`;
  }

  /**
   * Generate a mock ID token (JWT)
   * ID tokens contain user information
   * @private
   */
  _generateIdToken(email) {
    // Create a simple JWT-like structure (not cryptographically valid)
    const header = this._base64UrlEncode(JSON.stringify({
      alg: 'RS256',
      kid: 'mock_key_id',
      typ: 'JWT'
    }));

    const payload = this._base64UrlEncode(JSON.stringify({
      iss: 'https://accounts.google.com',
      azp: 'mock_client_id.apps.googleusercontent.com',
      aud: 'mock_client_id.apps.googleusercontent.com',
      sub: this._generateRandomString(21),
      email: email,
      email_verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));

    const signature = this._generateRandomString(43);

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate a random string of specified length
   * @private
   */
  _generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Base64 URL encode a string
   * @private
   */
  _base64UrlEncode(str) {
    const base64 = Buffer.from(str).toString('base64');
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Simulate async delay
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a new OAuth test helper instance
 * @returns {OAuthTestHelper} New helper instance
 */
export function createOAuthTestHelper() {
  return new OAuthTestHelper();
}

export default OAuthTestHelper;
