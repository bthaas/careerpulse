/**
 * OAuth State Manager
 * Generates and validates OAuth state parameters with user context
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const STATE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate OAuth state parameter with user context
 * @param {string} userId - User ID to encode in state
 * @param {string} email - User email
 * @returns {string} Encrypted state parameter
 */
export function generateOAuthState(userId, email) {
  // Create state payload
  const payload = {
    userId,
    email,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + STATE_EXPIRATION
  };
  
  // Sign with JWT (5 minute expiration)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });
}

/**
 * Validate and decode OAuth state parameter
 * @param {string} state - State parameter from OAuth callback
 * @returns {Object} { valid: boolean, userId?: string, email?: string, error?: string }
 */
export function validateOAuthState(state) {
  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(state, JWT_SECRET);
    
    // Check custom expiration timestamp
    if (Date.now() > decoded.expiresAt) {
      return { 
        valid: false, 
        error: 'State expired' 
      };
    }
    
    // Validate required fields
    if (!decoded.userId || !decoded.email) {
      return { 
        valid: false, 
        error: 'Invalid state payload' 
      };
    }
    
    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    console.error('State validation error:', error.message);
    return { 
      valid: false, 
      error: error.message 
    };
  }
}

export default {
  generateOAuthState,
  validateOAuthState
};
