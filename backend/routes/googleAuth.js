/**
 * Google OAuth Authentication Routes
 * For user authentication (login/signup with Google)
 */

import express from 'express';
import { google } from 'googleapis';
import container from '../services/container.js';

const router = express.Router();

// Get services from container
const { databaseService, authService } = container;

// OAuth2 client for authentication (separate from Gmail API)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`
);

/**
 * GET /api/auth/google
 * Initiate Google OAuth for authentication
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'select_account'
    });
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}?error=missing_code`);
    }
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    if (!data.email) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}?error=no_email`);
    }
    
    // Check if user exists
    let user = await databaseService.getUserByEmail(data.email);
    
    if (!user) {
      // Create new user with null password (OAuth user)
      const userId = await databaseService.createUser({
        email: data.email,
        password: null,
        name: data.name || data.email.split('@')[0]
      });
      
      user = {
        id: userId,
        email: data.email,
        name: data.name || data.email.split('@')[0]
      };
    }
    
    // Generate JWT token
    const token = authService.generateToken({ userId: user.id, email: user.email });
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${token}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

export default router;
