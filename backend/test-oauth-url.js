/**
 * Test OAuth URL generation
 */

import 'dotenv/config';
import { getAuthUrl } from './config/gmail.js';
import { generateOAuthState } from './utils/oauthState.js';

console.log('🧪 Testing OAuth URL Generation...\n');

// Generate state
const state = generateOAuthState('test-user-123', 'test@example.com');
console.log('📝 Generated State:', state);
console.log('');

// Generate auth URL
const authUrl = getAuthUrl(state);
console.log('🔗 Generated Auth URL:');
console.log(authUrl);
console.log('');

// Check if state is in URL
if (authUrl.includes(`state=${encodeURIComponent(state)}`)) {
  console.log('✅ State parameter is included in URL');
} else {
  console.log('❌ State parameter is NOT in URL');
}
