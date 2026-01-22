/**
 * Authentication utilities - Backward compatible wrapper for AuthService
 * This file maintains the original functional API while using the new OOP implementation
 */

import { AuthService } from '../services/AuthService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create singleton instance
const authService = new AuthService(JWT_SECRET, {
  expiresIn: '7d',
  saltRounds: 10
});

// ==========================================
// Backward Compatible Function Exports
// ==========================================

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return await authService.hashPassword(password);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function comparePassword(password, hash) {
  return await authService.comparePassword(password, hash);
}

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
export function generateToken(userId, email) {
  return authService.generateToken({ userId, email });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyToken(token) {
  return authService.verifyToken(token);
}

/**
 * Auth middleware - protects routes
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
export function authMiddleware(req, res, next) {
  return authService.authMiddleware(req, res, next);
}

/**
 * Optional auth middleware - doesn't require auth but adds user if present
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
export function optionalAuthMiddleware(req, res, next) {
  return authService.optionalAuthMiddleware(req, res, next);
}

// Export the service instance for direct access
export { authService };

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware
};
