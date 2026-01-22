import express from 'express';
import container from '../services/container.js';
import { parseCSV } from '../utils/csvParser.js';

const router = express.Router();

// Get services from container
const { databaseService, authService } = container;

// Protect all routes with authentication
router.use((req, res, next) => authService.authMiddleware(req, res, next));

/**
 * GET /api/applications
 * Get all applications
 */
router.get('/', async (req, res) => {
  try {
    const applications = await databaseService.getAllApplications(req.user.userId);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * GET /api/applications/:id/history
 * Get status history for an application
 * IMPORTANT: This must come BEFORE /:id route
 */
router.get('/:id/history', async (req, res) => {
  try {
    const history = await databaseService.getStatusHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

/**
 * GET /api/applications/:id
 * Get a single application by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const application = await databaseService.getApplicationById(req.params.id, req.user.userId);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * POST /api/applications
 * Create a new application
 */
router.post('/', async (req, res) => {
  try {
    const { id, company, role, location, dateApplied, lastUpdate, createdAt, status, source, salary, remotePolicy, notes } = req.body;
    
    // Validate required fields
    if (!id || !company || !role || !location || !dateApplied || !lastUpdate || !createdAt || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate status
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const application = {
      id,
      userId: req.user.userId, // Add userId from authenticated user
      company,
      role,
      location,
      dateApplied,
      lastUpdate,
      createdAt,
      status,
      source: source || null,
      salary: salary || null,
      remotePolicy: remotePolicy || null,
      notes: notes || null,
      emailId: null,
      confidenceScore: 0,
      isDuplicate: 0
    };
    
    await databaseService.createApplication(application);
    
    // Return the created application
    const created = await databaseService.getApplicationById(id, req.user.userId);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating application:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Application with this ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create application' });
  }
});

/**
 * PUT /api/applications/:id
 * Update an application
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if application exists and belongs to user
    const existing = await databaseService.getApplicationById(id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }
    
    // Update lastUpdate timestamp
    updates.lastUpdate = new Date().toISOString().split('T')[0];
    
    await databaseService.updateApplication(id, req.user.userId, updates);
    
    // Return updated application
    const updated = await databaseService.getApplicationById(id, req.user.userId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Update only the status of an application
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Check if application exists and belongs to user
    const existing = await databaseService.getApplicationById(id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Update status and lastUpdate
    await databaseService.updateApplication(id, req.user.userId, { 
      status, 
      lastUpdate: new Date().toISOString().split('T')[0] 
    });
    
    // Return updated application
    const updated = await databaseService.getApplicationById(id, req.user.userId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

/**
 * DELETE /api/applications/:id
 * Delete an application
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if application exists and belongs to user
    const existing = await databaseService.getApplicationById(id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    await databaseService.deleteApplication(id, req.user.userId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

/**
 * POST /api/applications/import/csv
 * Import applications from CSV file
 */
router.post('/import/csv', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }
    
    // Ensure user exists in database (fix for missing user records)
    const existingUser = await databaseService.getUserByEmail(req.user.email);
    if (!existingUser) {
      // Create user from JWT token data
      await databaseService.createUser({
        id: req.user.userId,
        email: req.user.email,
        password: null, // OAuth users don't have password
        name: req.user.email.split('@')[0]
      });
    }
    
    // Parse CSV
    const parsedApplications = parseCSV(csvData);
    
    if (parsedApplications.length === 0) {
      return res.status(400).json({ error: 'No valid applications found in CSV' });
    }
    
    // Create applications in database
    const results = {
      total: parsedApplications.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (const app of parsedApplications) {
      try {
        const now = new Date();
        const application = {
          id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: req.user.userId,
          company: app.company,
          role: app.role,
          location: app.location || 'Not specified',
          dateApplied: app.dateApplied,
          lastUpdate: now.toISOString().split('T')[0],
          createdAt: now.toISOString(),
          status: app.status,
          source: app.source || 'CSV Import',
          salary: app.salary || null,
          remotePolicy: app.remotePolicy || null,
          notes: app.notes || null,
          emailId: null,
          confidenceScore: 100, // Manual imports are 100% confidence
          isDuplicate: 0
        };
        
        await databaseService.createApplication(application);
        results.imported++;
        
        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 5));
      } catch (error) {
        console.error('Error importing application:', error);
        results.skipped++;
        results.errors.push({
          company: app.company,
          role: app.role,
          error: error.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ 
      error: 'Failed to import CSV',
      message: error.message 
    });
  }
});

export default router;
