/**
 * Assertion Helpers
 * 
 * Custom assertion functions for email scraping validation tests.
 * These helpers provide clear error messages when assertions fail and
 * validate against the database schema and requirements.
 */

/**
 * Valid status enum values from database schema
 */
const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

/**
 * Fallback values used by the email parser
 */
const FALLBACK_VALUES = {
  company: 'Unknown Company',
  role: 'Unknown Position',
  location: 'Not specified'
};

/**
 * Assert that an application has valid structure
 * Validates all required fields and their types according to database schema
 * 
 * @param {Object} app - Application object to validate
 * @throws {Error} If application structure is invalid
 * 
 * **Validates: Requirements 5.1, 5.2, 5.6**
 */
export function assertValidApplication(app) {
  // Check that app exists and is an object
  if (!app || typeof app !== 'object') {
    throw new Error('Application must be a non-null object');
  }

  // Required string fields
  const requiredStringFields = [
    'userId', 'company', 'role', 'location', 
    'dateApplied', 'lastUpdate', 'createdAt', 'status', 'notes'
  ];

  for (const field of requiredStringFields) {
    if (typeof app[field] !== 'string') {
      throw new Error(
        `Application.${field} must be a string, got ${typeof app[field]}`
      );
    }
    if (app[field].length === 0 && field !== 'notes') {
      throw new Error(`Application.${field} cannot be empty`);
    }
  }

  // Validate ID field (can be string or undefined for new applications)
  if (app.id !== undefined && typeof app.id !== 'string') {
    throw new Error(`Application.id must be a string, got ${typeof app.id}`);
  }

  // Validate source field (optional string)
  if (app.source !== undefined && app.source !== null && typeof app.source !== 'string') {
    throw new Error(`Application.source must be a string or null, got ${typeof app.source}`);
  }

  // Validate optional string fields (can be null or string)
  const optionalStringFields = ['salary', 'remotePolicy', 'emailId'];
  for (const field of optionalStringFields) {
    if (app[field] !== null && app[field] !== undefined && typeof app[field] !== 'string') {
      throw new Error(
        `Application.${field} must be a string or null, got ${typeof app[field]}`
      );
    }
  }

  // Validate numeric fields
  if (typeof app.confidenceScore !== 'number') {
    throw new Error(
      `Application.confidenceScore must be a number, got ${typeof app.confidenceScore}`
    );
  }

  if (typeof app.isDuplicate !== 'number') {
    throw new Error(
      `Application.isDuplicate must be a number, got ${typeof app.isDuplicate}`
    );
  }

  // Validate confidenceScore range (0-100)
  if (app.confidenceScore < 0 || app.confidenceScore > 100) {
    throw new Error(
      `Application.confidenceScore must be between 0 and 100, got ${app.confidenceScore}`
    );
  }

  // Validate isDuplicate is 0 or 1
  if (app.isDuplicate !== 0 && app.isDuplicate !== 1) {
    throw new Error(
      `Application.isDuplicate must be 0 or 1, got ${app.isDuplicate}`
    );
  }

  // Validate date format for dateApplied (YYYY-MM-DD)
  assertValidDateFormat(app.dateApplied, 'dateApplied');

  // Validate date format for lastUpdate (YYYY-MM-DD)
  assertValidDateFormat(app.lastUpdate, 'lastUpdate');

  // Validate status enum
  assertValidStatus(app.status);

  // Validate createdAt is ISO 8601 timestamp
  if (!isValidISO8601(app.createdAt)) {
    throw new Error(
      `Application.createdAt must be a valid ISO 8601 timestamp, got "${app.createdAt}"`
    );
  }

  // If emailId is present, it should not be empty
  if (app.emailId !== null && app.emailId !== undefined && app.emailId.length === 0) {
    throw new Error('Application.emailId cannot be an empty string');
  }
}

/**
 * Assert that confidence score is calculated correctly
 * According to Requirements 3.10:
 * - 35 points for valid company (not "Unknown Company")
 * - 35 points for valid role (not "Unknown Position")
 * - 30 points for status detection (any valid status)
 * 
 * @param {Object} app - Application object with company, role, status, and confidenceScore
 * @param {number} expected - Expected confidence score (optional, will calculate if not provided)
 * @throws {Error} If confidence score is incorrect
 * 
 * **Validates: Requirements 3.10**
 */
