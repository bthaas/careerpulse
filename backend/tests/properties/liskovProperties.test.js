/**
 * Property Tests for Liskov Substitution Principle
 * 
 * Validates that derived classes can substitute base classes
 * without breaking functionality
 * 
 * **Validates: Requirements 14.3**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { DatabaseService } from '../../services/DatabaseService.js';

describe('Property 24: Liskov Substitution Principle', () => {
  it('should allow DatabaseService subclasses to substitute base class', async () => {
    // Requirements: 14.3
    
    // Create a derived class that extends DatabaseService
    class TestDatabaseService extends DatabaseService {
      constructor(dbPath = ':memory:') {
        super(dbPath);
        this.testFlag = true;
      }

      // Override method with additional logging
      async createApplication(application) {
        // Add test-specific behavior
        const result = await super.createApplication(application);
        return result;
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          company: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (appData) => {
          const baseService = new DatabaseService(':memory:');
          const derivedService = new TestDatabaseService(':memory:');

          await baseService.initialize();
          await derivedService.initialize();

          const application = {
            id: `app-${Date.now()}-${Math.random()}`,
            userId: 'test-user',
            company: appData.company,
            role: appData.role,
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
          };

          // Both should work the same way
          await baseService.createApplication(application);
          await derivedService.createApplication({ ...application, id: `${application.id}-2` });

          const baseResult = await baseService.getApplicationById(application.id, 'test-user');
          const derivedResult = await derivedService.getApplicationById(`${application.id}-2`, 'test-user');

          // Both should return valid results with same structure
          expect(baseResult).not.toBeNull();
          expect(derivedResult).not.toBeNull();
          expect(baseResult.company).toBe(appData.company);
          expect(derivedResult.company).toBe(appData.company);

          await baseService.close();
          await derivedService.close();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain interface contracts in derived classes', async () => {
    // Requirements: 14.3
    
    class ExtendedDatabaseService extends DatabaseService {
      // Add new method without breaking existing ones
      async getApplicationCount(userId) {
        const apps = await this.getAllApplications(userId);
        return apps.length;
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            company: fc.string({ minLength: 1, maxLength: 30 }),
            role: fc.string({ minLength: 1, maxLength: 30 })
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (apps) => {
          const service = new ExtendedDatabaseService(':memory:');
          await service.initialize();

          const userId = 'test-user';

          // Create applications
          for (const app of apps) {
            await service.createApplication({
              id: `app-${Date.now()}-${Math.random()}`,
              userId,
              company: app.company,
              role: app.role,
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
          }

          // Base class method should work
          const allApps = await service.getAllApplications(userId);
          expect(Array.isArray(allApps)).toBe(true);

          // New method should work
          const count = await service.getApplicationCount(userId);
          expect(count).toBe(apps.length);

          await service.close();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should preserve preconditions and postconditions', async () => {
    // Requirements: 14.3
    
    class StrictDatabaseService extends DatabaseService {
      async createApplication(application) {
        // Precondition: application must have required fields
        if (!application.company || !application.role) {
          throw new Error('Missing required fields');
        }

        // Call base implementation
        const result = await super.createApplication(application);

        // Postcondition: result should be successful
        return result;
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          company: fc.string({ minLength: 1 }),
          role: fc.string({ minLength: 1 })
        }),
        async (appData) => {
          const service = new StrictDatabaseService(':memory:');
          await service.initialize();

          const application = {
            id: `app-${Date.now()}-${Math.random()}`,
            userId: 'test-user',
            company: appData.company,
            role: appData.role,
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
          };

          // Should work with valid data
          await service.createApplication(application);

          const retrieved = await service.getApplicationById(application.id, 'test-user');
          expect(retrieved).not.toBeNull();
          expect(retrieved.company).toBe(appData.company);

          await service.close();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow polymorphic usage of service instances', async () => {
    // Requirements: 14.3
    
    // Function that accepts any DatabaseService
    async function processWithService(service, userId) {
      const apps = await service.getAllApplications(userId);
      return apps.length;
    }

    class CustomDatabaseService extends DatabaseService {
      constructor() {
        super(':memory:');
        this.customProperty = 'custom';
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (userId) => {
          const baseService = new DatabaseService(':memory:');
          const customService = new CustomDatabaseService();

          await baseService.initialize();
          await customService.initialize();

          // Both should work with the same function
          const baseCount = await processWithService(baseService, userId);
          const customCount = await processWithService(customService, userId);

          // Both should return valid counts
          expect(typeof baseCount).toBe('number');
          expect(typeof customCount).toBe('number');
          expect(baseCount).toBeGreaterThanOrEqual(0);
          expect(customCount).toBeGreaterThanOrEqual(0);

          await baseService.close();
          await customService.close();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain behavioral consistency across inheritance', async () => {
    // Requirements: 14.3
    
    class LoggingDatabaseService extends DatabaseService {
      constructor() {
        super(':memory:');
        this.logs = [];
      }

      async createApplication(application) {
        this.logs.push(`Creating: ${application.company}`);
        return super.createApplication(application);
      }

      async getAllApplications(userId) {
        this.logs.push(`Getting all for: ${userId}`);
        return super.getAllApplications(userId);
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          company: fc.string({ minLength: 1, maxLength: 30 }),
          userId: fc.string({ minLength: 1, maxLength: 20 })
        }),
        async (data) => {
          const service = new LoggingDatabaseService();
          await service.initialize();

          const application = {
            id: `app-${Date.now()}-${Math.random()}`,
            userId: data.userId,
            company: data.company,
            role: 'Test Role',
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
          };

          // Create and retrieve
          await service.createApplication(application);
          const apps = await service.getAllApplications(data.userId);

          // Behavior should be consistent with base class
          expect(apps).toBeInstanceOf(Array);
          expect(apps.length).toBeGreaterThan(0);

          // Additional logging behavior should not break functionality
          expect(service.logs.length).toBeGreaterThan(0);

          await service.close();
        }
      ),
      { numRuns: 20 }
    );
  });
});
