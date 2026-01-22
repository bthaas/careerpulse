/**
 * Property-Based and Unit Tests for ApiClient
 * Tests universal properties and specific behaviors
 * 
 * Feature: oop-refactoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { ApiClient, type Interceptor } from './ApiClient';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ApiClient - Property Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorageMock.clear();
  });

  /**
   * Property 17: Automatic Authentication Headers
   * **Validates: Requirements 8.4**
   * 
   * For any API request with a token set, Authorization header should be added
   */
  describe('Property 17: Automatic Authentication Headers', () => {
    it('should automatically add Authorization header when token is set', async () => {
      const client = new ApiClient();
      const token = 'test-token-12345';
      client.setToken(token);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      await client.checkHealth();

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const config = callArgs[1];
      
      // Check that headers object exists and has Authorization
      expect(config.headers).toBeDefined();
      expect(config.headers.Authorization).toBeDefined();
      expect(config.headers.Authorization).toContain('Bearer');
    });

    it('should not add Authorization header when no token is set', async () => {
      const client = new ApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      await client.checkHealth();

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      
      expect(headers.Authorization).toBeUndefined();
    });
  });

  /**
   * Property 18: Consistent API Error Handling
   * **Validates: Requirements 8.5**
   * 
   * For any API failure, error should have consistent structure
   */
  describe('Property 18: Consistent API Error Handling', () => {
    it('should throw Error with status for HTTP errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (status, errorMessage) => {
            const client = new ApiClient();

            mockFetch.mockResolvedValueOnce({
              ok: false,
              status,
              json: async () => ({ error: errorMessage })
            });

            try {
              await client.checkHealth();
              expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
              expect(error).toBeInstanceOf(Error);
              expect(error.message).toBeTruthy();
              expect(error.status).toBe(status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle network errors consistently', async () => {
      const client = new ApiClient();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await client.checkHealth();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeTruthy();
      }
    });
  });

  /**
   * Property 19: Request/Response Interceptors
   * **Validates: Requirements 8.6**
   * 
   * For any registered interceptor, it should be called for requests/responses
   */
  describe('Property 19: Request/Response Interceptors', () => {
    it('should call request interceptors before making request', async () => {
      const client = new ApiClient();
      const headerValue = 'test-value-123';
      const requestInterceptor = vi.fn((config: RequestInit) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Custom-Header': headerValue
          }
        };
      });

      client.addInterceptor({ request: requestInterceptor });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      await client.checkHealth();

      expect(requestInterceptor).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['X-Custom-Header']).toBeDefined();
    });

    it('should call response interceptors after receiving response', async () => {
      const client = new ApiClient();
      const responseInterceptor = vi.fn((response: Response) => response);

      client.addInterceptor({ response: responseInterceptor });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      await client.checkHealth();

      expect(responseInterceptor).toHaveBeenCalled();
    });

    it('should call error interceptors on errors', async () => {
      const client = new ApiClient();
      const errorInterceptor = vi.fn((error: Error) => error);

      client.addInterceptor({ error: errorInterceptor });

      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      try {
        await client.checkHealth();
      } catch (error) {
        expect(errorInterceptor).toHaveBeenCalled();
      }
    });

    it('should call multiple interceptors in order', async () => {
      const client = new ApiClient();
      const calls: number[] = [];

      client.addInterceptor({
        request: (config) => {
          calls.push(1);
          return config;
        }
      });

      client.addInterceptor({
        request: (config) => {
          calls.push(2);
          return config;
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      await client.checkHealth();

      expect(calls).toEqual([1, 2]);
    });
  });
});

