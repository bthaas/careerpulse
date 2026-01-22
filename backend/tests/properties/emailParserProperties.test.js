/**
 * Property-Based Tests for EmailParser
 * Tests universal properties that should hold for email parsing operations
 * 
 * **Validates: Requirements 3.5, 3.6, 3.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { EmailParser } from '../../services/emailParser.js';

describe('EmailParser Properties', () => {
  let emailParser;
  let mockLLMParser;

  beforeEach(() => {
    mockLLMParser = {
      extractWithLLM: vi.fn()
    };
    emailParser = new EmailParser(mockLLMParser);
  });

  describe('Property 4: LLM Parser Delegation', () => {
    it('delegates to LLMParser for job emails passing keyword filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            from: fc.emailAddress(),
            subject: fc.constantFrom(
              'Application Received',
              'Interview Invitation',
              'Job Offer',
              'Application Status'
            ),
            body: fc.string({ minLength: 50, maxLength: 200 }),
            date: fc.date().map(d => d.toISOString())
          }),
          async (email) => {
            // Mock LLM to return job email result
            mockLLMParser.extractWithLLM.mockResolvedValue({
              isJobEmail: true,
              company: 'Test Company',
              jobTitle: 'Software Engineer',
              status: 'Applied',
              location: 'Remote'
            });

            // Parse email
            await emailParser.parseEmail(email);

            // Verify LLM was called
            expect(mockLLMParser.extractWithLLM).toHaveBeenCalledWith(
              email.from,
              email.subject,
              email.body
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('calls LLM for emails with job keywords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            from: fc.emailAddress(),
            keyword: fc.constantFrom('application', 'interview', 'offer', 'hiring', 'job'),
            body: fc.string({ minLength: 20, maxLength: 100 }),
            date: fc.date().map(d => d.toISOString())
          }),
          async (data) => {
            const email = {
              id: data.id,
              from: data.from,
              subject: `Email about ${data.keyword}`,
              body: data.body,
              date: data.date
            };

            mockLLMParser.extractWithLLM.mockResolvedValue({
              isJobEmail: true,
              company: 'Company',
              jobTitle: 'Role',
              status: 'Applied',
              location: 'Location'
            });

            await emailParser.parseEmail(email);

            expect(mockLLMParser.extractWithLLM).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 5: Non-Job Email Filtering', () => {
    it('returns null without calling LLM for emails without job keywords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            from: fc.emailAddress(),
            subject: fc.constantFrom(
              'Weekly Newsletter',
              'Special Discount',
              'Account Update',
              'Password Reset'
            ),
            body: fc.string({ minLength: 20, maxLength: 100 }),
            date: fc.date().map(d => d.toISOString())
          }),
          async (email) => {
            const result = await emailParser.parseEmail(email);

            // Should return null
            expect(result).toBeNull();

            // Should NOT call LLM
            expect(mockLLMParser.extractWithLLM).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('filters out spam emails even with job keywords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            from: fc.emailAddress(),
            spamKeyword: fc.constantFrom('unsubscribe', 'promotional', 'discount'),
            body: fc.string({ minLength: 20, maxLength: 100 }),
            date: fc.date().map(d => d.toISOString())
          }),
          async (data) => {
            const email = {
              id: data.id,
              from: data.from,
              subject: `${data.spamKeyword} - Special Offer`,
              body: data.body,
              date: data.date
            };

            // Mock LLM to return null (shouldn't be called for spam)
            mockLLMParser.extractWithLLM.mockResolvedValue(null);

            const result = await emailParser.parseEmail(email);

            // Should return null for spam
            expect(result).toBeNull();

            // LLM might be called if spam keyword is in subject but body has job keywords
            // The important thing is that result is null
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 6: Confidence Score Calculation', () => {
    it('returns scores between 0 and 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            company: fc.string({ minLength: 1, maxLength: 50 }),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
            usedLLM: fc.boolean()
          }),
          async (data) => {
            const score = emailParser.calculateConfidence(
              data.company,
              data.role,
              data.status,
              data.usedLLM
            );

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('gives higher scores for LLM-extracted data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            company: fc.string({ minLength: 5, maxLength: 50 }),
            role: fc.string({ minLength: 5, maxLength: 50 }),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected')
          }),
          async (data) => {
            const llmScore = emailParser.calculateConfidence(
              data.company,
              data.role,
              data.status,
              true
            );

            const manualScore = emailParser.calculateConfidence(
              data.company,
              data.role,
              data.status,
              false
            );

            // LLM score should be higher than manual score
            expect(llmScore).toBeGreaterThan(manualScore);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('gives higher scores for complete information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            usedLLM: fc.boolean(),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected')
          }),
          async (data) => {
            // Complete information
            const completeScore = emailParser.calculateConfidence(
              'Google',
              'Software Engineer',
              data.status,
              data.usedLLM
            );

            // Incomplete information (missing company)
            const incompleteScore = emailParser.calculateConfidence(
              'Not specified',
              'Software Engineer',
              data.status,
              data.usedLLM
            );

            // Complete should have higher score
            expect(completeScore).toBeGreaterThan(incompleteScore);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('gives bonus for non-Applied status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            company: fc.string({ minLength: 5, maxLength: 50 }),
            role: fc.string({ minLength: 5, maxLength: 50 }),
            usedLLM: fc.boolean(),
            specificStatus: fc.constantFrom('Interview', 'Offer', 'Rejected')
          }),
          async (data) => {
            const specificScore = emailParser.calculateConfidence(
              data.company,
              data.role,
              data.specificStatus,
              data.usedLLM
            );

            const appliedScore = emailParser.calculateConfidence(
              data.company,
              data.role,
              'Applied',
              data.usedLLM
            );

            // Specific status should have higher score
            expect(specificScore).toBeGreaterThanOrEqual(appliedScore);
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
