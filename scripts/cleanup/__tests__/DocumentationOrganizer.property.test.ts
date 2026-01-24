import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DocumentationOrganizer } from '../DocumentationOrganizer.js';

describe('DocumentationOrganizer - Property Tests', () => {
  /**
   * Property 3: Sequential numbering
   * **Validates: Requirements 2.1, 2.4**
   * 
   * For any list of files to be organized, the system should assign sequential numbers 
   * starting from 1 with no gaps (1, 2, 3, ..., n).
   */
  it('Property 3: should assign sequential numbers starting from 1', () => {
    const organizer = new DocumentationOrganizer();
    
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
        (filenames) => {
          const moves = organizer.getDocumentationMoves(filenames);
          
          // Check that positions are sequential starting from 1
          for (let i = 0; i < moves.length; i++) {
            expect(moves[i].position).toBe(i + 1);
          }
          
          // Verify no gaps in numbering
          const positions = moves.map(m => m.position);
          const expectedPositions = Array.from({ length: moves.length }, (_, i) => i + 1);
          expect(positions).toEqual(expectedPositions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Prefix format consistency
   * **Validates: Requirements 2.2, 2.3**
   * 
   * For any numbered file, the filename should match the pattern {number}-{originalName} 
   * where number is a positive integer and originalName is the original filename.
   */
  it('Property 4: should format filenames as {number}-{originalName}', () => {
    const organizer = new DocumentationOrganizer();
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 1000 }),
        (originalName, position) => {
          const numberedName = organizer.generateNumberedFilename(originalName, position);
          
          // Should start with the position number followed by dash
          expect(numberedName).toMatch(new RegExp(`^${position}-`));
          
          // Should end with the original name
          expect(numberedName).toBe(`${position}-${originalName}`);
          
          // Should contain exactly one dash separator (between number and name)
          const parts = numberedName.split('-');
          expect(parts.length).toBeGreaterThanOrEqual(2);
          expect(parts[0]).toBe(position.toString());
        }
      ),
      { numRuns: 100 }
    );
  });
});
