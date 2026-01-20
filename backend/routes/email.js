import express from 'express';
import { fetchJobEmails, getGmailProfile } from '../services/gmailService.js';
import { parseEmail } from '../services/emailParser.js';
import { checkDuplicate } from '../services/duplicateDetector.js';
import { createApplication } from '../database/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

/**
 * POST /api/email/sync
 * Sync emails and extract job applications
 */
router.post('/sync', async (req, res) => {
  try {
    const { maxResults = 100, afterDate = null } = req.body;
    
    console.log('🔄 Starting email sync for user:', req.user.userId);
    
    // Fetch job-related emails
    const emails = await fetchJobEmails({ 
      maxResults, 
      afterDate,
      userId: req.user.userId 
    });
    console.log(`📧 Fetched ${emails.length} emails`);
    
    const results = {
      totalEmails: emails.length,
      jobEmails: 0,
      newApplications: 0,
      duplicates: 0,
      errors: 0,
      applications: []
    };
    
    // Process each email
    for (const email of emails) {
      try {
        // Parse email to extract application data
        const application = await parseEmail(email);
        
        if (!application) {
          // Not a job-related email
          continue;
        }
        
        results.jobEmails++;
        
        // Add userId to application
        application.userId = req.user.userId;
        
        // Check for duplicates
        const duplicateCheck = await checkDuplicate(application);
        
        if (duplicateCheck.isDuplicate) {
          console.log(`⚠️  Duplicate found: ${application.company} - ${application.role}`);
          results.duplicates++;
          continue;
        }
        
        // Save to database
        await createApplication(application);
        
        console.log(`✅ Added: ${application.company} - ${application.role} (confidence: ${application.confidenceScore}%)`);
        results.newApplications++;
        results.applications.push({
          company: application.company,
          role: application.role,
          status: application.status,
          confidenceScore: application.confidenceScore
        });
        
      } catch (error) {
        console.error('Error processing email:', error);
        results.errors++;
      }
    }
    
    console.log(`✅ Sync complete: ${results.newApplications} new applications added`);
    
    res.json({
      success: true,
      ...results
    });
    
  } catch (error) {
    console.error('Email sync error:', error);
    
    if (error.message.includes('No Gmail connection')) {
      return res.status(401).json({ 
        error: 'Gmail not connected',
        message: 'Please connect your Gmail account first'
      });
    }
    
    res.status(500).json({ 
      error: 'Email sync failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/email/profile
 * Get Gmail profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await getGmailProfile(req.user.userId);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    
    if (error.message.includes('No Gmail connection')) {
      return res.status(401).json({ 
        error: 'Gmail not connected'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
});

/**
 * GET /api/email/status
 * Get email sync status
 */
router.get('/status', async (req, res) => {
  try {
    // Check if Gmail is connected
    const { getEmailConnection } = await import('../database/db.js');
    const connection = await getEmailConnection();
    
    if (!connection) {
      return res.json({
        connected: false,
        lastSync: null
      });
    }
    
    res.json({
      connected: true,
      email: connection.email,
      lastSync: connection.updated_at || null
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

/**
 * GET /api/email/debug
 * Debug endpoint to see raw Gmail data (first 5 emails)
 */
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Fetching raw Gmail data for debugging...');
    
    // Fetch first 5 job-related emails
    const emails = await fetchJobEmails({ 
      maxResults: 5,
      userId: req.user.userId 
    });
    
    // Return raw email data
    res.json({
      count: emails.length,
      emails: emails.map(email => ({
        id: email.id,
        from: email.from,
        subject: email.subject,
        date: email.date,
        snippet: email.snippet,
        bodyPreview: email.body.substring(0, 500) + '...',
        bodyLength: email.body.length
      }))
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch debug data',
      message: error.message 
    });
  }
});

export default router;
