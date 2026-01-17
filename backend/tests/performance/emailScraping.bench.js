/**
 * Performance Benchmarks for Email Scraping
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Performance Targets:
 * - Email parsing: < 100ms per email
 * - Duplicate detection: < 50ms per check
 * - Database write: < 100ms per write
 * - Full sync (100 emails): < 30 seconds
 * - API response time: < 35 seconds for 100 emails
 */

import { describe, bench, beforeEach } from 'vitest';
import { parseEmail } from '../../services/emailParser.js';
import { checkDuplicate } from '../../services/duplicateDetector.js';
import { createApplication, findDuplicateApplication } from '../../database/db.js';
import { generateJobEmail, generateApplication } from '../helpers/generators.js';

describe('Email Parsing Performance', () => {
  let sampleEmail;

  beforeEach(() => {
    sampleEmail = generateJobEmail({
      status: 'Applied',
      hasCompany: true,
      hasRole: true,
      hasLocation: true,
      format: 'html'
    });
  });

  bench('parse single email (target: < 100ms)', () => {
    parseEmail(sampleEmail);
  }, { time: 1000 });

  bench('parse 100 emails (target: < 10s)', () => {
    for (let i = 0; i < 100; i++) {
      const email = generateJobEmail({
        status: ['Applied', 'Interview', 'Offer', 'Rejected'][i % 4],
        hasCompany: true,
        hasRole: true,
        format: i % 2 === 0 ? 'html' : 'plain'
      });
      parseEmail(email);
    }
  }, { time: 15000 });
});

describe('Duplicate Detection Performance', () => {
  let testApplication;

  beforeEach(() => {
    testApplication = generateApplication({
      userId: 'bench-user-1',
      includeOptionalFields: true
    });
  });

  bench('check duplicate (target: < 50ms)', async () => {
    await checkDuplicate(testApplication);
  }, { time: 1000 });

  bench('database duplicate query (target: < 50ms)', async () => {
    await findDuplicateApplication(
      testApplication.userId,
      testApplication.company,
      testApplication.role,
      testApplication.dateApplied
    );
  }, { time: 1000 });
});

describe('Database Write Performance', () => {
  bench('write single application (target: < 100ms)', async () => {
    const app = generateApplication({
      userId: 'bench-user-2',
      includeOptionalFields: true
    });
    app.id = `bench-${Date.now()}-${Math.random()}`;
    
    try {
      await createApplication(app);
    } catch (error) {
      // Ignore duplicate errors in benchmarks
      if (!error.message.includes('UNIQUE constraint')) {
        throw error;
      }
    }
  }, { time: 2000 });

  bench('write 10 applications (target: < 1s)', async () => {
    for (let i = 0; i < 10; i++) {
      const app = generateApplication({
        userId: 'bench-user-3',
        includeOptionalFields: true
      });
      app.id = `bench-batch-${Date.now()}-${i}-${Math.random()}`;
      
      try {
        await createApplication(app);
      } catch (error) {
        // Ignore duplicate errors in benchmarks
        if (!error.message.includes('UNIQUE constraint')) {
          throw error;
        }
      }
    }
  }, { time: 5000 });
});

describe('Full Sync Workflow Performance', () => {
  bench('parse and check 100 emails (target: < 30s)', async () => {
    const results = {
      totalEmails: 100,
      jobEmails: 0,
      newApplications: 0,
      duplicates: 0,
      errors: 0
    };

    for (let i = 0; i < 100; i++) {
      try {
        // Generate email
        const email = generateJobEmail({
          status: ['Applied', 'Interview', 'Offer', 'Rejected'][i % 4],
          hasCompany: true,
          hasRole: true,
          format: i % 2 === 0 ? 'html' : 'plain'
        });

        // Parse email
        const parsed = parseEmail(email);
        if (!parsed) continue;
        
        results.jobEmails++;

        // Check duplicate
        parsed.userId = 'bench-user-4';
        const dupCheck = await checkDuplicate(parsed);
        
        if (dupCheck.isDuplicate) {
          results.duplicates++;
          continue;
        }

        // Save application
        parsed.id = `bench-sync-${Date.now()}-${i}-${Math.random()}`;
        try {
          await createApplication(parsed);
          results.newApplications++;
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint')) {
            results.errors++;
          }
        }
      } catch (error) {
        results.errors++;
      }
    }
  }, { time: 35000 });
});
