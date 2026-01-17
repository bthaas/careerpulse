import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a test database in memory
const db = new sqlite3.Database(':memory:');
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Enable foreign keys and initialize test database
await dbRun('PRAGMA foreign_keys = ON');
const schema = readFileSync(join(__dirname, '../database/schema.sql'), 'utf-8');
// Split and execute each statement separately
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const statement of statements) {
  await dbRun(statement);
}

describe('Database Schema Tests', () => {
  test('should create applications table', async () => {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name='applications'");
    assert.strictEqual(tables.length, 1);
    assert.strictEqual(tables[0].name, 'applications');
  });

  test('should create email_connections table', async () => {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name='email_connections'");
    assert.strictEqual(tables.length, 1);
    assert.strictEqual(tables[0].name, 'email_connections');
  });

  test('should create status_history table', async () => {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name='status_history'");
    assert.strictEqual(tables.length, 1);
    assert.strictEqual(tables[0].name, 'status_history');
  });
});

describe('Database Operations Tests', () => {
  const testApp = {
    id: 'test-123',
    company: 'Test Company',
    role: 'Software Engineer',
    location: 'Remote',
    dateApplied: '2024-01-15',
    lastUpdate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    status: 'Applied',
    source: 'LinkedIn',
    salary: '$100k-$120k',
    remotePolicy: 'Remote',
    notes: 'Test notes',
    emailId: null,
    confidenceScore: 0,
    isDuplicate: 0
  };

  test('should insert an application', async () => {
    await dbRun(`
      INSERT INTO applications (
        id, company, role, location, dateApplied, lastUpdate, createdAt,
        status, source, salary, remotePolicy, notes, emailId, confidenceScore, isDuplicate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testApp.id, testApp.company, testApp.role, testApp.location,
      testApp.dateApplied, testApp.lastUpdate, testApp.createdAt,
      testApp.status, testApp.source, testApp.salary, testApp.remotePolicy,
      testApp.notes, testApp.emailId, testApp.confidenceScore, testApp.isDuplicate
    ]);
    
    // Verify insertion by retrieving it
    const inserted = await dbGet('SELECT * FROM applications WHERE id = ?', [testApp.id]);
    assert.notStrictEqual(inserted, undefined);
  });

  test('should retrieve an application by id', async () => {
    const app = await dbGet('SELECT * FROM applications WHERE id = ?', ['test-123']);
    
    assert.strictEqual(app.id, 'test-123');
    assert.strictEqual(app.company, 'Test Company');
    assert.strictEqual(app.role, 'Software Engineer');
    assert.strictEqual(app.status, 'Applied');
  });

  test('should update an application', async () => {
    await dbRun('UPDATE applications SET status = ? WHERE id = ?', ['Interview', 'test-123']);
    
    const updatedApp = await dbGet('SELECT * FROM applications WHERE id = ?', ['test-123']);
    assert.strictEqual(updatedApp.status, 'Interview');
  });

  test('should enforce status check constraint', async () => {
    await assert.rejects(async () => {
      await dbRun('UPDATE applications SET status = ? WHERE id = ?', ['InvalidStatus', 'test-123']);
    });
  });

  test('should insert status history', async () => {
    await dbRun(`
      INSERT INTO status_history (applicationId, oldStatus, newStatus, changedAt)
      VALUES (?, ?, ?, ?)
    `, ['test-123', 'Applied', 'Interview', '2024-01-16T10:00:00Z']);
    
    // Verify insertion
    const history = await dbAll('SELECT * FROM status_history WHERE applicationId = ?', ['test-123']);
    assert.strictEqual(history.length, 1);
  });

  test('should retrieve status history', async () => {
    const history = await dbAll('SELECT * FROM status_history WHERE applicationId = ?', ['test-123']);
    
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].applicationId, 'test-123');
    assert.strictEqual(history[0].oldStatus, 'Applied');
    assert.strictEqual(history[0].newStatus, 'Interview');
  });

  test('should delete an application', async () => {
    await dbRun('DELETE FROM applications WHERE id = ?', ['test-123']);
    
    const deleted = await dbGet('SELECT * FROM applications WHERE id = ?', ['test-123']);
    assert.strictEqual(deleted, undefined);
  });

  test('should insert email connection', async () => {
    await dbRun(`
      INSERT INTO email_connections (userId, email, accessToken, refreshToken, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `, ['user-1', 'test@example.com', 'access-token', 'refresh-token', '2024-01-20T10:00:00Z']);
    
    // Verify insertion
    const connection = await dbGet('SELECT * FROM email_connections WHERE userId = ?', ['user-1']);
    assert.notStrictEqual(connection, undefined);
  });

  test('should retrieve email connection', async () => {
    const connection = await dbGet('SELECT * FROM email_connections WHERE userId = ?', ['user-1']);
    
    assert.strictEqual(connection.email, 'test@example.com');
    assert.strictEqual(connection.connected, 1);
  });

  test('should find duplicate applications', async () => {
    // Insert application
    await dbRun(`
      INSERT INTO applications (
        id, company, role, location, dateApplied, lastUpdate, createdAt, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['app-1', 'Google', 'SWE', 'Remote', '2024-01-15', '2024-01-15', '2024-01-15T10:00:00Z', 'Applied']);
    
    // Check for duplicate
    const duplicate = await dbGet(`
      SELECT * FROM applications 
      WHERE company = ? AND role = ? AND dateApplied = ?
    `, ['Google', 'SWE', '2024-01-15']);
    
    assert.notStrictEqual(duplicate, undefined);
    assert.strictEqual(duplicate.company, 'Google');
  });
});

after(() => {
  return new Promise((resolve) => {
    db.close(() => resolve());
  });
});
