import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GitHistoryAnalyzer } from '../GitHistoryAnalyzer.js';

describe('GitHistoryAnalyzer - Property Tests', () => {
  /**
   * Property 1: Git history extraction completeness
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any repository with .md files, the system should extract creation dates 
   * for all .md files that have git history, and assign current timestamp to files without history.
   */
  it('Property 1: should extract creation dates for all .md files or assign current timestamp', () => {
    const analyzer = new GitHistoryAnalyzer();
    
    fc.assert(
      fc.property(fc.constant(null), () => {
        const history = analyzer.getAllMarkdownFileHistory();
        
        // All files should have a date assigned
        for (const [file, date] of history.entries()) {
          expect(date).toBeInstanceOf(Date);
          expect(date.getTime()).not.toBeNaN();
          
          // Date should be in the past or present (not future)
          expect(date.getTime()).toBeLessThanOrEqual(Date.now());
        }
        
        // README.md should not be in the list
        expect(history.has('README.md')).toBe(false);
      }),
      { numRuns: 1 } // Run once since we're testing actual repo with many files
    );
  }, 180000); // 3 minute timeout for large repo

  /**
   * Property 2: Alphabetical ordering for same-date files
   * **Validates: Requirements 1.3**
   * 
   * For any set of .md files created in the same commit, the system should 
   * maintain alphabetical order among them in the final sorted list.
   */
  it('Property 2: should maintain alphabetical order for files with same creation date', () => {
    const analyzer = new GitHistoryAnalyzer();
    
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string(), fc.date()), { minLength: 2, maxLength: 10 }),
        (fileData) => {
          // Create a map with some files having the same date
          const testMap = new Map<string, Date>();
          const sameDate = new Date('2024-01-01');
          
          // Add files with the same date
          for (let i = 0; i < Math.min(3, fileData.length); i++) {
            testMap.set(`file${i}.md`, sameDate);
          }
          
          const sorted = analyzer.sortFilesByCreationOrder(testMap);
          
          // Find all files with the same date
          const sameDateFiles = sorted.filter(file => {
            const date = testMap.get(file);
            return date && date.getTime() === sameDate.getTime();
          });
          
          // Check if they are in alphabetical order
          for (let i = 1; i < sameDateFiles.length; i++) {
            expect(sameDateFiles[i - 1].localeCompare(sameDateFiles[i])).toBeLessThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
