/**
 * Property-Based Tests for DatabaseService
 * Tests universal properties that should hold for all database operations
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { DatabaseService, DatabaseError, NotFoundError, DuplicateError } from '../../services/DatabaseService.js';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('DatabaseService Properties', () => {
  let dbService;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test database
    tempDir = mkdtempSync(join(tmpdir(), 'db-test-'));
    const dbPath = join(tempDir, 'test.db');
    
    dbService = new DatabaseService(dbPath);
    await dbService.initialize();
  });

  afterEach(async () => {
    await dbService.close();
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Property 1: Async/Await Support', () => {
    it('all database operations return promises', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            uniqueSuffix: fc.integer({ min: 0, max: 1000000 })
          }),
          async (userData) => {
            // Generate unique email
            const uniqueEmail = `test-${userData.uniqueSuffix}-${userData.userId}@test.com`;
            
            try {
              // Create user
              const userId = await dbService.createUser({
                ...userData,
                email: uniqueEmail
              });
              
              // Verify all operations return promises
              const getUserPromise = dbService.getUserById(userId);
              expect(getUserPromise).toBeInstanceOf(Promise);
              
              const user = await getUserPromise;
              expect(user).toBeDefined();
              expect(user.id).toBe(userId);
            } catch (error) {
              // Skip duplicates that occur during shrinking
              if (error instanceof DuplicateError) {
                return;
              }
              throw error;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 2: Transaction Consistency', () => {
    it('create then read returns same data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            uniqueSuffix: fc.integer({ min: 0, max: 1000000 })
          }),
          async (userData) => {
            const uniqueEmail = `test-${userData.uniqueSuffix}-${userData.userId}@test.com`;
            
            try {
              const userId = await dbService.createUser({
                ...userData,
                email: uniqueEmail
              });
              const retrieved = await dbService.getUserById(userId);
              
              expect(retrieved.email).toBe(uniqueEmail);
              expect(retrieved.name).toBe(userData.name);
            } catch (error) {
              // Skip duplicates that occur during shrinking
              if (error instanceof DuplicateError) {
                return;
              }
              throw error;
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 3: Error Handling', () => {
    it('throws DatabaseError for invalid operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (invalidId) => {
            try {
              await dbService.getUserById(invalidId);
              // Should throw NotFoundError
              expect(true).toBe(false); // Fail if no error thrown
            } catch (error) {
              expect(error).toBeInstanceOf(NotFoundError);
              expect(error.name).toBe('NotFoundError');
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 4: Idempotency', () => {
    it('reading same data multiple times returns consistent results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            uniqueSuffix: fc.integer({ min: 0, max: 1000000 })
          }),
          async (userData) => {
            const uniqueEmail = `test-${userData.uniqueSuffix}-${userData.userId}@test.com`;
            
            try {
              const userId = await dbService.createUser({
                ...userData,
                email: uniqueEmail
              });
              
              const read1 = await dbService.getUserById(userId);
              const read2 = await dbService.getUserById(userId);
              const read3 = await dbService.getUserById(userId);
              
              expect(read1).toEqual(read2);
              expect(read2).toEqual(read3);
            } catch (error) {
              // Skip duplicates that occur during shrinking
              if (error instanceof DuplicateError) {
                return;
              }
              throw error;
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 5: Duplicate Prevention', () => {
    it('creating duplicate users throws DuplicateError', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (userData) => {
            const uniqueId1 = `test-user-${Date.now()}-${Math.random()}`;
            const uniqueId2 = `test-user-${Date.now()}-${Math.random()}`;
            
            // Create first user
            await dbService.createUser({
              id: uniqueId1,
              ...userData
            });
            
            // Try to create duplicate
            try {
              await dbService.createUser({
                id: uniqueId2,
                ...userData // Same email
              });
              expect(true).toBe(false); // Should not reach here
            } catch (error) {
              expect(error).toBeInstanceOf(DuplicateError);
              expect(error.field).toBe('email');
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 6: Application CRUD Operations', () => {
    it('create, read, update, delete cycle works correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.string({ minLength: 1, maxLength: 100 }),
            location: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected')
          }),
          async (appData) => {
            // Create user first
            const userId = await dbService.createUser({
              id: appData.userId,
              email: `${appData.userId}@test.com`,
              name: 'Test User'
            });
            
            // Create application
            const application = {
              id: `app-${Date.now()}-${Math.random()}`,
              userId,
              company: appData.company,
              role: appData.role,
              location: appData.location,
              dateApplied: new Date().toISOString().split('T')[0],
              lastUpdate: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              status: appData.status,
              source: 'Test',
              salary: null,
              remotePolicy: null,
              notes: null,
              emailId: null,
              confidenceScore: 100,
              isDuplicate: 0
            };
            
            await dbService.createApplication(application);
            
            // Read
            const retrieved = await dbService.getApplicationById(application.id, userId);
            expect(retrieved.company).toBe(appData.company);
            
            // Update
            await dbService.updateApplication(application.id, userId, { 
              status: 'Interview' 
            });
            const updated = await dbService.getApplicationById(application.id, userId);
            expect(updated.status).toBe('Interview');
            
            // Delete
            await dbService.deleteApplication(application.id, userId);
            
            try {
              await dbService.getApplicationById(application.id, userId);
              expect(true).toBe(false); // Should throw
            } catch (error) {
              expect(error).toBeInstanceOf(NotFoundError);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 7: Initialization Requirement', () => {
    it('operations fail before initialization', async () => {
      const uninitializedDb = new DatabaseService(join(tempDir, 'uninit.db'));
      
      try {
        await uninitializedDb.getUserById('test');
        expect(true).toBe(false); // Should throw
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toContain('not initialized');
      }
    });
  });
});
