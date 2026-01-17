/**
 * Unit Tests for OAuthTestHelper
 * 
 * Tests the OAuth test helper functionality including:
 * - Mock token generation
 * - Token refresh simulation
 * - OAuth callback simulation
 * - Authorization URL generation
 * - Token validation
 * 
 * Requirements: 1.1, 1.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthTestHelper, createOAuthTestHelper } from './oauthHelper.js';

describe('OAuthTestHelper', () => {
  let helper;

  beforeEach(() => {
    helper = new OAuthTestHelper();
  });

  describe('initialization', () => {
    it('should initialize with correct base URLs', () => {
      expect(helper.baseUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(helper.tokenEndpoint).toBe('https://oauth2.googleapis.com/token');
    });
  });

  describe('getMockAuthUrl()', () => {
    it('should generate a valid OAuth authorization URL', () => {
      const authUrl = helper.getMockAuthUrl();

      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain('state=');
    });

    it('should include correct scopes', () => {
      const authUrl = helper.getMockAuthUrl();

      expect(authUrl).toContain('gmail.readonly');
      expect(authUrl).toContain('userinfo.email');
    });

    it('should include correct redirect URI', () => {
      const authUrl = helper.getMockAuthUrl();

      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fgmail%2Fcallback');
    });

    it('should generate different state parameters each time', () => {
      const url1 = helper.getMockAuthUrl();
      const url2 = helper.getMockAuthUrl();

      const state1 = new URL(url1).searchParams.get('state');
      const state2 = new URL(url2).searchParams.get('state');

      expect(state1).not.toBe(state2);
      expect(state1).toHaveLength(32);
      expect(state2).toHaveLength(32);
    });
  });

  describe('generateMockTokens()', () => {
    it('should generate valid OAuth tokens with default options', () => {
      const tokens = helper.generateMockTokens();

      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
      expect(tokens).toHaveProperty('token_type', 'Bearer');
      expect(tokens).toHaveProperty('scope');
      expect(tokens).toHaveProperty('expiry_date');
      expect(tokens).toHaveProperty('id_token');
      expect(tokens).toHaveProperty('email', 'test@example.com');
    });

    it('should generate access token in Google format', () => {
      const tokens = helper.generateMockTokens();

      expect(tokens.access_token).toMatch(/^ya29\./);
      expect(tokens.access_token.length).toBeGreaterThan(100);
    });

    it('should generate refresh token in Google format', () => {
      const tokens = helper.generateMockTokens();

      expect(tokens.refresh_token).toMatch(/^1\/\//);
      expect(tokens.refresh_token.length).toBeGreaterThan(50);
    });

    it('should generate ID token in JWT format', () => {
      const tokens = helper.generateMockTokens();

      // JWT has 3 parts separated by dots
      const parts = tokens.id_token.split('.');
      expect(parts).toHaveLength(3);

      // Decode payload to verify structure
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload).toHaveProperty('iss', 'https://accounts.google.com');
      expect(payload).toHaveProperty('email', 'test@example.com');
      expect(payload).toHaveProperty('email_verified', true);
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });

    it('should include correct scopes', () => {
      const tokens = helper.generateMockTokens();

      expect(tokens.scope).toContain('gmail.readonly');
      expect(tokens.scope).toContain('userinfo.email');
    });

    it('should generate non-expired token by default', () => {
      const tokens = helper.generateMockTokens();

      expect(tokens.expiry_date).toBeGreaterThan(Date.now());
    });

    it('should generate expired token when expired option is true', () => {
      const tokens = helper.generateMockTokens({ expired: true });

      expect(tokens.expiry_date).toBeLessThan(Date.now());
    });

    it('should omit refresh token when missingRefresh is true', () => {
      const tokens = helper.generateMockTokens({ missingRefresh: true });

      expect(tokens).not.toHaveProperty('refresh_token');
      expect(tokens).toHaveProperty('access_token');
    });

    it('should use custom email when provided', () => {
      const customEmail = 'custom@example.com';
      const tokens = helper.generateMockTokens({ email: customEmail });

      expect(tokens.email).toBe(customEmail);

      // Verify email is in ID token payload
      const parts = tokens.id_token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.email).toBe(customEmail);
    });

    it('should respect custom expiresIn value', () => {
      const expiresIn = 7200; // 2 hours
      const beforeGeneration = Date.now();
      const tokens = helper.generateMockTokens({ expiresIn });
      const afterGeneration = Date.now();

      const expectedExpiry = beforeGeneration + (expiresIn * 1000);
      const maxExpiry = afterGeneration + (expiresIn * 1000);

      expect(tokens.expiry_date).toBeGreaterThanOrEqual(expectedExpiry);
      expect(tokens.expiry_date).toBeLessThanOrEqual(maxExpiry);
    });

    it('should generate unique tokens each time', () => {
      const tokens1 = helper.generateMockTokens();
      const tokens2 = helper.generateMockTokens();

      expect(tokens1.access_token).not.toBe(tokens2.access_token);
      expect(tokens1.refresh_token).not.toBe(tokens2.refresh_token);
      expect(tokens1.id_token).not.toBe(tokens2.id_token);
    });
  });

  describe('simulateTokenRefresh()', () => {
    it('should return new access token on successful refresh', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';
      const newTokens = await helper.simulateTokenRefresh(refreshToken);

      expect(newTokens).toHaveProperty('access_token');
      expect(newTokens).toHaveProperty('token_type', 'Bearer');
      expect(newTokens).toHaveProperty('scope');
      expect(newTokens).toHaveProperty('expiry_date');
      expect(newTokens).toHaveProperty('id_token');
    });

    it('should not return refresh token in refresh response', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';
      const newTokens = await helper.simulateTokenRefresh(refreshToken);

      // Refresh response doesn't include refresh_token (it stays the same)
      expect(newTokens).not.toHaveProperty('refresh_token');
    });

    it('should generate new access token different from original', async () => {
      const originalTokens = helper.generateMockTokens();
      const newTokens = await helper.simulateTokenRefresh(originalTokens.refresh_token);

      expect(newTokens.access_token).not.toBe(originalTokens.access_token);
    });

    it('should set expiry date to future', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';
      const beforeRefresh = Date.now();
      const newTokens = await helper.simulateTokenRefresh(refreshToken);

      expect(newTokens.expiry_date).toBeGreaterThan(beforeRefresh);
      // Should be approximately 1 hour in the future
      expect(newTokens.expiry_date).toBeLessThan(beforeRefresh + 3700000);
    });

    it('should use custom email when provided', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';
      const customEmail = 'refresh@example.com';
      const newTokens = await helper.simulateTokenRefresh(refreshToken, { email: customEmail });

      // Verify email is in ID token payload
      const parts = newTokens.id_token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.email).toBe(customEmail);
    });

    it('should throw error when shouldFail is true', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';

      await expect(
        helper.simulateTokenRefresh(refreshToken, { shouldFail: true })
      ).rejects.toThrow('invalid_grant');
    });

    it('should throw error with correct structure when failing', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';

      try {
        await helper.simulateTokenRefresh(refreshToken, { shouldFail: true });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('invalid_grant');
        expect(error.code).toBe(400);
        expect(error.errors).toBeDefined();
        expect(error.errors[0].reason).toBe('invalid_grant');
      }
    });

    it('should throw error for invalid refresh token format', async () => {
      const invalidToken = 'invalid_token_format';

      await expect(
        helper.simulateTokenRefresh(invalidToken)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for empty refresh token', async () => {
      await expect(
        helper.simulateTokenRefresh('')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for null refresh token', async () => {
      await expect(
        helper.simulateTokenRefresh(null)
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should simulate network delay', async () => {
      const refreshToken = '1//mock_refresh_token_abc123';
      const startTime = Date.now();
      await helper.simulateTokenRefresh(refreshToken);
      const endTime = Date.now();

      // Should take at least 50ms (the simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Allow some margin
    });
  });

  describe('simulateCallback()', () => {
    it('should return full token set on successful callback', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';
      const tokens = await helper.simulateCallback(authCode);

      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
      expect(tokens).toHaveProperty('token_type', 'Bearer');
      expect(tokens).toHaveProperty('scope');
      expect(tokens).toHaveProperty('expiry_date');
      expect(tokens).toHaveProperty('id_token');
      expect(tokens).toHaveProperty('email');
    });

    it('should include refresh token in callback response', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';
      const tokens = await helper.simulateCallback(authCode);

      // Callback response includes refresh_token (unlike refresh)
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.refresh_token).toMatch(/^1\/\//);
    });

    it('should use custom email when provided', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';
      const customEmail = 'callback@example.com';
      const tokens = await helper.simulateCallback(authCode, { email: customEmail });

      expect(tokens.email).toBe(customEmail);
    });

    it('should throw error when shouldFail is true', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';

      await expect(
        helper.simulateCallback(authCode, { shouldFail: true })
      ).rejects.toThrow('invalid_grant');
    });

    it('should throw error with correct structure when failing', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';

      try {
        await helper.simulateCallback(authCode, { shouldFail: true });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('invalid_grant');
        expect(error.code).toBe(400);
        expect(error.errors).toBeDefined();
        expect(error.errors[0].reason).toBe('invalid_grant');
      }
    });

    it('should throw error for invalid auth code', async () => {
      const invalidCode = 'short';

      await expect(
        helper.simulateCallback(invalidCode)
      ).rejects.toThrow('Invalid authorization code');
    });

    it('should throw error for empty auth code', async () => {
      await expect(
        helper.simulateCallback('')
      ).rejects.toThrow('Invalid authorization code');
    });

    it('should simulate network delay', async () => {
      const authCode = '4/0Amock_auth_code_xyz789';
      const startTime = Date.now();
      await helper.simulateCallback(authCode);
      const endTime = Date.now();

      // Should take at least 100ms (the simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('generateAuthCode()', () => {
    it('should generate auth code in Google format', () => {
      const code = helper.generateAuthCode();

      expect(code).toMatch(/^4\/0A/);
      expect(code.length).toBeGreaterThan(10);
    });

    it('should generate unique codes each time', () => {
      const code1 = helper.generateAuthCode();
      const code2 = helper.generateAuthCode();

      expect(code1).not.toBe(code2);
    });

    it('should generate codes of consistent length', () => {
      const code1 = helper.generateAuthCode();
      const code2 = helper.generateAuthCode();

      expect(code1.length).toBe(code2.length);
    });
  });

  describe('generateState()', () => {
    it('should generate random state string', () => {
      const state = helper.generateState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBe(32);
    });

    it('should generate unique states each time', () => {
      const state1 = helper.generateState();
      const state2 = helper.generateState();

      expect(state1).not.toBe(state2);
    });

    it('should only contain URL-safe characters', () => {
      const state = helper.generateState();

      // Should only contain alphanumeric, dash, and underscore
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('validateTokenStructure()', () => {
    it('should return true for valid token structure', () => {
      const tokens = helper.generateMockTokens();
      const isValid = helper.validateTokenStructure(tokens);

      expect(isValid).toBe(true);
    });

    it('should return false for null tokens', () => {
      const isValid = helper.validateTokenStructure(null);

      expect(isValid).toBe(false);
    });

    it('should return false for undefined tokens', () => {
      const isValid = helper.validateTokenStructure(undefined);

      expect(isValid).toBe(false);
    });

    it('should return false for non-object tokens', () => {
      expect(helper.validateTokenStructure('string')).toBe(false);
      expect(helper.validateTokenStructure(123)).toBe(false);
      expect(helper.validateTokenStructure([])).toBe(false);
    });

    it('should return false for missing access_token', () => {
      const tokens = helper.generateMockTokens();
      delete tokens.access_token;

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return false for empty access_token', () => {
      const tokens = helper.generateMockTokens();
      tokens.access_token = '';

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return false for missing token_type', () => {
      const tokens = helper.generateMockTokens();
      delete tokens.token_type;

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return false for incorrect token_type', () => {
      const tokens = helper.generateMockTokens();
      tokens.token_type = 'Basic';

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return false for missing expiry_date', () => {
      const tokens = helper.generateMockTokens();
      delete tokens.expiry_date;

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return false for missing scope', () => {
      const tokens = helper.generateMockTokens();
      delete tokens.scope;

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(false);
    });

    it('should return true even without refresh_token', () => {
      const tokens = helper.generateMockTokens({ missingRefresh: true });

      const isValid = helper.validateTokenStructure(tokens);
      expect(isValid).toBe(true);
    });
  });

  describe('isTokenExpired()', () => {
    it('should return false for non-expired token', () => {
      const tokens = helper.generateMockTokens();
      const isExpired = helper.isTokenExpired(tokens);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const tokens = helper.generateMockTokens({ expired: true });
      const isExpired = helper.isTokenExpired(tokens);

      expect(isExpired).toBe(true);
    });

    it('should return true for null tokens', () => {
      const isExpired = helper.isTokenExpired(null);

      expect(isExpired).toBe(true);
    });

    it('should return true for undefined tokens', () => {
      const isExpired = helper.isTokenExpired(undefined);

      expect(isExpired).toBe(true);
    });

    it('should return true for tokens without expiry_date', () => {
      const tokens = { access_token: 'test' };
      const isExpired = helper.isTokenExpired(tokens);

      expect(isExpired).toBe(true);
    });

    it('should return true for token expiring right now', () => {
      const tokens = {
        access_token: 'test',
        expiry_date: Date.now()
      };
      const isExpired = helper.isTokenExpired(tokens);

      expect(isExpired).toBe(true);
    });

    it('should return false for token expiring in future', () => {
      const tokens = {
        access_token: 'test',
        expiry_date: Date.now() + 1000
      };
      const isExpired = helper.isTokenExpired(tokens);

      expect(isExpired).toBe(false);
    });
  });

  describe('createOAuthTestHelper factory function', () => {
    it('should create a new OAuthTestHelper instance', () => {
      const helper = createOAuthTestHelper();

      expect(helper).toBeInstanceOf(OAuthTestHelper);
      expect(helper.baseUrl).toBeDefined();
      expect(helper.tokenEndpoint).toBeDefined();
    });

    it('should create independent instances', () => {
      const helper1 = createOAuthTestHelper();
      const helper2 = createOAuthTestHelper();

      expect(helper1).not.toBe(helper2);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete OAuth flow simulation', async () => {
      // 1. Generate auth URL
      const authUrl = helper.getMockAuthUrl();
      expect(authUrl).toContain('accounts.google.com');

      // 2. Generate auth code (simulating user authorization)
      const authCode = helper.generateAuthCode();
      expect(authCode).toMatch(/^4\/0A/);

      // 3. Exchange code for tokens
      const tokens = await helper.simulateCallback(authCode);
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();

      // 4. Validate token structure
      expect(helper.validateTokenStructure(tokens)).toBe(true);

      // 5. Check if token is expired
      expect(helper.isTokenExpired(tokens)).toBe(false);

      // 6. Simulate token refresh
      const newTokens = await helper.simulateTokenRefresh(tokens.refresh_token);
      expect(newTokens.access_token).not.toBe(tokens.access_token);
    });

    it('should handle expired token refresh flow', async () => {
      // Generate expired tokens
      const expiredTokens = helper.generateMockTokens({ expired: true });
      expect(helper.isTokenExpired(expiredTokens)).toBe(true);

      // Refresh the expired token
      const newTokens = await helper.simulateTokenRefresh(expiredTokens.refresh_token);
      expect(helper.isTokenExpired(newTokens)).toBe(false);
    });

    it('should handle failed refresh scenario', async () => {
      const tokens = helper.generateMockTokens();

      // Simulate failed refresh
      await expect(
        helper.simulateTokenRefresh(tokens.refresh_token, { shouldFail: true })
      ).rejects.toThrow('invalid_grant');
    });

    it('should handle missing refresh token scenario', async () => {
      const tokens = helper.generateMockTokens({ missingRefresh: true });

      expect(tokens.refresh_token).toBeUndefined();
      expect(helper.validateTokenStructure(tokens)).toBe(true);
    });
  });
});
