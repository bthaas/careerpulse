/**
 * Property-Based Tests for LLMParser
 * Tests universal properties that should hold for LLM operations
 * 
 * **Validates: Requirements 4.3, 4.5, 4.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { LLMParser } from '../../services/LLMParser.js';

describe('LLMParser Properties', () => {
  let llmParser;

  beforeEach(() => {
    llmParser = new LLMParser('test-api-key');
  });

  describe('Property 7: LLM Result Caching', () => {
    it('uses cache for repeated calls with same content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 10, maxLength: 100 }),
            body: fc.string({ minLength: 50, maxLength: 500 })
          }),
          async (emailData) => {
            // Mock the model to track calls
            let callCount = 0;
            const mockResult = {
              isJobEmail: true,
              company: 'Test Company',
              jobTitle: 'Software Engineer',
              status: 'Applied',
              location: 'Remote'
            };

            llmParser.model = {
              generateContent: vi.fn(async () => {
                callCount++;
                return {
                  response: {
                    text: () => JSON.stringify(mockResult)
                  }
                };
              })
            };

            // First call - should hit the model
            const result1 = await llmParser.extractWithLLM(
              emailData.from,
              emailData.subject,
              emailData.body
            );

            // Second call with same content - should use cache
            const result2 = await llmParser.extractWithLLM(
              emailData.from,
              emailData.subject,
              emailData.body
            );

            // Third call with same content - should use cache
            const result3 = await llmParser.extractWithLLM(
              emailData.from,
              emailData.subject,
              emailData.body
            );

            // Verify model was only called once
            expect(callCount).toBe(1);

            // Verify all results are identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('evicts oldest entries when cache is full', async () => {
      // Create parser with small cache
      const smallCacheParser = new LLMParser('test-api-key', { cacheMaxSize: 3 });

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              from: fc.emailAddress(),
              subject: fc.string({ minLength: 10, maxLength: 50 }),
              body: fc.string({ minLength: 50, maxLength: 200 })
            }),
            { minLength: 5, maxLength: 10 }
          ),
          async (emails) => {
            // Mock the model
            smallCacheParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify({
                    isJobEmail: false
                  })
                }
              }))
            };

            // Fill cache beyond capacity
            for (const email of emails) {
              await smallCacheParser.extractWithLLM(
                email.from,
                email.subject,
                email.body
              );
            }

            // Cache should never exceed max size
            const stats = smallCacheParser.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
            expect(stats.size).toBe(Math.min(emails.length, 3));
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 8: LLM Error Resilience', () => {
    it('returns null without throwing on API errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 }),
            errorMessage: fc.string({ minLength: 5, maxLength: 50 })
          }),
          async (data) => {
            // Mock the model to throw error
            llmParser.model = {
              generateContent: vi.fn(async () => {
                throw new Error(data.errorMessage);
              })
            };

            // Should return null, not throw
            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('returns null when model is not initialized', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 })
          }),
          async (data) => {
            const uninitializedParser = new LLMParser(null);

            const result = await uninitializedParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 9: LLM Response Validation', () => {
    it('rejects responses missing isJobEmail field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 })
          }),
          async (data) => {
            // Mock model to return invalid response (missing isJobEmail)
            llmParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify({
                    company: 'Test',
                    jobTitle: 'Engineer'
                  })
                }
              }))
            };

            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('rejects job emails missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 }),
            missingField: fc.constantFrom('company', 'jobTitle', 'status', 'location')
          }),
          async (data) => {
            // Create response missing one required field
            const response = {
              isJobEmail: true,
              company: 'Test Company',
              jobTitle: 'Software Engineer',
              status: 'Applied',
              location: 'Remote'
            };
            delete response[data.missingField];

            llmParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify(response)
                }
              }))
            };

            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('rejects job emails with empty jobTitle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 }),
            emptyTitle: fc.constantFrom('', '   ', '\t', '\n')
          }),
          async (data) => {
            llmParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify({
                    isJobEmail: true,
                    company: 'Test Company',
                    jobTitle: data.emptyTitle,
                    status: 'Applied',
                    location: 'Remote'
                  })
                }
              }))
            };

            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('accepts valid non-job email responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 })
          }),
          async (data) => {
            llmParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify({
                    isJobEmail: false
                  })
                }
              }))
            };

            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toEqual({ isJobEmail: false });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('accepts valid job email responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            body: fc.string({ minLength: 20, maxLength: 500 }),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            jobTitle: fc.string({ minLength: 5, maxLength: 100 }),
            status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
            location: fc.string({ minLength: 2, maxLength: 50 })
          }),
          async (data) => {
            const expectedResult = {
              isJobEmail: true,
              company: data.company,
              jobTitle: data.jobTitle,
              status: data.status,
              location: data.location
            };

            llmParser.model = {
              generateContent: vi.fn(async () => ({
                response: {
                  text: () => JSON.stringify(expectedResult)
                }
              }))
            };

            const result = await llmParser.extractWithLLM(
              data.from,
              data.subject,
              data.body
            );

            expect(result).toEqual(expectedResult);
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
