import express from 'express';
import { 
  getAuthUrl, 
  getTokensFromCode,
  refreshAccessToken 
} from '../config/gmail.js';
import {
  saveEmailConnection,
  getEmailConnection,
  disconnectEmail
} from '../database/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/auth/gmail
 * Initiate Gmail OAuth flow (protected route)
 */
router.get('/gmail', authMiddleware, (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * GET /api/auth/gmail/callback
 * OAuth callback endpoint
 */
router.get('/gmail/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return res.status(400).send('Failed to obtain tokens');
    }
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));
    
    // Note: This callback doesn't have access to user session
    // In production, you'd need to store the userId in the OAuth state parameter
    // For now, we'll extract from the session cookie if available
    
    // Save connection to database (temporary - will be updated with proper userId later)
    await saveEmailConnection({
      userId: 'pending', // Will be updated when user logs in
      email: tokens.email || 'unknown@email.com',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt.toISOString()
    });
    
    // Redirect to frontend with success
    res.send(`
      <html>
        <body>
          <h1>✅ Gmail Connected Successfully!</h1>
          <p>You can now close this window and return to CareerPulse.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Connection Failed</h1>
          <p>Error: ${error.message}</p>
          <p>Please try again.</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/status
 * Check if email is connected (protected route)
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const connection = await getEmailConnection(req.user.userId);
    
    if (!connection) {
      return res.json({ 
        connected: false,
        email: null
      });
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(connection.expiresAt);
    const isExpired = now >= expiresAt;
    
    // If expired, try to refresh
    if (isExpired && connection.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(connection.refreshToken);
        
        // Update tokens in database
        await saveEmailConnection({
          userId: connection.userId,
          email: connection.email,
          accessToken: newTokens.access_token,
          refreshToken: connection.refreshToken,
          expiresAt: new Date(newTokens.expiry_date).toISOString()
        });
        
        return res.json({
          connected: true,
          email: connection.email
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Token refresh failed, user needs to reconnect
        await disconnectEmail();
        return res.json({
          connected: false,
          email: null,
          error: 'Token expired, please reconnect'
        });
      }
    }
    
    res.json({
      connected: true,
      email: connection.email
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

/**
 * POST /api/auth/disconnect
 * Disconnect email connection (protected route)
 */
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    await disconnectEmail(req.user.userId);
    
    res.json({ 
      success: true,
      message: 'Email disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting email:', error);
    res.status(500).json({ error: 'Failed to disconnect email' });
  }
});

/**
 * POST /api/auth/refresh
 * Manually refresh access token (protected route)
 */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const connection = await getEmailConnection(req.user.userId);
    
    if (!connection || !connection.refreshToken) {
      return res.status(400).json({ error: 'No active connection found' });
    }
    
    const newTokens = await refreshAccessToken(connection.refreshToken);
    
    // Update tokens in database
    await saveEmailConnection({
      userId: connection.userId,
      email: connection.email,
      accessToken: newTokens.access_token,
      refreshToken: connection.refreshToken,
      expiresAt: new Date(newTokens.expiry_date).toISOString()
    });
    
    res.json({ 
      success: true,
      message: 'Token refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
