/**
 * Excel (.xlsx) Parser for Job Applications
 * Converts Excel files to CSV format for unified processing
 */

import XLSX from 'xlsx';

/**
 * Parse Excel file buffer into CSV text
 * @param {Buffer} buffer - Excel file buffer
 * @returns {string} CSV text
 */
export function excelToCSV(buffer) {
  try {
    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    return csv;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Detect if file is Excel based on buffer magic numbers
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if Excel file
 */
export function isExcelFile(buffer) {
  if (!buffer || buffer.length < 4) {
    return false;
  }
  
  // Check for Excel magic numbers
  // XLSX starts with PK (ZIP format): 50 4B
  // XLS starts with: D0 CF 11 E0
  const magicNumber = buffer.slice(0, 4);
  
  // XLSX (ZIP format)
  if (magicNumber[0] === 0x50 && magicNumber[1] === 0x4B) {
    return true;
  }
  
  // Legacy XLS
  if (magicNumber[0] === 0xD0 && magicNumber[1] === 0xCF &&
      magicNumber[2] === 0x11 && magicNumber[3] === 0xE0) {
    return true;
  }
  
  return false;
}

export default {
  excelToCSV,
  isExcelFile
};
