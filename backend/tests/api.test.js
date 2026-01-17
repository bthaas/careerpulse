import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set test database path
process.env.DATABASE_PATH = join(__dirname, '../database/test-api.db');

// Import server after setting env
const { default: app } = await import('../server.js');

// Helper function to make HTTP requests
async function makeRequest(method, path, body = null) {
  const url = `http://localhost:3001${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  
  return {
    status: response.status,
    data,
  };
}

// Wait for server to be ready
await new Promise(resolve => setTimeout(resolve, 500));

describe('API Health Check', () => {
  test('GET /api/health should return OK', async () => {
    const { status, data } = await makeRequest('GET', '/api/health');
    
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
    assert.strictEqual(data.version, '1.0.0');
  });
});

describe('Applications API - CRUD Operations', () => {
  const testApplication = {
    id: 'test-app-001',
    company: 'Test Corp',
    role: 'Senior Engineer',
    location: 'Remote',
    dateApplied: '2024-01-15',
    lastUpdate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    status: 'Applied',
    source: 'LinkedIn',
    salary: '$120k-$150k',
    remotePolicy: 'Fully Remote',
    notes: 'Great opportunity'
  };

  test('POST /api/applications should create a new application', async () => {
    const { status, data } = await makeRequest('POST', '/api/applications', testApplication);
    
    assert.strictEqual(status, 201);
    assert.strictEqual(data.id, testApplication.id);
    assert.strictEqual(data.company, testApplication.company);
    assert.strictEqual(data.role, testApplication.role);
    assert.strictEqual(data.status, testApplication.status);
  });

  test('POST /api/applications with duplicate ID should return 409', async () => {
    const { status, data } = await makeRequest('POST', '/api/applications', testApplication);
    
    assert.strictEqual(status, 409);
    assert.ok(data.error);
  });

  test('POST /api/applications with missing fields should return 400', async () => {
    const incomplete = { id: 'incomplete', company: 'Test' };
    const { status, data } = await makeRequest('POST', '/api/applications', incomplete);
    
    assert.strictEqual(status, 400);
    assert.ok(data.error);
  });

  test('POST /api/applications with invalid status should return 400', async () => {
    const invalid = { ...testApplication, id: 'invalid-status', status: 'InvalidStatus' };
    const { status, data } = await makeRequest('POST', '/api/applications', invalid);
    
    assert.strictEqual(status, 400);
    assert.ok(data.error.includes('Invalid status'));
  });

  test('GET /api/applications should return all applications', async () => {
    const { status, data } = await makeRequest('GET', '/api/applications');
    
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    
    const found = data.find(app => app.id === testApplication.id);
    assert.ok(found);
  });

  test('GET /api/applications/:id should return a single application', async () => {
    const { status, data } = await makeRequest('GET', `/api/applications/${testApplication.id}`);
    
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, testApplication.id);
    assert.strictEqual(data.company, testApplication.company);
  });

  test('GET /api/applications/:id with invalid ID should return 404', async () => {
    const { status, data } = await makeRequest('GET', '/api/applications/non-existent-id');
    
    assert.strictEqual(status, 404);
    assert.ok(data.error);
  });

  test('PUT /api/applications/:id should update an application', async () => {
    const updates = {
      role: 'Lead Engineer',
      salary: '$150k-$180k',
      notes: 'Updated notes'
    };
    
    const { status, data } = await makeRequest('PUT', `/api/applications/${testApplication.id}`, updates);
    
    assert.strictEqual(status, 200);
    assert.strictEqual(data.role, updates.role);
    assert.strictEqual(data.salary, updates.salary);
    assert.strictEqual(data.notes, updates.notes);
    // lastUpdate should be updated automatically
    assert.ok(data.lastUpdate);
  });

  test('PUT /api/applications/:id with invalid ID should return 404', async () => {
    const { status, data } = await makeRequest('PUT', '/api/applications/non-existent-id', { notes: 'test' });
    
    assert.strictEqual(status, 404);
    assert.ok(data.error);
  });

  test('PATCH /api/applications/:id/status should update status', async () => {
    const { status, data } = await makeRequest('PATCH', `/api/applications/${testApplication.id}/status`, { status: 'Interview' });
    
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, 'Interview');
  });

  test('PATCH /api/applications/:id/status with invalid status should return 400', async () => {
    const { status, data } = await makeRequest('PATCH', `/api/applications/${testApplication.id}/status`, { status: 'InvalidStatus' });
    
    assert.strictEqual(status, 400);
    assert.ok(data.error.includes('Invalid status'));
  });

  test('GET /api/applications/:id/history should return status history', async () => {
    const { status, data } = await makeRequest('GET', `/api/applications/${testApplication.id}/history`);
    
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
    // Should have at least 1 entry (status changes are tracked)
    assert.ok(data.length >= 1);
    
    // Verify the history entries have the right structure
    if (data.length > 0) {
      assert.ok(data[0].applicationId);
      assert.ok(data[0].newStatus);
      assert.ok(data[0].changedAt);
    }
  });

  test('DELETE /api/applications/:id should delete an application', async () => {
    const { status } = await makeRequest('DELETE', `/api/applications/${testApplication.id}`);
    
    assert.strictEqual(status, 204);
    
    // Verify it's deleted
    const getResponse = await makeRequest('GET', `/api/applications/${testApplication.id}`);
    assert.strictEqual(getResponse.status, 404);
  });

  test('DELETE /api/applications/:id with invalid ID should return 404', async () => {
    const { status, data } = await makeRequest('DELETE', '/api/applications/non-existent-id');
    
    assert.strictEqual(status, 404);
    assert.ok(data.error);
  });
});

describe('Applications API - Multiple Applications', () => {
  const apps = [
    {
      id: 'app-001',
      company: 'Google',
      role: 'SWE',
      location: 'Mountain View',
      dateApplied: '2024-01-10',
      lastUpdate: '2024-01-10',
      createdAt: '2024-01-10T10:00:00Z',
      status: 'Applied'
    },
    {
      id: 'app-002',
      company: 'Microsoft',
      role: 'Software Engineer',
      location: 'Seattle',
      dateApplied: '2024-01-12',
      lastUpdate: '2024-01-12',
      createdAt: '2024-01-12T10:00:00Z',
      status: 'Interview'
    },
    {
      id: 'app-003',
      company: 'Amazon',
      role: 'SDE',
      location: 'Remote',
      dateApplied: '2024-01-14',
      lastUpdate: '2024-01-14',
      createdAt: '2024-01-14T10:00:00Z',
      status: 'Rejected'
    }
  ];

  test('should create multiple applications', async () => {
    for (const app of apps) {
      const { status } = await makeRequest('POST', '/api/applications', app);
      assert.strictEqual(status, 201);
    }
  });

  test('should retrieve all applications', async () => {
    const { status, data } = await makeRequest('GET', '/api/applications');
    
    assert.strictEqual(status, 200);
    assert.ok(data.length >= 3);
    
    // Verify all our apps are there
    for (const app of apps) {
      const found = data.find(a => a.id === app.id);
      assert.ok(found, `Should find application ${app.id}`);
    }
  });
});

// Cleanup
after(async () => {
  // Clean up test database
  const { unlinkSync, existsSync } = await import('fs');
  const dbPath = join(__dirname, '../database/test-api.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  
  // Give a moment for server to finish
  await new Promise(resolve => setTimeout(resolve, 100));
  process.exit(0);
});
