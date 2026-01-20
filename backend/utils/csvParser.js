/**
 * CSV Parser for Job Applications
 * Handles various CSV formats and column name variations
 */

/**
 * Column name mappings for flexible parsing
 * Maps various column names to our standard fields
 */
const COLUMN_MAPPINGS = {
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

/**
 * Status mappings to normalize different status formats
 */
const STATUS_MAPPINGS = {
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

/**
 * Parse CSV text into structured data
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of parsed application objects
 */
export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  // Find the header row (look for "Company" column)
  let headerIndex = 0;
  let headers = [];
  let columnMap = {};
  
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const testHeaders = parseCSVLine(lines[i]);
    const testMap = mapColumns(testHeaders);
    
    // If we find Company and Position columns, this is the header row
    if (testMap.company !== undefined && testMap.role !== undefined) {
      headerIndex = i;
      headers = testHeaders;
      columnMap = testMap;
      break;
    }
  }
  
  if (headers.length === 0) {
    throw new Error('Could not find header row with Company and Position columns');
  }
  
  // Parse data rows (start after header row)
  const applications = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    // Skip empty rows or rows with no data
    if (values.length === 0 || values.every(v => !v || !v.trim())) {
      continue;
    }
    
    const application = parseRow(headers, values, columnMap);
    
    // Only include rows with both company and role
    if (application.company && application.company.trim() && 
        application.role && application.role.trim() &&
        application.company.toLowerCase() !== 'company') { // Skip header duplicates
      applications.push(application);
    }
  }
  
  return applications;
}

/**
 * Parse a single CSV line, handling quoted values
 * @param {string} line - CSV line
 * @returns {Array<string>} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
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
 * Map CSV column names to our standard field names
 * @param {Array<string>} headers - CSV column headers
 * @returns {Object} Mapping of field names to column indices
 */
function mapColumns(headers) {
  const map = {};
  
  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
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
 * @param {Array<string>} headers - Column headers
 * @param {Array<string>} values - Row values
 * @param {Object} columnMap - Field to column index mapping
 * @returns {Object} Application object
 */
function parseRow(headers, values, columnMap) {
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
  
  // Map known columns
  for (const [field, index] of Object.entries(columnMap)) {
    if (index !== undefined && values[index]) {
      let value = values[index].trim();
      
      if (field === 'status') {
        value = normalizeStatus(value);
      } else if (field === 'dateApplied') {
        value = normalizeDate(value);
      }
      
      application[field] = value;
    }
  }
  
  // If no date provided, use today
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
 * Normalize status to our standard values
 * @param {string} status - Input status
 * @returns {string} Normalized status
 */
function normalizeStatus(status) {
  const normalized = status.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(STATUS_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'Applied'; // Default
}

/**
 * Normalize date format
 * @param {string} dateStr - Input date string
 * @returns {string} Normalized date string
 */
function normalizeDate(dateStr) {
  try {
    // Try to parse various date formats
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // If invalid, return today's date
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
    // On error, return today's date
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

export default {
  parseCSV,
  COLUMN_MAPPINGS,
  STATUS_MAPPINGS
};