export function assertConfidenceScore(app, expected) {
  if (!app || typeof app !== 'object') {
    throw new Error('Application must be a non-null object');
  }

  // Calculate expected score if not provided
  if (expected === undefined) {
    expected = 0;
    
    // 35 points for valid company
    if (app.company && app.company !== FALLBACK_VALUES.company) {
      expected += 35;
    }
    
    // 35 points for valid role
    if (app.role && app.role !== FALLBACK_VALUES.role) {
      expected += 35;
    }
    
    // 30 points for status detection
    if (app.status && VALID_STATUSES.includes(app.status)) {
      expected += 30;
    }
  }

  if (app.confidenceScore !== expected) {
    // Provide detailed breakdown in error message
    const companyPoints = (app.company && app.company !== FALLBACK_VALUES.company) ? 35 : 0;
    const rolePoints = (app.role && app.role !== FALLBACK_VALUES.role) ? 35 : 0;
    const statusPoints = (app.status && VALID_STATUSES.includes(app.status)) ? 30 : 0;
    
    throw new Error(
      `Confidence score mismatch. Expected ${expected}, got ${app.confidenceScore}.\n` +
      `Breakdown:\n` +
      `  Company "${app.company}": ${companyPoints} points (${app.company === FALLBACK_VALUES.company ? 'fallback' : 'valid'})\n` +
      `  Role "${app.role}": ${rolePoints} points (${app.role === FALLBACK_VALUES.role ? 'fallback' : 'valid'})\n` +
      `  Status "${app.status}": ${statusPoints} points (${VALID_STATUSES.includes(app.status) ? 'valid' : 'invalid'})\n` +
      `  Total: ${companyPoints + rolePoints + statusPoints} points`
    );
  }
}

/**
 * Assert that a date string is in valid YYYY-MM-DD format
 * 
 * @param {string} date - Date string to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @throws {Error} If date format is invalid
 * 
 * **Validates: Requirements 5.1**
 */
export function assertValidDateFormat(date, fieldName = 'date') {
  if (typeof date !== 'string') {
    throw new Error(
      `${fieldName} must be a string, got ${typeof date}`
    );
  }

  // Check format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error(
      `${fieldName} must be in YYYY-MM-DD format, got "${date}"`
    );
  }

  // Validate that it's a real date
  const [year, month, day] = date.split('-').map(Number);
  
  // Check year range (reasonable range for job applications)
  if (year < 2000 || year > 2100) {
    throw new Error(
      `${fieldName} year must be between 2000 and 2100, got ${year}`
    );
  }

  // Check month range
  if (month < 1 || month > 12) {
    throw new Error(
      `${fieldName} month must be between 01 and 12, got ${month}`
    );
  }

  // Check day range
  if (day < 1 || day > 31) {
    throw new Error(
      `${fieldName} day must be between 01 and 31, got ${day}`
    );
  }

  // Validate the date is actually valid (e.g., not Feb 31)
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    throw new Error(
      `${fieldName} "${date}" is not a valid calendar date`
    );
  }
}

/**
 * Assert that status is a valid enum value
 * Valid values: 'Applied', 'Interview', 'Offer', 'Rejected'
 * 
 * @param {string} status - Status string to validate
 * @throws {Error} If status is not a valid enum value
 * 
 * **Validates: Requirements 5.2**
 */
