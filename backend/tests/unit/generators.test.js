/**
 * Unit tests for test data generators
 * Validates that generators produce correct data structures
 */

import { describe, it, expect } from 'vitest';
import {
  generateJobEmail,
  generateNonJobEmail,
  generateEdgeCaseEmail,
  generateApplication,
  generateJobBoardEmail
} from '../helpers/generators.js';

describe('Test Data Generators', () => {
  describe('generateJobEmail', () => {
    it('should generate a valid email structure', () => {
      const email = generateJobEmail();
      
      expect(email).toHaveProperty('id');
      expect(email).toHaveProperty('from');
      expect(email).toHaveProperty('to');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('body');
      expect(email).toHaveProperty('date');
      expect(email).toHaveProperty('snippet');
      expect(email).toHaveProperty('threadId');
      expect(email).toHaveProperty('labels');
      
      expect(typeof email.id).toBe('string');
      expect(typeof email.from).toBe('string');
      expect(typeof email.subject).toBe('string');
      expect(typeof email.body).toBe('string');
      expect(Array.isArray(email.labels)).toBe(true);
    });
    
    it('should generate email with specified status', () => {
      const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
      
      statuses.forEach(status => {
        const email = generateJobEmail({ status });
        const text = email.body.toLowerCase();
        
        // Check for status-related keywords
        if (status === 'Applied') {
          expect(text).toMatch(/appl(y|ying|ied|ication)/);
        } else if (status === 'Interview') {
          expect(text).toMatch(/interview|schedule|call|discuss/);
        } else if (status === 'Offer') {
          expect(text).toMatch(/offer|congratulations|pleased/);
        } else if (status === 'Rejected') {
          expect(text).toMatch(/unfortunately|not moving forward|other candidates/);
        }
      });
    });
    
    it('should generate email with company when hasCompany is true', () => {
      const email = generateJobEmail({ hasCompany: true });
      expect(email.body).toMatch(/\w+/); // Should have some company name
      expect(email.from).toMatch(/@\w+\.com/);
    });
    
    it('should generate email with role when hasRole is true', () => {
      const email = generateJobEmail({ hasRole: true });
      expect(email.subject).toMatch(/\w+/); // Should have some role
    });
    
    it('should generate email with location when hasLocation is true', () => {
      const email = generateJobEmail({ hasLocation: true });
      expect(email.body).toMatch(/Location:|Remote|, [A-Z]{2}/);
    });
    
    it('should generate HTML email when format is html', () => {
      const email = generateJobEmail({ format: 'html' });
      expect(email.body).toContain('<html>');
      expect(email.body).toContain('</html>');
      expect(email.body).toContain('<body>');
    });
    
    it('should generate plain text email by default', () => {
      const email = generateJobEmail();
      expect(email.body).not.toContain('<html>');
    });
  });
  
  describe('generateNonJobEmail', () => {
    it('should generate a valid email structure', () => {
      const email = generateNonJobEmail();
      
      expect(email).toHaveProperty('id');
      expect(email).toHaveProperty('from');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('body');
      expect(email).toHaveProperty('date');
    });
    
    it('should not contain job-related keywords', () => {
      const email = generateNonJobEmail();
      const text = `${email.subject} ${email.body}`.toLowerCase();
      
      const jobKeywords = [
        'application', 'interview', 'offer', 'rejected',
        'applying', 'position', 'role', 'job'
      ];
      
      const hasJobKeyword = jobKeywords.some(keyword => text.includes(keyword));
      expect(hasJobKeyword).toBe(false);
    });
  });
  
  describe('generateEdgeCaseEmail', () => {
    it('should generate empty email', () => {
      const email = generateEdgeCaseEmail('empty');
      
      expect(email.from).toBe('');
      expect(email.to).toBe('');
      expect(email.subject).toBe('');
      expect(email.body).toBe('');
    });
    
    it('should generate malformed email', () => {
      const email = generateEdgeCaseEmail('malformed');
      
      expect(email.from).not.toMatch(/@/); // Invalid email format
      expect(email.date).toBe('invalid-date-format');
    });
    
    it('should generate email with special characters', () => {
      const email = generateEdgeCaseEmail('special-chars');
      
      expect(email.subject).toMatch(/[^\x00-\x7F]/); // Non-ASCII characters
      expect(email.body).toMatch(/[^\x00-\x7F]/);
    });
    
    it('should generate email with missing fields', () => {
      const email = generateEdgeCaseEmail('missing-fields');
      
      expect(email.subject).toBe('Thanks for applying');
      expect(email.body).not.toMatch(/company|role|position/i);
    });
  });
  
  describe('generateApplication', () => {
    it('should generate a valid application structure', () => {
      const app = generateApplication();
      
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('userId');
      expect(app).toHaveProperty('company');
      expect(app).toHaveProperty('role');
      expect(app).toHaveProperty('location');
      expect(app).toHaveProperty('dateApplied');
      expect(app).toHaveProperty('lastUpdate');
      expect(app).toHaveProperty('createdAt');
      expect(app).toHaveProperty('status');
      expect(app).toHaveProperty('source');
      expect(app).toHaveProperty('emailId');
      expect(app).toHaveProperty('confidenceScore');
      expect(app).toHaveProperty('isDuplicate');
    });
    
    it('should generate application with valid status', () => {
      const app = generateApplication();
      const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
      
      expect(validStatuses).toContain(app.status);
    });
    
    it('should generate application with YYYY-MM-DD date format', () => {
      const app = generateApplication();
      
      expect(app.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(app.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    
    it('should generate application with correct confidence score', () => {
      const app = generateApplication();
      
      expect(app.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(app.confidenceScore).toBeLessThanOrEqual(100);
    });
    
    it('should include optional fields when requested', () => {
      const app = generateApplication({ includeOptionalFields: true });
      
      expect(app).toHaveProperty('salary');
      expect(app).toHaveProperty('remotePolicy');
    });
    
    it('should use provided userId', () => {
      const userId = 'custom-user-123';
      const app = generateApplication({ userId });
      
      expect(app.userId).toBe(userId);
    });
  });
  
  describe('generateJobBoardEmail', () => {
    it('should generate email from job board domain', () => {
      const email = generateJobBoardEmail();
      
      const jobBoards = ['greenhouse', 'lever', 'indeed', 'linkedin', 'workday', 'taleo', 'icims', 'smartrecruiters'];
      const hasJobBoardDomain = jobBoards.some(board => email.from.toLowerCase().includes(board));
      
      expect(hasJobBoardDomain).toBe(true);
    });
    
    it('should still contain job-related content', () => {
      const email = generateJobBoardEmail({ status: 'Applied' });
      
      expect(email.body.toLowerCase()).toMatch(/application|applying|applied/);
    });
  });
});
