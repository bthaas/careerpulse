/**
 * Unit Tests for DuplicateDetector
 * Tests specific examples and edge cases for duplicate detection
 * 
 * **Validates: Requirements 5.2, 5.3, 5.5, 5.6**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DuplicateDetector } from '../../services/duplicateDetector.js';

describe('DuplicateDetector Unit Tests', () => {
  let duplicateDetector;
  let mockDatabaseService;

  beforeEach(() => {
    mockDatabaseService = {
      findDuplicateApplication: vi.fn(),
      getAllApplications: vi.fn()
    };
    duplicateDetector = new DuplicateDetector(mockDatabaseService);
  });

  describe('Initialization', () => {
    it('should create instance with DatabaseService', () => {
      expect(duplicateDetector).toBeDefined();
      expect(duplicateDetector.databaseService).toBe(mockDatabaseService);
    });
  });

  describe('String Similarity', () => {
    it('should return 1.0 for exact match', () => {
      const sim = duplicateDetector.stringSimilarity('Google', 'Google');
      expect(sim).toBe(1.0);
    });

    it('should be case insensitive', () => {
      const sim = duplicateDetector.stringSimilarity('Google', 'google');
      expect(sim).toBe(1.0);
    });

    it('should trim whitespace', () => {
      const sim = duplicateDetector.stringSimilarity('  Google  ', 'Google');
      expect(sim).toBe(1.0);
    });

    it('should return 0.8 when one contains the other', () => {
      const sim = duplicateDetector.stringSimilarity('Google Inc', 'Google');
      expect(sim).toBe(0.8);
    });

    it('should calculate word overlap', () => {
      const sim = duplicateDetector.stringSimilarity('Software Engineer', 'Senior Software Engineer');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1.0);
    });

    it('should return 0 for null strings', () => {
      expect(duplicateDetector.stringSimilarity(null, 'test')).toBe(0);
      expect(duplicateDetector.stringSimilarity('test', null)).toBe(0);
    });

    it('should return 0 for empty strings', () => {
      expect(duplicateDetector.stringSimilarity('', 'test')).toBe(0);
    });
  });

  describe('Date Normalization', () => {
    it('should normalize ISO date', () => {
      const normalized = duplicateDetector.normalizeDate('2024-01-15T10:30:00Z');
      expect(normalized).toBe('2024-01-15');
    });

    it('should normalize date string', () => {
      const normalized = duplicateDetector.normalizeDate('Mon Jan 15 2024');
      expect(normalized).toBe('2024-01-15');
    });

    it('should return original string for invalid date', () => {
      const normalized = duplicateDetector.normalizeDate('invalid');
      expect(normalized).toBe('invalid');
    });
  });

  describe('Duplicate Checking', () => {
    it('should find exact duplicate', async () => {
      const application = {
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer',
        dateApplied: '2024-01-15'
      };

      mockDatabaseService.findDuplicateApplication.mockResolvedValue({
        id: 'app123',
        company: 'Google',
        role: 'Software Engineer'
      });

      const result = await duplicateDetector.checkDuplicate(application);

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateId).toBe('app123');
      expect(result.similarity).toBe(1.0);
      expect(result.reason).toContain('Exact match');
    });

    it('should return no duplicate when not found', async () => {
      const application = {
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer',
        dateApplied: '2024-01-15'
      };

      mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);

      const result = await duplicateDetector.checkDuplicate(application);

      expect(result.isDuplicate).toBe(false);
      expect(result.duplicateId).toBeNull();
      expect(result.similarity).toBe(0);
      expect(result.reason).toBeNull();
    });

    it('should call database with correct parameters', async () => {
      const application = {
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer',
        dateApplied: '2024-01-15'
      };

      mockDatabaseService.findDuplicateApplication.mockResolvedValue(null);

      await duplicateDetector.checkDuplicate(application);

      expect(mockDatabaseService.findDuplicateApplication).toHaveBeenCalledWith(
        'user123',
        'Google',
        'Software Engineer',
        '2024-01-15'
      );
    });
  });

  describe('Finding Similar Applications', () => {
    it('should return empty array when no userId', async () => {
      const application = {
        company: 'Google',
        role: 'Software Engineer'
      };

      const similar = await duplicateDetector.findSimilarApplications(application);

      expect(similar).toEqual([]);
      expect(mockDatabaseService.getAllApplications).not.toHaveBeenCalled();
    });

    it('should find similar applications above threshold', async () => {
      const application = {
        id: 'app1',
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer'
      };

      mockDatabaseService.getAllApplications.mockResolvedValue([
        {
          id: 'app2',
          company: 'Google Inc',
          role: 'Software Engineer'
        },
        {
          id: 'app3',
          company: 'Amazon',
          role: 'Data Scientist'
        }
      ]);

      const similar = await duplicateDetector.findSimilarApplications(application, 0.7);

      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].id).toBe('app2');
      expect(similar[0].similarity).toBeGreaterThanOrEqual(0.7);
    });

    it('should exclude the same application', async () => {
      const application = {
        id: 'app1',
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer'
      };

      mockDatabaseService.getAllApplications.mockResolvedValue([
        {
          id: 'app1',
          company: 'Google',
          role: 'Software Engineer'
        },
        {
          id: 'app2',
          company: 'Google Inc',
          role: 'Software Engineer'
        }
      ]);

      const similar = await duplicateDetector.findSimilarApplications(application);

      expect(similar.every(app => app.id !== 'app1')).toBe(true);
    });

    it('should sort by similarity descending', async () => {
      const application = {
        id: 'app1',
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer'
      };

      mockDatabaseService.getAllApplications.mockResolvedValue([
        {
          id: 'app2',
          company: 'Amazon',
          role: 'Software Engineer'
        },
        {
          id: 'app3',
          company: 'Google Inc',
          role: 'Software Engineer'
        }
      ]);

      const similar = await duplicateDetector.findSimilarApplications(application, 0.3);

      if (similar.length > 1) {
        for (let i = 0; i < similar.length - 1; i++) {
          expect(similar[i].similarity).toBeGreaterThanOrEqual(similar[i + 1].similarity);
        }
      }
    });

    it('should handle database errors gracefully', async () => {
      const application = {
        id: 'app1',
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer'
      };

      mockDatabaseService.getAllApplications.mockRejectedValue(new Error('Database error'));

      const similar = await duplicateDetector.findSimilarApplications(application);

      expect(similar).toEqual([]);
    });

    it('should filter by threshold', async () => {
      const application = {
        id: 'app1',
        userId: 'user123',
        company: 'Google',
        role: 'Software Engineer'
      };

      mockDatabaseService.getAllApplications.mockResolvedValue([
        {
          id: 'app2',
          company: 'Google Inc',
          role: 'Software Engineer'
        },
        {
          id: 'app3',
          company: 'Amazon',
          role: 'Data Scientist'
        }
      ]);

      const similar = await duplicateDetector.findSimilarApplications(application, 0.9);

      // Only very similar applications should be returned
      expect(similar.every(app => app.similarity >= 0.9)).toBe(true);
    });
  });
});
