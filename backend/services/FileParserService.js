/**
 * FileParserService Class - OOP Implementation
 * 
 * Encapsulates CSV and Excel file parsing operations including:
 * - CSV file parsing with flexible column mapping
 * - Excel file parsing (.xlsx, .xls)
 * - Format validation
 * - Status normalization
 * - Consistent Application object structure
 * 
 * @class FileParserService
 * @example
 * const fileParser = new FileParserService({
 *   columnMappings: {
 *     company: ['company', 'employer'],
 *     role: ['position', 'title']
 *   }
 * });
 * 
 * const applications = fileParser.parseCSV(csvContent);
 * console.log(`Parsed ${applications.length} applications`);
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 */

import XLSX from 'xlsx';

/**
 * Custom error class for parsing operations
 */
export class ParsingError extends Error {
  constructor(type, message, originalError = null) {
    super(`${type} parsing failed: ${message}`);
    this.name = 'ParsingError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * FileParserService Class
 * 
 * Handles CSV and Excel file parsing with validation and flexible column mapping.
 * Normalizes various column names and status values to a consistent format.
 * 
 * @class
 */
export class FileParserService {
  /**
   * Create a FileParserService instance
   * 
   * @param {Object} [config={}] - Configuration options
   * @param {Object} [config.columnMappings] - Custom column name mappings for flexible parsing
   * @param {Object} [config.statusMappings] - Custom status value mappings for normalization
   * @example
   * const fileParser = new FileParserService({
   *   columnMappings: {
   *     company: ['company', 'employer', 'organization'],
   *     role: ['position', 'job title', 'title']
   *   },
   *   statusMappings: {
   *     'Applied': ['applied', 'submitted', 'pending'],
   *     'Interview': ['interview', 'screening', 'phone screen']
   *   }
   * });
   */
  constructor(config = {}) {
    this.columnMappings = config.columnMappings || this._getDefaultColumnMappings();
    this.statusMappings = config.statusMappings || this._getDefaultStatusMappings();
  }

  /**
   * Get default column mappings
   * @private
   */
  _getDefaultColumnMappings() {
    return {
      company: ['company', 'company name', 'organization', 'employer', 'business'],
      role: ['position', 'role', 'job title', 'title', 'job', 'job position'],
      location: ['location', 'job location', 'city', 'place', 'where'],
      dateApplied: ['date applied', 'date', 'applied date', 'application date', 'submitted', 'submitted date', 'applied'],
      status: ['status', 'application status', 'state', 'stage'],
      source: ['source', 'job source', 'platform', 'website', 'portal'],
      salary: ['salary', 'salary range', 'compensation', 'pay'],
      remotePolicy: ['remote policy', 'remote', 'work type', 'location type'],
      notes: ['notes', 'comments', 'description', 'details']
    };
  }

  /**
   * Get default status mappings
   * @private
   */
  _getDefaultStatusMappings() {
    return {
      'applied': 'Applied',
      'submitted': 'Applied',
      'in progress': 'Interview',
      'interview': 'Interview',
      'interviewing': 'Interview',
      'phone screen': 'Interview',
      'rejected': 'Rejected',
      'declined': 'Rejected',
      'not selected': 'Rejected',
      'offer': 'Offer',
      'accepted': 'Offer',
      'offer received': 'Offer'
    };
  }

  /**
   * Parse CSV file
   * @param {Buffer|string} file - CSV file buffer or text
   * @returns {Promise<Array>} Array of parsed applications
   */
  async parseCSV(file) {
    try {
      // Validate format first
      if (!this.validateFormat(file, 'csv')) {
        throw new ParsingError('CSV', 'Invalid CSV format');
      }

      const csvText = Buffer.isBuffer(file) ? file.toString('utf-8') : file;
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new ParsingError('CSV', 'File must have at least a header row and one data row');
      }
      
      // Find the header row
      let headerIndex = 0;
      let headers = [];
      let columnMap = {};
      
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const testHeaders = this._parseCSVLine(lines[i]);
        const testMap = this._mapColumns(testHeaders);
        
        if (testMap.company !== undefined && testMap.role !== undefined) {
          headerIndex = i;
          headers = testHeaders;
          columnMap = testMap;
          break;
        }
      }
      
      if (headers.length === 0) {
        throw new ParsingError('CSV', 'Could not find header row with Company and Position columns');
      }
      
      // Parse data rows
      const applications = [];
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const values = this._parseCSVLine(lines[i]);
        
        if (values.length === 0 || values.every(v => !v || !v.trim())) {
          continue;
        }
        
        const application = this._parseRow(headers, values, columnMap);
        
        if (application.company && application.company.trim() && 
            application.role && application.role.trim() &&
            application.company.toLowerCase() !== 'company') {
          applications.push(application);
        }
      }
      
      return applications;
    } catch (error) {
      if (error instanceof ParsingError) {
        throw error;
      }
      throw new ParsingError('CSV', error.message, error);
    }
  }

  /**
   * Parse Excel file
   * @param {Buffer} file - Excel file buffer
   * @returns {Promise<Array>} Array of parsed applications
   */
  async parseExcel(file) {
    try {
      // Validate format first
      if (!this.validateFormat(file, 'excel')) {
        throw new ParsingError('Excel', 'Invalid Excel format');
      }

      // Convert Excel to CSV
      const workbook = XLSX.read(file, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // Parse as CSV
      return await this.parseCSV(csv);
    } catch (error) {
      if (error instanceof ParsingError) {
        throw error;
      }
      throw new ParsingError('Excel', error.message, error);
    }
  }

  /**
   * Validate file format
   * @param {Buffer|string} file - File to validate
   * @param {string} type - File type ('csv' or 'excel')
   * @returns {boolean} True if valid
   */
  validateFormat(file, type) {
    if (!file) {
      return false;
    }

    if (type === 'csv') {
      const text = Buffer.isBuffer(file) ? file.toString('utf-8') : file;
      return typeof text === 'string' && text.length > 0;
    }

    if (type === 'excel') {
      if (!Buffer.isBuffer(file) || file.length < 4) {
        return false;
      }
      
      // Check for Excel magic numbers
      const magicNumber = file.slice(0, 4);
      
      // XLSX (ZIP format): 50 4B
      if (magicNumber[0] === 0x50 && magicNumber[1] === 0x4B) {
        return true;
      }
      
      // Legacy XLS: D0 CF 11 E0
      if (magicNumber[0] === 0xD0 && magicNumber[1] === 0xCF &&
          magicNumber[2] === 0x11 && magicNumber[3] === 0xE0) {
        return true;
      }
      
      return false;
    }

    return false;
  }

  /**
   * Parse a single CSV line, handling quoted values
   * @private
   */
  _parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Map CSV column names to standard field names
   * @private
   */
  _mapColumns(headers) {
    const map = {};
    
    for (const [field, variations] of Object.entries(this.columnMappings)) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        
        if (variations.some(v => header === v || header.includes(v))) {
          map[field] = i;
          break;
        }
      }
    }
    
    return map;
  }

  /**
   * Parse a data row into an application object
   * @private
   */
  _parseRow(headers, values, columnMap) {
    const application = {
      company: '',
      role: '',
      location: '',
      dateApplied: '',
      status: 'Applied',
      source: 'CSV Import',
      salary: '',
      remotePolicy: '',
      notes: ''
    };
    
    for (const [field, index] of Object.entries(columnMap)) {
      if (index !== undefined && values[index]) {
        let value = values[index].trim();
        
        if (field === 'status') {
          value = this._normalizeStatus(value);
        } else if (field === 'dateApplied') {
          value = this._normalizeDate(value);
        }
        
        application[field] = value;
      }
    }
    
    if (!application.dateApplied) {
      application.dateApplied = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return application;
  }

  /**
   * Normalize status to standard values
   * @private
   */
  _normalizeStatus(status) {
    const normalized = status.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(this.statusMappings)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    
    return 'Applied';
  }

  /**
   * Normalize date format
   * @private
   */
  _normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      return new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
}
