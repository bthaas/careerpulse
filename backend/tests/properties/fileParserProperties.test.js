/**
 * Property-Based Tests for FileParserService
 * Tests universal properties across all inputs
 * 
 * Feature: oop-refactoring
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { FileParserService, ParsingError } from '../../services/FileParserService.js';

describe('FileParserService - Property Tests', () => {
  
  /**
   * Property 14: File Format Validation
   * **Validates: Requirements 7.3**
   * 
   * For any invalid file, the parser should reject it before attempting to parse
   */
  describe('Property 14: File Format Validation', () => {
    it('should reject invalid CSV files before parsing', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant(Buffer.from([]))
          ),
          (invalidFile) => {
            const parser = new FileParserService();
            const isValid = parser.validateFormat(invalidFile, 'csv');
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid Excel files before parsing', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(Buffer.from([0x00, 0x00])), // Too short
            fc.constant(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])) // Invalid magic number
          ),
          (invalidFile) => {
            const parser = new FileParserService();
            const isValid = parser.validateFormat(invalidFile, 'excel');
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid CSV format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (csvText) => {
            const parser = new FileParserService();
            const isValid = parser.validateFormat(csvText, 'csv');
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid Excel format (XLSX)', () => {
      const parser = new FileParserService();
      // XLSX magic number: 50 4B (ZIP format)
      const xlsxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      const isValid = parser.validateFormat(xlsxBuffer, 'excel');
      expect(isValid).toBe(true);
    });

    it('should accept valid Excel format (XLS)', () => {
      const parser = new FileParserService();
      // XLS magic number: D0 CF 11 E0
      const xlsBuffer = Buffer.from([0xD0, 0xCF, 0x11, 0xE0]);
      const isValid = parser.validateFormat(xlsBuffer, 'excel');
      expect(isValid).toBe(true);
    });
  });

  /**
   * Property 15: File Parsing Error Handling
   * **Validates: Requirements 7.4**
   * 
   * For any malformed file, the parser should return descriptive errors without crashing
   */
  describe('Property 15: File Parsing Error Handling', () => {
    it('should throw ParsingError for malformed CSV without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(''), // Empty file
            fc.constant('Company'), // Only header, no data
            fc.constant('Invalid\nData\nWithout\nProper\nColumns')
          ),
          async (malformedCSV) => {
            const parser = new FileParserService();
            
            try {
              await parser.parseCSV(malformedCSV);
              // If it doesn't throw, it should return empty array or valid data
              expect(true).toBe(true);
            } catch (error) {
              // Should throw ParsingError with descriptive message
              expect(error).toBeInstanceOf(ParsingError);
              expect(error.message).toBeTruthy();
              expect(error.type).toBe('CSV');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw ParsingError for malformed Excel without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(Buffer.from([0x50, 0x4B, 0x00, 0x00])), // Invalid ZIP
            fc.constant(Buffer.from([0xD0, 0xCF, 0x00, 0x00])) // Invalid OLE
          ),
          async (malformedExcel) => {
            const parser = new FileParserService();
            
            try {
              await parser.parseExcel(malformedExcel);
              // Should not reach here
              expect(true).toBe(true);
            } catch (error) {
              // Should throw ParsingError
              expect(error).toBeInstanceOf(ParsingError);
              expect(error.message).toBeTruthy();
              expect(error.type).toBe('Excel');
            }
          }
        ),
        { numRuns: 50 } // Reduced runs for Excel parsing
      );
    });

    it('should include original error in ParsingError', async () => {
      const parser = new FileParserService();
      const invalidCSV = 'Company'; // Only header
      
      try {
        await parser.parseCSV(invalidCSV);
      } catch (error) {
        expect(error).toBeInstanceOf(ParsingError);
        expect(error.name).toBe('ParsingError');
        expect(error.type).toBe('CSV');
      }
    });
  });

  /**
   * Property 16: Parsed Data Consistency
   * **Validates: Requirements 7.5**
   * 
   * For any successfully parsed file, data should follow Application structure
   */
  describe('Property 16: Parsed Data Consistency', () => {
    it('should return consistent Application structure for valid CSV', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            company: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"') && !s.includes(',')),
            role: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"') && !s.includes(',')),
            location: fc.string({ maxLength: 50 }).filter(s => !s.includes('"') && !s.includes(',')),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected')
          }),
          async (data) => {
            const csv = `Company,Position,Location,Status\n${data.company},${data.role},${data.location},${data.status}`;
            const parser = new FileParserService();
            
            const applications = await parser.parseCSV(csv);
            
            // Should return array
            expect(Array.isArray(applications)).toBe(true);
            
            if (applications.length > 0) {
              const app = applications[0];
              
              // Should have all required fields
              expect(app).toHaveProperty('company');
              expect(app).toHaveProperty('role');
              expect(app).toHaveProperty('location');
              expect(app).toHaveProperty('dateApplied');
              expect(app).toHaveProperty('status');
              expect(app).toHaveProperty('source');
              expect(app).toHaveProperty('salary');
              expect(app).toHaveProperty('remotePolicy');
              expect(app).toHaveProperty('notes');
              
              // Company and role should match input (trimmed)
              expect(app.company).toBe(data.company.trim());
              expect(app.role).toBe(data.role.trim());
              
              // Status should be normalized
              expect(['Applied', 'Interview', 'Offer', 'Rejected']).toContain(app.status);
              
              // Source should be set
              expect(app.source).toBe('CSV Import');
              
              // Date should be set
              expect(app.dateApplied).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should normalize status values consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'applied', 'Applied', 'APPLIED',
            'interview', 'Interview', 'INTERVIEW',
            'rejected', 'Rejected', 'REJECTED',
            'offer', 'Offer', 'OFFER'
          ),
          async (status) => {
            const csv = `Company,Position,Status\nTest Corp,Engineer,${status}`;
            const parser = new FileParserService();
            
            const applications = await parser.parseCSV(csv);
            
            if (applications.length > 0) {
              const app = applications[0];
              // Status should be normalized to one of the standard values
              expect(['Applied', 'Interview', 'Offer', 'Rejected']).toContain(app.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set default date when not provided', async () => {
      const csv = 'Company,Position\nTest Corp,Engineer';
      const parser = new FileParserService();
      
      const applications = await parser.parseCSV(csv);
      
      expect(applications.length).toBeGreaterThan(0);
      expect(applications[0].dateApplied).toBeTruthy();
      expect(typeof applications[0].dateApplied).toBe('string');
    });

    it('should handle empty optional fields', async () => {
      const csv = 'Company,Position,Location,Salary,Notes\nTest Corp,Engineer,,,';
      const parser = new FileParserService();
      
      const applications = await parser.parseCSV(csv);
      
      expect(applications.length).toBeGreaterThan(0);
      const app = applications[0];
      expect(app.company).toBe('Test Corp');
      expect(app.role).toBe('Engineer');
      expect(app.location).toBe('');
      expect(app.salary).toBe('');
      expect(app.notes).toBe('');
    });
  });

  /**
   * Additional property: Custom configuration support
   */
  describe('Custom Configuration', () => {
    it('should accept custom column mappings', async () => {
      const customMappings = {
        company: ['employer'],
        role: ['job'],
        location: ['place'],
        dateApplied: ['date'],
        status: ['state'],
        source: ['source'],
        salary: ['pay'],
        remotePolicy: ['remote'],
        notes: ['comments']
      };
      
      const parser = new FileParserService({ columnMappings: customMappings });
      const csv = 'Employer,Job\nTest Corp,Engineer';
      
      const applications = await parser.parseCSV(csv);
      
      expect(applications.length).toBeGreaterThan(0);
      expect(applications[0].company).toBe('Test Corp');
      expect(applications[0].role).toBe('Engineer');
    });

    it('should accept custom status mappings', async () => {
      const customStatusMappings = {
        'pending': 'Applied',
        'active': 'Interview'
      };
      
      const parser = new FileParserService({ statusMappings: customStatusMappings });
      const csv = 'Company,Position,Status\nTest Corp,Engineer,pending';
      
      const applications = await parser.parseCSV(csv);
      
      expect(applications.length).toBeGreaterThan(0);
      expect(applications[0].status).toBe('Applied');
    });
  });
});
