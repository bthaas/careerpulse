/**
 * Property-Based Tests for DuplicateDetector
 * Tests universal properties that should hold for duplicate detection
 * 
 * **Validates: Requirements 5.5, 5.6**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { DuplicateDetector } from '../../services/duplicateDetector.js';

describe('DuplicateDetector Properties', () => {
  let duplicateDetector;
  let mockDatabaseService;

  beforeEach(() => {
    mockDatabaseService = {
      findDuplicateApplication: vi.fn(),
      getAllApplications: vi.fn()
    };
    duplicateDetector = new DuplicateDetector(mockDatabaseService);
  });

  describe('Property 10: Database Service Delegation', () => {
    it('delegates to DatabaseService for duplicate checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 }),
            dateApplied: fc.date().map(d => d.toISOString().split('T')[0])
          }),
          async (application) => {
            // Mock database to return no duplicate
            mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);

            // Check duplicate
            await duplicateDetector.checkDuplicate(application);

            // Verify DatabaseService was called
            expect(mockDatabaseService.findDuplicateApplication).toHaveBeenCalledWith(
              application.userId,
              application.company,
              application.role,
              application.dateApplied
            );
          }
        ),
        { numRuns: 15 }
      );
    });

    it('delegates to DatabaseService for finding similar applications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 })
          }),
          async (application) => {
            // Mock database to return empty array
            mockDatabaseService.getAllApplications.mockResolvedValue([]);

            // Find similar applications
            await duplicateDetector.findSimilarApplications(application);

            // Verify DatabaseService was called
            expect(mockDatabaseService.getAllApplications).toHaveBeenCalledWith(
              application.userId
            );
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Property 11: Duplicate Result Structure', () => {
    it('returns result with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 }),
            dateApplied: fc.date().map(d => d.toISOString().split('T')[0])
          }),
          async (application) => {
            // Mock database to return no duplicate
            mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);

            const result = await duplicateDetector.checkDuplicate(application);

            // Verify result structure
            expect(result).toHaveProperty('isDuplicate');
            expect(result).toHaveProperty('duplicateId');
            expect(result).toHaveProperty('similarity');
            expect(result).toHaveProperty('reason');

            // Verify types
            expect(typeof result.isDuplicate).toBe('boolean');
            expect(result.duplicateId === null || typeof result.duplicateId === 'string').toBe(true);
            expect(typeof result.similarity).toBe('number');
            expect(result.reason === null || typeof result.reason === 'string').toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('returns isDuplicate=true with duplicateId when match found', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 }),
            dateApplied: fc.date().map(d => d.toISOString().split('T')[0]),
            duplicateId: fc.uuid()
          }),
          async (data) => {
            // Mock database to return a duplicate
            mockDatabaseService.findDuplicateApplication.mockResolvedValue({
              id: data.duplicateId,
              company: data.company,
              role: data.role
            });

            const result = await duplicateDetector.checkDuplicate({
              userId: data.userId,
              company: data.company,
              role: data.role,
              dateApplied: data.dateApplied
            });

            // Verify duplicate found
            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateId).toBe(data.duplicateId);
            expect(result.similarity).toBe(1.0);
            expect(result.reason).toBeTruthy();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('returns isDuplicate=false with null duplicateId when no match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 }),
            dateApplied: fc.date().map(d => d.toISOString().split('T')[0])
          }),
          async (application) => {
            // Mock database to return no duplicate
            mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);

            const result = await duplicateDetector.checkDuplicate(application);

            // Verify no duplicate
            expect(result.isDuplicate).toBe(false);
            expect(result.duplicateId).toBeNull();
            expect(result.similarity).toBe(0);
            expect(result.reason).toBeNull();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('returns similarity between 0 and 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            role: fc.string({ minLength: 2, maxLength: 50 }),
            dateApplied: fc.date().map(d => d.toISOString().split('T')[0]),
            hasDuplicate: fc.boolean()
          }),
          async (data) => {
            if (data.hasDuplicate) {
              mockDatabaseService.findDuplicateApplication.mockResolvedValue({
                id: 'dup-id',
                company: data.company,
                role: data.role
              });
            } else {
              mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);
            }

            const result = await duplicateDetector.checkDuplicate({
              userId: data.userId,
              company: data.company,
              role: data.role,
              dateApplied: data.dateApplied
            });

            // Verify similarity is in valid range
            expect(result.similarity).toBeGreaterThanOrEqual(0);
            expect(result.similarity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
