/**
 * Unit Tests for LLM Parser Service
 * Tests Gemini integration with mocked responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractWithLLM, clearCache, getCacheStats } from '../../services/llmParser.js';

// Mock the Google Generative AI module
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn()
      })
    }))
  };
});

describe('LLM Parser - extractWithLLM()', () => {
  beforeEach(() => {
    clearCache();
    // Reset environment variable
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should extract job application details correctly', async () => {
    const mockResponse = {
      isJobEmail: true,
      company: 'Google',
      jobTitle: 'Software Engineer',
      status: 'Applied',
      location: 'Mountain View, CA'
    };

    // Mock the Gemini API response
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'jobs@google.com',
      'Application Received - Software Engineer',
      'Thank you for applying to Google.'
    );

    expect(result).toEqual(mockResponse);
    expect(result.isJobEmail).toBe(true);
    expect(result.company).toBe('Google');
    expect(result.jobTitle).toBe('Software Engineer');
  });

  it('should return null for non-job emails', async () => {
    const mockResponse = {
      isJobEmail: false,
      company: '',
      jobTitle: '',
      status: '',
      location: ''
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'newsletter@tech.com',
      'Weekly Newsletter',
      'Here are the top tech stories.'
    );

    expect(result).toEqual({ isJobEmail: false });
  });

  it('should cache results to avoid duplicate API calls', async () => {
    const mockResponse = {
      isJobEmail: true,
      company: 'Amazon',
      jobTitle: 'Software Engineer II',
      status: 'Applied',
      location: 'Seattle, WA'
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockResponse)
      }
    });
    
    const mockModel = { generateContent: mockGenerateContent };
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    // First call
    const result1 = await extractWithLLM(
      'jobs@amazon.com',
      'Application Received',
      'Thank you for applying.'
    );

    // Second call with same content
    const result2 = await extractWithLLM(
      'jobs@amazon.com',
      'Application Received',
      'Thank you for applying.'
    );

    expect(result1).toEqual(mockResponse);
    expect(result2).toEqual(mockResponse);
    // API should only be called once due to caching
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should handle JSON in markdown code blocks', async () => {
    const mockResponse = {
      isJobEmail: true,
      company: 'Microsoft',
      jobTitle: 'Senior Developer',
      status: 'Interview',
      location: 'Redmond, WA'
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'careers@microsoft.com',
      'Interview Invitation',
      'We would like to schedule an interview.'
    );

    expect(result).toEqual(mockResponse);
  });

  it('should return null for invalid JSON responses', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON'
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'jobs@company.com',
      'Test Subject',
      'Test body'
    );

    expect(result).toBeNull();
  });

  it('should return null for responses missing required fields', async () => {
    const mockResponse = {
      isJobEmail: true,
      company: 'TechCorp',
      // Missing jobTitle, status, location
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'jobs@techcorp.com',
      'Application',
      'Thank you'
    );

    expect(result).toBeNull();
  });

  it('should return null for empty job titles', async () => {
    const mockResponse = {
      isJobEmail: true,
      company: 'TechCorp',
      jobTitle: '   ', // Empty/whitespace
      status: 'Applied',
      location: 'Remote'
    };

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      })
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'jobs@techcorp.com',
      'Application',
      'Thank you'
    );

    expect(result).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockModel = {
      generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
    };
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => mockModel
    }));

    const result = await extractWithLLM(
      'jobs@company.com',
      'Test Subject',
      'Test body'
    );

    expect(result).toBeNull();
  });
});

describe('LLM Parser - Cache Management', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should clear cache', () => {
    clearCache();
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
  });

  it('should return cache stats', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats.maxSize).toBe(1000);
  });
});
