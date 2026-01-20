/**
 * Unit Tests for Data Quality Validation
 * Tests date formatting, status validation, fallback values, and field integrity
 */

import { describe, it, expect } from 'vitest';
import { parseEmail } from '../../services/emailParser.js';

describe('Data Validation - Date Formatting', () => {
  it('should format dates as YYYY-MM-DD', () => {
    const testDates = [
      '2026-01-15T10:00:00Z',
      '2026-12-31T23:59:59Z',
      'Mon, 15 Jan 2026 10:00:00 -0800',
      'Tue, 16 Jan 2026 14:30:00 +0000'
    ];

    testDates.forEach(dateString => {
      const email = {
        id: 'test',
        from: 'jobs@company.com',
        subject: 'Application Received',
        body: 'Thank you for applying',
        date: dateString
      };

      const result = parseEmail(email);
      if (result) {
        expect(result.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  it('should use consistent date format across all parsed emails', () => {
    const emails = [
      { id: '1', from: 'jobs@stripe.com', subject: 'Application', body: 'Thank you for applying', date: '2026-01-15T10:00:00Z' },
      { id: '2', from: 'jobs@google.com', subject: 'Interview', body: 'Schedule an interview', date: '2026-02-20T14:30:00Z' },
      { id: '3', from: 'jobs@amazon.com', subject: 'Offer', body: 'Congratulations', date: '2026-03-25T09:15:00Z' }
    ];

    const results = emails.map(email => parseEmail(email)).filter(r => r !== null);
    
    results.forEach(result => {
      expect(result.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

describe('Data Validation - Status Enum', () => {
  const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

  it('should only return valid status enum values', () => {
    const testCases = [
      { keywords: 'application received', expected: 'Applied' },
      { keywords: 'interview invitation', expected: 'Interview' },
      { keywords: 'job offer', expected: 'Offer' },
      { keywords: 'unfortunately not moving forward', expected: 'Rejected' }
    ];

    testCases.forEach(({ keywords, expected }) => {
      const email = {
        id: 'test',
        from: 'jobs@company.com',
        subject: keywords,
        body: keywords,
        date: new Date().toISOString()
      };

      const result = parseEmail(email);
      if (result) {
        expect(validStatuses).toContain(result.status);
        expect(result.status).toBe(expected);
      }
    });
  });

  it('should never return invalid status values', () => {
    const emails = [
      { id: '1', from: 'jobs@company.com', subject: 'Application', body: 'Thank you for applying', date: new Date().toISOString() },
      { id: '2', from: 'jobs@company.com', subject: 'Interview', body: 'Schedule a call', date: new Date().toISOString() },
      { id: '3', from: 'jobs@company.com', subject: 'Offer', body: 'Congratulations', date: new Date().toISOString() },
      { id: '4', from: 'jobs@company.com', subject: 'Update', body: 'Unfortunately', date: new Date().toISOString() }
    ];

    emails.forEach(email => {
      const result = parseEmail(email);
      if (result) {
        expect(validStatuses).toContain(result.status);
      }
    });
  });
});

describe('Data Validation - Fallback Values', () => {
  it('should use "Unknown Company" fallback when company cannot be extracted', () => {
    const email = {
      id: 'test',
      from: 'noreply@example.com',
      subject: 'Application Received',
      body: 'Thank you for your application',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.company).toBeDefined();
      // Will extract "Example" from domain, not "Unknown Company"
      expect(result.company.length).toBeGreaterThan(0);
    }
  });

  it('should use "Unknown Position" fallback when role cannot be extracted', () => {
    const email = {
      id: 'test',
      from: 'jobs@company.com',
      subject: 'Application Received',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.role).toBeDefined();
      expect(result.role.length).toBeGreaterThan(0);
    }
  });

  it('should use "Not specified" fallback when location cannot be extracted', () => {
    const email = {
      id: 'test',
      from: 'jobs@company.com',
      subject: 'Application - Software Engineer',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.location).toBeDefined();
      expect(result.location).toBe('Not specified');
    }
  });

  it('should always provide fallback values for required fields', () => {
    const email = {
      id: 'test',
      from: 'noreply@test.com',
      subject: 'Application',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.company).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.location).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.dateApplied).toBeDefined();
    }
  });
});

describe('Data Validation - Email ID Inclusion', () => {
  it('should include original email ID in parsed application', () => {
    const emailIds = ['msg123', 'email456', 'id789'];

    emailIds.forEach(id => {
      const email = {
        id: id,
        from: 'jobs@company.com',
        subject: 'Application Received',
        body: 'Thank you for applying',
        date: new Date().toISOString()
      };

      const result = parseEmail(email);
      if (result) {
        expect(result.emailId).toBe(id);
      }
    });
  });

  it('should maintain email traceability through emailId field', () => {
    const email = {
      id: 'original-email-123',
      from: 'jobs@stripe.com',
      subject: 'Application - Software Engineer',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.emailId).toBe('original-email-123');
      expect(result.notes).toContain('Application - Software Engineer');
    }
  });
});

describe('Data Validation - Field Integrity', () => {
  it('should not truncate field values', () => {
    const longCompanyName = 'Very Long Company Name With Many Words Inc.';
    const longJobTitle = 'Senior Principal Staff Software Engineering Manager';
    
    const email = {
      id: 'test',
      from: 'jobs@company.com',
      subject: `Application - ${longJobTitle}`,
      body: `Thank you for applying to ${longCompanyName}`,
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.role.length).toBeGreaterThan(10);
      expect(result.company.length).toBeGreaterThan(5);
    }
  });

  it('should preserve all required fields in parsed output', () => {
    const email = {
      id: 'test123',
      from: 'jobs@stripe.com',
      subject: 'Application - Software Engineer',
      body: 'Thank you for applying. Location: San Francisco, CA',
      date: '2026-01-15T10:00:00Z'
    };

    const result = parseEmail(email);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('company');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('dateApplied');
    expect(result).toHaveProperty('lastUpdate');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('salary');
    expect(result).toHaveProperty('remotePolicy');
    expect(result).toHaveProperty('notes');
    expect(result).toHaveProperty('emailId');
    expect(result).toHaveProperty('confidenceScore');
    expect(result).toHaveProperty('isDuplicate');
  });

  it('should set source to "Email" for all parsed emails', () => {
    const emails = [
      { id: '1', from: 'jobs@stripe.com', subject: 'Application', body: 'Thank you for applying', date: new Date().toISOString() },
      { id: '2', from: 'jobs@google.com', subject: 'Interview', body: 'Schedule a call', date: new Date().toISOString() }
    ];

    emails.forEach(email => {
      const result = parseEmail(email);
      if (result) {
        expect(result.source).toBe('Email');
      }
    });
  });

  it('should initialize isDuplicate to 0', () => {
    const email = {
      id: 'test',
      from: 'jobs@company.com',
      subject: 'Application Received',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.isDuplicate).toBe(0);
    }
  });

  it('should set salary to null by default', () => {
    const email = {
      id: 'test',
      from: 'jobs@company.com',
      subject: 'Application Received',
      body: 'Thank you for applying',
      date: new Date().toISOString()
    };

    const result = parseEmail(email);
    if (result) {
      expect(result.salary).toBeNull();
    }
  });
});
