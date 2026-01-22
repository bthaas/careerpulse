/**
 * Unit Tests for DatabaseService
 * Tests specific examples and edge cases for database operations
 * 
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6, 1.7**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService, DatabaseError, NotFoundError, DuplicateError } from '../../services/DatabaseService.js';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('DatabaseService Unit Tests', () => {
  let dbService;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test database
    tempDir = mkdtempSync(join(tmpdir(), 'db-unit-test-'));
    const dbPath = join(tempDir, 'test.db');
    
    dbService = new DatabaseService(dbPath);
    await dbService.initialize();
  });

  afterEach(async () => {
    await dbService.close();
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Connection Management', () => {
    it('should initialize database successfully', async () => {
      expect(dbService.initialized).toBe(true);
      expect(dbService.db).toBeDefined();
    });

    it('should close database connection', async () => {
      const tempDb = new DatabaseService(join(tempDir, 'close-test.db'));
      await tempDb.initialize();
      
      await tempDb.close();
      expect(tempDb.initialized).toBe(false);
    });

    it('should throw error when operations called before initialization', async () => {
      const uninitDb = new DatabaseService(join(tempDir, 'uninit.db'));
      
      await expect(uninitDb.getUserById('test')).rejects.toThrow(DatabaseError);
      await expect(uninitDb.getUserById('test')).rejects.toThrow('not initialized');
    });
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };

      const userId = await dbService.createUser(user);
      
      expect(userId).toBeDefined();
      expect(userId).toMatch(/^user-\d+$/);
    });

    it('should retrieve user by ID', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };

      const userId = await dbService.createUser(user);
      const retrieved = await dbService.getUserById(userId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(userId);
      expect(retrieved.email).toBe(user.email);
      expect(retrieved.name).toBe(user.name);
    });

    it('should retrieve user by email', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };

      await dbService.createUser(user);
      const retrieved = await dbService.getUserByEmail(user.email);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.email).toBe(user.email);
      expect(retrieved.name).toBe(user.name);
    });

    it('should throw NotFoundError for non-existent user ID', async () => {
      await expect(dbService.getUserById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should return undefined for non-existent user email', async () => {
      const user = await dbService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });

    it('should throw DuplicateError for duplicate email', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };

      await dbService.createUser(user);
      
      await expect(dbService.createUser(user)).rejects.toThrow(DuplicateError);
    });
  });

  describe('Application CRUD Operations', () => {
    let userId;

    beforeEach(async () => {
      userId = await dbService.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });
    });

    it('should create a new application', async () => {
      const application = {
        id: 'app-test-1',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: '$100k-$150k',
        remotePolicy: 'Remote',
        notes: 'Test notes',
        emailId: null,
        confidenceScore: 95,
        isDuplicate: 0
      };

      const created = await dbService.createApplication(application);
      
      expect(created).toEqual(application);
    });

    it('should retrieve application by ID', async () => {
      const application = {
        id: 'app-test-2',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      await dbService.createApplication(application);
      const retrieved = await dbService.getApplicationById(application.id, userId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(application.id);
      expect(retrieved.company).toBe(application.company);
      expect(retrieved.role).toBe(application.role);
    });

    it('should get all applications for a user', async () => {
      const app1 = {
        id: 'app-test-3',
        userId,
        company: 'Company A',
        role: 'Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      const app2 = {
        id: 'app-test-4',
        userId,
        company: 'Company B',
        role: 'Developer',
        location: 'Hybrid',
        dateApplied: '2024-01-16',
        lastUpdate: '2024-01-16',
        createdAt: new Date().toISOString(),
        status: 'Interview',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      await dbService.createApplication(app1);
      await dbService.createApplication(app2);

      const applications = await dbService.getAllApplications(userId);
      
      expect(applications).toHaveLength(2);
      expect(applications[0].company).toBe('Company B'); // Ordered by dateApplied DESC
      expect(applications[1].company).toBe('Company A');
    });

    it('should update an application', async () => {
      const application = {
        id: 'app-test-5',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      await dbService.createApplication(application);

      const updates = {
        status: 'Interview',
        notes: 'Updated notes'
      };

      const updated = await dbService.updateApplication(application.id, userId, updates);
      
      expect(updated.status).toBe('Interview');
      expect(updated.notes).toBe('Updated notes');
      expect(updated.company).toBe(application.company); // Unchanged fields remain
    });

    it('should delete an application', async () => {
      const application = {
        id: 'app-test-6',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      await dbService.createApplication(application);
      await dbService.deleteApplication(application.id, userId);

      await expect(dbService.getApplicationById(application.id, userId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when updating non-existent application', async () => {
      await expect(
        dbService.updateApplication('nonexistent', userId, { status: 'Interview' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when deleting non-existent application', async () => {
      await expect(
        dbService.deleteApplication('nonexistent', userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should find duplicate application', async () => {
      const application = {
        id: 'app-test-7',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      await dbService.createApplication(application);

      const duplicate = await dbService.findDuplicateApplication(
        userId,
        'Test Company',
        'Software Engineer',
        '2024-01-15'
      );

      expect(duplicate).toBeDefined();
      expect(duplicate.id).toBe(application.id);
    });

    it('should return undefined when no duplicate found', async () => {
      const duplicate = await dbService.findDuplicateApplication(
        userId,
        'Nonexistent Company',
        'Role',
        '2024-01-15'
      );

      expect(duplicate).toBeUndefined();
    });
  });

  describe('Status History Operations', () => {
    let userId;
    let applicationId;

    beforeEach(async () => {
      userId = await dbService.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      applicationId = 'app-test-history';
      await dbService.createApplication({
        id: applicationId,
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      });
    });

    it('should add status history entry', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await dbService.addStatusHistory(applicationId, 'Applied', 'Interview');

      const history = await dbService.getStatusHistory(applicationId);
      
      expect(history).toHaveLength(2); // Initial + new entry
      // Ordered by changedAt DESC (most recent first)
      expect(history[0].newStatus).toBe('Interview');
      expect(history[0].oldStatus).toBe('Applied');
      expect(history[1].newStatus).toBe('Applied'); // Initial status
    });

    it('should get status history for application', async () => {
      // Add delays to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await dbService.addStatusHistory(applicationId, 'Applied', 'Interview');
      await new Promise(resolve => setTimeout(resolve, 10));
      await dbService.addStatusHistory(applicationId, 'Interview', 'Offer');

      const history = await dbService.getStatusHistory(applicationId);
      
      expect(history).toHaveLength(3); // Initial + 2 updates
      // Ordered by changedAt DESC (most recent first)
      expect(history[0].newStatus).toBe('Offer');
      expect(history[1].newStatus).toBe('Interview');
      expect(history[2].newStatus).toBe('Applied');
    });
  });

  describe('Email Connection Operations', () => {
    let userId;

    beforeEach(async () => {
      userId = await dbService.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });
    });

    it('should save email connection', async () => {
      const connection = {
        userId,
        email: 'test@gmail.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000
      };

      await dbService.saveEmailConnection(connection);

      const retrieved = await dbService.getEmailConnection(userId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.email).toBe(connection.email);
      expect(retrieved.accessToken).toBe(connection.accessToken);
    });

    it('should update existing email connection', async () => {
      const connection = {
        userId,
        email: 'test@gmail.com',
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresAt: Date.now() + 3600000
      };

      await dbService.saveEmailConnection(connection);

      const updatedConnection = {
        userId,
        email: 'test@gmail.com',
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresAt: Date.now() + 7200000
      };

      await dbService.saveEmailConnection(updatedConnection);

      const retrieved = await dbService.getEmailConnection(userId);
      
      expect(retrieved.accessToken).toBe('access-token-2');
      expect(retrieved.refreshToken).toBe('refresh-token-2');
    });

    it('should disconnect email', async () => {
      const connection = {
        userId,
        email: 'test@gmail.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000
      };

      await dbService.saveEmailConnection(connection);
      await dbService.disconnectEmail(userId);

      const retrieved = await dbService.getEmailConnection(userId);
      
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined when no email connection exists', async () => {
      const connection = await dbService.getEmailConnection(userId);
      expect(connection).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw DatabaseError with context', async () => {
      const uninitDb = new DatabaseService(join(tempDir, 'uninit.db'));
      
      try {
        await uninitDb.getAllApplications('test-user');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toContain('not initialized');
      }
    });

    it('should throw NotFoundError with resource details', async () => {
      try {
        await dbService.getUserById('nonexistent-id');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.resource).toBe('User');
        expect(error.id).toBe('nonexistent-id');
      }
    });

    it('should throw DuplicateError with field details', async () => {
      const user = {
        email: 'duplicate@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      };

      await dbService.createUser(user);

      try {
        await dbService.createUser(user);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateError);
        expect(error.resource).toBe('User');
        expect(error.field).toBe('email');
        expect(error.value).toBe('duplicate@example.com');
      }
    });
  });

  describe('Transaction Behavior', () => {
    let userId;

    beforeEach(async () => {
      userId = await dbService.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });
    });

    it('should maintain data consistency across operations', async () => {
      const application = {
        id: 'app-transaction-test',
        userId,
        company: 'Test Company',
        role: 'Software Engineer',
        location: 'Remote',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: new Date().toISOString(),
        status: 'Applied',
        source: 'LinkedIn',
        salary: null,
        remotePolicy: null,
        notes: null,
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      // Create application
      await dbService.createApplication(application);

      // Update status
      await dbService.updateApplication(application.id, userId, { status: 'Interview' });

      // Verify both application and status history are consistent
      const app = await dbService.getApplicationById(application.id, userId);
      const history = await dbService.getStatusHistory(application.id);

      expect(app.status).toBe('Interview');
      expect(history).toHaveLength(1); // Only initial status (update doesn't add history automatically)
      expect(history[0].newStatus).toBe('Applied');
    });
  });
});
