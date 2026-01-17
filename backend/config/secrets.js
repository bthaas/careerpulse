/**
 * Google Cloud Secret Manager Configuration
 * Securely retrieves API keys and secrets from Google Cloud
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';

// Load .env for local development fallback
dotenv.config();

// Lazy-load client only when needed (to avoid crashes when not using Secret Manager)
let client = null;
function getClient() {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

// Get Google Cloud Project ID
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT;

/**
 * Access a secret from Google Cloud Secret Manager
 * @param {string} secretName - Name of the secret
 * @param {string} version - Version of the secret (default: 'latest')
 * @returns {Promise<string>} The secret value
 */
async function accessSecret(secretName, version = 'latest') {
  try {
    // Construct the secret path
    const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;
    
    // Access the secret
    const [secretVersion] = await getClient().accessSecretVersion({ name });
    const payload = secretVersion.payload.data.toString('utf8');
    
    return payload;
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error.message);
    
    // Fallback to environment variable for local development
    const fallbackValue = process.env[secretName];
    if (fallbackValue) {
      console.log(`⚠️  Using fallback environment variable for ${secretName}`);
      return fallbackValue;
    }
    
    throw new Error(`Failed to access secret: ${secretName}`);
  }
}

/**
 * Load all required secrets for the application
 * @returns {Promise<Object>} Object containing all secrets
 */
export async function loadSecrets() {
  console.log('🔐 Loading application secrets...');
  
  try {
    // Check if we should use Secret Manager or .env
    // USE_SECRET_MANAGER=false explicitly disables Secret Manager (even in production)
    let useSecretManager;
    if (process.env.USE_SECRET_MANAGER === 'false') {
      useSecretManager = false;
    } else {
      useSecretManager = process.env.USE_SECRET_MANAGER === 'true' || process.env.NODE_ENV === 'production';
    }
    
    if (!useSecretManager) {
      console.log('📝 Using environment variables (.env file)');
      return {
        JWT_SECRET: process.env.JWT_SECRET,
        SESSION_SECRET: process.env.SESSION_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        FRONTEND_URL: process.env.FRONTEND_URL,
        API_URL: process.env.API_URL,
      };
    }
    
    // Load secrets from Google Cloud Secret Manager
    console.log('🔐 Loading secrets from Google Cloud Secret Manager...');
    // Note: Google OAuth secrets are optional
    let JWT_SECRET, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET;
    
    try {
      [JWT_SECRET, SESSION_SECRET] = await Promise.all([
        accessSecret('JWT_SECRET'),
        accessSecret('SESSION_SECRET'),
      ]);
      
      // Try to load Google OAuth secrets (optional)
      try {
        [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET] = await Promise.all([
          accessSecret('GOOGLE_CLIENT_ID'),
          accessSecret('GOOGLE_CLIENT_SECRET'),
        ]);
      } catch (error) {
        console.log('⚠️  Google OAuth secrets not found in Secret Manager, using environment variables');
        GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || undefined;
        GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || undefined;
      }
    } catch (error) {
      console.error('❌ Failed to load required secrets from Google Cloud:', error.message);
      throw new Error('Failed to load JWT_SECRET and SESSION_SECRET from Secret Manager. Set USE_SECRET_MANAGER=false to use environment variables instead.');
    }
    
    // Non-secret config from environment variables
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const API_URL = process.env.API_URL;
    
    console.log('✅ Secrets loaded successfully from Google Cloud');
    
    return {
      JWT_SECRET,
      SESSION_SECRET,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
      FRONTEND_URL,
      API_URL,
    };
  } catch (error) {
    console.error('❌ Failed to load secrets:', error);
    throw error;
  }
}

/**
 * Create or update a secret in Google Cloud Secret Manager
 * (Helper function for setup - not used in production code)
 */
export async function createSecret(secretName, secretValue) {
  try {
    const parent = `projects/${PROJECT_ID}`;
    
    // Create the secret
    try {
      await getClient().createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: { automatic: {} },
        },
      });
      console.log(`✅ Created secret: ${secretName}`);
    } catch (error) {
      if (error.code === 6) { // ALREADY_EXISTS
        console.log(`ℹ️  Secret ${secretName} already exists, adding new version`);
      } else {
        throw error;
      }
    }
    
    // Add secret version
    const secretPath = `projects/${PROJECT_ID}/secrets/${secretName}`;
    await getClient().addSecretVersion({
      parent: secretPath,
      payload: {
        data: Buffer.from(secretValue, 'utf8'),
      },
    });
    
    console.log(`✅ Added version to secret: ${secretName}`);
  } catch (error) {
    console.error(`❌ Failed to create secret ${secretName}:`, error);
    throw error;
  }
}

export default {
  loadSecrets,
  accessSecret,
  createSecret,
};
