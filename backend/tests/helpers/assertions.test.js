/**
 * Unit Tests for Assertion Helpers
 * 
 * Tests all custom assertion functions to ensure they correctly validate
 * application structure, confidence scores, date formats, and status values.
 */

import { describe, it, expect } from 'vitest';
import {
  assertValidApplication,
  assertConfidenceScore,
  assertValidDateFormat,
  assertValidStatus,
  assertEmailParsedCorrectly,
  assertSpecialCharactersPreserved,
  assertFallbackValuesUsed,
  CONSTANTS
} from './assertions.js';

describe('Assertion Helpers', () => {
  describe('assertValidApplication', () => {
    it('should pass for a valid application with all required fields', () => {
      const validApp = {
        id: 'app-123',
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: '$100k-$150k',
        remotePolicy: 'Hybrid',
        notes: 'Interesting position',
        emailId: 'email-789',
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(validApp)).not.toThrow();
    });

    it('should pass for a valid application with null optional fields', () => {
      const validApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(validApp)).not.toThrow();
    });

    it('should throw if application is null', () => {
      expect(() => assertValidApplication(null)).toThrow('Application must be a non-null object');
    });

    it('should throw if application is not an object', () => {
      expect(() => assertValidApplication('not an object')).toThrow('Application must be a non-null object');
    });

    it('should throw if required string field is missing', () => {
      const invalidApp = {
        userId: 'user-456',
        // company is missing
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.company must be a string');
    });

    it('should throw if required string field is empty', () => {
      const invalidApp = {
        userId: 'user-456',
        company: '', // empty string
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.company cannot be empty');
    });

    it('should throw if confidenceScore is not a number', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: '100', // string instead of number
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.confidenceScore must be a number');
    });

    it('should throw if confidenceScore is out of range', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 150, // out of range
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.confidenceScore must be between 0 and 100');
    });

    it('should throw if isDuplicate is not 0 or 1', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 2 // invalid value
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.isDuplicate must be 0 or 1');
    });

    it('should throw if dateApplied format is invalid', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '01/15/2024', // wrong format
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('dateApplied must be in YYYY-MM-DD format');
    });

    it('should throw if status is invalid', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:30:00.000Z',
        status: 'Pending', // invalid status
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Status must be one of');
    });

    it('should throw if createdAt is not ISO 8601', () => {
      const invalidApp = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15', // not ISO 8601
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: null,
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertValidApplication(invalidApp)).toThrow('Application.createdAt must be a valid ISO 8601 timestamp');
    });
  });

  describe('assertConfidenceScore', () => {
    it('should pass for correct confidence score with all valid fields', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        status: 'Applied',
        confidenceScore: 100 // 35 + 35 + 30
      };

      expect(() => assertConfidenceScore(app)).not.toThrow();
    });

    it('should pass for correct confidence score with fallback company', () => {
      const app = {
        company: 'Unknown Company',
        role: 'Software Engineer',
        status: 'Applied',
        confidenceScore: 65 // 0 + 35 + 30
      };

      expect(() => assertConfidenceScore(app)).not.toThrow();
    });

    it('should pass for correct confidence score with fallback role', () => {
      const app = {
        company: 'TechCorp',
        role: 'Unknown Position',
        status: 'Applied',
        confidenceScore: 65 // 35 + 0 + 30
      };

      expect(() => assertConfidenceScore(app)).not.toThrow();
    });

    it('should pass for correct confidence score with all fallbacks', () => {
      const app = {
        company: 'Unknown Company',
        role: 'Unknown Position',
        status: 'Applied',
        confidenceScore: 30 // 0 + 0 + 30
      };

      expect(() => assertConfidenceScore(app)).not.toThrow();
    });

    it('should throw if confidence score is incorrect', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        status: 'Applied',
        confidenceScore: 50 // should be 100
      };

      expect(() => assertConfidenceScore(app)).toThrow('Confidence score mismatch');
    });

    it('should pass when expected score is explicitly provided', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        status: 'Applied',
        confidenceScore: 100
      };

      expect(() => assertConfidenceScore(app, 100)).not.toThrow();
    });

    it('should throw when expected score does not match', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        status: 'Applied',
        confidenceScore: 100
      };

      expect(() => assertConfidenceScore(app, 50)).toThrow('Confidence score mismatch');
    });

    it('should provide detailed breakdown in error message', () => {
      const app = {
        company: 'TechCorp',
        role: 'Unknown Position',
        status: 'Applied',
        confidenceScore: 100 // should be 65
      };

      try {
        assertConfidenceScore(app);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Breakdown:');
        expect(error.message).toContain('Company "TechCorp": 35 points');
        expect(error.message).toContain('Role "Unknown Position": 0 points');
        expect(error.message).toContain('Status "Applied": 30 points');
      }
    });
  });

  describe('assertValidDateFormat', () => {
    it('should pass for valid YYYY-MM-DD date', () => {
      expect(() => assertValidDateFormat('2024-01-15')).not.toThrow();
    });

    it('should pass for valid date with single digit month/day', () => {
      expect(() => assertValidDateFormat('2024-01-05')).not.toThrow();
    });

    it('should pass for leap year date', () => {
      expect(() => assertValidDateFormat('2024-02-29')).not.toThrow();
    });

    it('should throw for non-string date', () => {
      expect(() => assertValidDateFormat(20240115)).toThrow('date must be a string');
    });

    it('should throw for wrong format (MM/DD/YYYY)', () => {
      expect(() => assertValidDateFormat('01/15/2024')).toThrow('date must be in YYYY-MM-DD format');
    });

    it('should throw for wrong format (DD-MM-YYYY)', () => {
      expect(() => assertValidDateFormat('15-01-2024')).toThrow('date must be in YYYY-MM-DD format');
    });

    it('should throw for invalid month', () => {
      expect(() => assertValidDateFormat('2024-13-15')).toThrow('month must be between 01 and 12');
    });

    it('should throw for invalid day', () => {
      expect(() => assertValidDateFormat('2024-01-32')).toThrow('day must be between 01 and 31');
    });

    it('should throw for invalid calendar date (Feb 31)', () => {
      expect(() => assertValidDateFormat('2024-02-31')).toThrow('is not a valid calendar date');
    });

    it('should throw for non-leap year Feb 29', () => {
      expect(() => assertValidDateFormat('2023-02-29')).toThrow('is not a valid calendar date');
    });

    it('should throw for year out of range', () => {
      expect(() => assertValidDateFormat('1999-01-15')).toThrow('year must be between 2000 and 2100');
    });

    it('should use custom field name in error message', () => {
      try {
        assertValidDateFormat('invalid', 'dateApplied');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('dateApplied');
      }
    });
  });

  describe('assertValidStatus', () => {
    it('should pass for "Applied" status', () => {
      expect(() => assertValidStatus('Applied')).not.toThrow();
    });

    it('should pass for "Interview" status', () => {
      expect(() => assertValidStatus('Interview')).not.toThrow();
    });

    it('should pass for "Offer" status', () => {
      expect(() => assertValidStatus('Offer')).not.toThrow();
    });

    it('should pass for "Rejected" status', () => {
      expect(() => assertValidStatus('Rejected')).not.toThrow();
    });

    it('should throw for invalid status', () => {
      expect(() => assertValidStatus('Pending')).toThrow('Status must be one of');
    });

    it('should throw for non-string status', () => {
      expect(() => assertValidStatus(123)).toThrow('Status must be a string');
    });

    it('should throw for empty string', () => {
      expect(() => assertValidStatus('')).toThrow('Status must be one of');
    });

    it('should be case-sensitive', () => {
      expect(() => assertValidStatus('applied')).toThrow('Status must be one of');
    });
  });

  describe('assertEmailParsedCorrectly', () => {
    it('should pass for correctly parsed email', () => {
      const email = {
        id: 'email-123',
        from: 'jobs@techcorp.com',
        subject: 'Application Received - Software Engineer',
        body: 'Thank you for applying...',
        date: '2024-01-15T10:00:00Z'
      };

      const parsed = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: 'email-123',
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertEmailParsedCorrectly(email, parsed)).not.toThrow();
    });

    it('should throw if emailId does not match', () => {
      const email = {
        id: 'email-123',
        from: 'jobs@techcorp.com',
        subject: 'Application Received',
        body: 'Thank you for applying...'
      };

      const parsed = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: 'email-999', // wrong ID
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertEmailParsedCorrectly(email, parsed)).toThrow('emailId should match email.id');
    });

    it('should validate expected company if provided', () => {
      const email = {
        id: 'email-123',
        from: 'jobs@techcorp.com',
        subject: 'Application Received',
        body: 'Thank you for applying...'
      };

      const parsed = {
        userId: 'user-456',
        company: 'WrongCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'Applied',
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: 'email-123',
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertEmailParsedCorrectly(email, parsed, { company: 'TechCorp' }))
        .toThrow('Expected company "TechCorp"');
    });

    it('should validate expected status if provided', () => {
      const email = {
        id: 'email-123',
        from: 'jobs@techcorp.com',
        subject: 'Interview Invitation',
        body: 'We would like to schedule an interview...'
      };

      const parsed = {
        userId: 'user-456',
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA',
        dateApplied: '2024-01-15',
        lastUpdate: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'Applied', // should be Interview
        source: 'Email',
        salary: null,
        remotePolicy: null,
        notes: '',
        emailId: 'email-123',
        confidenceScore: 100,
        isDuplicate: 0
      };

      expect(() => assertEmailParsedCorrectly(email, parsed, { status: 'Interview' }))
        .toThrow('Expected status "Interview"');
    });
  });

  describe('assertSpecialCharactersPreserved', () => {
    it('should pass when special characters are preserved', () => {
      const original = 'Café™ Inc.';
      const processed = 'Café™ Inc.';
      
      expect(() => assertSpecialCharactersPreserved(original, processed)).not.toThrow();
    });

    it('should pass when original is contained in processed', () => {
      const original = 'José García';
      const processed = 'Application from José García for the position';
      
      expect(() => assertSpecialCharactersPreserved(original, processed)).not.toThrow();
    });

    it('should pass for unicode characters', () => {
      const original = '日本語テスト';
      const processed = '日本語テスト';
      
      expect(() => assertSpecialCharactersPreserved(original, processed)).not.toThrow();
    });

    it('should pass for emoji', () => {
      const original = 'Great opportunity! 🎉';
      const processed = 'Great opportunity! 🎉';
      
      expect(() => assertSpecialCharactersPreserved(original, processed)).not.toThrow();
    });

    it('should throw if characters are corrupted', () => {
      const original = 'Café';
      const processed = 'Cafe'; // accent removed
      
      expect(() => assertSpecialCharactersPreserved(original, processed))
        .toThrow('Special characters not preserved');
    });

    it('should throw if replacement character is present', () => {
      const original = 'Test';
      const processed = 'Test\uFFFD'; // replacement character
      
      expect(() => assertSpecialCharactersPreserved(original, processed))
        .toThrow('contains replacement character');
    });

    it('should throw if null bytes are present', () => {
      const original = 'Test';
      const processed = 'Test\x00'; // null byte
      
      expect(() => assertSpecialCharactersPreserved(original, processed))
        .toThrow('contains null bytes');
    });

    it('should use custom field name in error message', () => {
      const original = 'Café';
      const processed = 'Cafe';
      
      try {
        assertSpecialCharactersPreserved(original, processed, 'company');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('company');
      }
    });
  });

  describe('assertFallbackValuesUsed', () => {
    it('should pass when expected fallback values are used', () => {
      const app = {
        company: 'Unknown Company',
        role: 'Unknown Position',
        location: 'Not specified'
      };

      expect(() => assertFallbackValuesUsed(app, ['company', 'role', 'location'])).not.toThrow();
    });

    it('should pass when some fallback values are used', () => {
      const app = {
        company: 'Unknown Company',
        role: 'Software Engineer',
        location: 'Not specified'
      };

      expect(() => assertFallbackValuesUsed(app, ['company', 'location'])).not.toThrow();
    });

    it('should pass when no fallbacks are expected', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA'
      };

      expect(() => assertFallbackValuesUsed(app, [])).not.toThrow();
    });

    it('should throw when expected fallback is not used', () => {
      const app = {
        company: 'TechCorp', // not a fallback
        role: 'Unknown Position',
        location: 'Not specified'
      };

      expect(() => assertFallbackValuesUsed(app, ['company']))
        .toThrow('Expected fallback value for company');
    });

    it('should throw for unknown fallback field', () => {
      const app = {
        company: 'TechCorp',
        role: 'Software Engineer',
        location: 'San Francisco, CA'
      };

      expect(() => assertFallbackValuesUsed(app, ['unknownField']))
        .toThrow('Unknown fallback field');
    });
  });

  describe('CONSTANTS', () => {
    it('should export VALID_STATUSES', () => {
      expect(CONSTANTS.VALID_STATUSES).toEqual(['Applied', 'Interview', 'Offer', 'Rejected']);
    });

    it('should export FALLBACK_VALUES', () => {
      expect(CONSTANTS.FALLBACK_VALUES).toEqual({
        company: 'Unknown Company',
        role: 'Unknown Position',
        location: 'Not specified'
      });
    });
  });
});
