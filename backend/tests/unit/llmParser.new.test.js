/**
 * Unit Tests for LLMParser
 * Tests specific examples and edge cases for LLM operations
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMParser } from '../../services/LLMParser.js';

describe('LLMParser Unit Tests', () => {
  let llmParser;

  beforeEach(() => {
    llmParser = new LLMParser('test-api-key');
  });

  describe('Initialization', () => {
    it('should create instance with API key', () => {
      expect(llmParser).toBeDefined();
      expect(llmParser.apiKey).toBe('test-api-key');
      expect(llmParser.model).toBeDefined();
      expect(llmParser.cache).toBeDefined();
    });

    it('should create instance without API key', () => {
      const parser = new LLMParser(null);
      expect(parser.model).toBeNull();
    });

    it('should use custom cache size', () => {
      const parser = new LLMParser('test-key', { cacheMaxSize: 500 });
      expect(parser.cacheMaxSize).toBe(500);
    });
  });

  describe('Cache Management', () => {
    it('should generate consistent cache keys', () => {
      const key1 = llmParser.getCacheKey('Test Subject', 'Test Body');
      const key2 = llmParser.getCacheKey('Test Subject', 'Test Body');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different content', () => {
      const key1 = llmParser.getCacheKey('Subject 1', 'Body 1');
      const key2 = llmParser.getCacheKey('Subject 2', 'Body 2');
      expect(key1).not.toBe(key2);
    });

    it('should clear cache', () => {
      llmParser.addToCache('key1', { test: 'value' });
      llmParser.addToCache('key2', { test: 'value2' });
      expect(llmParser.cache.size).toBe(2);

      llmParser.clearCache();
      expect(llmParser.cache.size).toBe(0);
    });

    it('should return cache stats', () => {
      llmParser.addToCache('key1', { test: 'value' });
      const stats = llmParser.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(1000);
    });

    it('should evict oldest entry when cache is full', () => {
      const smallParser = new LLMParser('test-key', { cacheMaxSize: 2 });
      smallParser.addToCache('key1', 'value1');
      smallParser.addToCache('key2', 'value2');
      smallParser.addToCache('key3', 'value3');

      expect(smallParser.cache.size).toBe(2);
      expect(smallParser.cache.has('key1')).toBe(false); // Oldest evicted
      expect(smallParser.cache.has('key2')).toBe(true);
      expect(smallParser.cache.has('key3')).toBe(true);
    });
  });

  describe('Response Validation', () => {
    it('should validate correct non-job email response', () => {
      const result = { isJobEmail: false };
      expect(llmParser.validateResponse(result)).toBe(true);
    });

    it('should validate correct job email response', () => {
      const result = {
        isJobEmail: true,
        company: 'Google',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        location: 'Mountain View, CA'
      };
      expect(llmParser.validateResponse(result)).toBe(true);
    });

    it('should reject response missing isJobEmail', () => {
      const result = { company: 'Google' };
      expect(llmParser.validateResponse(result)).toBe(false);
    });

    it('should reject job email missing company', () => {
      const result = {
        isJobEmail: true,
        jobTitle: 'Engineer',
        status: 'Applied',
        location: 'Remote'
      };
      expect(llmParser.validateResponse(result)).toBe(false);
    });

    it('should reject job email with empty jobTitle', () => {
      const result = {
        isJobEmail: true,
        company: 'Google',
        jobTitle: '   ',
        status: 'Applied',
        location: 'Remote'
      };
      expect(llmParser.validateResponse(result)).toBe(false);
    });
  });

  describe('LLM Extraction', () => {
    it('should extract job email successfully', async () => {
      const mockResult = {
        isJobEmail: true,
        company: 'Google',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        location: 'Mountain View, CA'
      };

      llmParser.model = {
        generateContent: vi.fn(async () => ({
          response: {
            text: () => JSON.stringify(mockResult)
          }
        }))
      };

      const result = await llmParser.extractWithLLM(
        'jobs@google.com',
        'Application Received',
        'Thank you for applying to Google'
      );

      expect(result).toEqual(mockResult);
    });

    it('should extract non-job email successfully', async () => {
      llmParser.model = {
        generateContent: vi.fn(async () => ({
          response: {
            text: () => JSON.stringify({ isJobEmail: false })
          }
        }))
      };

      const result = await llmParser.extractWithLLM(
        'newsletter@company.com',
        'Weekly Newsletter',
        'Here are this week\'s updates'
      );

      expect(result).toEqual({ isJobEmail: false });
    });

    it('should handle JSON in markdown code blocks', async () => {
      const mockResult = {
        isJobEmail: true,
        company: 'Amazon',
        jobTitle: 'SDE',
        status: 'Interview',
        location: 'Seattle'
      };

      llmParser.model = {
        generateContent: vi.fn(async () => ({
          response: {
            text: () => '```json\n' + JSON.stringify(mockResult) + '\n```'
          }
        }))
      };

      const result = await llmParser.extractWithLLM(
        'jobs@amazon.com',
        'Interview Invitation',
        'We would like to schedule an interview'
      );

      expect(result).toEqual(mockResult);
    });

    it('should return null for invalid JSON', async () => {
      llmParser.model = {
        generateContent: vi.fn(async () => ({
          response: {
            text: () => 'This is not JSON'
          }
        }))
      };

      const result = await llmParser.extractWithLLM(
        'test@test.com',
        'Test',
        'Test body'
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid response structure', async () => {
      llmParser.model = {
        generateContent: vi.fn(async () => ({
          response: {
            text: () => JSON.stringify({ invalid: 'structure' })
          }
        }))
      };

      const result = await llmParser.extractWithLLM(
        'test@test.com',
        'Test',
        'Test body'
      );

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      llmParser.model = {
        generateContent: vi.fn(async () => {
          throw new Error('API Error');
        })
      };

      const result = await llmParser.extractWithLLM(
        'test@test.com',
        'Test',
        'Test body'
      );

      expect(result).toBeNull();
    });

    it('should return null when model not initialized', async () => {
      const uninitializedParser = new LLMParser(null);

      const result = await uninitializedParser.extractWithLLM(
        'test@test.com',
        'Test',
        'Test body'
      );

      expect(result).toBeNull();
    });

    it('should use cache for repeated calls', async () => {
      const mockResult = { isJobEmail: false };
      let callCount = 0;

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

      // First call
      await llmParser.extractWithLLM('test@test.com', 'Test', 'Body');
      expect(callCount).toBe(1);

      // Second call - should use cache
      await llmParser.extractWithLLM('test@test.com', 'Test', 'Body');
      expect(callCount).toBe(1); // Still 1, not 2
    });
  });

  describe('Prompt Building', () => {
    it('should build prompt with email details', () => {
      const prompt = llmParser.buildPrompt(
        'jobs@company.com',
        'Application Received',
        'Thank you for applying'
      );

      expect(prompt).toContain('jobs@company.com');
      expect(prompt).toContain('Application Received');
      expect(prompt).toContain('Thank you for applying');
    });

    it('should truncate long email bodies', () => {
      const longBody = 'a'.repeat(5000);
      const prompt = llmParser.buildPrompt('test@test.com', 'Test', longBody);

      // Should only include first 2000 chars
      expect(prompt).toContain('a'.repeat(2000));
      expect(prompt).not.toContain('a'.repeat(2001));
    });
  });
});
