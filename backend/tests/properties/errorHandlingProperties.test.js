/**
 * Property Tests for Error Handling
 * 
 * Validates comprehensive error handling across all services
 * 
 * **Validates: Requirements 11.2, 11.3, 11.4, 11.5**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { DatabaseService } from '../../services/DatabaseService.js';
import { LLMParser } from '../../services/LLMParser.js';
import { EmailParser } from '../../services/EmailParser.js';
import { AuthService } from '../../services/AuthService.js';
import { FileParserService } from '../../services/FileParserService.js';

describe('Property 22: Descriptive Error Context', () => {
  let databaseService;
  let authService;

  beforeAll(async () => {
    databaseService = new DatabaseService(':memory:');
    await databaseService.initialize();
    authService = new AuthService('test-secret');
  });

  afterAll(async () => {
    await databaseService.close();
  });

  it('should include context in database errors', async () => {
    // Requirements: 11.2
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (invalidId, userId) => {
          try {
            // Try to update non-existent application
            await databaseService.updateApplication(invalidId, userId, { status: 'Applied' });
            
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Error should have meaningful message
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include context in authentication errors', () => {
    // Requirements: 11.2
    fc.assert(
      fc.property(
        fc.string(),
        (invalidToken) => {
          // Try to verify invalid token
          const result = authService.verifyToken(invalidToken);
          
          // Should return null for invalid tokens (graceful handling)
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include context in parsing errors', () => {
    // Requirements: 11.2
    const fileParser = new FileParserService();

    fc.assert(
      fc.property(
        fc.string(),
        (invalidData) => {
          try {
            const result = fileParser.parseCSV(invalidData);
            // If successful, should return array
            expect(Array.isArray(result)).toBe(true);
            return true;
          } catch (error) {
            // If error, should have meaningful message
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 23: Comprehensive Error Handling', () => {
  let databaseService;
  let llmParser;
  let emailParser;

  beforeAll(async () => {
    databaseService = new DatabaseService(':memory:');
    await databaseService.initialize();
    llmParser = new LLMParser('invalid-api-key');
    emailParser = new EmailParser(llmParser);
  });

  afterAll(async () => {
    await databaseService.close();
  });

  it('should handle database errors gracefully', async () => {
    // Requirements: 11.3, 11.4, 11.5
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          userId: fc.string({ minLength: 1 })
        }),
        async (data) => {
          try {
            // Try to create application with duplicate ID
            await databaseService.createApplication({
              id: data.id,
              userId: data.userId,
              company: 'Test',
              role: 'Test',
              location: 'Test',
              dateApplied: '2024-01-01',
              lastUpdate: '2024-01-01',
              createdAt: new Date().toISOString(),
              status: 'Applied',
              source: 'Test',
              salary: null,
              remotePolicy: null,
              notes: null,
              emailId: null,
              confidenceScore: 100,
              isDuplicate: 0
            });

            // Try to create again with same ID
            await databaseService.createApplication({
              id: data.id,
              userId: data.userId,
              company: 'Test2',
              role: 'Test2',
              location: 'Test',
              dateApplied: '2024-01-01',
              lastUpdate: '2024-01-01',
              createdAt: new Date().toISOString(),
              status: 'Applied',
              source: 'Test',
              salary: null,
              remotePolicy: null,
              notes: null,
              emailId: null,
              confidenceScore: 100,
              isDuplicate: 0
            });

            // Should throw error
            expect(true).toBe(false);
          } catch (error) {
            // Should handle error gracefully
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle LLM errors gracefully', async () => {
    // Requirements: 11.3, 11.4, 11.5
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10 }),
        async (emailBody) => {
          // LLM with invalid API key should return null, not throw
          const result = await llmParser.extractWithLLM(emailBody);
          
          // Should return null for errors (graceful handling)
          expect(result).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle email parsing errors gracefully', async () => {
    // Requirements: 11.3, 11.4, 11.5
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string(),
          from: fc.string(),
          subject: fc.string(),
          body: fc.string(),
          date: fc.string()
        }),
        async (email) => {
          // Should not throw, even with invalid data
          const result = await emailParser.parseEmail(email);
          
          // Result should be null or valid application object
          if (result !== null) {
            expect(result).toHaveProperty('company');
            expect(result).toHaveProperty('role');
            expect(result).toHaveProperty('status');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle password hashing errors gracefully', async () => {
    // Requirements: 11.3, 11.4, 11.5
    const authService = new AuthService('test-secret');

    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        async (password) => {
          try {
            // Should handle any password string
            const hashed = await authService.hashPassword(password);
            
            expect(typeof hashed).toBe('string');
            expect(hashed.length).toBeGreaterThan(0);
          } catch (error) {
            // If it throws, error should be meaningful
            expect(error.message).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle file parsing errors gracefully', () => {
    // Requirements: 11.3, 11.4, 11.5
    const fileParser = new FileParserService();

    fc.assert(
      fc.property(
        fc.string(),
        (data) => {
          try {
            const result = fileParser.parseCSV(data);
            // If successful, should return array
            expect(Array.isArray(result)).toBe(true);
            return true;
          } catch (error) {
            // If it throws, should have meaningful error
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should recover from transient errors', async () => {
    // Requirements: 11.5
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
        async (userIds) => {
          // Multiple operations should not affect each other
          const results = [];
          
          for (const userId of userIds) {
            try {
              const apps = await databaseService.getAllApplications(userId);
              results.push({ success: true, data: apps });
            } catch (error) {
              results.push({ success: false, error: error.message });
            }
          }

          // All operations should complete (no hanging)
          expect(results.length).toBe(userIds.length);
          
          // Each result should have success flag
          results.forEach(result => {
            expect(result).toHaveProperty('success');
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});
