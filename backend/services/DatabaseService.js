/**
 * DatabaseService - OOP wrapper for database operations
 * 
 * Provides a class-based interface for all database interactions with proper
 * encapsulation, error handling, and connection management.
 * 
 * @class DatabaseService
 * @example
 * const dbService = new DatabaseService();
 * await dbService.initialize();
 * const apps = await dbService.getAllApplications('user-123');
 * await dbService.close();
 */

import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Custom error classes for database operations
 */
export class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

export class DuplicateError extends DatabaseError {
  constructor(resource, field, value) {
    super(`${resource} with ${field} '${value}' already exists`);
    this.name = 'DuplicateError';
    this.resource = resource;
    this.field = field;
    this.value = value;
  }
}

/**
 * DatabaseService class
 * 
 * Manages all database operations with proper encapsulation, including:
 * - Application CRUD operations
 * - User management
 * - Email connection management
 * - Status history tracking
 * 
 * @class
 */
export class DatabaseService {
  /**
   * Creates a new DatabaseService instance
   * 
   * @param {string|null} dbPath - Optional path to SQLite database file.
   *                                Defaults to DATABASE_PATH env var or ./database/careerpulse.db
   * @example
   * // Use default database path
   * const db = new DatabaseService();
   * 
   * // Use custom path
   * const db = new DatabaseService('/path/to/custom.db');
   * 
   * // Use in-memory database for testing
   * const db = new DatabaseService(':memory:');
   */
  constructor(dbPath = null) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || join(dirname(__dirname), 'database', 'careerpulse.db');
    this.db = null;
    this.dbRun = null;
    this.dbGet = null;
    this.dbAll = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection and schema
   * 
   * Sets up the SQLite connection, enables foreign keys, loads the schema,
   * and fixes any orphaned email connections. This method is idempotent and
   * can be called multiple times safely.
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {DatabaseError} If initialization fails
   * @example
   * const db = new DatabaseService();
   * await db.initialize();
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.db = new sqlite3.Database(this.dbPath);
      
      // Promisify database methods
      this.dbRun = promisify(this.db.run.bind(this.db));
      this.dbGet = promisify(this.db.get.bind(this.db));
      this.dbAll = promisify(this.db.all.bind(this.db));

      // Enable foreign keys
      await this.dbRun('PRAGMA foreign_keys = ON');

      // Load and execute schema
      await this._loadSchema();

      // Fix orphaned connections
      await this._fixOrphanedConnections();

