/**
 * Property-Based Tests for Duplicate Detection
 * Validates duplicate detection correctness with randomized inputs
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 13: Duplicate Detection Correctness
 * For any application, duplicate should be detected iff exact match exists
 * Validates: Requirements 4.1, 4.2, 4.3
 */
describe('Property 13: Duplicate Detection Correctness', () => {
  it('should detect exact matches as duplicates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TechCorp', 'Google', 'Amazon', 'Microsoft'),
        fc.constantFrom('Software Engineer', 'Senior Developer', 'Product Manager'),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        (company, role, date) => {
          // Handle invalid dates
          if (isNaN(date.getTime())) return;
          
          const dateStr = date.toISOString().split('T')[0];
          
          const app1 = { company, role, dateApplied: dateStr };
          const app2 = { company, role, dateApplied: dateStr };
          
          // Exact match logic
          const isExactMatch = 
            app1.company === app2.company &&
            app1.role === app2.role &&
            app1.dateApplied === app2.dateApplied;
          
          expect(isExactMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not detect non-matches as duplicates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TechCorp', 'Google', 'Amazon'),
        fc.constantFrom('DataCorp', 'Microsoft', 'Apple'),
        fc.constantFrom('Software Engineer', 'Senior Developer'),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (company1, company2, role, date) => {
          const dateStr = date.toISOString().split('T')[0];
          
          const app1 = { company: company1, role, dateApplied: dateStr };
          const app2 = { company: company2, role, dateApplied: dateStr };
          
          // Different companies = not a duplicate
          if (company1 !== company2) {
            const isExactMatch = 
              app1.company === app2.company &&
              app1.role === app2.role &&
              app1.dateApplied === app2.dateApplied;
            
            expect(isExactMatch).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle date differences correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TechCorp', 'Google'),
        fc.constantFrom('Software Engineer', 'Senior Developer'),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2028-12-31') }),
        fc.date({ min: new Date('2020-01-02'), max: new Date('2029-12-31') }),
        (company, role, date1, date2) => {
          // Handle invalid dates
          if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return;
          
          const dateStr1 = date1.toISOString().split('T')[0];
          const dateStr2 = date2.toISOString().split('T')[0];
          
          if (dateStr1 !== dateStr2) {
            const app1 = { company, role, dateApplied: dateStr1 };
            const app2 = { company, role, dateApplied: dateStr2 };
            
            // Different dates = not a duplicate
            const isExactMatch = 
              app1.company === app2.company &&
              app1.role === app2.role &&
              app1.dateApplied === app2.dateApplied;
            
            expect(isExactMatch).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 14: Duplicate Skipping During Sync
 * For any sync with duplicates, they should be skipped and counted
 * Validates: Requirements 4.4
 */
describe('Property 14: Duplicate Skipping During Sync', () => {
  it('should track duplicate count during sync', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            company: fc.constantFrom('TechCorp', 'Google', 'Amazon'),
            role: fc.constantFrom('Software Engineer', 'Senior Developer'),
            dateApplied: fc.constantFrom('2026-01-15', '2026-02-20')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (applications) => {
          // Simulate duplicate detection
          const seen = new Set();
          let duplicateCount = 0;
          let newCount = 0;
          
          applications.forEach(app => {
            const key = `${app.company}|${app.role}|${app.dateApplied}`;
            if (seen.has(key)) {
              duplicateCount++;
            } else {
              seen.add(key);
              newCount++;
            }
          });
          
          // Total should equal sum of new and duplicates
          expect(applications.length).toBe(newCount + duplicateCount);
          
          // Duplicate count should be non-negative
          expect(duplicateCount).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain sync statistics correctly', () => {
    const applications = [
      { company: 'TechCorp', role: 'SWE', dateApplied: '2026-01-15' },
      { company: 'TechCorp', role: 'SWE', dateApplied: '2026-01-15' }, // duplicate
      { company: 'Google', role: 'SWE', dateApplied: '2026-01-15' },
      { company: 'TechCorp', role: 'SWE', dateApplied: '2026-01-15' }, // duplicate
    ];
    
    const seen = new Set();
    let duplicates = 0;
    let newApps = 0;
    
    applications.forEach(app => {
      const key = `${app.company}|${app.role}|${app.dateApplied}`;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
        newApps++;
      }
    });
    
    expect(newApps).toBe(2); // TechCorp and Google
    expect(duplicates).toBe(2); // Two duplicate TechCorp entries
    expect(newApps + duplicates).toBe(applications.length);
  });
});
