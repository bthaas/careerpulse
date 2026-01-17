import express from 'express';
import { createUser, getUserByEmail } from '../database/db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * POST /api/user/signup
 * Create a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userId = `user-${Date.now()}`;
    await createUser({
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0]
    });
    
    // Generate token
    const token = generateToken(userId, email.toLowerCase());
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/user/login
 * Log in to existing account
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

/**
 * GET /api/user/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    // User info is added by auth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { getUserById } = await import('../database/db.js');
    const user = await getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
