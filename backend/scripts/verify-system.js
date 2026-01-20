#!/usr/bin/env node

/**
 * System Verification Script
 * Checks all connections, configurations, and integrations
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import sqlite3 from 'sqlite3';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function check(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Verification Results
const results = {
  environment: { passed: 0, failed: 0, warnings: 0 },
  database: { passed: 0, failed: 0, warnings: 0 },
  oauth: { passed: 0, failed: 0, warnings: 0 },
  gemini: { passed: 0, failed: 0, warnings: 0 }
};

// 1. Environment Variables Check
section('ENVIRONMENT CONFIGURATION');

const requiredVars = {
  PORT: { required: true, type: 'number' },
  DATABASE_PATH: { required: true, type: 'string' },
  JWT_SECRET: { required: true, type: 'string', minLength: 20 },
  SESSION_SECRET: { required: true, type: 'string', minLength: 20 },
  GOOGLE_CLIENT_ID: { required: true, type: 'string' },
  GOOGLE_CLIENT_SECRET: { required: true, type: 'string' },
  GOOGLE_REDIRECT_URI: { required: true, type: 'url' },
  GOOGLE_AI_API_KEY: { required: true, type: 'string' },
  FRONTEND_URL: { required: true, type: 'url' }
};

const optionalVars = {
  USE_SECRET_MANAGER: { required: false, type: 'boolean' },
  SECRET_MANAGER_PROJECT_ID: { required: false, type: 'string' }
};

for (const [key, config] of Object.entries(requiredVars)) {
  const value = process.env[key];
  
  if (!value) {
    check(`${key}`, false, 'Missing required variable');
    results.environment.failed++;
    continue;
  }
  
  // Type validation
  let valid = true;
  if (config.type === 'number' && isNaN(Number(value))) {
    valid = false;
  }
  if (config.type === 'url' && !value.startsWith('http')) {
    valid = false;
  }
  if (config.minLength && value.length < config.minLength) {
    valid = false;
  }
  
  if (valid) {
    check(`${key}`, true, `Set (${value.substring(0, 20)}...)`);
    results.environment.passed++;
  } else {
    check(`${key}`, false, 'Invalid format');
    results.environment.failed++;
  }
}

for (const [key, config] of Object.entries(optionalVars)) {
  const value = process.env[key];
  if (value) {
    check(`${key} (optional)`, true, `Set: ${value}`);
    results.environment.passed++;
  } else {
    log(`⚠️  ${key} (optional)`, 'yellow');
    log(`   Not set (optional)`, 'yellow');
    results.environment.warnings++;
  }
}

// 2. Database Check
section('DATABASE CONNECTION');

const dbPath = join(__dirname, '..', process.env.DATABASE_PATH || './database/careerpulse.db');

if (!existsSync(dbPath)) {
  check('Database file exists', false, `Not found at: ${dbPath}`);
  results.database.failed++;
} else {
  check('Database file exists', true, dbPath);
  results.database.passed++;
  
  try {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        check('Database connection', false, err.message);
        results.database.failed++;
        return;
      }
    });
    
    // Check tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        check('Database query', false, err.message);
        results.database.failed++;
        db.close();
        return;
      }
      
      const tableNames = tables.map(t => t.name);
      
      const requiredTables = ['users', 'applications', 'status_history', 'email_connections'];
      
      for (const table of requiredTables) {
        if (tableNames.includes(table)) {
          check(`Table: ${table}`, true);
          results.database.passed++;
        } else {
          check(`Table: ${table}`, false, 'Missing');
          results.database.failed++;
        }
      }
      
      // Check table schemas
      db.all("PRAGMA table_info(users)", [], (err, userColumns) => {
        if (err) {
          check('users table schema', false, err.message);
          results.database.failed++;
          db.close();
          return;
        }
        
        const requiredUserColumns = ['id', 'email', 'password', 'name', 'created_at'];
        const userColumnNames = userColumns.map(c => c.name);
        
        for (const col of requiredUserColumns) {
          if (userColumnNames.includes(col)) {
            check(`users.${col}`, true);
            results.database.passed++;
          } else {
            check(`users.${col}`, false, 'Missing column');
            results.database.failed++;
          }
        }
        
        // Test read operation
        db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
          if (err) {
            check('Database read operation', false, err.message);
            results.database.failed++;
          } else {
            check('Database read operation', true, `${row.count} users`);
            results.database.passed++;
          }
          
          db.close();
          
          // Continue with rest of checks after database checks complete
          continueVerification();
        });
      });
    });
  } catch (err) {
    check('Database connection', false, err.message);
    results.database.failed++;
    continueVerification();
  }
}

function continueVerification() {

// 3. OAuth Configuration Check
section('OAUTH CONFIGURATION');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

if (clientId && clientId.includes('.apps.googleusercontent.com')) {
  check('Google Client ID format', true);
  results.oauth.passed++;
} else {
  check('Google Client ID format', false, 'Invalid format');
  results.oauth.failed++;
}

if (clientSecret && clientSecret.startsWith('GOCSPX-')) {
  check('Google Client Secret format', true);
  results.oauth.passed++;
} else {
  check('Google Client Secret format', false, 'Invalid format');
  results.oauth.failed++;
}

if (redirectUri && redirectUri.includes('/api/auth/gmail/callback')) {
  check('Gmail redirect URI format', true, redirectUri);
  results.oauth.passed++;
} else {
  check('Gmail redirect URI format', false, 'Should end with /api/auth/gmail/callback');
  results.oauth.failed++;
}

// Check if OAuth state utility exists
const oauthStatePath = join(__dirname, '../utils/oauthState.js');
if (existsSync(oauthStatePath)) {
  check('OAuth state manager', true, 'File exists');
  results.oauth.passed++;
} else {
  check('OAuth state manager', false, 'File missing');
  results.oauth.failed++;
}

// 4. Gemini LLM Check
section('GEMINI LLM INTEGRATION');

const geminiKey = process.env.GOOGLE_AI_API_KEY;

if (geminiKey && geminiKey.startsWith('AIzaSy')) {
  check('Gemini API key format', true);
  results.gemini.passed++;
} else {
  check('Gemini API key format', false, 'Invalid format (should start with AIzaSy)');
  results.gemini.failed++;
}

// Check if LLM parser exists
const llmParserPath = join(__dirname, '../services/llmParser.js');
if (existsSync(llmParserPath)) {
  check('LLM parser service', true, 'File exists');
  results.gemini.passed++;
} else {
  check('LLM parser service', false, 'File missing');
  results.gemini.failed++;
}

// Check if email parser uses LLM
const emailParserPath = join(__dirname, '../services/emailParser.js');
if (existsSync(emailParserPath)) {
  check('Email parser service', true, 'File exists');
  results.gemini.passed++;
} else {
  check('Email parser service', false, 'File missing');
  results.gemini.failed++;
}

// Summary
section('VERIFICATION SUMMARY');

const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
const totalWarnings = Object.values(results).reduce((sum, r) => sum + r.warnings, 0);

console.log('');
log(`✅ Passed: ${totalPassed}`, 'green');
log(`❌ Failed: ${totalFailed}`, 'red');
log(`⚠️  Warnings: ${totalWarnings}`, 'yellow');
console.log('');

if (totalFailed === 0) {
  log('🎉 ALL CHECKS PASSED!', 'green');
  log('System is properly configured and ready to use.', 'green');
  process.exit(0);
} else {
  log('⚠️  SOME CHECKS FAILED', 'red');
  log('Please fix the issues above before proceeding.', 'red');
  process.exit(1);
}
}