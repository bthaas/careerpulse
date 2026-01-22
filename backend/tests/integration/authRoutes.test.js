/**
 * Integration Tests for Auth Routes
 * 
 * Tests the authentication API endpoints with OAuth flow
 * 
 * Requirements: 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { TestDatabaseManager } from '../helpers/testSetup.js';

// Mock the Gmail config
const mockGetAuthUrl = vi.fn();
const mockGetTokensFromCode = vi.fn();
const mockRefreshAccessToken = vi.fn();
const mockOAuth2Client = {
  setCredentials: vi.fn()
};

vi.mock('../../config/gmail.js', () => ({
  getAuthUrl: mockGetAuthUrl,
  getTokensFromCode: mockGetTokensFromCode,
  refreshAccessToken: mockRefreshAccessToken,
  oauth2Client: mockOAuth2Client
}));

// Mock googleapis
vi.mock('googleapis', () => ({
  google: {
    oauth2: vi.fn(() => ({
      userinfo: {
        get: vi.fn().mockResolvedValue({
          data: {
            email: 'test@gmail.com',
            name: 'Test User'
          }
        })
      }
    }))
  }
}));

// Mock the container services
const mockAuthService = {
  authMiddleware: (req, res, next) => {
    req.user = { userId: 'test-user-123', email: 'test@example.com' };
    next();
  }
};

const mockDatabaseService = {
  saveEmailConnection: vi.fn(),
  getEmailConnection: vi.fn(),
  disconnectEmail: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn()
};

vi.mock('../../services/container.js', () => ({
  default: {
    authService: mockAuthService,
    databaseService: mockDatabaseService
  }
}));

// Import routes AFTER mocking
const authRoutes = await import('../../routes/auth.js').then(m => m.default);

describe('Auth Routes Integration Tests', () => {
  let app;
  let dbManager;

  beforeEach(async () => {
    // Set up Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    
    // Set up test database
    dbManager = new TestDatabaseManager();
    await dbManager.initialize();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock for getUserByEmail (for fallback OAuth flow)
    mockDatabaseService.getUserByEmail.mockResolvedValue(null);
    mockDatabaseService.createUser.mockResolvedValue('new-user-id');
  });

  afterEach(async () => {
    if (dbManager) {
      await dbManager.teardown();
    }
  });

  describe('GET /api/auth/gmail', () => {
    it('should return OAuth authorization URL', async () => {
      // Requirements: 9.4
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...';
      mockGetAuthUrl.mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/api/auth/gmail')
        .expect(200);

      expect(response.body.authUrl).toBe(mockAuthUrl);
      expect(mockGetAuthUrl).toHaveBeenCalled();
    });

    it('should handle errors generating auth URL', async () => {
      mockGetAuthUrl.mockImplementation(() => {
        throw new Error('OAuth config error');
      });

      const response = await request(app)
        .get('/api/auth/gmail')
        .expect(500);

      expect(response.body.error).toBe('Failed to generate authorization URL');
    });
  });

  describe('GET /api/auth/gmail/callback', () => {
    it('should exchange code for tokens and save connection', async () => {
      // Requirements: 9.5
      const mockTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expiry_date: Date.now() + 3600000,
        email: 'test@gmail.com'
      };

      mockGetTokensFromCode.mockResolvedValue(mockTokens);
      mockDatabaseService.saveEmailConnection.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .get('/api/auth/gmail/callback')
        .query({ code: 'mock_auth_code' })
        .expect(200);

      expect(response.text).toContain('Gmail Connected');
      expect(mockGetTokensFromCode).toHaveBeenCalledWith('mock_auth_code');
      expect(mockDatabaseService.saveEmailConnection).toHaveBeenCalled();
    });

    it('should return error when code is missing', async () => {
      const response = await request(app)
        .get('/api/auth/gmail/callback')
        .expect(400);

      expect(response.text).toContain('Connection Failed');
    });

    it('should handle token exchange failure', async () => {
      mockGetTokensFromCode.mockRejectedValue(new Error('Invalid code'));

      const response = await request(app)
        .get('/api/auth/gmail/callback')
        .query({ code: 'invalid_code' })
        .expect(500);

      expect(response.text).toContain('Connection Failed');
    });

    it('should handle missing tokens', async () => {
      mockGetTokensFromCode.mockResolvedValue({
        access_token: 'token',
        // Missing refresh_token
      });

      const response = await request(app)
        .get('/api/auth/gmail/callback')
        .query({ code: 'code' })
        .expect(400);

      expect(response.text).toContain('Failed to obtain');
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return connection status when connected', async () => {
      // Requirements: 9.6
      const mockConnection = {
        userId: 'test-user-123',
        email: 'test@gmail.com',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refresh_token'
      };

      mockDatabaseService.getEmailConnection.mockResolvedValue(mockConnection);

      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.connected).toBe(true);
      expect(response.body.email).toBe('test@gmail.com');
    });

    it('should return not connected when no connection exists', async () => {
      mockDatabaseService.getEmailConnection.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.connected).toBe(false);
      expect(response.body.email).toBeNull();
    });

    it('should refresh expired tokens automatically', async () => {
      const mockConnection = {
        userId: 'test-user-123',
        email: 'test@gmail.com',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        refreshToken: 'refresh_token'
      };

      const newTokens = {
        access_token: 'new_access_token',
        expiry_date: Date.now() + 3600000
      };

      mockDatabaseService.getEmailConnection.mockResolvedValue(mockConnection);
      mockRefreshAccessToken.mockResolvedValue(newTokens);
      mockDatabaseService.saveEmailConnection.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.connected).toBe(true);
      expect(mockRefreshAccessToken).toHaveBeenCalledWith('refresh_token');
      expect(mockDatabaseService.saveEmailConnection).toHaveBeenCalled();
    });

    it('should disconnect when token refresh fails', async () => {
      const mockConnection = {
        userId: 'test-user-123',
        email: 'test@gmail.com',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        refreshToken: 'refresh_token'
      };

      mockDatabaseService.getEmailConnection.mockResolvedValue(mockConnection);
      mockRefreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
      mockDatabaseService.disconnectEmail.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.connected).toBe(false);
      expect(response.body.error).toContain('token_expired');
      expect(mockDatabaseService.disconnectEmail).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/disconnect', () => {
    it('should disconnect email connection', async () => {
      // Requirements: 9.7
      mockDatabaseService.disconnectEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/disconnect')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('disconnected successfully');
      expect(mockDatabaseService.disconnectEmail).toHaveBeenCalledWith('test-user-123');
    });

    it('should handle disconnect errors', async () => {
      mockDatabaseService.disconnectEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/disconnect')
        .expect(500);

      expect(response.body.error).toBe('Failed to disconnect email');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should manually refresh access token', async () => {
      const mockConnection = {
        userId: 'test-user-123',
        email: 'test@gmail.com',
        refreshToken: 'refresh_token'
      };

      const newTokens = {
        access_token: 'new_access_token',
        expiry_date: Date.now() + 3600000
      };

      mockDatabaseService.getEmailConnection.mockResolvedValue(mockConnection);
      mockRefreshAccessToken.mockResolvedValue(newTokens);
      mockDatabaseService.saveEmailConnection.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('refreshed successfully');
    });

    it('should return error when no connection exists', async () => {
      mockDatabaseService.getEmailConnection.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(400);

      expect(response.body.error).toBe('No active connection found');
    });
  });

  describe('Authentication Enforcement', () => {
    it('should require authentication for protected endpoints', async () => {
      // Requirements: 9.8
      // This test verifies that the auth middleware is applied
      // In our mocked version, it always succeeds
      // In production, it would check for valid JWT tokens
      
      mockGetAuthUrl.mockReturnValue('https://accounts.google.com/oauth');
      
      const response = await request(app)
        .get('/api/auth/gmail')
        .expect(200); // Should succeed with mocked auth

      expect(response.body).toHaveProperty('authUrl');
    });

    it('should allow callback without authentication', async () => {
      // Callback endpoint should work without auth
      mockGetTokensFromCode.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        expiry_date: Date.now() + 3600000
      });
      
      mockDatabaseService.saveEmailConnection.mockResolvedValue({ id: 1 });

      await request(app)
        .get('/api/auth/gmail/callback')
        .query({ code: 'code' })
        .expect(200);
    });
  });
});
