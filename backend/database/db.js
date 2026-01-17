import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, 'careerpulse.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods for easier async/await usage
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Enable foreign keys
await dbRun('PRAGMA foreign_keys = ON');

/**
 * Initialize the database with schema
 */
export async function initializeDatabase() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  // Split and execute each statement separately
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    await dbRun(statement);
  }
  console.log('✅ Database initialized successfully');
}

/**
 * Get all applications for a user
 */
export async function getAllApplications(userId) {
  return await dbAll(`
    SELECT * FROM applications 
    WHERE userId = ?
    ORDER BY dateApplied DESC
  `, [userId]);
}

/**
 * Get application by ID (user-specific)
 */
export async function getApplicationById(id, userId) {
  return await dbGet('SELECT * FROM applications WHERE id = ? AND userId = ?', [id, userId]);
}

/**
 * Create a new application
 */
export async function createApplication(application) {
  const result = await dbRun(`
    INSERT INTO applications (
      id, userId, company, role, location, dateApplied, lastUpdate, createdAt,
      status, source, salary, remotePolicy, notes, emailId, confidenceScore, isDuplicate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    application.id, application.userId, application.company, application.role, application.location,
    application.dateApplied, application.lastUpdate, application.createdAt,
    application.status, application.source, application.salary, application.remotePolicy,
    application.notes, application.emailId, application.confidenceScore, application.isDuplicate
  ]);
  
  // Add to status history
  if (application.status) {
    await addStatusHistory(application.id, null, application.status);
  }
  
  return result;
}

/**
 * Update an application (user-specific)
 */
export async function updateApplication(id, userId, updates) {
  const fields = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'userId')
    .map(key => `${key} = ?`)
    .join(', ');
  
  const values = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'userId')
    .map(key => updates[key]);
  
  const result = await dbRun(`
    UPDATE applications 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND userId = ?
  `, [...values, id, userId]);
  
  // If status changed, add to history
  if (updates.status) {
    const oldApp = await getApplicationById(id, userId);
    if (oldApp && oldApp.status !== updates.status) {
      await addStatusHistory(id, oldApp.status, updates.status);
    }
  }
  
  return result;
}

/**
 * Delete an application (user-specific)
 */
export async function deleteApplication(id, userId) {
  return await dbRun('DELETE FROM applications WHERE id = ? AND userId = ?', [id, userId]);
}

/**
 * Add status history entry
 */
export async function addStatusHistory(applicationId, oldStatus, newStatus) {
  return await dbRun(`
    INSERT INTO status_history (applicationId, oldStatus, newStatus, changedAt)
    VALUES (?, ?, ?, ?)
  `, [applicationId, oldStatus, newStatus, new Date().toISOString()]);
}

/**
 * Get status history for an application
 */
export async function getStatusHistory(applicationId) {
  return await dbAll(`
    SELECT * FROM status_history 
    WHERE applicationId = ? 
    ORDER BY changedAt DESC
  `, [applicationId]);
}

/**
 * Save email connection
 */
export async function saveEmailConnection(connection) {
  // SQLite doesn't support UPSERT with ON CONFLICT in older versions, so we'll do it manually
  const existing = await dbGet('SELECT id FROM email_connections WHERE userId = ?', [connection.userId]);
  
  if (existing) {
    return await dbRun(`
      UPDATE email_connections 
      SET email = ?, accessToken = ?, refreshToken = ?, expiresAt = ?, connected = 1, updated_at = CURRENT_TIMESTAMP
      WHERE userId = ?
    `, [connection.email, connection.accessToken, connection.refreshToken, connection.expiresAt, connection.userId]);
  } else {
    return await dbRun(`
      INSERT INTO email_connections (userId, email, accessToken, refreshToken, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `, [connection.userId, connection.email, connection.accessToken, connection.refreshToken, connection.expiresAt]);
  }
}

/**
 * Get email connection
 */
export async function getEmailConnection(userId) {
  if (userId) {
    return await dbGet('SELECT * FROM email_connections WHERE userId = ? AND connected = 1', [userId]);
  } else {
    // If no userId provided, return any connected user (useful for testing)
    return await dbGet('SELECT * FROM email_connections WHERE connected = 1 LIMIT 1');
  }
}

/**
 * Disconnect email
 */
export async function disconnectEmail(userId) {
  return await dbRun('UPDATE email_connections SET connected = 0 WHERE userId = ?', [userId]);
}

/**
 * Check for duplicate applications (user-specific)
 */
export async function findDuplicateApplication(userId, company, role, dateApplied) {
  return await dbGet(`
    SELECT * FROM applications 
    WHERE userId = ? AND company = ? AND role = ? AND dateApplied = ?
    LIMIT 1
  `, [userId, company, role, dateApplied]);
}

/**
 * User management functions
 */

/**
 * Create a new user
 */
export async function createUser(user) {
  return await dbRun(`
    INSERT INTO users (id, email, password, name)
    VALUES (?, ?, ?, ?)
  `, [user.id, user.email, user.password, user.name]);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  return await dbGet('SELECT * FROM users WHERE email = ?', [email]);
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  return await dbGet('SELECT * FROM users WHERE id = ?', [id]);
}

/**
 * Close database connection
 */
export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Initialize database on import
await initializeDatabase();

export default db;