      this.initialized = true;
      console.log('✅ DatabaseService initialized successfully');
    } catch (error) {
      throw new DatabaseError('Failed to initialize database', error);
    }
  }

  /**
   * Load and execute database schema
   * @private
   */
  async _loadSchema() {
    const schemaPath = join(dirname(__dirname), 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await this.dbRun(statement);
    }
  }

  /**
   * Fix orphaned email connections
   * @private
   */
  async _fixOrphanedConnections() {
    try {
      const connections = await this.dbAll('SELECT * FROM email_connections WHERE connected = 1');
      
      for (const conn of connections) {
        const user = await this.dbGet('SELECT * FROM users WHERE id = ?', [conn.userId]);
        
        if (!user) {
          console.log(`🔧 Creating missing user for connection: ${conn.userId} (${conn.email})`);
          await this.dbRun(`
            INSERT INTO users (id, email, password, name)
            VALUES (?, ?, NULL, ?)
          `, [conn.userId, conn.email, conn.email.split('@')[0]]);
          console.log(`✅ Created user: ${conn.userId}`);
        }
      }
    } catch (error) {
      console.error('⚠️  Error fixing orphaned connections:', error.message);
    }
  }

  /**
   * Close database connection
   * 
   * Gracefully closes the SQLite database connection. Safe to call multiple times.
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {DatabaseError} If closing fails
   * @example
   * await db.close();
   */
  async close() {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(new DatabaseError('Failed to close database', err));
        } else {
          this.initialized = false;
          resolve();
        }
      });
    });
  }

  // ==========================================
  // Application Operations
  // ==========================================

  /**
   * Get all applications for a user
   * 
   * Retrieves all job applications belonging to the specified user,
   * ordered by last update date (most recent first).
   * 
   * @async
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<Array<Object>>} Array of application objects
   * @throws {DatabaseError} If query fails
   * @example
   * const apps = await db.getAllApplications('user-123');
   * console.log(`Found ${apps.length} applications`);
   */
  async getAllApplications(userId) {
    this._ensureInitialized();
    
    try {
      return await this.dbAll(`
        SELECT * FROM applications 
        WHERE userId = ?
        ORDER BY dateApplied DESC
      `, [userId]);
    } catch (error) {
      throw new DatabaseError('Failed to fetch applications', error);
    }
  }

  /**
   * Get application by ID
   * 
   * Retrieves a single application by its ID, ensuring it belongs to the specified user.
   * 
   * @async
   * @param {string} id - The application's unique identifier
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<Object|null>} Application object or null if not found
   * @throws {DatabaseError} If query fails
   * @example
   * const app = await db.getApplicationById('app-123', 'user-123');
   * if (app) {
   *   console.log(`Found application at ${app.company}`);
   * }
   */
  async getApplicationById(id, userId) {
    this._ensureInitialized();
    
    try {
      const app = await this.dbGet(
        'SELECT * FROM applications WHERE id = ? AND userId = ?',
        [id, userId]
      );
      
      if (!app) {
        throw new NotFoundError('Application', id);
      }
      
      return app;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch application', error);
    }
  }

  /**
   * Create a new application
   * 
   * Inserts a new job application into the database. All required fields must be provided.
   * 
   * @async
   * @param {Object} application - The application object to create
   * @param {string} application.id - Unique identifier
   * @param {string} application.userId - User's unique identifier
   * @param {string} application.company - Company name
   * @param {string} application.role - Job role/title
   * @param {string} application.location - Job location
   * @param {string} application.dateApplied - Application date (YYYY-MM-DD)
   * @param {string} application.lastUpdate - Last update timestamp
   * @param {string} application.createdAt - Creation timestamp
   * @param {string} application.status - Application status (Applied, Interview, Offer, Rejected)
   * @param {string} [application.source] - Application source
   * @param {string} [application.salary] - Salary information
   * @param {string} [application.remotePolicy] - Remote work policy
   * @param {string} [application.notes] - Additional notes
   * @param {string} [application.emailId] - Associated email ID
   * @param {number} [application.confidenceScore] - Confidence score (0-100)
   * @param {number} [application.isDuplicate] - Duplicate flag (0 or 1)
   * @returns {Promise<void>}
   * @throws {DatabaseError} If creation fails
   * @example
   * await db.createApplication({
   *   id: 'app-123',
   *   userId: 'user-123',
   *   company: 'Acme Corp',
   *   role: 'Software Engineer',
   *   location: 'San Francisco, CA',
   *   dateApplied: '2024-01-15',
   *   lastUpdate: '2024-01-15T10:00:00Z',
   *   createdAt: '2024-01-15T10:00:00Z',
   *   status: 'Applied',
   *   source: 'LinkedIn',
   *   confidenceScore: 95,
   *   isDuplicate: 0
   * });
   */
  async createApplication(application) {
    this._ensureInitialized();
    
    try {
      await this.dbRun(`
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
        await this.addStatusHistory(application.id, null, application.status);
      }
      
      return application;
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new DuplicateError('Application', 'id', application.id);
      }
      throw new DatabaseError('Failed to create application', error);
    }
  }

  /**
   * Update an application
   * 
   * Updates specific fields of an existing application. Only provided fields are updated.
   * Automatically updates the lastUpdate timestamp.
   * 
   * @async
   * @param {string} id - The application's unique identifier
   * @param {string} userId - The user's unique identifier
   * @param {Object} updates - Object containing fields to update
   * @param {string} [updates.company] - Company name
   * @param {string} [updates.role] - Job role/title
   * @param {string} [updates.location] - Job location
   * @param {string} [updates.dateApplied] - Application date
   * @param {string} [updates.status] - Application status
   * @param {string} [updates.source] - Application source
   * @param {string} [updates.salary] - Salary information
   * @param {string} [updates.remotePolicy] - Remote work policy
   * @param {string} [updates.notes] - Additional notes
   * @param {number} [updates.confidenceScore] - Confidence score
   * @param {number} [updates.isDuplicate] - Duplicate flag
   * @returns {Promise<void>}
   * @throws {NotFoundError} If application not found
   * @throws {DatabaseError} If update fails
   * @example
   * await db.updateApplication('app-123', 'user-123', {
   *   status: 'Interview',
   *   notes: 'Phone screen scheduled for next week'
   * });
   */
  async updateApplication(id, userId, updates) {
    this._ensureInitialized();
    
    try {
      // Check if application exists
      await this.getApplicationById(id, userId);
      
      const fields = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'userId')
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'userId')
        .map(key => updates[key]);
      
      await this.dbRun(`
        UPDATE applications 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND userId = ?
      `, [...values, id, userId]);
      
      // If status changed, add to history
      if (updates.status) {
        const oldApp = await this.getApplicationById(id, userId);
        if (oldApp && oldApp.status !== updates.status) {
          await this.addStatusHistory(id, oldApp.status, updates.status);
        }
      }
      
      return await this.getApplicationById(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update application', error);
    }
  }

  /**
   * Delete an application
   * 
   * Permanently removes an application from the database. This action cannot be undone.
   * 
   * @async
   * @param {string} id - The application's unique identifier
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<void>}
   * @throws {NotFoundError} If application not found
   * @throws {DatabaseError} If deletion fails
   * @example
   * await db.deleteApplication('app-123', 'user-123');
   */
  async deleteApplication(id, userId) {
    this._ensureInitialized();
    
    try {
      // Check if application exists
      await this.getApplicationById(id, userId);
      
      await this.dbRun('DELETE FROM applications WHERE id = ? AND userId = ?', [id, userId]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete application', error);
    }
  }

  /**
   * Find duplicate application
   */
  async findDuplicateApplication(userId, company, role, dateApplied) {
    this._ensureInitialized();
    
    try {
      return await this.dbGet(`
        SELECT * FROM applications 
        WHERE userId = ? AND company = ? AND role = ? AND dateApplied = ?
        LIMIT 1
      `, [userId, company, role, dateApplied]);
    } catch (error) {
      throw new DatabaseError('Failed to check for duplicates', error);
    }
  }

  // ==========================================
  // Status History Operations
  // ==========================================

  /**
   * Add status history entry
   */
  async addStatusHistory(applicationId, oldStatus, newStatus) {
    this._ensureInitialized();
    
    try {
      await this.dbRun(`
        INSERT INTO status_history (applicationId, oldStatus, newStatus, changedAt)
        VALUES (?, ?, ?, ?)
      `, [applicationId, oldStatus, newStatus, new Date().toISOString()]);
    } catch (error) {
      throw new DatabaseError('Failed to add status history', error);
    }
  }

  /**
   * Get status history for an application
   */
  async getStatusHistory(applicationId) {
    this._ensureInitialized();
    
    try {
      return await this.dbAll(`
        SELECT * FROM status_history 
        WHERE applicationId = ? 
        ORDER BY changedAt DESC
      `, [applicationId]);
    } catch (error) {
      throw new DatabaseError('Failed to fetch status history', error);
    }
  }

  // ==========================================
  // User Operations
  // ==========================================

  /**
   * Create a new user
   * 
   * Inserts a new user into the database with the provided information.
   * 
   * @async
   * @param {Object} user - The user object to create
   * @param {string} user.id - Unique identifier
   * @param {string} user.email - User's email address
   * @param {string|null} user.password - Hashed password (null for OAuth users)
   * @param {string} user.name - User's display name
   * @returns {Promise<string>} The created user's ID
   * @throws {DuplicateError} If email already exists
   * @throws {DatabaseError} If creation fails
   * @example
   * const userId = await db.createUser({
   *   id: 'user-123',
   *   email: 'user@example.com',
   *   password: hashedPassword,
   *   name: 'John Doe'
   * });
   */
  async createUser(user) {
    this._ensureInitialized();
    
    try {
      const userId = user.id || `user-${Date.now()}`;
      
      await this.dbRun(`
        INSERT INTO users (id, email, password, name)
        VALUES (?, ?, ?, ?)
      `, [userId, user.email, user.password, user.name]);
      
      return userId;
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new DuplicateError('User', 'email', user.email);
      }
      throw new DatabaseError('Failed to create user', error);
    }
  }

  /**
   * Get user by email
   * 
   * Retrieves a user by their email address.
   * 
   * @async
   * @param {string} email - The user's email address
   * @returns {Promise<Object|null>} User object or null if not found
   * @throws {DatabaseError} If query fails
   * @example
   * const user = await db.getUserByEmail('user@example.com');
   * if (user) {
   *   console.log(`Found user: ${user.name}`);
   * }
   */
  async getUserByEmail(email) {
    this._ensureInitialized();
    
    try {
      return await this.dbGet('SELECT * FROM users WHERE email = ?', [email]);
    } catch (error) {
      throw new DatabaseError('Failed to fetch user by email', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    this._ensureInitialized();
    
    try {
      const user = await this.dbGet('SELECT * FROM users WHERE id = ?', [id]);
      
      if (!user) {
        throw new NotFoundError('User', id);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch user by ID', error);
    }
  }

  // ==========================================
  // Email Connection Operations
  // ==========================================

  /**
   * Save email connection
   */
  async saveEmailConnection(connection) {
    this._ensureInitialized();
    
    try {
      const existing = await this.dbGet('SELECT id FROM email_connections WHERE userId = ?', [connection.userId]);
      
      if (existing) {
        await this.dbRun(`
          UPDATE email_connections 
          SET email = ?, accessToken = ?, refreshToken = ?, expiresAt = ?, connected = 1, updated_at = CURRENT_TIMESTAMP
          WHERE userId = ?
        `, [connection.email, connection.accessToken, connection.refreshToken, connection.expiresAt, connection.userId]);
      } else {
        await this.dbRun(`
          INSERT INTO email_connections (userId, email, accessToken, refreshToken, expiresAt)
          VALUES (?, ?, ?, ?, ?)
        `, [connection.userId, connection.email, connection.accessToken, connection.refreshToken, connection.expiresAt]);
      }
    } catch (error) {
      throw new DatabaseError('Failed to save email connection', error);
    }
  }

  /**
   * Get email connection
   */
  async getEmailConnection(userId = null) {
    this._ensureInitialized();
    
    try {
      if (userId) {
        return await this.dbGet('SELECT * FROM email_connections WHERE userId = ? AND connected = 1', [userId]);
      } else {
        return await this.dbGet('SELECT * FROM email_connections WHERE connected = 1 LIMIT 1');
      }
    } catch (error) {
      throw new DatabaseError('Failed to fetch email connection', error);
    }
  }

  /**
   * Disconnect email
   */
  async disconnectEmail(userId) {
    this._ensureInitialized();
    
    try {
      await this.dbRun('UPDATE email_connections SET connected = 0 WHERE userId = ?', [userId]);
    } catch (error) {
      throw new DatabaseError('Failed to disconnect email', error);
    }
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Ensure database is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new DatabaseError('Database not initialized. Call initialize() first.');
    }
  }
}

// Create singleton instance
const dbService = new DatabaseService();

// Export singleton instance
export default dbService;
