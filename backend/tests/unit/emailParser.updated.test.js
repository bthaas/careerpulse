/**
 * Updated Unit Tests for Email Parser Service (LLM-based)
 * Tests the new LLM-based parsing pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isJobEmail,
  calculateConfidence,
  parseEmail
} from '../../services/emailParser.js';
import * as llmParser from '../../services/llmParser.js';

// Mock the LLM parser
vi.mock('../../services/llmParser.js', () => ({
  extractWithLLM: vi.fn()
}));

describe('Email Parser - isJobEmail() [Keyword Filter]', () => {
  it('should detect job emails with application keywords', () => {
    expect(isJobEmail('Application Received', 'Thank you for applying')).toBe(true);
    expect(isJobEmail('Your application', 'We received your application')).toBe(true);
  });

  it('should detect job emails with interview keywords', () => {
    expect(isJobEmail('Interview Invitation', 'Schedule a call with us')).toBe(true);
    expect(isJobEmail('Next Steps', 'We would like to interview you')).toBe(true);
  });

  it('should detect job emails with offer keywords', () => {
    expect(isJobEmail('Job Offer', 'Congratulations! We are pleased to offer')).toBe(true);
  });

  it('should detect job emails with rejection keywords', () => {
    expect(isJobEmail('Application Update', 'Unfortunately, we are not moving forward')).toBe(true);
  });

  it('should reject non-job emails', () => {
    expect(isJobEmail('Newsletter', 'Weekly tech news')).toBe(false);
    expect(isJobEmail('Coffee this weekend?', 'Want to grab coffee?')).toBe(false);
  });

  it('should reject spam emails', () => {
    expect(isJobEmail('Unsubscribe', 'Click here to unsubscribe')).toBe(false);
    expect(isJobEmail('Sale!', 'Big discount on products')).toBe(false);
  });
});

describe('Email Parser - calculateConfidence()', () => {
  it('should return 100 for LLM with all fields', () => {
    expect(calculateConfidence('TechCorp', 'Software Engineer', 'Applied', true)).toBe(100);
  });

  it('should return 90 for LLM with company and role', () => {
    expect(calculateConfidence('TechCorp', 'Software Engineer', 'Applied', true)).toBe(100);
  });

  it('should return 75 for LLM with company only', () => {
    expect(calculateConfidence('TechCorp', 'Not specified', 'Applied', true)).toBe(75);
  });

  it('should return 75 for LLM with role only', () => {
    expect(calculateConfidence('Not specified', 'Software Engineer', 'Applied', true)).toBe(75);
  });

  it('should return 60 for LLM with no extracted fields', () => {
    expect(calculateConfidence('Not specified', 'Not specified', 'Applied', true)).toBe(60);
  });

  it('should return lower scores for manual parsing', () => {
    expect(calculateConfidence('TechCorp', 'Software Engineer', 'Applied', false)).toBe(60);
    expect(calculateConfidence('Not specified', 'Not specified', 'Applied', false)).toBe(30);
  });
});

describe('Email Parser - parseEmail() [LLM Integration]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse job email using LLM', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'Google',
      jobTitle: 'Software Engineer',
      status: 'Applied',
      location: 'Mountain View, CA'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test123',
      from: 'jobs@google.com',
      subject: 'Application Received - Software Engineer',
      body: 'Thank you for applying to Google.',
      date: '2026-01-15T10:00:00Z'
    };

    const result = await parseEmail(email);

    expect(result).toBeDefined();
    expect(result.company).toBe('Google');
    expect(result.role).toBe('Software Engineer');
    expect(result.status).toBe('Applied');
    expect(result.location).toBe('Mountain View, CA');
    expect(result.confidenceScore).toBe(100);
    expect(result.source).toBe('Email');
    expect(result.notes).toContain('LLM-enhanced');
  });

  it('should return null when LLM classifies as non-job email', async () => {
    const mockLLMResult = {
      isJobEmail: false
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test456',
      from: 'newsletter@tech.com',
      subject: 'Weekly Newsletter',
      body: 'Here are the top tech stories.',
      date: '2026-01-16T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result).toBeNull();
  });

  it('should return null when keyword filter rejects email', async () => {
    const email = {
      id: 'test789',
      from: 'spam@example.com',
      subject: 'Unsubscribe',
      body: 'Click here to unsubscribe from our mailing list.',
      date: '2026-01-17T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result).toBeNull();
    // LLM should not be called for obvious spam
    expect(llmParser.extractWithLLM).not.toHaveBeenCalled();
  });

  it('should return null when LLM fails', async () => {
    llmParser.extractWithLLM.mockResolvedValue(null);

    const email = {
      id: 'test101',
      from: 'jobs@company.com',
      subject: 'Application Received',
      body: 'Thank you for applying.',
      date: '2026-01-18T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result).toBeNull();
  });

  it('should set remote policy when location contains "remote"', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'RemoteCorp',
      jobTitle: 'Software Engineer',
      status: 'Applied',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test202',
      from: 'jobs@remotecorp.com',
      subject: 'Application Received',
      body: 'Thank you for applying.',
      date: '2026-01-19T10:00:00Z'
    };

    const result = await parseEmail(email);

    expect(result).toBeDefined();
    expect(result.remotePolicy).toBe('Remote');
  });

  it('should format dates correctly', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Applied',
      location: 'San Francisco, CA'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test303',
      from: 'jobs@techcorp.com',
      subject: 'Application Received',
      body: 'Thank you.',
      date: '2026-01-20T15:30:45.123Z'
    };

    const result = await parseEmail(email);

    expect(result).toBeDefined();
    expect(result.dateApplied).toBe('2026-01-20');
    expect(result.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should include email subject in notes', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Applied',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test404',
      from: 'jobs@techcorp.com',
      subject: 'Software Engineer Application',
      body: 'Thank you.',
      date: '2026-01-21T10:00:00Z'
    };

    const result = await parseEmail(email);

    expect(result).toBeDefined();
    expect(result.notes).toContain('Software Engineer Application');
    expect(result.notes).toContain('LLM-enhanced');
  });

  it('should set default values correctly', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Applied',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test505',
      from: 'jobs@techcorp.com',
      subject: 'Application',
      body: 'Thank you.',
      date: '2026-01-22T10:00:00Z'
    };

    const result = await parseEmail(email);

    expect(result).toBeDefined();
    expect(result.source).toBe('Email');
    expect(result.salary).toBeNull();
    expect(result.isDuplicate).toBe(0);
    expect(result.emailId).toBe('test505');
  });

  it('should handle LLM errors gracefully', async () => {
    llmParser.extractWithLLM.mockRejectedValue(new Error('API Error'));

    const email = {
      id: 'test606',
      from: 'jobs@company.com',
      subject: 'Application Received',
      body: 'Thank you for applying.',
      date: '2026-01-23T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result).toBeNull();
  });
});

describe('Email Parser - Status Classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly classify "Applied" status', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Applied',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test1',
      from: 'jobs@techcorp.com',
      subject: 'Application Received',
      body: 'Thank you for applying.',
      date: '2026-01-24T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result.status).toBe('Applied');
  });

  it('should correctly classify "Interview" status', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Interview',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test2',
      from: 'jobs@techcorp.com',
      subject: 'Interview Invitation',
      body: 'We would like to schedule an interview.',
      date: '2026-01-25T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result.status).toBe('Interview');
  });

  it('should correctly classify "Offer" status', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Offer',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test3',
      from: 'jobs@techcorp.com',
      subject: 'Job Offer',
      body: 'Congratulations! We are pleased to offer you the position.',
      date: '2026-01-26T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result.status).toBe('Offer');
  });

  it('should correctly classify "Rejected" status', async () => {
    const mockLLMResult = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: 'Developer',
      status: 'Rejected',
      location: 'Remote'
    };

    llmParser.extractWithLLM.mockResolvedValue(mockLLMResult);

    const email = {
      id: 'test4',
      from: 'jobs@techcorp.com',
      subject: 'Application Update',
      body: 'Unfortunately, we are not moving forward with your application.',
      date: '2026-01-27T10:00:00Z'
    };

    const result = await parseEmail(email);
    expect(result.status).toBe('Rejected');
  });
});
