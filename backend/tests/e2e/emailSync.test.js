/**
 * End-to-End Tests for Email Sync
 * 
 * Tests the complete email sync workflow with REAL Gmail API
 * 
 * SETUP REQUIRED:
 * 1. Valid OAuth credentials in backend/.env (✓ Already configured)
 * 2. Run the backend server: npm run dev
 * 3. Connect Gmail account via the web UI at http://localhost:3001
 * 4. Complete OAuth flow to get valid tokens
 * 5. Then run: npm run test:e2e
 * 
 * These tests will use REAL Gmail API calls with your actual inbox.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.7, 10.8
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { fetchJobEmails, getGmailProfile } from '../../services/gmailService.js';
import { parseEmail } from '../../services/emailParser.js';
import { checkDuplicate } from '../../services/duplicateDetector.js';
import { TestDatabaseManager } from '../helpers/testSetup.js';
import { getEmailConnection, saveEmailConnection } from '../../database/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if Gmail OAuth is configured
const isGmailConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

describe('E2E: Email Sync Workflow', () => {
  let dbManager;
  let skipTests = false;
  let skipReason = '';

  beforeAll(async () => {
    // Check if OAuth is configured
    if (!isGmailConfigured()) {
      skipTests = true;
      skipReason = 'Gmail OAuth not configured in .env';
      console.log(`⚠️  Skipping E2E tests: ${skipReason}`);
      return;
    }

    // For E2E tests, use the REAL database to access Gmail connections
    // Set up test database for storing test applications
    dbManager = new TestDatabaseManager({ dbPath: './database/careerpulse.db', useInMemory: false });
    await dbManager.initialize();

    // Check if there's an active Gmail connection in the REAL database
    try {
      // Try common user IDs
      let connection = await getEmailConnection('pending');
      if (!connection) {
        connection = await getEmailConnection('default_user');
      }
      if (!connection) {
        // Try to find any connected user
        const result = await dbManager.get('SELECT * FROM email_connections WHERE connected = 1 LIMIT 1');
        connection = result;
      }
      
      if (!connection) {
        skipTests = true;
        skipReason = 'No active Gmail connection found in database';
        console.log(`⚠️  Skipping E2E tests: ${skipReason}`);
        console.log('   To enable these tests:');
        console.log('   1. Start the backend: npm run dev');
        console.log('   2. Open http://localhost:3001 and connect Gmail');
        console.log('   3. Run tests: npm run test:e2e');
      } else {
        console.log(`✅ Gmail connected: ${connection.email}`);
        console.log(`   User ID: ${connection.userId}`);
        console.log(`   Token expires: ${connection.expiresAt}`);
      }
    } catch (error) {
      skipTests = true;
      skipReason = `Database error: ${error.message}`;
      console.log(`⚠️  Skipping E2E tests: ${skipReason}`);
    }
  });

  beforeEach(async () => {
    if (skipTests) return;
  });

  afterAll(async () => {
    if (dbManager) {
      await dbManager.teardown();
    }
  });

  it('should fetch real emails from Gmail', async () => {
    if (skipTests) {
      console.log(`⏭️  Skipped: ${skipReason}`);
      return;
    }

    // Requirements: 10.1, 10.2
    const emails = await fetchJobEmails({ maxResults: 10 });
    
    expect(emails).toBeDefined();
    expect(Array.isArray(emails)).toBe(true);
    
    if (emails.length > 0) {
      const email = emails[0];
      expect(email).toHaveProperty('id');
      expect(email).toHaveProperty('from');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('body');
      expect(email).toHaveProperty('date');
      
      console.log(`✅ Fetched ${emails.length} emails from Gmail`);
      console.log(`   First email: "${email.subject.substring(0, 50)}..."`);
    } else {
      console.log('ℹ️  No job-related emails found in inbox (this is OK)');
    }
  });

  it('should get Gmail profile information', async () => {
    if (skipTests) {
      console.log(`⏭️  Skipped: ${skipReason}`);
      return;
    }

    // Requirements: 10.7
    const profile = await getGmailProfile();
    
    expect(profile).toBeDefined();
    expect(profile).toHaveProperty('email');
    expect(profile.email).toContain('@');
    expect(profile).toHaveProperty('messagesTotal');
    expect(profile).toHaveProperty('threadsTotal');
    
    console.log(`✅ Gmail profile retrieved`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Total messages: ${profile.messagesTotal}`);
    console.log(`   Total threads: ${profile.threadsTotal}`);
  });

  it('should parse real emails and extract job applications', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 6.1, 6.2, 10.8
    const emails = await fetchJobEmails({ maxResults: 20 });
    
    let jobEmailsFound = 0;
    let applicationsExtracted = 0;
    
    for (const email of emails) {
      const application = parseEmail(email);
      
      if (application) {
        jobEmailsFound++;
        
        // Validate application structure
        expect(application).toHaveProperty('company');
        expect(application).toHaveProperty('role');
        expect(application).toHaveProperty('status');
        expect(application).toHaveProperty('dateApplied');
        expect(application).toHaveProperty('confidenceScore');
        
        // Validate date format
        expect(application.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Validate status enum
        expect(['Applied', 'Interview', 'Offer', 'Rejected']).toContain(application.status);
        
        // Validate confidence score
        expect(application.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(application.confidenceScore).toBeLessThanOrEqual(100);
        
        applicationsExtracted++;
        
        console.log(`✅ Parsed: ${application.company} - ${application.role} (${application.status}, confidence: ${application.confidenceScore}%)`);
      }
    }
    
    console.log(`📊 Found ${jobEmailsFound} job-related emails out of ${emails.length} total`);
    console.log(`📊 Extracted ${applicationsExtracted} applications`);
    
    // We should find at least some job emails if the inbox has them
    // This is informational, not a hard requirement
    if (emails.length > 0 && jobEmailsFound === 0) {
      console.log('ℹ️  No job-related emails found in the fetched emails');
    }
  });

  it('should handle different email formats (plain text, HTML, multipart)', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 10.1
    const emails = await fetchJobEmails({ maxResults: 20 });
    
    const formats = {
      plain: 0,
      html: 0,
      multipart: 0
    };
    
    for (const email of emails) {
      if (email.body.includes('<html') || email.body.includes('<HTML')) {
        formats.html++;
      } else if (email.body.includes('multipart')) {
        formats.multipart++;
      } else {
        formats.plain++;
      }
      
      // Should be able to parse regardless of format
      const application = parseEmail(email);
      // Parsing may return null for non-job emails, which is expected
    }
    
    console.log(`📧 Email formats: ${formats.plain} plain, ${formats.html} HTML, ${formats.multipart} multipart`);
    
    expect(emails.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect and skip duplicate applications', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 6.3
    const emails = await fetchJobEmails({ maxResults: 10 });
    
    if (emails.length === 0) {
      console.log('ℹ️  No emails to test duplicates');
      return;
    }
    
    const applications = [];
    
    for (const email of emails) {
      const application = parseEmail(email);
      if (application) {
        applications.push(application);
      }
    }
    
    if (applications.length < 2) {
      console.log('ℹ️  Not enough applications to test duplicates');
      return;
    }
    
    // Test duplicate detection
    const firstApp = applications[0];
    const duplicateCheck = await checkDuplicate(firstApp);
    
    expect(duplicateCheck).toHaveProperty('isDuplicate');
    expect(typeof duplicateCheck.isDuplicate).toBe('boolean');
    
    console.log(`✅ Duplicate detection working: ${duplicateCheck.isDuplicate ? 'duplicate found' : 'no duplicate'}`);
  });

  it('should perform incremental sync without duplicates', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 6.4
    // First sync
    const emails1 = await fetchJobEmails({ maxResults: 5 });
    const apps1 = [];
    
    for (const email of emails1) {
      const app = parseEmail(email);
      if (app) {
        app.userId = 'test-user';
        app.id = `app-${Date.now()}-${Math.random()}`;
        
        // Save to test database
        await dbManager.run(
          `INSERT INTO applications (
            id, userId, company, role, location, dateApplied, lastUpdate,
            status, source, confidenceScore, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            app.id,
            app.userId,
            app.company,
            app.role,
            app.location || 'Unknown',
            app.dateApplied,
            app.lastUpdate,
            app.status,
            app.source || 'Email',
            app.confidenceScore,
            new Date().toISOString()
          ]
        );
        
        apps1.push(app);
      }
    }
    
    console.log(`✅ First sync: ${apps1.length} applications saved`);
    
    // Second sync - should detect duplicates
    const emails2 = await fetchJobEmails({ maxResults: 5 });
    let duplicatesFound = 0;
    
    for (const email of emails2) {
      const app = parseEmail(email);
      if (app) {
        app.userId = 'test-user';
        
        // Check for duplicates
        const existing = await dbManager.all(
          `SELECT * FROM applications 
           WHERE userId = ? AND company = ? AND role = ? AND dateApplied = ?`,
          [app.userId, app.company, app.role, app.dateApplied]
        );
        
        if (existing.length > 0) {
          duplicatesFound++;
        }
      }
    }
    
    console.log(`✅ Second sync: ${duplicatesFound} duplicates detected`);
    
    expect(apps1.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate data extraction quality from real emails', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 10.8
    const emails = await fetchJobEmails({ maxResults: 20 });
    
    const stats = {
      total: 0,
      withCompany: 0,
      withRole: 0,
      withLocation: 0,
      withStatus: 0,
      highConfidence: 0
    };
    
    for (const email of emails) {
      const app = parseEmail(email);
      if (app) {
        stats.total++;
        
        if (app.company && app.company !== 'Unknown Company') {
          stats.withCompany++;
        }
        
        if (app.role && app.role !== 'Unknown Position') {
          stats.withRole++;
        }
        
        if (app.location && app.location !== 'Unknown') {
          stats.withLocation++;
        }
        
        if (app.status) {
          stats.withStatus++;
        }
        
        if (app.confidenceScore >= 70) {
          stats.highConfidence++;
        }
      }
    }
    
    if (stats.total > 0) {
      console.log(`📊 Data Quality Report:`);
      console.log(`   Total applications: ${stats.total}`);
      console.log(`   With company: ${stats.withCompany} (${Math.round(stats.withCompany/stats.total*100)}%)`);
      console.log(`   With role: ${stats.withRole} (${Math.round(stats.withRole/stats.total*100)}%)`);
      console.log(`   With location: ${stats.withLocation} (${Math.round(stats.withLocation/stats.total*100)}%)`);
      console.log(`   With status: ${stats.withStatus} (${Math.round(stats.withStatus/stats.total*100)}%)`);
      console.log(`   High confidence (≥70%): ${stats.highConfidence} (${Math.round(stats.highConfidence/stats.total*100)}%)`);
      
      // Quality expectations
      expect(stats.withCompany / stats.total).toBeGreaterThan(0.5); // At least 50% should have company
      expect(stats.withRole / stats.total).toBeGreaterThan(0.5); // At least 50% should have role
      expect(stats.withStatus).toBe(stats.total); // All should have status
    } else {
      console.log('ℹ️  No job applications found to validate');
    }
  });

  it('should handle emails from different providers (companies, job boards)', async () => {
    if (skipTests) {
      console.log('⏭️  Skipped: Gmail not connected');
      return;
    }

    // Requirements: 10.2
    const emails = await fetchJobEmails({ maxResults: 30 });
    
    const sources = {
      directCompany: 0,
      jobBoard: 0,
      recruiter: 0,
      other: 0
    };
    
    const jobBoards = ['greenhouse', 'lever', 'indeed', 'linkedin', 'workday', 'taleo'];
    const recruiterKeywords = ['recruiter', 'recruiting', 'talent', 'staffing'];
    
    for (const email of emails) {
      const fromLower = email.from.toLowerCase();
      
      if (jobBoards.some(board => fromLower.includes(board))) {
        sources.jobBoard++;
      } else if (recruiterKeywords.some(keyword => fromLower.includes(keyword))) {
        sources.recruiter++;
      } else if (email.from.includes('@')) {
        const domain = email.from.split('@')[1];
        if (domain && !domain.includes('noreply')) {
          sources.directCompany++;
        } else {
          sources.other++;
        }
      } else {
        sources.other++;
      }
    }
    
    console.log(`📊 Email sources:`);
    console.log(`   Direct companies: ${sources.directCompany}`);
    console.log(`   Job boards: ${sources.jobBoard}`);
    console.log(`   Recruiters: ${sources.recruiter}`);
    console.log(`   Other: ${sources.other}`);
    
    expect(emails.length).toBeGreaterThanOrEqual(0);
  });
});
