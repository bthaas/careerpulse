/**
 * Property Tests for API Endpoint Compatibility
 * 
 * Validates that API responses maintain backward compatibility
 * after OOP refactoring
 * 
 * **Validates: Requirements 10.2**
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { DatabaseService } from '../../services/DatabaseService.js';
import { AuthService } from '../../services/AuthService.js';

describe('Property 21: API Endpoint Compatibility', () => {
  let databaseService;
  let authService;
  let testUserId;

  beforeAll(async () => {
    databaseService = new DatabaseService(':memory:');
    await databaseService.initialize();
    authService = new AuthService('test-secret');
    
    // Create a test user for all tests
    testUserId = 'test-user-123';
    const hashedPassword = await authService.hashPassword('password123');
    await databaseService.createUser({
      id: testUserId,
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User'
    });
  });

  afterAll(async () => {
    await databaseService.close();
  });

  it('should return consistent application structure', async () => {
    // Requirements: 10.2
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          company: fc.string({ minLength: 2, maxLength: 100 }),
          role: fc.string({ minLength: 2, maxLength: 100 }),
          location: fc.string({ minLength: 2, maxLength: 100 }),
          status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
          dateApplied: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }).map(d => d.toISOString().split('T')[0]),
          salary: fc.option(fc.string({ minLength: 1 }), { nil: null }),
          remotePolicy: fc.option(fc.string({ minLength: 1 }), { nil: null }),
          notes: fc.option(fc.string({ minLength: 1 }), { nil: null })
        }),
        async (appData) => {
          // Create application
          const application = {
            id: `app-${Date.now()}-${Math.random()}`,
            userId: testUserId,
            company: appData.company,
            role: appData.role,
            location: appData.location,
            dateApplied: appData.dateApplied,
            lastUpdate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            status: appData.status,
            source: 'Test',
            salary: appData.salary,
            remotePolicy: appData.remotePolicy,
            notes: appData.notes,
            emailId: null,
            confidenceScore: 100,
            isDuplicate: 0
          };

          await databaseService.createApplication(application);

          // Retrieve application
          const retrieved = await databaseService.getApplicationById(application.id, testUserId);

          // Verify structure matches expected API response format
          expect(retrieved).toHaveProperty('id');
          expect(retrieved).toHaveProperty('userId');
          expect(retrieved).toHaveProperty('company');
          expect(retrieved).toHaveProperty('role');
          expect(retrieved).toHaveProperty('location');
          expect(retrieved).toHaveProperty('dateApplied');
          expect(retrieved).toHaveProperty('lastUpdate');
          expect(retrieved).toHaveProperty('createdAt');
          expect(retrieved).toHaveProperty('status');
          expect(retrieved).toHaveProperty('source');
          expect(retrieved).toHaveProperty('salary');
          expect(retrieved).toHaveProperty('remotePolicy');
          expect(retrieved).toHaveProperty('notes');
          expect(retrieved).toHaveProperty('emailId');
          expect(retrieved).toHaveProperty('confidenceScore');
          expect(retrieved).toHaveProperty('isDuplicate');

          // Verify data types
          expect(typeof retrieved.id).toBe('string');
          expect(typeof retrieved.company).toBe('string');
          expect(typeof retrieved.role).toBe('string');
          expect(['Applied', 'Interview', 'Offer', 'Rejected']).toContain(retrieved.status);
          expect(typeof retrieved.confidenceScore).toBe('number');
          expect(typeof retrieved.isDuplicate).toBe('number');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should return consistent user structure', async () => {
    // Requirements: 10.2
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 2, maxLength: 50 })
        }),
        async (userData) => {
          const userId = `user-${Date.now()}-${Math.random()}`;
          const hashedPassword = await authService.hashPassword('password123');

          await databaseService.createUser({
            id: userId,
            email: userData.email,
            password: hashedPassword,
            name: userData.name
          });

          const user = await databaseService.getUserById(userId);

          // Verify structure matches expected API response format
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('email');
          expect(user).toHaveProperty('password');
          expect(user).toHaveProperty('name');
          expect(user).toHaveProperty('created_at');

          // Verify data types
          expect(typeof user.id).toBe('string');
          expect(typeof user.email).toBe('string');
          expect(typeof user.name).toBe('string');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should return consistent JWT token structure', () => {
    // Requirements: 10.2
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress()
        }),
        (userData) => {
          const token = authService.generateToken({ userId: userData.userId, email: userData.email });

          // Verify token is a string
          expect(typeof token).toBe('string');

          // Verify token has 3 parts (header.payload.signature)
          const parts = token.split('.');
          expect(parts).toHaveLength(3);

          // Verify token can be decoded
          const decoded = authService.verifyToken(token);
          expect(decoded).not.toBeNull();
          expect(decoded.userId).toBe(userData.userId);
          expect(decoded.email).toBe(userData.email);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent error response structure', async () => {
    // Requirements: 10.2
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (invalidId) => {
          // Try to get non-existent application
          try {
            await databaseService.getApplicationById(invalidId, testUserId);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Should throw NotFoundError (consistent behavior)
            expect(error.name).toBe('NotFoundError');
            expect(error.resource).toBe('Application');
            expect(error.id).toBe(invalidId);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should return consistent list structure', async () => {
    // Requirements: 10.2
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            company: fc.string({ minLength: 3, maxLength: 50 }),
            role: fc.string({ minLength: 3, maxLength: 50 })
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (apps) => {
          const userId = `user-list-${Date.now()}-${Math.random()}`;
          
          // Create user first
          const hashedPassword = await authService.hashPassword('password123');
          await databaseService.createUser({
            id: userId,
            email: `${userId}@test.com`,
            password: hashedPassword,
            name: 'Test User'
          });

          // Create applications
          for (const app of apps) {
            await databaseService.createApplication({
              id: `app-${Date.now()}-${Math.random()}`,
              userId,
              company: app.company.trim() || 'Company',
              role: app.role.trim() || 'Role',
              location: 'Test Location',
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

          // Get all applications
          const retrieved = await databaseService.getAllApplications(userId);

          // Verify it's an array
          expect(Array.isArray(retrieved)).toBe(true);
          expect(retrieved.length).toBe(apps.length);

          // Verify each item has consistent structure
          retrieved.forEach(app => {
            expect(app).toHaveProperty('id');
            expect(app).toHaveProperty('company');
            expect(app).toHaveProperty('role');
            expect(app).toHaveProperty('status');
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});
