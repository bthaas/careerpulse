/**
 * AuthService Class - OOP Implementation
 * 
 * Encapsulates authentication and authorization operations including:
 * - Password hashing and verification using bcrypt
 * - JWT token generation and validation
 * - Express middleware for route protection
 * 
 * @class AuthService
 * @example
 * const authService = new AuthService('my-secret-key', {
 *   expiresIn: '7d',
 *   saltRounds: 10
 * });
 * 
 * // Hash password
 * const hash = await authService.hashPassword('mypassword');
 * 
 * // Generate token
 * const token = authService.generateToken({
 *   userId: 'user-123',
 *   email: 'user@example.com'
 * });
 * 
 * **Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6**
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * AuthService Class
 * 
 * Manages authentication with JWT tokens and bcrypt password hashing.
 * Provides middleware for protecting Express routes.
 * 
 * @class
 */
export class AuthService {
  /**
   * Create an AuthService instance
   * 
   * @param {string} jwtSecret - JWT secret key for signing tokens
   * @param {Object} [config={}] - Configuration options
   * @param {string} [config.expiresIn='7d'] - Token expiration time (e.g., '7d', '24h', '1h')
   * @param {number} [config.saltRounds=10] - Bcrypt salt rounds for password hashing (higher = more secure but slower)
   * @example
   * const authService = new AuthService(process.env.JWT_SECRET, {
   *   expiresIn: '30d',
   *   saltRounds: 12
   * });
   */
  constructor(jwtSecret, config = {}) {
    this.jwtSecret = jwtSecret;
    this.expiresIn = config.expiresIn || '7d';
    this.saltRounds = config.saltRounds || 10;
  }

  /**
   * Hash a password using bcrypt
   * 
   * Generates a secure hash of the provided password using bcrypt with
   * the configured number of salt rounds.
   * 
   * @async
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} Hashed password
   * @throws {Error} If hashing fails
   * @example
   * const hash = await authService.hashPassword('mySecurePassword123');
   * // Store hash in database
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * 
   * Verifies if the provided password matches the stored hash using bcrypt.
   * 
   * @async
   * @param {string} password - Plain text password to verify
   * @param {string} hash - Hashed password from database
   * @returns {Promise<boolean>} True if password matches, false otherwise
   * @example
   * const isValid = await authService.comparePassword(
   *   'userInputPassword',
   *   storedHash
   * );
   * if (isValid) {
   *   // Login successful
   * }
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token
   * 
   * Creates a signed JWT token containing the user's ID and email.
   * The token expires after the configured duration.
   * 
   * @param {Object} payload - Token payload data
   * @param {string} payload.userId - User's unique identifier
   * @param {string} payload.email - User's email address
   * @returns {string} Signed JWT token
   * @example
   * const token = authService.generateToken({
   *   userId: 'user-123',
   *   email: 'user@example.com'
   * });
   * // Send token to client
   * res.json({ token });
   */
  generateToken(payload) {
    const { userId, email } = payload;
    return jwt.sign(
      { userId, email },
      this.jwtSecret,
      { expiresIn: this.expiresIn }
    );
  }

  /**
   * Verify and decode a JWT token
   * 
   * Validates the token signature and expiration, returning the decoded payload
   * if valid or null if invalid/expired.
   * 
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded payload with userId and email, or null if invalid
   * @example
   * const decoded = authService.verifyToken(token);
   * if (decoded) {
   *   console.log(`User ${decoded.userId} authenticated`);
   * } else {
   *   console.log('Invalid or expired token');
   * }
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Express middleware for route authentication
   * 
   * Protects routes by requiring a valid JWT token in the Authorization header
   * or cookie. Adds decoded user info to req.user if authentication succeeds.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void}
   * @example
   * // Protect a route
   * app.get('/api/protected', 
   *   authService.authMiddleware.bind(authService),
   *   (req, res) => {
   *     res.json({ userId: req.user.userId });
   *   }
   * );
   */
  authMiddleware(req, res, next) {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = this.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = decoded;
    next();
  }

  /**
   * Optional auth middleware - doesn't require auth but adds user if present
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (token) {
      const decoded = this.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  }
}
