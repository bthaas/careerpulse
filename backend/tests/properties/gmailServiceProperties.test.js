/**
 * Property-Based Tests for GmailService
 * Tests universal properties that should hold for Gmail API operations
 * 
 * **Validates: Requirements 2.5, 2.6, 2.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GmailService, GmailAPIError } from '../../services/gmailService.js';

describe('GmailService Properties', () => {
  let gmailService;

  beforeEach(() => {
    gmailService = new GmailService({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost/callback'
    });
  });

  describe('Property 2: OAuth Token Refresh', () => {
    it('automatically refreshes expired tokens before API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            accessToken: fc.string({ minLength: 20, maxLength: 100 }),
            refreshToken: fc.string({ minLength: 20, maxLength: 100 }),
            expiryOffset: fc.integer({ min: -10, max: -1 }) // Expired tokens (minutes in past)
          }),
          async (tokenData) => {
            // Set expired credentials
            const expiredTime = Date.now() + (tokenData.expiryOffset * 60 * 1000);
            
            gmailService.setCredentials({
              access_token: tokenData.accessToken,
              refresh_token: tokenData.refreshToken,
              expiry_date: expiredTime
            });

            // Mock Gmail API FIRST before setting up refresh mock
            gmailService.gmail = {
              users: {
                messages: {
                  list: vi.fn().mockResolvedValue({ data: { messages: [] } })
                }
              }
            };

            // Mock the refresh method
            const originalRefresh = gmailService.refreshCredentials;
            let refreshCalled = false;
            gmailService.refreshCredentials = vi.fn(async () => {
              refreshCalled = true;
              // Simulate successful refresh
              gmailService.setCredentials({
                access_token: 'new-' + tokenData.accessToken,
                refresh_token: tokenData.refreshToken,
                expiry_date: Date.now() + (60 * 60 * 1000) // 1 hour from now
              });
              // Re-mock Gmail API after credentials change
              gmailService.gmail = {
                users: {
                  messages: {
                    list: vi.fn().mockResolvedValue({ data: { messages: [] } })
                  }
                }
              };
              return gmailService.credentials;
            });

            // Call fetchEmails - should trigger refresh
            await gmailService.fetchEmails({ query: 'test' });

            // Verify refresh was called for expired token
            expect(refreshCalled).toBe(true);

            // Restore original method
            gmailService.refreshCredentials = originalRefresh;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('does not refresh valid tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            accessToken: fc.string({ minLength: 20, maxLength: 100 }),
            refreshToken: fc.string({ minLength: 20, maxLength: 100 }),
            expiryOffset: fc.integer({ min: 10, max: 60 }) // Valid tokens (minutes in future)
          }),
          async (tokenData) => {
            // Set valid credentials
            const validTime = Date.now() + (tokenData.expiryOffset * 60 * 1000);
            
            gmailService.setCredentials({
              access_token: tokenData.accessToken,
              refresh_token: tokenData.refreshToken,
              expiry_date: validTime
            });

            // Mock the refresh method
            let refreshCalled = false;
            gmailService.refreshCredentials = vi.fn(async () => {
              refreshCalled = true;
              return gmailService.credentials;
            });

            // Mock Gmail API
            gmailService.gmail = {
              users: {
                messages: {
                  list: vi.fn().mockResolvedValue({ data: { messages: [] } })
                }
              }
            };

            // Call fetchEmails - should NOT trigger refresh
            await gmailService.fetchEmails({ query: 'test' });

            // Verify refresh was NOT called for valid token
            expect(refreshCalled).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 3: Gmail API Error Handling', () => {
    it('throws descriptive GmailAPIError for API failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
            errorCode: fc.integer({ min: 400, max: 599 })
          }),
          async (errorData) => {
            // Set valid credentials
            gmailService.setCredentials({
              access_token: 'test-token',
              refresh_token: 'test-refresh',
              expiry_date: Date.now() + (60 * 60 * 1000)
            });

            // Mock Gmail API to throw error
            const apiError = new Error(errorData.errorMessage);
            apiError.code = errorData.errorCode;
            
            gmailService.gmail = {
              users: {
                messages: {
                  list: vi.fn().mockRejectedValue(apiError)
                }
              }
            };

            // Call fetchEmails - should throw GmailAPIError
            try {
              await gmailService.fetchEmails({ query: 'test' });
              expect(true).toBe(false); // Should not reach here
            } catch (error) {
              expect(error).toBeInstanceOf(GmailAPIError);
              expect(error.message).toContain('Failed to fetch emails');
              expect(error.originalError).toBeDefined();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('throws GmailAPIError when not initialized', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            query: fc.string({ minLength: 1, maxLength: 50 })
          }),
          async (options) => {
            const uninitializedService = new GmailService({
              clientId: 'test',
              clientSecret: 'test',
              redirectUri: 'http://test'
            });

            try {
              await uninitializedService.fetchEmails({ query: options.query });
              expect(true).toBe(false); // Should not reach here
            } catch (error) {
              expect(error).toBeInstanceOf(GmailAPIError);
              expect(error.message).toContain('not initialized');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('continues processing emails despite individual message failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 10, maxLength: 20 }), { minLength: 3, maxLength: 10 }),
          async (messageIds) => {
            // Set valid credentials
            gmailService.setCredentials({
              access_token: 'test-token',
              refresh_token: 'test-refresh',
              expiry_date: Date.now() + (60 * 60 * 1000)
            });

            // Mock Gmail API - list returns messages, but some get() calls fail
            const messages = messageIds.map(id => ({ id }));
            let getCallCount = 0;
            
            gmailService.gmail = {
              users: {
                messages: {
                  list: vi.fn().mockResolvedValue({ data: { messages } }),
                  get: vi.fn().mockImplementation(({ id }) => {
                    getCallCount++;
                    // Fail every other message
                    if (getCallCount % 2 === 0) {
                      return Promise.reject(new Error('Message fetch failed'));
                    }
                    return Promise.resolve({
                      data: {
                        id,
                        payload: {
                          headers: [
                            { name: 'From', value: 'test@example.com' },
                            { name: 'Subject', value: 'Test' }
                          ],
                          body: { data: Buffer.from('test body').toString('base64') }
                        },
                        snippet: 'test',
                        threadId: 'thread-' + id,
                        labelIds: []
                      }
                    });
                  })
                }
              }
            };

            // Call fetchEmails - should return successful messages only
            const emails = await gmailService.fetchEmails({ query: 'test' });

            // Should have approximately half the messages (those that didn't fail)
            expect(emails.length).toBeGreaterThan(0);
            expect(emails.length).toBeLessThanOrEqual(messageIds.length);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 4: Credential Management', () => {
    it('maintains credentials after setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            accessToken: fc.string({ minLength: 20, maxLength: 100 }),
            refreshToken: fc.string({ minLength: 20, maxLength: 100 }),
            expiryDate: fc.integer({ min: Date.now(), max: Date.now() + 86400000 })
          }),
          async (creds) => {
            gmailService.setCredentials({
              access_token: creds.accessToken,
              refresh_token: creds.refreshToken,
              expiry_date: creds.expiryDate
            });

            expect(gmailService.credentials).toBeDefined();
            expect(gmailService.credentials.access_token).toBe(creds.accessToken);
            expect(gmailService.credentials.refresh_token).toBe(creds.refreshToken);
            expect(gmailService.gmail).toBeDefined();
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
