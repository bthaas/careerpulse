/**
 * Script to set up secrets in Google Cloud Secret Manager
 * Run this once to upload your secrets to Google Cloud
 */

import { createSecret, loadSecrets } from '../config/secrets.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSecrets() {
  console.log('🔐 Google Cloud Secret Manager Setup\n');
  console.log('This script will upload your secrets to Google Cloud Secret Manager.');
  console.log('Make sure you have:');
  console.log('  1. Enabled Secret Manager API in Google Cloud Console');
  console.log('  2. Set GOOGLE_CLOUD_PROJECT_ID environment variable');
  console.log('  3. Authenticated with: gcloud auth application-default login\n');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT;
  
  if (!projectId) {
    console.error('❌ Error: GOOGLE_CLOUD_PROJECT_ID not set');
    console.log('\nSet it with:');
    console.log('  export GOOGLE_CLOUD_PROJECT_ID=your-project-id');
    process.exit(1);
  }
  
  console.log(`📦 Project ID: ${projectId}\n`);
  
  const proceed = await question('Ready to create secrets? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    rl.close();
    process.exit(0);
  }
  
  try {
    console.log('\n📝 Reading secrets from .env file...\n');
    
    const secrets = {
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    };
    
    // Validate all secrets exist
    for (const [key, value] of Object.entries(secrets)) {
      if (!value) {
        console.error(`❌ Error: ${key} not found in .env file`);
        process.exit(1);
      }
    }
    
    // Create each secret
    console.log('🚀 Creating secrets in Google Cloud...\n');
    for (const [key, value] of Object.entries(secrets)) {
      await createSecret(key, value);
    }
    
    console.log('\n✅ All secrets created successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Set USE_SECRET_MANAGER=true in your production environment');
    console.log('  2. Deploy your application');
    console.log('  3. Secrets will be automatically loaded from Google Cloud\n');
    
  } catch (error) {
    console.error('\n❌ Failed to set up secrets:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  • Make sure Secret Manager API is enabled');
    console.log('  • Authenticate with: gcloud auth application-default login');
    console.log('  • Check your project ID is correct');
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupSecrets();
