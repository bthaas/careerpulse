/**
 * Property-Based Tests for AuthService
 * Tests universal properties that should hold for authentication operations
 * 
 * **Validates: Requirements 6.5, 6.6**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AuthService } from '../../services/AuthService.js';

describe('AuthService Properties', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService('test-secret-key', {
      expiresIn: '1h',
      saltRounds: 4 // Lower for faster tests
    });
  });

  describe('Property 12: JWT Token Expiration', () => {
    it('returns null for expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress()
          }),
          async (user) => {
            // Create service with very short expiration
            const shortLivedService = new AuthService('test-secret', {
              expiresIn: '1ms' // Expires immediately
            });

            // Generate token
            const token = shortLivedService.generateToken(user);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify token is expired
            const decoded = shortLivedService.verifyToken(token);
            expect(decoded).toBeNull();
          }
        ),
        { numRuns: 5 } // Fewer runs due to timing
      );
    });

    it('returns valid payload for non-expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress()
          }),
          async (user) => {
            // Generate token
            const token = authService.generateToken(user);

            // Verify immediately
            const decoded = authService.verifyToken(token);

            expect(decoded).not.toBeNull();
            expect(decoded.userId).toBe(user.userId);
            expect(decoded.email).toBe(user.email);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 13: Password Hashing Round Trip', () => {
    it('hashed password matches original on compare', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            // Hash password
            const hash = await authService.hashPassword(password);

            // Compare should return true
            const matches = await authService.comparePassword(password, hash);
            expect(matches).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('hashed password does not match different password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.string({ minLength: 8, maxLength: 50 }),
            fc.string({ minLength: 8, maxLength: 50 })
          ).filter(([p1, p2]) => p1 !== p2),
          async ([password1, password2]) => {
            // Hash first password
            const hash = await authService.hashPassword(password1);

            // Compare with different password should return false
            const matches = await authService.comparePassword(password2, hash);
            expect(matches).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('same password produces different hashes (salt)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            // Hash same password twice
            const hash1 = await authService.hashPassword(password);
            const hash2 = await authService.hashPassword(password);

            // Hashes should be different (due to salt)
            expect(hash1).not.toBe(hash2);

            // But both should match the original password
            expect(await authService.comparePassword(password, hash1)).toBe(true);
            expect(await authService.comparePassword(password, hash2)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