export function assertValidStatus(status) {
  if (typeof status !== 'string') {
    throw new Error(
      `Status must be a string, got ${typeof status}`
    );
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Status must be one of [${VALID_STATUSES.join(', ')}], got "${status}"`
    );
  }
}

/**
 * Assert that an email was parsed correctly
 * Validates that the parsed application matches expected values from the email
 * 
 * @param {Object} email - Original email object
 * @param {Object} parsed - Parsed application object
 * @param {Object} expectations - Expected values (optional)
 * @throws {Error} If parsing is incorrect
 */
export function assertEmailParsedCorrectly(email, parsed, expectations = {}) {
  if (!email || typeof email !== 'object') {
    throw new Error('Email must be a non-null object');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed application must be a non-null object');
  }

  // Validate basic structure
  assertValidApplication(parsed);

  // Check emailId matches
  if (parsed.emailId !== email.id) {
    throw new Error(
      `Parsed application emailId should match email.id. Expected "${email.id}", got "${parsed.emailId}"`
    );
  }

  // Validate expected values if provided
  if (expectations.company && parsed.company !== expectations.company) {
    throw new Error(
      `Expected company "${expectations.company}", got "${parsed.company}"`
    );
  }

  if (expectations.role && parsed.role !== expectations.role) {
    throw new Error(
      `Expected role "${expectations.role}", got "${parsed.role}"`
    );
  }

  if (expectations.status && parsed.status !== expectations.status) {
    throw new Error(
      `Expected status "${expectations.status}", got "${parsed.status}"`
    );
  }

  if (expectations.location && parsed.location !== expectations.location) {
    throw new Error(
      `Expected location "${expectations.location}", got "${parsed.location}"`
    );
  }

  // Validate confidence score
  assertConfidenceScore(parsed);
}

/**
 * Assert that special characters are preserved in a string
 * Validates that unicode, symbols, and accents are not corrupted
 * 
 * @param {string} original - Original string with special characters
 * @param {string} processed - Processed string that should preserve characters
 * @param {string} fieldName - Name of the field (for error messages)
 * @throws {Error} If special characters are not preserved
 * 
 * **Validates: Requirements 5.7**
 */
export function assertSpecialCharactersPreserved(original, processed, fieldName = 'field') {
  if (typeof original !== 'string' || typeof processed !== 'string') {
    throw new Error(
      `Both original and processed ${fieldName} must be strings`
    );
  }

  // Check if the processed string contains the original (or is equal)
  // This allows for extraction from larger text while preserving characters
  if (!processed.includes(original) && processed !== original) {
    // Check if characters were corrupted
    const originalChars = [...original];
    const processedChars = [...processed];
    
    // Find first differing character
    let firstDiff = -1;
    for (let i = 0; i < Math.min(originalChars.length, processedChars.length); i++) {
      if (originalChars[i] !== processedChars[i]) {
        firstDiff = i;
        break;
      }
    }

    if (firstDiff >= 0) {
      throw new Error(
        `Special characters not preserved in ${fieldName}.\n` +
        `First difference at position ${firstDiff}:\n` +
        `  Original: "${originalChars[firstDiff]}" (U+${originalChars[firstDiff].charCodeAt(0).toString(16).toUpperCase()})\n` +
        `  Processed: "${processedChars[firstDiff]}" (U+${processedChars[firstDiff].charCodeAt(0).toString(16).toUpperCase()})`
      );
    }
  }

  // Check for replacement characters (�) which indicate encoding issues
  if (processed.includes('\uFFFD')) {
    throw new Error(
      `${fieldName} contains replacement character (�), indicating encoding corruption`
    );
  }

  // Check for null bytes which can cause truncation
  if (processed.includes('\x00')) {
    throw new Error(
      `${fieldName} contains null bytes which may cause truncation`
    );
  }
}

/**
 * Assert that fallback values are used when extraction fails
 * 
 * @param {Object} app - Application object to check
 * @param {Array<string>} expectedFallbacks - Array of field names that should have fallback values
 * @throws {Error} If fallback values are not used correctly
 * 
 * **Validates: Requirements 5.3, 5.4, 5.5**
 */
export function assertFallbackValuesUsed(app, expectedFallbacks = []) {
  if (!app || typeof app !== 'object') {
    throw new Error('Application must be a non-null object');
  }

  for (const field of expectedFallbacks) {
    if (!FALLBACK_VALUES[field]) {
      throw new Error(`Unknown fallback field: ${field}`);
    }

    if (app[field] !== FALLBACK_VALUES[field]) {
      throw new Error(
        `Expected fallback value for ${field}. Expected "${FALLBACK_VALUES[field]}", got "${app[field]}"`
      );
    }
  }
}

/**
 * Helper function to check if a string is a valid ISO 8601 timestamp
 * @private
 */
function isValidISO8601(dateString) {
  if (typeof dateString !== 'string') {
    return false;
  }

  // Try to parse as ISO 8601
  const date = new Date(dateString);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check if it matches ISO 8601 format (basic check)
  // Should be like: 2024-01-15T10:30:00.000Z or 2024-01-15T10:30:00Z
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return iso8601Regex.test(dateString);
}

// Export constants for use in tests
export const CONSTANTS = {
  VALID_STATUSES,
  FALLBACK_VALUES
};

export default {
  assertValidApplication,
  assertConfidenceScore,
  assertValidDateFormat,
  assertValidStatus,
  assertEmailParsedCorrectly,
  assertSpecialCharactersPreserved,
  assertFallbackValuesUsed,
  CONSTANTS
};
