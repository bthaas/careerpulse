/**
 * Unit Tests for FileParserService
 * Tests specific examples and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FileParserService, ParsingError } from '../../services/FileParserService.js';
import XLSX from 'xlsx';

describe('FileParserService - Unit Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new FileParserService();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(parser).toBeInstanceOf(FileParserService);
      expect(parser.columnMappings).toBeDefined();
      expect(parser.statusMappings).toBeDefined();
    });

    it('should accept custom column mappings', () => {
      const customMappings = { company: ['employer'] };
      const customParser = new FileParserService({ columnMappings: customMappings });
      expect(customParser.columnMappings).toEqual(customMappings);
    });

    it('should accept custom status mappings', () => {
      const customStatusMappings = { 'pending': 'Applied' };
      const customParser = new FileParserService({ statusMappings: customStatusMappings });
      expect(customParser.statusMappings).toEqual(customStatusMappings);
    });
  });

  describe('validateFormat', () => {
    describe('CSV validation', () => {
      it('should validate valid CSV string', () => {
        expect(parser.validateFormat('Company,Role\nTest,Engineer', 'csv')).toBe(true);
      });

      it('should validate valid CSV buffer', () => {
        const buffer = Buffer.from('Company,Role\nTest,Engineer');
        expect(parser.validateFormat(buffer, 'csv')).toBe(true);
      });

      it('should reject null', () => {
        expect(parser.validateFormat(null, 'csv')).toBe(false);
      });

      it('should reject undefined', () => {
        expect(parser.validateFormat(undefined, 'csv')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(parser.validateFormat('', 'csv')).toBe(false);
      });
    });

    describe('Excel validation', () => {
      it('should validate XLSX format (ZIP magic number)', () => {
        const xlsxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
        expect(parser.validateFormat(xlsxBuffer, 'excel')).toBe(true);
      });

      it('should validate XLS format (OLE magic number)', () => {
        const xlsBuffer = Buffer.from([0xD0, 0xCF, 0x11, 0xE0]);
        expect(parser.validateFormat(xlsBuffer, 'excel')).toBe(true);
      });

      it('should reject invalid magic number', () => {
        const invalidBuffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
        expect(parser.validateFormat(invalidBuffer, 'excel')).toBe(false);
      });

      it('should reject buffer too short', () => {
        const shortBuffer = Buffer.from([0x50, 0x4B]);
        expect(parser.validateFormat(shortBuffer, 'excel')).toBe(false);
      });

      it('should reject null', () => {
        expect(parser.validateFormat(null, 'excel')).toBe(false);
      });

      it('should reject non-buffer', () => {
        expect(parser.validateFormat('not a buffer', 'excel')).toBe(false);
      });
    });
  });

  describe('parseCSV', () => {
    it('should parse simple CSV with standard headers', async () => {
      const csv = 'Company,Position,Location,Status\nTest Corp,Engineer,NYC,Applied';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
      expect(result[0].role).toBe('Engineer');
      expect(result[0].location).toBe('NYC');
      expect(result[0].status).toBe('Applied');
    });

    it('should parse CSV with alternative column names', async () => {
      const csv = 'Organization,Job Title,City\nTest Corp,Engineer,NYC';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
      expect(result[0].role).toBe('Engineer');
      expect(result[0].location).toBe('NYC');
    });

    it('should handle quoted values with commas', async () => {
      const csv = 'Company,Position\n"Test, Inc.",Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test, Inc.');
    });

    it('should handle escaped quotes', async () => {
      const csv = 'Company,Position\n"Test ""Corp""",Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test "Corp"');
    });

    it('should skip empty rows', async () => {
      const csv = 'Company,Position\nTest Corp,Engineer\n\n\nAnother Corp,Designer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(2);
    });

    it('should skip rows with only whitespace', async () => {
      const csv = 'Company,Position\nTest Corp,Engineer\n   \nAnother Corp,Designer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(2);
    });

    it('should skip rows without company or role', async () => {
      const csv = 'Company,Position\n,Engineer\nTest Corp,';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(0);
    });

    it('should normalize status values', async () => {
      const csv = 'Company,Position,Status\nTest Corp,Engineer,interview';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].status).toBe('Interview');
    });

    it('should set default date when not provided', async () => {
      const csv = 'Company,Position\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].dateApplied).toBeTruthy();
      expect(typeof result[0].dateApplied).toBe('string');
    });

    it('should parse and normalize dates', async () => {
      const csv = 'Company,Position,Date Applied\nTest Corp,Engineer,2024-01-15';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].dateApplied).toBeTruthy();
    });

    it('should set source to CSV Import', async () => {
      const csv = 'Company,Position\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].source).toBe('CSV Import');
    });

    it('should handle all optional fields', async () => {
      const csv = 'Company,Position,Salary,Remote Policy,Notes\nTest Corp,Engineer,$100k,Hybrid,Great company';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].salary).toBe('$100k');
      expect(result[0].remotePolicy).toBe('Hybrid');
      expect(result[0].notes).toBe('Great company');
    });

    it('should find header row even if not first', async () => {
      const csv = 'Some metadata\nMore metadata\nCompany,Position\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
    });

    it('should throw error if no header found', async () => {
      const csv = 'Invalid,Data\nNo,Headers';
      
      await expect(parser.parseCSV(csv)).rejects.toThrow(ParsingError);
      await expect(parser.parseCSV(csv)).rejects.toThrow('Could not find header row');
    });

    it('should throw error if less than 2 lines', async () => {
      const csv = 'Company,Position';
      
      await expect(parser.parseCSV(csv)).rejects.toThrow(ParsingError);
      await expect(parser.parseCSV(csv)).rejects.toThrow('at least a header row and one data row');
    });

    it('should throw error for invalid format', async () => {
      await expect(parser.parseCSV(null)).rejects.toThrow(ParsingError);
    });

    it('should accept buffer input', async () => {
      const buffer = Buffer.from('Company,Position\nTest Corp,Engineer');
      const result = await parser.parseCSV(buffer);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
    });
  });

  describe('parseExcel', () => {
    it('should parse valid Excel file', async () => {
      // Create a simple Excel file
      const ws = XLSX.utils.aoa_to_sheet([
        ['Company', 'Position', 'Location'],
        ['Test Corp', 'Engineer', 'NYC']
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      const result = await parser.parseExcel(buffer);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
      expect(result[0].role).toBe('Engineer');
      expect(result[0].location).toBe('NYC');
    });

    it('should throw error for invalid Excel format', async () => {
      const invalidBuffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
      
      await expect(parser.parseExcel(invalidBuffer)).rejects.toThrow(ParsingError);
    });

    it('should throw error for null input', async () => {
      await expect(parser.parseExcel(null)).rejects.toThrow(ParsingError);
    });
  });

  describe('Error handling', () => {
    it('should throw ParsingError with type and message', async () => {
      try {
        await parser.parseCSV('');
      } catch (error) {
        expect(error).toBeInstanceOf(ParsingError);
        expect(error.name).toBe('ParsingError');
        expect(error.type).toBe('CSV');
        expect(error.message).toContain('CSV parsing failed');
      }
    });

    it('should include original error in ParsingError', async () => {
      try {
        await parser.parseCSV('Company');
      } catch (error) {
        expect(error).toBeInstanceOf(ParsingError);
        expect(error.type).toBe('CSV');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle CSV with BOM', async () => {
      const bom = '\uFEFF';
      const csv = bom + 'Company,Position\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
    });

    it('should handle different line endings', async () => {
      const csv = 'Company,Position\r\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
    });

    it('should trim whitespace from values', async () => {
      const csv = 'Company,Position\n  Test Corp  ,  Engineer  ';
      const result = await parser.parseCSV(csv);
      
      expect(result[0].company).toBe('Test Corp');
      expect(result[0].role).toBe('Engineer');
    });

    it('should handle case-insensitive headers', async () => {
      const csv = 'COMPANY,POSITION\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
    });

    it('should skip duplicate header rows', async () => {
      const csv = 'Company,Position\nCompany,Position\nTest Corp,Engineer';
      const result = await parser.parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Test Corp');
    });
  });
});
