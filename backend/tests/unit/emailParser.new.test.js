/**
 * Unit Tests for EmailParser
 * Tests specific examples and edge cases for email parsing
 * 
 * **Validates: Requirements 3.2, 3.3, 3.5, 3.6, 3.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailParser } from '../../services/EmailParser.js';

describe('EmailParser Unit Tests', () => {
  let emailParser;
  let mockLLMParser;

  beforeEach(() => {
    mockLLMParser = {
      extractWithLLM: vi.fn()
    };
    emailParser = new EmailParser(mockLLMParser);
  });

  describe('Initialization', () => {
    it('should create instance with LLMParser', () => {
      expect(emailParser).toBeDefined();
      expect(emailParser.llmParser).toBe(mockLLMParser);
      expect(emailParser.jobKeywords).toBeDefined();
      expect(emailParser.spamKeywords).toBeDefined();
    });

    it('should have job keywords', () => {
      expect(emailParser.jobKeywords).toContain('application');
      expect(emailParser.jobKeywords).toContain('interview');
      expect(emailParser.jobKeywords).toContain('offer');
    });

    it('should have spam keywords', () => {
      expect(emailParser.spamKeywords).toContain('unsubscribe');
      expect(emailParser.spamKeywords).toContain('promotional');
    });
  });

  describe('Job Email Detection', () => {
    it('should detect job emails with application keyword', () => {
      expect(emailParser.isJobEmail('Application Received', 'Thank you for applying')).toBe(true);
    });

    it('should detect job emails with interview keyword', () => {
      expect(emailParser.isJobEmail('Interview Invitation', 'We would like to schedule')).toBe(true);
    });

    it('should detect job emails with offer keyword', () => {
      expect(emailParser.isJobEmail('Job Offer', 'Congratulations on your offer')).toBe(true);
    });

    it('should reject non-job emails', () => {
      expect(emailParser.isJobEmail('Weekly Newsletter', 'Here are this week\'s updates')).toBe(false);
    });

    it('should reject spam emails', () => {
      expect(emailParser.isJobEmail('Unsubscribe from our list', 'Click here to unsubscribe')).toBe(false);
    });

    it('should reject promotional emails', () => {
      expect(emailParser.isJobEmail('Special Discount', 'Get 50% off today')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(emailParser.isJobEmail('APPLICATION RECEIVED', 'THANK YOU')).toBe(true);
    });
  });

  describe('Confidence Score Calculation', () => {
    it('should give base score of 60 for LLM extraction', () => {
      const score = emailParser.calculateConfidence('', '', 'Applied', true);
      expect(score).toBe(60);
    });

    it('should give base score of 30 for manual extraction', () => {
      const score = emailParser.calculateConfidence('', '', 'Applied', false);
      expect(score).toBe(30);
    });

    it('should add 15 points for valid company', () => {
      const withCompany = emailParser.calculateConfidence('Google', '', 'Applied', true);
      const withoutCompany = emailParser.calculateConfidence('', '', 'Applied', true);
      expect(withCompany - withoutCompany).toBe(15);
    });

    it('should not add points for "Unknown Company"', () => {
      const score = emailParser.calculateConfidence('Unknown Company', '', 'Applied', true);
      expect(score).toBe(60);
    });

    it('should add 15 points for valid role', () => {
      const withRole = emailParser.calculateConfidence('', 'Software Engineer', 'Applied', true);
      const withoutRole = emailParser.calculateConfidence('', '', 'Applied', true);
      expect(withRole - withoutRole).toBe(15);
    });

    it('should add 10 points for non-Applied status', () => {
      const interview = emailParser.calculateConfidence('', '', 'Interview', true);
      const applied = emailParser.calculateConfidence('', '', 'Applied', true);
      expect(interview - applied).toBe(10);
    });

    it('should cap score at 100', () => {
      const score = emailParser.calculateConfidence('Google', 'Engineer', 'Interview', true);
      expect(score).toBe(100);
    });

    it('should calculate full score correctly', () => {
      // LLM (60) + Company (15) + Role (15) + Status (10) = 100
      const score = emailParser.calculateConfidence('Google', 'Software Engineer', 'Interview', true);
      expect(score).toBe(100);
    });
  });

  describe('Email Parsing', () => {
    it('should parse job email successfully', async () => {
      const email = {
        id: 'msg123',
        from: 'jobs@google.com',
        subject: 'Application Received',
        body: 'Thank you for applying to Google',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: true,
        company: 'Google',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        location: 'Mountain View, CA'
      });

      const result = await emailParser.parseEmail(email);

      expect(result).toBeDefined();
      expect(result.company).toBe('Google');
      expect(result.role).toBe('Software Engineer');
      expect(result.status).toBe('Applied');
      expect(result.location).toBe('Mountain View, CA');
      expect(result.emailId).toBe('msg123');
    });

    it('should return null for non-job emails (keyword filter)', async () => {
      const email = {
        id: 'msg123',
        from: 'newsletter@company.com',
        subject: 'Weekly Newsletter',
        body: 'Here are this week\'s updates',
        date: '2024-01-15T10:00:00Z'
      };

      const result = await emailParser.parseEmail(email);

      expect(result).toBeNull();
      expect(mockLLMParser.extractWithLLM).not.toHaveBeenCalled();
    });

    it('should return null when LLM says not a job email', async () => {
      const email = {
        id: 'msg123',
        from: 'test@test.com',
        subject: 'Application for discount',
        body: 'Apply for our special discount',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: false
      });

      const result = await emailParser.parseEmail(email);

      expect(result).toBeNull();
    });

    it('should return null when LLM returns null', async () => {
      const email = {
        id: 'msg123',
        from: 'test@test.com',
        subject: 'Job Application',
        body: 'Test body',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue(null);

      const result = await emailParser.parseEmail(email);

      expect(result).toBeNull();
    });

    it('should return null when LLM throws error', async () => {
      const email = {
        id: 'msg123',
        from: 'test@test.com',
        subject: 'Job Application',
        body: 'Test body',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockRejectedValue(new Error('LLM Error'));

      const result = await emailParser.parseEmail(email);

      expect(result).toBeNull();
    });

    it('should set remote policy for remote jobs', async () => {
      const email = {
        id: 'msg123',
        from: 'jobs@company.com',
        subject: 'Job Application',
        body: 'Remote position',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: true,
        company: 'Company',
        jobTitle: 'Engineer',
        status: 'Applied',
        location: 'Remote'
      });

      const result = await emailParser.parseEmail(email);

      expect(result.remotePolicy).toBe('Remote');
    });

    it('should format date correctly', async () => {
      const email = {
        id: 'msg123',
        from: 'jobs@company.com',
        subject: 'Job Application',
        body: 'Test',
        date: '2024-01-15T10:30:45Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: true,
        company: 'Company',
        jobTitle: 'Engineer',
        status: 'Applied',
        location: 'Location'
      });

      const result = await emailParser.parseEmail(email);

      expect(result.dateApplied).toBe('2024-01-15');
    });

    it('should include email metadata in notes', async () => {
      const email = {
        id: 'msg123',
        from: 'jobs@company.com',
        subject: 'Application Received',
        body: 'Test',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: true,
        company: 'Company',
        jobTitle: 'Engineer',
        status: 'Applied',
        location: 'Location'
      });

      const result = await emailParser.parseEmail(email);

      expect(result.notes).toContain('Application Received');
      expect(result.notes).toContain('LLM-enhanced');
    });

    it('should set source to Email', async () => {
      const email = {
        id: 'msg123',
        from: 'jobs@company.com',
        subject: 'Job Application',
        body: 'Test',
        date: '2024-01-15T10:00:00Z'
      };

      mockLLMParser.extractWithLLM.mockResolvedValue({
        isJobEmail: true,
        company: 'Company',
        jobTitle: 'Engineer',
        status: 'Applied',
        location: 'Location'
      });

      const result = await emailParser.parseEmail(email);

      expect(result.source).toBe('Email');
    });
  });

  describe('Date Formatting', () => {
    it('should format ISO date correctly', () => {
      const formatted = emailParser.formatDate('2024-01-15T10:30:45Z');
      expect(formatted).toBe('2024-01-15');
    });

    it('should format date string correctly', () => {
      const formatted = emailParser.formatDate('Mon, 15 Jan 2024 10:30:45 GMT');
      expect(formatted).toBe('2024-01-15');
    });
  });
});