describe('ApiClient - Unit Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorageMock.clear();
  });

  describe('Constructor', () => {
    it('should create instance with default base URL', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should accept custom base URL', () => {
      const customUrl = 'https://custom.api.com/api';
      const client = new ApiClient(customUrl);
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should accept initial token', () => {
      const token = 'test-token';
      const client = new ApiClient(undefined, token);
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should load token from localStorage if available', () => {
      localStorageMock.setItem('auth_token', 'stored-token');
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('setToken', () => {
    it('should set token and store in localStorage', () => {
      const client = new ApiClient();
      const token = 'new-token';
      
      client.setToken(token);
      
      expect(localStorageMock.getItem('auth_token')).toBe(token);
    });
  });

  describe('setBaseUrl', () => {
    it('should update base URL', () => {
      const client = new ApiClient();
      const newUrl = 'https://new.api.com/api';
      
      client.setBaseUrl(newUrl);
      
      // Verify by making a request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      client.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://new.api.com/api'),
        expect.any(Object)
      );
    });
  });

  describe('Health Check', () => {
    it('should call health endpoint', async () => {
      const client = new ApiClient();
      const mockResponse = { status: 'ok', timestamp: '2024-01-01', version: '1.0.0' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await client.checkHealth();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
    });
  });

  describe('Applications API', () => {
    it('should get all applications', async () => {
      const client = new ApiClient();
      const mockApps = [{ id: '1', company: 'Test', role: 'Engineer' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApps
      });

      const result = await client.getAllApplications();

      expect(result).toEqual(mockApps);
    });

    it('should get single application', async () => {
      const client = new ApiClient();
      const mockApp = { id: '1', company: 'Test', role: 'Engineer' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApp
      });

      const result = await client.getApplication('1');

      expect(result).toEqual(mockApp);
    });

    it('should create application', async () => {
      const client = new ApiClient();
      const newApp = { company: 'Test', role: 'Engineer' };
      const createdApp = { id: '1', ...newApp };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createdApp
      });

      const result = await client.createApplication(newApp);

      expect(result).toEqual(createdApp);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should update application', async () => {
      const client = new ApiClient();
      const updates = { status: 'Interview' as const };
      const updatedApp = { id: '1', company: 'Test', role: 'Engineer', ...updates };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedApp
      });

      const result = await client.updateApplication('1', updates);

      expect(result).toEqual(updatedApp);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should delete application', async () => {
      const client = new ApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await client.deleteApplication('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Auth API', () => {
    it('should get auth URL', async () => {
      const client = new ApiClient();
      const mockResponse = { authUrl: 'https://auth.google.com' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await client.getAuthUrl();

      expect(result).toEqual(mockResponse);
    });

    it('should get auth status', async () => {
      const client = new ApiClient();
      const mockStatus = { connected: true, email: 'test@example.com' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStatus
      });

      const result = await client.getAuthStatus();

      expect(result).toEqual(mockStatus);
    });

    it('should disconnect email', async () => {
      const client = new ApiClient();
      const mockResponse = { success: true, message: 'Disconnected' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await client.disconnectEmail();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Email Sync API', () => {
    it('should sync emails', async () => {
      const client = new ApiClient();
      const mockResult = {
        success: true,
        totalEmails: 10,
        jobEmails: 5,
        newApplications: 3,
        duplicates: 2,
        errors: 0,
        applications: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await client.syncEmails();

      expect(result).toEqual(mockResult);
    });

    it('should handle sync timeout', async () => {
      const client = new ApiClient();

      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        })
      );

      await expect(client.syncEmails()).rejects.toThrow('Sync is taking longer than expected');
    });

    it('should get email profile', async () => {
      const client = new ApiClient();
      const mockProfile = { email: 'test@example.com', messagesTotal: 100, threadsTotal: 50 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile
      });

      const result = await client.getEmailProfile();

      expect(result).toEqual(mockProfile);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const client = new ApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      await expect(client.getApplication('999')).rejects.toThrow();
    });

    it('should handle 500 errors', async () => {
      const client = new ApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      await expect(client.checkHealth()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      const client = new ApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(client.checkHealth()).rejects.toThrow();
    });
  });
});
