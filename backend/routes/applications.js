import express from 'express';
import { 
  getAllApplications, 
  getApplicationById, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getStatusHistory 
} from '../database/db.js';

const router = express.Router();

/**
 * GET /api/applications
 * Get all applications
 */
router.get('/', async (req, res) => {
  try {
    const applications = await getAllApplications();
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
    const history = await getStatusHistory(req.params.id);
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
    const application = await getApplicationById(req.params.id);
    
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
    
    await createApplication(application);
    
    // Return the created application
    const created = await getApplicationById(id);
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
    
    // Check if application exists
    const existing = await getApplicationById(id);
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
    
    await updateApplication(id, updates);
    
    // Return updated application
    const updated = await getApplicationById(id);
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
    
    // Check if application exists
    const existing = await getApplicationById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Update status and lastUpdate
    await updateApplication(id, { 
      status, 
      lastUpdate: new Date().toISOString().split('T')[0] 
    });
    
    // Return updated application
    const updated = await getApplicationById(id);
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
    
    // Check if application exists
    const existing = await getApplicationById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    await deleteApplication(id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
