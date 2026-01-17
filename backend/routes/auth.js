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
import { generateOAuthState, validateOAuthState } from '../utils/oauthState.js';

const router = express.Router();

/**
 * GET /api/auth/gmail
 * Initiate Gmail OAuth flow (protected route)
 */
router.get('/gmail', authMiddleware, (req, res) => {
  try {
    // Generate OAuth state with user context
    const state = generateOAuthState(req.user.userId, req.user.email);
    
    console.log('🔐 Generating OAuth URL for user:', req.user.userId);
    
    // Generate OAuth URL with state parameter
    const authUrl = getAuthUrl(state);
    
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
    const { code, state } = req.query;
    
    console.log('📧 OAuth callback received');
    
    if (!code) {
      console.error('❌ Missing authorization code');
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Connection Failed</h1>
            <p>Missing authorization code</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    if (!state) {
      console.error('❌ Missing state parameter');
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Connection Failed</h1>
            <p>Missing state parameter (security error)</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    // Validate state parameter
    const stateData = validateOAuthState(state);
    
    if (!stateData.valid) {
      console.error('❌ Invalid state:', stateData.error);
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Connection Failed</h1>
            <p>Invalid or expired state parameter</p>
            <p>Error: ${stateData.error}</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    console.log('✅ State validated for user:', stateData.userId);
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('❌ Failed to obtain tokens');
      return res.status(400).send(`
        <html>
          <body>
            <h1>❌ Connection Failed</h1>
            <p>Failed to obtain access tokens</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    console.log('✅ Tokens obtained successfully');
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));
    
    // Save connection with ACTUAL userId (not 'pending')
    await saveEmailConnection({
      userId: stateData.userId, // ✅ FIXED: Use actual userId from state
      email: tokens.email || stateData.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt.toISOString()
    });
    
    console.log('✅ Gmail connection saved for user:', stateData.userId);
    
    // Redirect to frontend with success
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #10b981; margin: 0 0 1rem 0; font-size: 2rem; }
            p { color: #6b7280; margin: 0.5rem 0; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Gmail Connected!</h1>
            <p>Your Gmail account has been successfully connected.</p>
            <p style="margin-top: 1.5rem; font-size: 0.875rem;">You can now close this window and return to CareerPulse.</p>
          </div>
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
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #ef4444; margin: 0 0 1rem 0; font-size: 2rem; }
            p { color: #6b7280; margin: 0.5rem 0; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            .error { background: #fee; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; font-size: 0.875rem; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Connection Failed</h1>
            <p>We couldn't connect your Gmail account.</p>
            <div class="error">${error.message}</div>
            <p style="margin-top: 1.5rem; font-size: 0.875rem;">Please close this window and try again.</p>
          </div>
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
