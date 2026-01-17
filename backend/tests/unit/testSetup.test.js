/**
 * Unit Tests for TestDatabaseManager
 * 
 * Tests the test database manager functionality including:
 * - Database initialization
 * - Data seeding
 * - Database cleaning
 * - Connection management
 * - Teardown
 * 
 * Requirements: 10.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabaseManager } from '../helpers/testSetup.js';
import { v4 as uuidv4 } from 'uuid';

describe('TestDatabaseManager', () => {
  let dbManager;

  beforeEach(async () => {
    // Create a new in-memory database for each test
    dbManager = new TestDatabaseManager({ useInMemory: true });
    await dbManager.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    if (dbManager) {
      await dbManager.teardown();
    }
  });

  describe('initialize()', () => {
    it('should create database with schema', async () => {
      // Verify tables exist by querying sqlite_master
      const tables = await dbManager.query(
        `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
      );

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('applications');
      expect(tableNames).toContain('email_connections');
      expect(tableNames).toContain('status_history');
    });

    it('should create indexes', async () => {
      // Verify indexes exist
      const indexes = await dbManager.query(
        `SELECT name FROM sqlite_master WHERE type='index' ORDER BY name`
      );

      const indexNames = indexes.map(i => i.name);
      expect(indexNames).toContain('idx_users_email');
      expect(indexNames).toContain('idx_applications_userId');
      expect(indexNames).toContain('idx_applications_status');
    });

    it('should create empty tables', async () => {
      // Verify tables are empty
      const userCount = await dbManager.query('SELECT COUNT(*) as count FROM users');
      const appCount = await dbManager.query('SELECT COUNT(*) as count FROM applications');
      const connCount = await dbManager.query('SELECT COUNT(*) as count FROM email_connections');

      expect(userCount[0].count).toBe(0);
      expect(appCount[0].count).toBe(0);
      expect(connCount[0].count).toBe(0);
    });

    it('should handle multiple initializations', async () => {
      // Initialize again - should not throw error
      await expect(dbManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('seed()', () => {
    it('should seed users', async () => {
      const testData = {
        users: [
          {
            id: uuidv4(),
            email: 'test@example.com',
            password: 'hashed_password',
            createdAt: new Date().toISOString(),
          },
        ],
      };

      await dbManager.seed(testData);

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('test@example.com');
      expect(users[0].password).toBe('hashed_password');
    });

    it('should seed email connections', async () => {
      const userId = uuidv4();
      const testData = {
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'hashed_password',
            createdAt: new Date().toISOString(),
          },
        ],
        emailConnections: [
          {
            userId,
            email: 'gmail@example.com',
            accessToken: 'access_token_123',
            refreshToken: 'refresh_token_456',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            connected: 1,
          },
        ],
      };

      await dbManager.seed(testData);

      const connections = await dbManager.query('SELECT * FROM email_connections');
      expect(connections).toHaveLength(1);
      expect(connections[0].email).toBe('gmail@example.com');
      expect(connections[0].accessToken).toBe('access_token_123');
      expect(connections[0].refreshToken).toBe('refresh_token_456');
      expect(connections[0].connected).toBe(1);
    });

    it('should seed applications', async () => {
      const userId = uuidv4();
      const appId = uuidv4();
      const testData = {
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'hashed_password',
            createdAt: new Date().toISOString(),
          },
        ],
        applications: [
          {
            id: appId,
            userId,
            company: 'Test Company',
            role: 'Software Engineer',
            location: 'Remote',
            dateApplied: '2024-01-15',
            lastUpdate: '2024-01-15',
            createdAt: new Date().toISOString(),
            status: 'Applied',
            source: 'Email',
            salary: null,
            remotePolicy: null,
            notes: 'Test application',
            emailId: 'email_123',
            confidenceScore: 70,
            isDuplicate: 0,
          },
        ],
      };

      await dbManager.seed(testData);

      const applications = await dbManager.query('SELECT * FROM applications');
      expect(applications).toHaveLength(1);
      expect(applications[0].company).toBe('Test Company');
      expect(applications[0].role).toBe('Software Engineer');
      expect(applications[0].status).toBe('Applied');
      expect(applications[0].confidenceScore).toBe(70);
    });

    it('should seed multiple records', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      const testData = {
        users: [
          {
            id: userId1,
            email: 'user1@example.com',
            password: 'password1',
            createdAt: new Date().toISOString(),
          },
          {
            id: userId2,
            email: 'user2@example.com',
            password: 'password2',
            createdAt: new Date().toISOString(),
          },
        ],
      };

      await dbManager.seed(testData);

      const users = await dbManager.query('SELECT * FROM users ORDER BY email');
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });

    it('should handle empty seed data', async () => {
      await expect(dbManager.seed({})).resolves.not.toThrow();

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(0);
    });

    it('should seed all data types together', async () => {
      const userId = uuidv4();
      const appId = uuidv4();
      const testData = {
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'hashed_password',
            createdAt: new Date().toISOString(),
          },
        ],
        emailConnections: [
          {
            userId,
            email: 'gmail@example.com',
            accessToken: 'access_token',
            refreshToken: 'refresh_token',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            connected: 1,
          },
        ],
        applications: [
          {
            id: appId,
            userId,
            company: 'Test Company',
            role: 'Developer',
            location: 'Remote',
            dateApplied: '2024-01-15',
            lastUpdate: '2024-01-15',
            createdAt: new Date().toISOString(),
            status: 'Applied',
            source: 'Email',
            salary: null,
            remotePolicy: null,
            notes: '',
            emailId: 'email_123',
            confidenceScore: 70,
            isDuplicate: 0,
          },
        ],
      };

      await dbManager.seed(testData);

      const users = await dbManager.query('SELECT * FROM users');
      const connections = await dbManager.query('SELECT * FROM email_connections');
      const applications = await dbManager.query('SELECT * FROM applications');

      expect(users).toHaveLength(1);
      expect(connections).toHaveLength(1);
      expect(applications).toHaveLength(1);
    });
  });

  describe('clean()', () => {
    it('should delete all data from tables', async () => {
      // Seed some data first
      const userId = uuidv4();
      const appId = uuidv4();
      const testData = {
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
        emailConnections: [
          {
            userId,
            email: 'gmail@example.com',
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: new Date().toISOString(),
            connected: 1,
          },
        ],
        applications: [
          {
            id: appId,
            userId,
            company: 'Company',
            role: 'Role',
            location: 'Location',
            dateApplied: '2024-01-15',
            lastUpdate: '2024-01-15',
            createdAt: new Date().toISOString(),
            status: 'Applied',
            source: 'Email',
            salary: null,
            remotePolicy: null,
            notes: '',
            emailId: 'email_123',
            confidenceScore: 70,
            isDuplicate: 0,
          },
        ],
      };

      await dbManager.seed(testData);

      // Verify data exists
      let users = await dbManager.query('SELECT * FROM users');
      let connections = await dbManager.query('SELECT * FROM email_connections');
      let applications = await dbManager.query('SELECT * FROM applications');

      expect(users).toHaveLength(1);
      expect(connections).toHaveLength(1);
      expect(applications).toHaveLength(1);

      // Clean database
      await dbManager.clean();

      // Verify all data is deleted
      users = await dbManager.query('SELECT * FROM users');
      connections = await dbManager.query('SELECT * FROM email_connections');
      applications = await dbManager.query('SELECT * FROM applications');

      expect(users).toHaveLength(0);
      expect(connections).toHaveLength(0);
      expect(applications).toHaveLength(0);
    });

    it('should handle cleaning empty database', async () => {
      await expect(dbManager.clean()).resolves.not.toThrow();

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(0);
    });

    it('should allow re-seeding after clean', async () => {
      const userId = uuidv4();
      const testData = {
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      };

      // Seed, clean, seed again
      await dbManager.seed(testData);
      await dbManager.clean();
      await dbManager.seed(testData);

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(1);
    });
  });

  describe('getConnection()', () => {
    it('should return database connection', () => {
      const connection = dbManager.getConnection();
      expect(connection).toBeDefined();
      expect(connection).toBe(dbManager.db);
    });

    it('should return working connection', async () => {
      const connection = dbManager.getConnection();

      // Test that connection works
      const result = await new Promise((resolve, reject) => {
        connection.get('SELECT 1 as test', (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      expect(result.test).toBe(1);
    });
  });

  describe('query()', () => {
    it('should execute SELECT queries', async () => {
      const userId = uuidv4();
      await dbManager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const results = await dbManager.query('SELECT * FROM users WHERE email = ?', [
        'test@example.com',
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('test@example.com');
    });

    it('should return empty array for no results', async () => {
      const results = await dbManager.query('SELECT * FROM users WHERE email = ?', [
        'nonexistent@example.com',
      ]);

      expect(results).toHaveLength(0);
    });

    it('should handle queries without parameters', async () => {
      const results = await dbManager.query('SELECT * FROM users');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('run()', () => {
    it('should execute INSERT queries', async () => {
      const userId = uuidv4();
      const result = await dbManager.run(
        'INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, ?)',
        [userId, 'test@example.com', 'password', new Date().toISOString()]
      );

      expect(result.changes).toBe(1);

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(1);
    });

    it('should execute UPDATE queries', async () => {
      const userId = uuidv4();
      await dbManager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const result = await dbManager.run('UPDATE users SET email = ? WHERE id = ?', [
        'updated@example.com',
        userId,
      ]);

      expect(result.changes).toBe(1);

      const users = await dbManager.query('SELECT * FROM users WHERE id = ?', [userId]);
      expect(users[0].email).toBe('updated@example.com');
    });

    it('should execute DELETE queries', async () => {
      const userId = uuidv4();
      await dbManager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const result = await dbManager.run('DELETE FROM users WHERE id = ?', [userId]);

      expect(result.changes).toBe(1);

      const users = await dbManager.query('SELECT * FROM users');
      expect(users).toHaveLength(0);
    });
  });

  describe('teardown()', () => {
    it('should close database connection', async () => {
      await dbManager.teardown();

      // Attempting to use the connection after teardown should fail
      await expect(
        dbManager.query('SELECT * FROM users')
      ).rejects.toThrow();
    });

    it('should handle multiple teardowns', async () => {
      await dbManager.teardown();
      await expect(dbManager.teardown()).resolves.not.toThrow();
    });

    it('should handle teardown without initialization', async () => {
      const newManager = new TestDatabaseManager({ useInMemory: true });
      await expect(newManager.teardown()).resolves.not.toThrow();
    });
  });

  describe('constructor options', () => {
    it('should use in-memory database by default', () => {
      const manager = new TestDatabaseManager();
      expect(manager.useInMemory).toBe(true);
      expect(manager.dbPath).toBe(':memory:');
    });

    it('should allow custom database path', () => {
      const manager = new TestDatabaseManager({
        useInMemory: false,
        dbPath: './test.db',
      });
      expect(manager.useInMemory).toBe(false);
      expect(manager.dbPath).toBe('./test.db');
    });

    it('should respect useInMemory option', () => {
      const manager = new TestDatabaseManager({ useInMemory: false });
      expect(manager.useInMemory).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete test lifecycle', async () => {
      // Initialize
      const manager = new TestDatabaseManager({ useInMemory: true });
      await manager.initialize();

      // Seed data
      const userId = uuidv4();
      await manager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      // Query data
      let users = await manager.query('SELECT * FROM users');
      expect(users).toHaveLength(1);

      // Clean data
      await manager.clean();
      users = await manager.query('SELECT * FROM users');
      expect(users).toHaveLength(0);

      // Teardown
      await manager.teardown();
    });

    it('should support foreign key relationships', async () => {
      const userId = uuidv4();
      const appId = uuidv4();

      await dbManager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
        applications: [
          {
            id: appId,
            userId,
            company: 'Company',
            role: 'Role',
            location: 'Location',
            dateApplied: '2024-01-15',
            lastUpdate: '2024-01-15',
            createdAt: new Date().toISOString(),
            status: 'Applied',
            source: 'Email',
            salary: null,
            remotePolicy: null,
            notes: '',
            emailId: 'email_123',
            confidenceScore: 70,
            isDuplicate: 0,
          },
        ],
      });

      // Verify relationship
      const applications = await dbManager.query(
        `SELECT a.*, u.email 
         FROM applications a 
         JOIN users u ON a.userId = u.id`
      );

      expect(applications).toHaveLength(1);
      expect(applications[0].email).toBe('test@example.com');
    });

    it('should enforce status CHECK constraint', async () => {
      const userId = uuidv4();
      const appId = uuidv4();

      await dbManager.seed({
        users: [
          {
            id: userId,
            email: 'test@example.com',
            password: 'password',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      // Try to insert application with invalid status
      await expect(
        dbManager.run(
          `INSERT INTO applications (id, userId, company, role, location, dateApplied, lastUpdate, createdAt, status, source, emailId, confidenceScore, isDuplicate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            appId,
            userId,
            'Company',
            'Role',
            'Location',
            '2024-01-15',
            '2024-01-15',
            new Date().toISOString(),
            'InvalidStatus', // Invalid status
            'Email',
            'email_123',
            70,
            0,
          ]
        )
      ).rejects.toThrow();
    });
  });
});
