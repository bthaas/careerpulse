/**
 * Gmail OAuth Connection Script
 * Run this to connect Gmail and get fresh tokens for testing
 */

import { getAuthUrl, getTokensFromCode } from '../config/gmail.js';
import { saveEmailConnection } from '../database/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectGmail() {
  console.log('\n🔐 Gmail OAuth Connection\n');
  
  // Step 1: Get authorization URL
  const authUrl = getAuthUrl();
  console.log('Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');
  
  // Step 2: Get authorization code
  const code = await new Promise((resolve) => {
    rl.question('Step 2: After authorizing, paste the code from the URL here: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (!code) {
    console.log('❌ No code provided. Exiting.');
    rl.close();
    process.exit(1);
  }
  
  try {
    // Step 3: Exchange code for tokens
    console.log('\n🔄 Exchanging code for tokens...');
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.log('❌ Failed to get tokens');
      rl.close();
      process.exit(1);
    }
    
    // Step 4: Save to database
    console.log('💾 Saving connection to database...');
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600000);
    
    await saveEmailConnection({
      userId: 'test-user',
      email: tokens.email || 'r.w.chen88@gmail.com',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt.toISOString()
    });
    
    console.log('\n✅ Gmail connected successfully!');
    console.log(`   Email: ${tokens.email || 'r.w.chen88@gmail.com'}`);
    console.log(`   Expires: ${expiresAt.toISOString()}`);
    console.log('\n🧪 You can now run E2E tests: npm run test:e2e\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  rl.close();
  process.exit(0);
}

connectGmail();
