/**
 * Duplicate Detection Service
 * Checks if an application is a duplicate of an existing one
 */

import { findDuplicateApplication } from '../database/db.js';

/**
 * Check if two strings are similar using simple comparison
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Calculate simple word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);
  
  return similarity;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Check if an application is a duplicate
 * Returns { isDuplicate: boolean, duplicateId: string|null, similarity: number }
 */
export async function checkDuplicate(application) {
  const { userId, company, role, dateApplied } = application;
  
  // First, check exact match in database
  const exactMatch = await findDuplicateApplication(userId, company, role, dateApplied);
  
  if (exactMatch) {
    return {
      isDuplicate: true,
      duplicateId: exactMatch.id,
      similarity: 1.0,
      reason: 'Exact match (company, role, and date)'
    };
  }
  
  // TODO: For MVP, we only check exact matches
  // In future, could implement fuzzy matching:
  // - Similar company names (e.g., "Google" vs "Google Inc")
  // - Similar role names (e.g., "Software Engineer" vs "SWE")
  // - Same day applications (ignoring time)
  
  return {
    isDuplicate: false,
    duplicateId: null,
    similarity: 0,
    reason: null
  };
}

/**
 * Find similar applications (for future enhancement)
 */
export async function findSimilarApplications(application, threshold = 0.7) {
  // This is a placeholder for future implementation
  // Would query database and compare using fuzzy matching
  return [];
}

export default {
  checkDuplicate,
  findSimilarApplications
};
