/**
 * Quick Gmail OAuth Connection
 * Opens browser and waits for callback
 */

import { getAuthUrl } from '../config/gmail.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function quickConnect() {
  console.log('\n🔐 Quick Gmail OAuth Connection\n');
  
  // Get authorization URL
  const authUrl = getAuthUrl();
  
  console.log('Opening browser for OAuth...\n');
  console.log('If browser doesn\'t open, visit this URL:');
  console.log(authUrl);
  console.log('\n');
  
  // Open browser (works on macOS, Linux, Windows)
  try {
    if (process.platform === 'darwin') {
      await execAsync(`open "${authUrl}"`);
    } else if (process.platform === 'win32') {
      await execAsync(`start "${authUrl}"`);
    } else {
      await execAsync(`xdg-open "${authUrl}"`);
    }
  } catch (err) {
    console.log('Could not open browser automatically. Please open the URL manually.');
  }
  
  console.log('✅ After authorizing in the browser, the backend will save your tokens automatically.');
  console.log('   Check the backend server logs to confirm connection.');
  console.log('\n🧪 Once connected, run: npm run test:e2e\n');
}

quickConnect();
