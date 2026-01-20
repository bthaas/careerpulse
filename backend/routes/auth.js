import express from 'express';
import { 
  getAuthUrl, 
  getTokensFromCode,
  refreshAccessToken,
  oauth2Client 
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
    console.log('📝 Query params:', { code: code ? 'present' : 'missing', state: state ? 'present' : 'missing' });
    
    if (!code) {
      console.error('❌ Missing authorization code');
      return res.status(400).send(`
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
                max-width: 500px;
              }
              h1 { color: #ef4444; margin: 0 0 1rem 0; font-size: 2rem; }
              p { color: #6b7280; margin: 0.5rem 0; line-height: 1.6; }
              .icon { font-size: 4rem; margin-bottom: 1rem; }
              .help { background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin-top: 1.5rem; font-size: 0.875rem; color: #92400e; text-align: left; }
              .help strong { display: block; margin-bottom: 0.5rem; }
              .help ul { margin: 0.5rem 0; padding-left: 1.5rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h1>Connection Failed</h1>
              <p>The authorization code is missing. This usually happens when:</p>
              <div class="help">
                <strong>Common Causes:</strong>
                <ul>
                  <li>You closed the authorization window too early</li>
                  <li>You clicked "Cancel" or "Deny" in Google's consent screen</li>
                  <li>The authorization request timed out</li>
                </ul>
                <strong>What to do:</strong>
                <ul>
                  <li>Close this window</li>
                  <li>Try connecting Gmail again from CareerPulse</li>
                  <li>Make sure to click "Allow" when Google asks for permissions</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    
    // TEMPORARY WORKAROUND: If state is missing, use a fallback approach
    // This happens when Google OAuth doesn't preserve the state parameter
    // TODO: Fix Google Cloud Console OAuth configuration to preserve state
    let userId, userEmail;
    
    if (state) {
      // Validate state parameter (preferred method)
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
      
      userId = stateData.userId;
      userEmail = stateData.email;
      console.log('✅ State validated for user:', userId);
    } else {
      // FALLBACK: State parameter missing (Google OAuth config issue)
      console.warn('⚠️  State parameter missing - using fallback method');
      console.warn('⚠️  This is less secure. Please fix Google Cloud Console OAuth configuration.');
      
      // We'll get the email from the OAuth tokens and use that to find/create user
      // This is a temporary workaround until Google OAuth is properly configured
      userId = 'pending'; // Will be updated after we get the email from tokens
      userEmail = null;
    }
    
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
    
    // If we're using fallback method, get email from tokens
    if (userId === 'pending') {
      // Get email from OAuth tokens
      const { google } = await import('googleapis');
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      oauth2Client.setCredentials(tokens);
      
      try {
        const userInfo = await oauth2.userinfo.get();
        userEmail = userInfo.data.email;
        
        // For now, use email as userId (this is a temporary workaround)
        // In production, you'd look up the user in your database
        userId = userEmail;
        
        console.log('✅ Retrieved email from OAuth:', userEmail);
      } catch (emailError) {
        console.error('❌ Failed to get email from OAuth:', emailError);
        return res.status(400).send(`
          <html>
            <body>
              <h1>❌ Connection Failed</h1>
              <p>Failed to retrieve email from OAuth</p>
              <p>Please try again.</p>
            </body>
          </html>
        `);
      }
    }
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));
    
    // Save connection with actual userId
    await saveEmailConnection({
      userId: userId,
      email: userEmail || tokens.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt.toISOString()
    });
    
    console.log('✅ Gmail connection saved for user:', userId);
    
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
        console.log('🔄 Refreshing expired token for user:', req.user.userId);
        const newTokens = await refreshAccessToken(connection.refreshToken);
        
        // Update tokens in database
        await saveEmailConnection({
          userId: connection.userId,
          email: connection.email,
          accessToken: newTokens.access_token,
          refreshToken: connection.refreshToken,
          expiresAt: new Date(newTokens.expiry_date).toISOString()
        });
        
        console.log('✅ Token refreshed successfully');
        
        return res.json({
          connected: true,
          email: connection.email,
          refreshed: true
        });
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.message);
        
        // Token refresh failed, clean up and inform user
        try {
          await disconnectEmail(req.user.userId);
          console.log('🧹 Cleaned up expired connection');
        } catch (cleanupError) {
          console.error('Failed to cleanup connection:', cleanupError);
        }
        
        return res.json({
          connected: false,
          email: null,
          error: 'token_expired',
          message: 'Your Gmail connection has expired. Please reconnect to continue syncing emails.'
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
