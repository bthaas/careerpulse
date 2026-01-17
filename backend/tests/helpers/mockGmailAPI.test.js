/**
 * Tests for MockGmailAPI helper
 * Verifies the mock behaves correctly for error simulation scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockGmailAPI, createMockGmailAPI } from './mockGmailAPI.js';

describe('MockGmailAPI', () => {
  let mockAPI;
  let client;

  beforeEach(() => {
    mockAPI = new MockGmailAPI();
    client = mockAPI.createClient();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(mockAPI.messages).toEqual([]);
      expect(mockAPI.error).toBeNull();
      expect(mockAPI.rateLimitEnabled).toBe(false);
      expect(mockAPI.callHistory).toEqual([]);
    });

    it('should have default profile', () => {
      expect(mockAPI.profile).toEqual({
        emailAddress: 'test@example.com',
        messagesTotal: 0,
        threadsTotal: 0
      });
    });
  });

  describe('setMessages()', () => {
    it('should set messages and update profile counts', () => {
      const messages = [
        {
          id: 'msg1',
          threadId: 'thread1',
          labelIds: ['INBOX'],
          snippet: 'Test message 1',
          payload: {
            headers: [
              { name: 'From', value: 'sender@example.com' },
              { name: 'Subject', value: 'Test Subject' }
            ],
            body: { data: 'VGVzdCBib2R5' } // base64 encoded "Test body"
          }
        },
        {
          id: 'msg2',
          threadId: 'thread1',
          labelIds: ['INBOX'],
          snippet: 'Test message 2',
          payload: {
            headers: [
              { name: 'From', value: 'sender@example.com' },
              { name: 'Subject', value: 'Test Subject 2' }
            ],
            body: { data: 'VGVzdCBib2R5IDI=' } // base64 encoded "Test body 2"
          }
        }
      ];

      mockAPI.setMessages(messages);

      expect(mockAPI.messages).toEqual(messages);
      expect(mockAPI.profile.messagesTotal).toBe(2);
      expect(mockAPI.profile.threadsTotal).toBe(1); // Both in same thread
    });
  });

  describe('setError()', () => {
    it('should set error to be thrown', () => {
      const error = new Error('Test error');
      mockAPI.setError(error);
      expect(mockAPI.error).toBe(error);
    });
  });

  describe('simulateRateLimit()', () => {
    it('should enable rate limiting and set appropriate error', () => {
      mockAPI.simulateRateLimit();

      expect(mockAPI.rateLimitEnabled).toBe(true);
      expect(mockAPI.error).toBeDefined();
      expect(mockAPI.error.message).toBe('Rate limit exceeded');
      expect(mockAPI.error.code).toBe(429);
      expect(mockAPI.error.errors).toBeDefined();
      expect(mockAPI.error.errors[0].reason).toBe('rateLimitExceeded');
    });
  });

  describe('reset()', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      mockAPI.setMessages([{ id: 'msg1', threadId: 'thread1' }]);
      mockAPI.setError(new Error('Test'));
      mockAPI.simulateRateLimit();
      mockAPI._recordCall('test', {});

      // Reset
      mockAPI.reset();

      // Verify reset
      expect(mockAPI.messages).toEqual([]);
      expect(mockAPI.error).toBeNull();
      expect(mockAPI.rateLimitEnabled).toBe(false);
      expect(mockAPI.callHistory).toEqual([]);
      expect(mockAPI.profile.messagesTotal).toBe(0);
    });
  });

  describe('getCallHistory()', () => {
    it('should return empty array initially', () => {
      expect(mockAPI.getCallHistory()).toEqual([]);
    });

    it('should track API calls', async () => {
      mockAPI.setMessages([
        {
          id: 'msg1',
          threadId: 'thread1',
          payload: { headers: [], body: {} }
        }
      ]);

      await client.users.messages.list({ userId: 'me', q: 'test', maxResults: 10 });
      await client.users.messages.get({ userId: 'me', id: 'msg1', format: 'full' });
      await client.users.getProfile({ userId: 'me' });

      const history = mockAPI.getCallHistory();
      expect(history).toHaveLength(3);
      expect(history[0].method).toBe('users.messages.list');
      expect(history[0].params).toEqual({ userId: 'me', q: 'test', maxResults: 10 });
      expect(history[1].method).toBe('users.messages.get');
      expect(history[2].method).toBe('users.getProfile');
    });
  });

  describe('createClient() - users.messages.list', () => {
    it('should return message list', async () => {
      mockAPI.setMessages([
        { id: 'msg1', threadId: 'thread1', payload: { headers: [] } },
        { id: 'msg2', threadId: 'thread2', payload: { headers: [] } }
      ]);

      const response = await client.users.messages.list({
        userId: 'me',
        q: 'test query',
        maxResults: 10
      });

      expect(response.data.messages).toHaveLength(2);
      expect(response.data.messages[0]).toEqual({ id: 'msg1', threadId: 'thread1' });
      expect(response.data.messages[1]).toEqual({ id: 'msg2', threadId: 'thread2' });
      expect(response.data.resultSizeEstimate).toBe(2);
    });

    it('should respect maxResults parameter', async () => {
      mockAPI.setMessages([
        { id: 'msg1', threadId: 'thread1', payload: { headers: [] } },
        { id: 'msg2', threadId: 'thread2', payload: { headers: [] } },
        { id: 'msg3', threadId: 'thread3', payload: { headers: [] } }
      ]);

      const response = await client.users.messages.list({
        userId: 'me',
        q: 'test',
        maxResults: 2
      });

      expect(response.data.messages).toHaveLength(2);
    });

    it('should return empty result when no messages', async () => {
      mockAPI.setMessages([]);

      const response = await client.users.messages.list({
        userId: 'me',
        q: 'test',
        maxResults: 10
      });

      expect(response.data.messages).toBeUndefined();
      expect(response.data.resultSizeEstimate).toBe(0);
    });

    it('should throw error when error is set', async () => {
      const testError = new Error('API Error');
      mockAPI.setError(testError);

      await expect(
        client.users.messages.list({ userId: 'me', q: 'test' })
      ).rejects.toThrow('API Error');
    });

    it('should throw rate limit error when simulated', async () => {
      mockAPI.simulateRateLimit();

      await expect(
        client.users.messages.list({ userId: 'me', q: 'test' })
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('createClient() - users.messages.get', () => {
    it('should return full message details', async () => {
      const message = {
        id: 'msg1',
        threadId: 'thread1',
        labelIds: ['INBOX'],
        snippet: 'Test snippet',
        payload: {
          headers: [
            { name: 'From', value: 'sender@example.com' },
            { name: 'Subject', value: 'Test Subject' }
          ],
          body: { data: 'VGVzdCBib2R5' }
        }
      };

      mockAPI.setMessages([message]);

      const response = await client.users.messages.get({
        userId: 'me',
        id: 'msg1',
        format: 'full'
      });

      expect(response.data).toEqual(message);
    });

    it('should throw 404 error for non-existent message', async () => {
      mockAPI.setMessages([
        { id: 'msg1', threadId: 'thread1', payload: { headers: [] } }
      ]);

      await expect(
        client.users.messages.get({ userId: 'me', id: 'nonexistent', format: 'full' })
      ).rejects.toThrow('Message not found: nonexistent');
    });

    it('should throw error when error is set', async () => {
      mockAPI.setMessages([
        { id: 'msg1', threadId: 'thread1', payload: { headers: [] } }
      ]);
      mockAPI.setError(new Error('Network error'));

      await expect(
        client.users.messages.get({ userId: 'me', id: 'msg1', format: 'full' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('createClient() - users.getProfile', () => {
    it('should return default profile', async () => {
      const response = await client.users.getProfile({ userId: 'me' });

      expect(response.data).toEqual({
        emailAddress: 'test@example.com',
        messagesTotal: 0,
        threadsTotal: 0
      });
    });

    it('should return custom profile when set', async () => {
      mockAPI.setProfile({
        emailAddress: 'custom@example.com',
        messagesTotal: 100,
        threadsTotal: 50
      });

      const response = await client.users.getProfile({ userId: 'me' });

      expect(response.data).toEqual({
        emailAddress: 'custom@example.com',
        messagesTotal: 100,
        threadsTotal: 50
      });
    });

    it('should throw error when error is set', async () => {
      mockAPI.setError(new Error('Profile error'));

      await expect(
        client.users.getProfile({ userId: 'me' })
      ).rejects.toThrow('Profile error');
    });
  });

  describe('createMockGmailAPI factory function', () => {
    it('should create a new MockGmailAPI instance', () => {
      const mock = createMockGmailAPI();
      expect(mock).toBeInstanceOf(MockGmailAPI);
      expect(mock.messages).toEqual([]);
      expect(mock.error).toBeNull();
    });
  });
});
