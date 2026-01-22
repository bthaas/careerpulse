/**
 * Unit Tests for AuthService
 * Tests specific examples and edge cases for authentication
 * 
 * **Validates: Requirements 6.2, 6.4, 6.5, 6.6**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../services/AuthService.js';

describe('AuthService Unit Tests', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService('test-secret-key', {
      expiresIn: '1h',
      saltRounds: 4 // Lower for faster tests
    });
  });

  describe('Initialization', () => {
    it('should create instance with secret and config', () => {
      expect(authService).toBeDefined();
      expect(authService.jwtSecret).toBe('test-secret-key');
      expect(authService.expiresIn).toBe('1h');
      expect(authService.saltRounds).toBe(4);
    });

    it('should use default config values', () => {
      const service = new AuthService('secret');
      expect(service.expiresIn).toBe('7d');
      expect(service.saltRounds).toBe(10);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const password = 'mySecurePassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password Comparison', () => {
    it('should return true for matching password', async () => {
      const password = 'mySecurePassword123';
      const hash = await authService.hashPassword(password);

      const matches = await authService.comparePassword(password, hash);
      expect(matches).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mySecurePassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await authService.hashPassword(password);

      const matches = await authService.comparePassword(wrongPassword, hash);
      expect(matches).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MyPassword';
      const hash = await authService.hashPassword(password);

      const matches = await authService.comparePassword('mypassword', hash);
      expect(matches).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com'
      };

      const token = authService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload in token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com'
      };

      const token = authService.generateToken(payload);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com'
      };

      const token = authService.generateToken(payload);
      const decoded = authService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should return null for invalid token', () => {
      const decoded = authService.verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const otherService = new AuthService('different-secret');
      const token = otherService.generateToken({
        userId: 'user123',
        email: 'test@example.com'
      });

      const decoded = authService.verifyToken(token);
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', async () => {
      const shortService = new AuthService('test-secret', { expiresIn: '1ms' });
      const token = shortService.generateToken({
        userId: 'user123',
        email: 'test@example.com'
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const decoded = shortService.verifyToken(token);
      expect(decoded).toBeNull();
    });
  });

  describe('Auth Middleware', () => {
    it('should allow request with valid token in header', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(payload);

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {}
      };
      const res = {};
      const next = vi.fn();

      authService.authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user123');
    });

    it('should allow request with valid token in cookie', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(payload);

      const req = {
        headers: {},
        cookies: { token }
      };
      const res = {};
      const next = vi.fn();

      authService.authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    it('should reject request without token', () => {
      const req = {
        headers: {},
        cookies: {}
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authService.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      const req = {
        headers: { authorization: 'Bearer invalid.token.here' },
        cookies: {}
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authService.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Optional Auth Middleware', () => {
    it('should add user if valid token present', () => {
      const payload = { userId: 'user123', email: 'test@example.com' };
      const token = authService.generateToken(payload);

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {}
      };
      const res = {};
      const next = vi.fn();

      authService.optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user123');
    });

    it('should continue without user if no token', () => {
      const req = {
        headers: {},
        cookies: {}
      };
      const res = {};
      const next = vi.fn();

      authService.optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should continue without user if invalid token', () => {
      const req = {
        headers: { authorization: 'Bearer invalid.token.here' },
        cookies: {}
      };
      const res = {};
      const next = vi.fn();

      authService.optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
