/**
 * Database module - Backward compatible wrapper for DatabaseService
 * This file maintains the original functional API while using the new OOP implementation
 */

import dbService from '../services/DatabaseService.js';

// Initialize the database service
await dbService.initialize();


// ==========================================
// Backward Compatible Function Exports
// ==========================================

/**
 * Initialize the database with schema
 */
export async function initializeDatabase() {
  return await dbService.initialize();
}

/**
 * Get all applications for a user
 */
export async function getAllApplications(userId) {
  return await dbService.getAllApplications(userId);
}

/**
 * Get application by ID (user-specific)
 */
export async function getApplicationById(id, userId) {
  try {
    return await dbService.getApplicationById(id, userId);
  } catch (error) {
    // Return null for backward compatibility (original behavior)
    if (error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new application
 */
export async function createApplication(application) {
  return await dbService.createApplication(application);
}

/**
 * Update an application (user-specific)
 */
export async function updateApplication(id, userId, updates) {
  return await dbService.updateApplication(id, userId, updates);
}

/**
 * Delete an application (user-specific)
 */
export async function deleteApplication(id, userId) {
  return await dbService.deleteApplication(id, userId);
}

/**
 * Add status history entry
 */
export async function addStatusHistory(applicationId, oldStatus, newStatus) {
  return await dbService.addStatusHistory(applicationId, oldStatus, newStatus);
}

/**
 * Get status history for an application
 */
export async function getStatusHistory(applicationId) {
  return await dbService.getStatusHistory(applicationId);
}

/**
 * Save email connection
 */
export async function saveEmailConnection(connection) {
  return await dbService.saveEmailConnection(connection);
}

/**
 * Get email connection
 */
export async function getEmailConnection(userId) {
  return await dbService.getEmailConnection(userId);
}

/**
 * Disconnect email
 */
export async function disconnectEmail(userId) {
  return await dbService.disconnectEmail(userId);
}

/**
 * Check for duplicate applications (user-specific)
 */
export async function findDuplicateApplication(userId, company, role, dateApplied) {
  return await dbService.findDuplicateApplication(userId, company, role, dateApplied);
}

/**
 * Create a new user
 */
export async function createUser(user) {
  return await dbService.createUser(user);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  return await dbService.getUserByEmail(email);
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  try {
    return await dbService.getUserById(id);
  } catch (error) {
    // Return null for backward compatibility (original behavior)
    if (error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  return dbService.close();
}

// Export the database service instance for direct access
export { dbService };

// Export default for backward compatibility
export default dbService.db;
