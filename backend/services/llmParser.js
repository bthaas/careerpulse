/**
 * LLMParser Class - OOP Implementation
 * 
 * Encapsulates LLM-based extraction using Google Gemini including:
 * - Job application data extraction from emails
 * - In-memory result caching for performance
 * - Response validation
 * - Graceful error handling
 * 
 * @class LLMParser
 * @example
 * const llmParser = new LLMParser(process.env.GOOGLE_AI_API_KEY, {
 *   cacheMaxSize: 1000,
 *   temperature: 0.1
 * });
 * 
 * const result = await llmParser.extractWithLLM(
 *   'from@example.com',
 *   'Application Received',
 *   'Thank you for applying to Acme Corp...'
 * );
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * LLMParser Class
 * 
 * Manages LLM-based job application extraction with caching and validation.
 * Uses Google Gemini for intelligent parsing of job-related emails.
 * 
 * @class
 */
export class LLMParser {
  /**
   * Create an LLMParser instance
   * 
   * @param {string} apiKey - Google Gemini API key (if null, extraction will return null)
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.cacheMaxSize=1000] - Maximum number of cached results
   * @param {number} [options.temperature=0.1] - Model temperature (0-1, lower = more deterministic)
   * @param {number} [options.maxOutputTokens=1000] - Maximum tokens in model response
   * @example
   * const llmParser = new LLMParser(process.env.GOOGLE_AI_API_KEY, {
   *   cacheMaxSize: 500,
   *   temperature: 0.2,
   *   maxOutputTokens: 800
   * });
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.cacheMaxSize = options.cacheMaxSize || 1000;
    this.cache = new Map();
    
    // Initialize Gemini client if API key provided
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: options.temperature || 0.1,
            maxOutputTokens: options.maxOutputTokens || 1000
          }
        });
      } catch (error) {
        console.warn('Failed to initialize Gemini:', error.message);
        this.model = null;
      }
    } else {
      this.model = null;
    }
  }

  /**
   * Generate a cache key from email content
   * 
   * Creates a base64-encoded key from the first 200 characters of the
   * combined subject and body for efficient cache lookups.
   * 
   * @param {string} subject - Email subject line
   * @param {string} body - Email body content
   * @returns {string} Base64-encoded cache key
   * @private
   */
  getCacheKey(subject, body) {
    const content = `${subject}${body}`.substring(0, 200);
    return Buffer.from(content).toString('base64');
  }

  /**
   * Add result to cache with size limit
   * 
   * Implements a FIFO (First In, First Out) cache eviction policy.
   * When the cache reaches max size, the oldest entry is removed.
   * 
   * @param {string} key - Cache key
   * @param {Object} value - Extraction result to cache
   * @private
   */
  addToCache(key, value) {
    // If cache is full, remove oldest entry (FIFO)
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Validate LLM response structure
   * 
   * Ensures the parsed response contains all required fields with correct types.
   * For job emails, validates presence of company, jobTitle, status, and location.
   * 
   * @param {Object} result - Parsed LLM response
   * @param {boolean} result.isJobEmail - Whether email is job-related
   * @param {string} [result.company] - Company name (required if isJobEmail=true)
   * @param {string} [result.jobTitle] - Job title (required if isJobEmail=true)
   * @param {string} [result.status] - Application status (required if isJobEmail=true)
   * @param {string} [result.location] - Job location (required if isJobEmail=true)
   * @returns {boolean} True if response is valid, false otherwise
   * @private
   */
  validateResponse(result) {
    // Must have isJobEmail field
    if (typeof result.isJobEmail !== 'boolean') {
      return false;
    }

    // If not a job email, no further validation needed
    if (!result.isJobEmail) {
      return true;
    }

    // For job emails, validate required fields
    if (!result.company || !result.jobTitle || !result.status || !result.location) {
      return false;
    }

    // jobTitle should not be empty or just whitespace
    if (result.jobTitle.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Extract job application details using Gemini
   * @param {string} from - Email sender
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {Promise<Object|null>} Extraction result or null
   */
  async extractWithLLM(from, subject, body) {
    // Check if Gemini is available
    if (!this.model) {
      console.warn('Gemini not available, skipping LLM extraction');
      return null;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(subject, body);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildPrompt(from, subject, body);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text().trim();

      // Parse JSON response
      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          console.warn('Failed to parse Gemini response:', content);
          return null;
        }
      }

      // Validate response
      if (!this.validateResponse(parsedResult)) {
        console.warn('Invalid Gemini response:', parsedResult);
        return null;
      }

      // If not a job email, return early
      if (!parsedResult.isJobEmail) {
        const notJobResult = { isJobEmail: false };
        this.addToCache(cacheKey, notJobResult);
        return notJobResult;
      }

      // Cache the result
      this.addToCache(cacheKey, parsedResult);

      return parsedResult;
    } catch (error) {
      console.error('Gemini extraction error:', error.message);
      return null;
    }
  }

  /**
   * Build prompt for Gemini
   * @param {string} from - Email sender
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {string} Prompt
   */
  buildPrompt(from, subject, body) {
    return `You are an expert at analyzing job application emails.

Analyze this email and determine:
1. Is this a job application related email? (true/false)
2. If yes, extract: company name, job title, status, location

Email From: ${from}
Email Subject: ${subject}
Email Body: ${body.substring(0, 2000)}

CRITICAL: Return ONLY a valid, complete JSON object. Do not truncate the response.
Use these exact keys: isJobEmail, company, jobTitle, status, location
Do not include any explanation, markdown formatting, or code blocks.

Rules for classification:
- isJobEmail: true if this is about a job application, interview, offer, or rejection
- isJobEmail: false if this is marketing, newsletter, spam, or unrelated

Rules for extraction (only if isJobEmail is true):
- company: Extract the actual hiring company name, NOT ATS platforms like "Greenhouse", "Lever", "Workday", "Myworkday", "Hrapply", "Jobvite", "Ashbyhq", "Icims", etc.
- jobTitle: Extract the COMPLETE job title. If not found in email, use "Not specified". Never leave empty or truncate.
- status: Must be one of: "Applied", "Interview", "Offer", "Rejected"
  * "Applied" = application received/confirmed
  * "Interview" = invitation to interview or schedule a call
  * "Offer" = job offer with compensation details
  * "Rejected" = application declined/not moving forward
- location: Extract city/state if mentioned, or "Remote" if remote work, or "Not specified"

Example valid responses:
{"isJobEmail":true,"company":"Google","jobTitle":"Software Engineer","status":"Applied","location":"Mountain View, CA"}
{"isJobEmail":true,"company":"Amazon","jobTitle":"Software Development Engineer II","status":"Interview","location":"Seattle, WA"}
{"isJobEmail":false,"company":"","jobTitle":"","status":"","location":""}

IMPORTANT: Ensure the JSON is complete and properly closed with all closing braces and quotes.`;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize
    };
  }
}

// ==========================================
// Backward-compatible functional exports
// ==========================================

// Create singleton instance
const llmParserInstance = new LLMParser(process.env.GOOGLE_AI_API_KEY);

// Export functional wrappers for backward compatibility
export async function extractWithLLM(from, subject, body) {
  return llmParserInstance.extractWithLLM(from, subject, body);
}

export function clearCache() {
  return llmParserInstance.clearCache();
}

export function getCacheStats() {
  return llmParserInstance.getCacheStats();
}

// Export singleton instance
export default llmParserInstance;
