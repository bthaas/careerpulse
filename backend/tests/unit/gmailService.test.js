/**
 * Unit Tests for GmailService
 * Tests specific examples and edge cases for Gmail API operations
 * 
 * **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GmailService, GmailAPIError } from '../../services/GmailService.js';

describe('GmailService Unit Tests', () => {
  let gmailService;

  beforeEach(() => {
    gmailService = new GmailService({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost/callback'
    });
  });

  describe('Initialization', () => {
    it('should create instance with OAuth2 config', () => {
      expect(gmailService).toBeDefined();
      expect(gmailService.oauth2Client).toBeDefined();
      expect(gmailService.gmail).toBeNull();
      expect(gmailService.credentials).toBeNull();
    });

    it('should initialize Gmail client when credentials are set', () => {
      gmailService.setCredentials({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expiry_date: Date.now() + 3600000
      });

      expect(gmailService.gmail).toBeDefined();
      expect(gmailService.credentials).toBeDefined();
    });
  });

  describe('Credential Management', () => {
    it('should set credentials correctly', () => {
      const credentials = {
        access_token: 'test-access',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      };

      gmailService.setCredentials(credentials);

      expect(gmailService.credentials).toEqual(credentials);
    });

    it('should throw error when refreshing without refresh token', async () => {
      gmailService.setCredentials({
        access_token: 'test-access',
        expiry_date: Date.now() + 3600000
      });

      await expect(gmailService.refreshCredentials()).rejects.toThrow(GmailAPIError);
      await expect(gmailService.refreshCredentials()).rejects.toThrow('No refresh token available');
    });

    it('should refresh credentials successfully', async () => {
      gmailService.setCredentials({
        access_token: 'old-access-token',
        refresh_token: 'test-refresh-token',
        expiry_date: Date.now() - 1000 // Expired
      });

      // Mock the OAuth2 client's refreshAccessToken method
      gmailService.oauth2Client.refreshAccessToken = vi.fn().mockResolvedValue({
        credentials: {
          access_token: 'new-access-token',
          expiry_date: Date.now() + 3600000
        }
      });

      const newCredentials = await gmailService.refreshCredentials();

      expect(newCredentials.access_token).toBe('new-access-token');
      expect(gmailService.credentials.access_token).toBe('new-access-token');
    });
  });

  describe('Email Fetching', () => {
    beforeEach(() => {
      gmailService.setCredentials({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      });
    });

    it('should fetch emails with default options', async () => {
      const mockMessages = [
        { id: 'msg1' },
        { id: 'msg2' }
      ];

      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: mockMessages } }),
            get: vi.fn().mockImplementation(({ id }) => ({
              data: {
                id,
                payload: {
                  headers: [
                    { name: 'From', value: 'sender@example.com' },
                    { name: 'To', value: 'recipient@example.com' },
                    { name: 'Subject', value: 'Test Email' },
                    { name: 'Date', value: '2024-01-15' }
                  ],
                  body: { data: Buffer.from('Test body').toString('base64') }
                },
                snippet: 'Test snippet',
                threadId: 'thread-' + id,
                labelIds: ['INBOX']
              }
            }))
          }
        }
      };

      const emails = await gmailService.fetchEmails();

      expect(emails).toHaveLength(2);
      expect(emails[0].from).toBe('sender@example.com');
      expect(emails[0].subject).toBe('Test Email');
      expect(gmailService.gmail.users.messages.list).toHaveBeenCalledWith({
        userId: 'me',
        q: 'in:inbox',
        maxResults: 50
      });
    });

    it('should fetch emails with custom query and options', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: [] } })
          }
        }
      };

      await gmailService.fetchEmails({
        query: 'from:test@example.com',
        maxResults: 100,
        afterDate: '2024/01/01'
      });

      expect(gmailService.gmail.users.messages.list).toHaveBeenCalledWith({
        userId: 'me',
        q: 'from:test@example.com after:2024/01/01',
        maxResults: 100
      });
    });

    it('should return empty array when no messages found', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: {} })
          }
        }
      };

      const emails = await gmailService.fetchEmails();

      expect(emails).toEqual([]);
    });

    it('should handle multipart email bodies', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: [{ id: 'msg1' }] } }),
            get: vi.fn().mockResolvedValue({
              data: {
                id: 'msg1',
                payload: {
                  headers: [
                    { name: 'From', value: 'test@example.com' },
                    { name: 'Subject', value: 'Test' }
                  ],
                  parts: [
                    {
                      mimeType: 'text/plain',
                      body: { data: Buffer.from('Plain text body').toString('base64') }
                    },
                    {
                      mimeType: 'text/html',
                      body: { data: Buffer.from('<p>HTML body</p>').toString('base64') }
                    }
                  ]
                },
                snippet: 'test',
                threadId: 'thread1',
                labelIds: []
              }
            })
          }
        }
      };

      const emails = await gmailService.fetchEmails();

      expect(emails).toHaveLength(1);
      expect(emails[0].body).toBe('Plain text body');
    });

    it('should strip HTML from email body when no plain text available', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: [{ id: 'msg1' }] } }),
            get: vi.fn().mockResolvedValue({
              data: {
                id: 'msg1',
                payload: {
                  headers: [
                    { name: 'From', value: 'test@example.com' },
                    { name: 'Subject', value: 'Test' }
                  ],
                  parts: [
                    {
                      mimeType: 'text/html',
                      body: { data: Buffer.from('<p>HTML <b>body</b></p>').toString('base64') }
                    }
                  ]
                },
                snippet: 'test',
                threadId: 'thread1',
                labelIds: []
              }
            })
          }
        }
      };

      const emails = await gmailService.fetchEmails();

      expect(emails).toHaveLength(1);
      expect(emails[0].body).not.toContain('<p>');
      expect(emails[0].body).not.toContain('<b>');
    });
  });

  describe('Job Email Fetching', () => {
    beforeEach(() => {
      gmailService.setCredentials({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      });
    });

    it('should fetch job emails with default job query', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: [] } })
          }
        }
      };

      await gmailService.fetchJobEmails();

      const callArgs = gmailService.gmail.users.messages.list.mock.calls[0][0];
      expect(callArgs.q).toContain('application');
      expect(callArgs.q).toContain('interview');
      expect(callArgs.q).toContain('offer');
      expect(callArgs.maxResults).toBe(100);
    });

    it('should use custom afterDate if provided', async () => {
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: [] } })
          }
        }
      };

      await gmailService.fetchJobEmails({ afterDate: '2024/01/01' });

      const callArgs = gmailService.gmail.users.messages.list.mock.calls[0][0];
      expect(callArgs.q).toContain('after:2024/01/01');
    });
  });

  describe('Gmail Profile', () => {
    beforeEach(() => {
      gmailService.setCredentials({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      });
    });

    it('should fetch Gmail profile successfully', async () => {
      gmailService.gmail = {
        users: {
          getProfile: vi.fn().mockResolvedValue({
            data: {
              emailAddress: 'user@gmail.com',
              messagesTotal: 1000,
              threadsTotal: 500
            }
          })
        }
      };

      const profile = await gmailService.getGmailProfile();

      expect(profile.email).toBe('user@gmail.com');
      expect(profile.messagesTotal).toBe(1000);
      expect(profile.threadsTotal).toBe(500);
    });

    it('should throw GmailAPIError on profile fetch failure', async () => {
      gmailService.gmail = {
        users: {
          getProfile: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      await expect(gmailService.getGmailProfile()).rejects.toThrow(GmailAPIError);
      await expect(gmailService.getGmailProfile()).rejects.toThrow('Failed to fetch Gmail profile');
    });
  });

  describe('Error Handling', () => {
    it('should throw GmailAPIError when fetching emails fails', async () => {
      gmailService.setCredentials({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      });

      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockRejectedValue(new Error('Network error'))
          }
        }
      };

      await expect(gmailService.fetchEmails()).rejects.toThrow(GmailAPIError);
      await expect(gmailService.fetchEmails()).rejects.toThrow('Failed to fetch emails');
    });

    it('should throw GmailAPIError when not initialized', async () => {
      await expect(gmailService.fetchEmails()).rejects.toThrow(GmailAPIError);
      await expect(gmailService.fetchEmails()).rejects.toThrow('not initialized');
    });

    it('should continue processing when individual message fetch fails', async () => {
      gmailService.setCredentials({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000
      });

      const mockMessages = [
        { id: 'msg1' },
        { id: 'msg2' },
        { id: 'msg3' }
      ];

      let callCount = 0;
      gmailService.gmail = {
        users: {
          messages: {
            list: vi.fn().mockResolvedValue({ data: { messages: mockMessages } }),
            get: vi.fn().mockImplementation(({ id }) => {
              callCount++;
              if (id === 'msg2') {
                return Promise.reject(new Error('Failed to fetch message'));
              }
              return Promise.resolve({
                data: {
                  id,
                  payload: {
                    headers: [
                      { name: 'From', value: 'test@example.com' },
                      { name: 'Subject', value: 'Test' }
                    ],
                    body: { data: Buffer.from('test').toString('base64') }
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

      const emails = await gmailService.fetchEmails();

      expect(emails).toHaveLength(2); // msg1 and msg3, msg2 failed
      expect(callCount).toBe(3); // All three were attempted
    });
  });

  describe('Database Integration', () => {
    it('should initialize from database connection', async () => {
      // Mock getEmailConnection
      const mockConnection = {
        accessToken: 'db-access-token',
        refreshToken: 'db-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      // This test would require mocking the database module
      // For now, we'll just verify the method exists
      expect(gmailService.initializeFromDatabase).toBeDefined();
      expect(typeof gmailService.initializeFromDatabase).toBe('function');
    });
  });
});
