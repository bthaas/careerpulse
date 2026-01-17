/**
 * Property-Based Tests for Data Quality
 * Validates date formatting, status enums, fallback values, and email traceability
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseEmail } from '../../services/emailParser.js';

/**
 * Property 8: Date Format Consistency
 * For any parsed application, dateApplied should match YYYY-MM-DD
 * Validates: Requirements 5.1
 */
describe('Property 8: Date Format Consistency', () => {
  it('should always format dates as YYYY-MM-DD', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.emailAddress(),
        (date, from) => {
          // Skip invalid dates
          if (isNaN(date.getTime())) return;
          
          const email = {
            id: fc.sample(fc.uuid(), 1)[0],
            from: `jobs@${from.split('@')[1]}`,
            subject: 'Application Received',
            body: 'Thank you for applying',
            date: date.toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(result.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(result.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent date format across different date inputs', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        (date) => {
          const email = {
            id: 'test',
            from: 'jobs@company.com',
            subject: 'Application - Software Engineer',
            body: 'Thank you for applying',
            date: date.toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            expect(result.dateApplied).toMatch(dateRegex);
            
            // Verify it's a valid date
            const parsedDate = new Date(result.dateApplied);
            expect(parsedDate).toBeInstanceOf(Date);
            expect(isNaN(parsedDate.getTime())).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: Status Enum Validation
 * For any parsed application, status should be valid enum value
 * Validates: Requirements 5.2
 */
describe('Property 9: Status Enum Validation', () => {
  const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

  it('should only return valid status enum values', () => {
    const statusKeywords = {
      'Applied': ['application received', 'thank you for applying', 'applied successfully'],
      'Interview': ['interview', 'schedule a call', 'phone screen'],
      'Offer': ['offer', 'congratulations', 'pleased to offer'],
      'Rejected': ['unfortunately', 'not moving forward', 'rejected']
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(statusKeywords)),
        fc.string({ minLength: 0, maxLength: 50 }),
        (expectedStatus, extraText) => {
          const keywords = statusKeywords[expectedStatus];
          const keyword = keywords[0];
          
          const email = {
            id: 'test',
            from: 'jobs@company.com',
            subject: `${keyword} ${extraText}`,
            body: keyword,
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(validStatuses).toContain(result.status);
            expect(result.status).toBe(expectedStatus);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never return invalid status values for any email', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('application', 'interview', 'offer', 'unfortunately'),
        fc.emailAddress(),
        fc.string({ minLength: 5, maxLength: 100 }),
        (keyword, from, body) => {
          const email = {
            id: 'test',
            from: `jobs@${from.split('@')[1]}`,
            subject: `${keyword} notification`,
            body: `${keyword} ${body}`,
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(validStatuses).toContain(result.status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Fallback Value Assignment
 * For any email with extraction failures, fallbacks should be used
 * Validates: Requirements 5.3, 5.4, 5.5
 */
describe('Property 10: Fallback Value Assignment', () => {
  it('should provide fallback values when extraction fails', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 30 }),
        fc.string({ minLength: 10, maxLength: 50 }),
        (subject, body) => {
          // Create email with minimal extractable information
          const email = {
            id: 'test',
            from: 'noreply@test.com',
            subject: `Application ${subject}`,
            body: `Thank you for applying. ${body}`,
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            // All fields should be defined (with fallbacks if needed)
            expect(result.company).toBeDefined();
            expect(result.company.length).toBeGreaterThan(0);
            
            expect(result.role).toBeDefined();
            expect(result.role.length).toBeGreaterThan(0);
            
            expect(result.location).toBeDefined();
            expect(result.location.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never return null or undefined for required fields', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 10, maxLength: 100 }),
        (from, body) => {
          const email = {
            id: 'test',
            from: from,
            subject: 'Application Received',
            body: `Thank you for applying. ${body}`,
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(result.company).not.toBeNull();
            expect(result.company).not.toBeUndefined();
            
            expect(result.role).not.toBeNull();
            expect(result.role).not.toBeUndefined();
            
            expect(result.location).not.toBeNull();
            expect(result.location).not.toBeUndefined();
            
            expect(result.status).not.toBeNull();
            expect(result.status).not.toBeUndefined();
            
            expect(result.dateApplied).not.toBeNull();
            expect(result.dateApplied).not.toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: Email Traceability
 * For any saved application, emailId should contain original message ID
 * Validates: Requirements 5.6
 */
describe('Property 11: Email Traceability', () => {
  it('should preserve original email ID in parsed application', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        (emailId, from) => {
          const email = {
            id: emailId,
            from: `jobs@${from.split('@')[1]}`,
            subject: 'Application - Software Engineer',
            body: 'Thank you for applying',
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(result.emailId).toBe(emailId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain traceability for any email ID format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (emailId) => {
          const email = {
            id: emailId,
            from: 'jobs@company.com',
            subject: 'Application Received',
            body: 'Thank you for applying',
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(result.emailId).toBe(emailId);
            expect(result.emailId.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email subject in notes for traceability', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (subject) => {
          const email = {
            id: 'test',
            from: 'jobs@company.com',
            subject: `Application - ${subject}`,
            body: 'Thank you for applying',
            date: new Date().toISOString()
          };

          const result = parseEmail(email);
          if (result) {
            expect(result.notes).toBeDefined();
            expect(result.notes).toContain(subject);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
