/**
 * Backward-compatible functional wrapper for FileParserService
 * Delegates to FileParserService class instance
 */

import { FileParserService, ParsingError } from '../services/FileParserService.js';

// Create singleton instance
const fileParserService = new FileParserService();

// Export class for new code
export { FileParserService, ParsingError };

// Export functional wrappers for backward compatibility
export async function parseCSV(file) {
  return fileParserService.parseCSV(file);
}

export async function parseExcel(file) {
  return fileParserService.parseExcel(file);
}

export function validateFormat(file, type) {
  return fileParserService.validateFormat(file, type);
}

// Export singleton instance
export default fileParserService;
