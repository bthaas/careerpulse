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
 * Get all applications
 */
export async function getAllApplications() {
  return await dbAll(`
    SELECT * FROM applications 
    ORDER BY dateApplied DESC
  `);
}

/**
 * Get application by ID
 */
export async function getApplicationById(id) {
  return await dbGet('SELECT * FROM applications WHERE id = ?', [id]);
}

/**
 * Create a new application
 */
export async function createApplication(application) {
  const result = await dbRun(`
    INSERT INTO applications (
      id, company, role, location, dateApplied, lastUpdate, createdAt,
      status, source, salary, remotePolicy, notes, emailId, confidenceScore, isDuplicate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    application.id, application.company, application.role, application.location,
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
 * Update an application
 */
export async function updateApplication(id, updates) {
  const fields = Object.keys(updates)
    .filter(key => key !== 'id')
    .map(key => `${key} = ?`)
    .join(', ');
  
  const values = Object.keys(updates)
    .filter(key => key !== 'id')
    .map(key => updates[key]);
  
  const result = await dbRun(`
    UPDATE applications 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [...values, id]);
  
  // If status changed, add to history
  if (updates.status) {
    const oldApp = await getApplicationById(id);
    if (oldApp && oldApp.status !== updates.status) {
      await addStatusHistory(id, oldApp.status, updates.status);
    }
  }
  
  return result;
}

/**
 * Delete an application
 */
export async function deleteApplication(id) {
  return await dbRun('DELETE FROM applications WHERE id = ?', [id]);
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
export async function getEmailConnection(userId = 'default_user') {
  return await dbGet('SELECT * FROM email_connections WHERE userId = ? AND connected = 1', [userId]);
}

/**
 * Disconnect email
 */
export async function disconnectEmail(userId = 'default_user') {
  return await dbRun('UPDATE email_connections SET connected = 0 WHERE userId = ?', [userId]);
}

/**
 * Check for duplicate applications
 */
export async function findDuplicateApplication(company, role, dateApplied) {
  return await dbGet(`
    SELECT * FROM applications 
    WHERE company = ? AND role = ? AND dateApplied = ?
    LIMIT 1
  `, [company, role, dateApplied]);
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
