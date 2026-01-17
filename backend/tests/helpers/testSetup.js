/**
 * Test Database Manager
 * Manages test database lifecycle for unit and integration tests
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TestDatabaseManager {
  constructor(options = {}) {
    // Handle both string path and options object
    if (typeof options === 'string') {
      this.dbPath = options;
      this.useInMemory = options === ':memory:';
    } else {
      this.useInMemory = options.useInMemory !== false;
      this.dbPath = this.useInMemory ? ':memory:' : (options.dbPath || 'test.db');
    }
    this.db = null;
  }

  /**
   * Initialize clean test database with schema
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Read and execute schema
          const schemaPath = path.join(__dirname, '../../database/schema.sql');
          const schema = fs.readFileSync(schemaPath, 'utf8');
          
          // Split by semicolon and execute each statement
          const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          for (const statement of statements) {
            await this.run(statement);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Seed database with test data
   */
  async seed(data) {
    if (data.users) {
      for (const user of data.users) {
        await this.run(
          `INSERT INTO users (id, email, password, name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.email,
            user.password || null,
            user.name || null,
            user.createdAt || user.created_at || new Date().toISOString(),
            user.updatedAt || user.updated_at || new Date().toISOString()
          ]
        );
      }
    }

    if (data.applications) {
      for (const app of data.applications) {
        await this.run(
          `INSERT INTO applications (
            id, userId, company, role, location, dateApplied, lastUpdate,
            status, source, salary, remotePolicy, notes, emailId, confidenceScore, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            app.id,
            app.userId,
            app.company,
            app.role,
            app.location,
            app.dateApplied,
            app.lastUpdate,
            app.status,
            app.source,
            app.salary,
            app.remotePolicy,
            app.notes,
            app.emailId,
            app.confidenceScore,
            app.createdAt || new Date().toISOString()
          ]
        );
      }
    }

    if (data.emailConnections) {
      for (const conn of data.emailConnections) {
        await this.run(
          `INSERT INTO email_connections (
            userId, email, accessToken, refreshToken, expiresAt, connected
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            conn.userId,
            conn.email,
            conn.accessToken,
            conn.refreshToken,
            conn.expiresAt || conn.tokenExpiry,
            conn.connected !== undefined ? conn.connected : (conn.isConnected !== undefined ? conn.isConnected : 1)
          ]
        );
      }
    }

    if (data.statusHistory) {
      for (const history of data.statusHistory) {
        await this.run(
          `INSERT INTO status_history (
            applicationId, oldStatus, newStatus, changedAt
          ) VALUES (?, ?, ?, ?)`,
          [
            history.applicationId,
            history.oldStatus,
            history.newStatus,
            history.changedAt
          ]
        );
      }
    }
  }

  /**
   * Clean all tables
   */
  async clean() {
    await this.run('DELETE FROM status_history');
    await this.run('DELETE FROM applications');
    await this.run('DELETE FROM email_connections');
    await this.run('DELETE FROM users');
  }

  /**
   * Get database connection
   */
  getConnection() {
    return this.db;
  }

  /**
   * Execute a SQL query (alias for all())
   */
  query(sql, params = []) {
    return this.all(sql, params);
  }

  /**
   * Execute a SQL statement
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Execute a SQL query
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute a SQL query returning all rows
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Teardown database
   */
  async teardown() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export default TestDatabaseManager;
