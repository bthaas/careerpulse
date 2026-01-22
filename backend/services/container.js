/**
 * Dependency Injection Container
 * Creates and manages singleton instances of all service classes
 * 
 * **Validates: Requirements 9.1, 9.3**
 */

import { DatabaseService } from './DatabaseService.js';
import { GmailService } from './gmailService.js';
import { LLMParser } from './llmParser.js';
import { EmailParser } from './emailParser.js';
import { DuplicateDetector } from './duplicateDetector.js';
import { AuthService } from './AuthService.js';
import { FileParserService } from './FileParserService.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Dependency Graph:
 * 
 * DatabaseService (no dependencies)
 *   └─> DuplicateDetector
 *   └─> GmailService (also needs OAuth2 config)
 * 
 * LLMParser (needs API key)
 *   └─> EmailParser
 * 
 * AuthService (needs JWT secret)
 * 
 * FileParserService (no dependencies)
 */

// ==========================================
// 1. DatabaseService - No dependencies
// ==========================================
export const databaseService = new DatabaseService();

// Initialize database on startup
await databaseService.initialize();

// ==========================================
// 2. LLMParser - Needs Gemini API key
// ==========================================
export const llmParser = new LLMParser(process.env.GOOGLE_AI_API_KEY);

// ==========================================
// 3. EmailParser - Depends on LLMParser
// ==========================================
export const emailParser = new EmailParser(llmParser);

// ==========================================
// 4. GmailService - Needs OAuth2 config
// ==========================================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const gmailService = new GmailService(oauth2Client, databaseService);

// ==========================================
// 5. DuplicateDetector - Depends on DatabaseService
// ==========================================
export const duplicateDetector = new DuplicateDetector(databaseService);

// ==========================================
// 6. AuthService - Needs JWT secret
// ==========================================
export const authService = new AuthService(process.env.JWT_SECRET || 'default-secret-change-in-production', {
  expiresIn: '7d',
  saltRounds: 10
});

// ==========================================
// 7. FileParserService - No dependencies
// ==========================================
export const fileParserService = new FileParserService();

// ==========================================
// Export all services as default object
// ==========================================
export default {
  databaseService,
  gmailService,
  emailParser,
  llmParser,
  duplicateDetector,
  authService,
  fileParserService
};

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup() {
  console.log('🧹 Cleaning up services...');
  
  try {
    await databaseService.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
  
  // Clear LLM cache
  try {
    llmParser.clearCache();
    console.log('✅ LLM cache cleared');
  } catch (error) {
    console.error('❌ Error clearing LLM cache:', error.message);
  }
  
  console.log('✅ Cleanup complete');
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});
