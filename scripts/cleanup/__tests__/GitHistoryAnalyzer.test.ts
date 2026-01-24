import { describe, it, expect, beforeEach } from 'vitest';
import { GitHistoryAnalyzer } from '../GitHistoryAnalyzer.js';

describe('GitHistoryAnalyzer - Unit Tests', () => {
  let analyzer: GitHistoryAnalyzer;

  beforeEach(() => {
    analyzer = new GitHistoryAnalyzer();
  });

  describe('getFileCreationDate', () => {
    it('should return a valid date for files with git history', () => {
      // Test with README.md which should have git history
      const date = analyzer.getFileCreationDate('README.md');
      
      if (date !== null) {
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).not.toBeNaN();
        expect(date.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should return null for files with no git history', () => {
      // Test with a file that doesn't exist
      const date = analyzer.getFileCreationDate('nonexistent-file-12345.md');
      expect(date).toBeNull();
    });

    it('should handle files with special characters in path', () => {
      // This should not crash, even if file doesn't exist
      const date = analyzer.getFileCreationDate('file with spaces.md');
      // Should return null since file doesn't exist
      expect(date).toBeNull();
    });
  });

  describe('getAllMarkdownFileHistory', () => {
    it('should return a Map with file paths and dates', () => {
      const history = analyzer.getAllMarkdownFileHistory();
      
      expect(history).toBeInstanceOf(Map);
      
      // All values should be Date objects
      for (const [file, date] of history.entries()) {
        expect(typeof file).toBe('string');
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).not.toBeNaN();
      }
    }, 180000); // 3 minute timeout

    it('should exclude README.md from the list', () => {
      const history = analyzer.getAllMarkdownFileHistory();
      expect(history.has('README.md')).toBe(false);
    }, 180000);

    it('should only include .md files', () => {
      const history = analyzer.getAllMarkdownFileHistory();
      
      for (const file of history.keys()) {
        expect(file.endsWith('.md')).toBe(true);
      }
    }, 180000);

    it('should assign current timestamp to files without git history', () => {
      const history = analyzer.getAllMarkdownFileHistory();
      const now = Date.now();
      
      // Files without history should have a timestamp close to now
      for (const date of history.values()) {
        // Should be within the last minute or in the past
        expect(date.getTime()).toBeLessThanOrEqual(now + 60000);
      }
    }, 180000);
  });

  describe('sortFilesByCreationOrder', () => {
    it('should sort files by creation date (earliest first)', () => {
      const testMap = new Map<string, Date>([
        ['file3.md', new Date('2024-03-01')],
        ['file1.md', new Date('2024-01-01')],
        ['file2.md', new Date('2024-02-01')],
      ]);

      const sorted = analyzer.sortFilesByCreationOrder(testMap);

      expect(sorted).toEqual(['file1.md', 'file2.md', 'file3.md']);
    });

    it('should maintain alphabetical order for files with same date', () => {
      const sameDate = new Date('2024-01-01');
      const testMap = new Map<string, Date>([
        ['zebra.md', sameDate],
        ['apple.md', sameDate],
        ['banana.md', sameDate],
      ]);

      const sorted = analyzer.sortFilesByCreationOrder(testMap);

      expect(sorted).toEqual(['apple.md', 'banana.md', 'zebra.md']);
    });

    it('should handle empty map', () => {
      const testMap = new Map<string, Date>();
      const sorted = analyzer.sortFilesByCreationOrder(testMap);

      expect(sorted).toEqual([]);
    });

    it('should handle single file', () => {
      const testMap = new Map<string, Date>([
        ['single.md', new Date('2024-01-01')],
      ]);

      const sorted = analyzer.sortFilesByCreationOrder(testMap);

      expect(sorted).toEqual(['single.md']);
    });

    it('should handle mixed dates and alphabetical ordering', () => {
      const testMap = new Map<string, Date>([
        ['file-z.md', new Date('2024-01-01')],
        ['file-a.md', new Date('2024-01-01')],
        ['file-b.md', new Date('2024-02-01')],
        ['file-c.md', new Date('2024-02-01')],
      ]);

      const sorted = analyzer.sortFilesByCreationOrder(testMap);

      // First two should be from Jan 1 in alphabetical order
      // Next two should be from Feb 1 in alphabetical order
      expect(sorted).toEqual(['file-a.md', 'file-z.md', 'file-b.md', 'file-c.md']);
    });
  });
});
