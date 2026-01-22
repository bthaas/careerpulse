/**
 * DuplicateDetector Class - OOP Implementation
 * Encapsulates duplicate detection logic
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6**
 */

/**
 * DuplicateDetector Class
 * Manages duplicate detection with database delegation
 */
export class DuplicateDetector {
  /**
   * Create a DuplicateDetector instance
   * @param {Object} databaseService - DatabaseService instance
   */
  constructor(databaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Check if two strings are similar using simple comparison
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  stringSimilarity(str1, str2) {
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
   * @param {string} dateStr - Date string
   * @returns {string} Normalized date
   */
  normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  /**
   * Check if an application is a duplicate
   * @param {Object} application - Application to check
   * @param {string} application.userId - User ID
   * @param {string} application.company - Company name
   * @param {string} application.role - Job role
   * @param {string} application.dateApplied - Application date
   * @returns {Promise<Object>} Duplicate result
   */
  async checkDuplicate(application) {
    const { userId, company, role, dateApplied } = application;
    
    // First, check exact match in database (delegate to DatabaseService)
    const exactMatch = await this.databaseService.findDuplicateApplication(
      userId,
      company,
      role,
      dateApplied
    );
    
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
   * @param {Object} application - Application to compare
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Array>} Array of similar applications
   */
  async findSimilarApplications(application, threshold = 0.7) {
    // This is a placeholder for future implementation
    // Would query database and compare using fuzzy matching
    
    // For now, get all applications for the user and compare
    const { userId } = application;
    
    if (!userId) {
      return [];
    }
    
    try {
      const allApplications = await this.databaseService.getAllApplications(userId);
      const similar = [];
      
      for (const app of allApplications) {
        // Skip the same application
        if (app.id === application.id) {
          continue;
        }
        
        // Calculate similarity
        const companySim = this.stringSimilarity(application.company, app.company);
        const roleSim = this.stringSimilarity(application.role, app.role);
        
        // Average similarity
        const avgSim = (companySim + roleSim) / 2;
        
        if (avgSim >= threshold) {
          similar.push({
            ...app,
            similarity: avgSim
          });
        }
      }
      
      // Sort by similarity (highest first)
      similar.sort((a, b) => b.similarity - a.similarity);
      
      return similar;
    } catch (error) {
      console.error('Error finding similar applications:', error);
      return [];
    }
  }
}

// ==========================================
// Backward Compatible Functional Exports
// ==========================================

// Create singleton instance for backward compatibility
// This avoids circular dependency with container.js
import { DatabaseService } from './DatabaseService.js';

let _duplicateDetectorInstance = null;
let _databaseServiceInstance = null;

function getDuplicateDetectorInstance() {
  if (!_duplicateDetectorInstance) {
    if (!_databaseServiceInstance) {
      _databaseServiceInstance = new DatabaseService();
    }
    _duplicateDetectorInstance = new DuplicateDetector(_databaseServiceInstance);
  }
  return _duplicateDetectorInstance;
}

/**
 * Check if an application is a duplicate (functional wrapper)
 * @param {Object} application - Application to check
 * @returns {Promise<Object>} Duplicate check result
 */
export async function checkDuplicate(application) {
  const duplicateDetector = getDuplicateDetectorInstance();
  return duplicateDetector.checkDuplicate(application);
}

/**
 * Find similar applications (functional wrapper)
 * @param {Object} application - Application to compare
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Array>} Array of similar applications
 */
export async function findSimilarApplications(application, threshold = 0.7) {
  const duplicateDetector = getDuplicateDetectorInstance();
  return duplicateDetector.findSimilarApplications(application, threshold);
}
