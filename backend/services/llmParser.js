/**
 * LLM Parser Service
 * Uses Google Gemini 2.0 Flash-Lite to extract complex job application details from emails
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client (will be null if API key not set)
let genAI = null;
let model = null;

try {
  if (process.env.GOOGLE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',  // Current stable model
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,  // Increased to prevent truncation
      }
    });
  }
} catch (error) {
  console.warn('Gemini not initialized:', error.message);
}

// Simple in-memory cache for LLM results (to avoid repeat calls for same email)
const cache = new Map();
const CACHE_MAX_SIZE = 1000;

/**
 * Generate cache key from email content
 */
function getCacheKey(subject, body) {
  // Use first 200 chars of subject + body as cache key
  const content = `${subject}${body}`.substring(0, 200);
  return Buffer.from(content).toString('base64');
}

/**
 * Add to cache with size limit
 */
function addToCache(key, value) {
  // If cache is full, remove oldest entry
  if (cache.size >= CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

/**
 * Extract job application details using Gemini
 * Returns: { isJobEmail, company, jobTitle, status, location }
 */
export async function extractWithLLM(from, subject, body) {
  // Check if Gemini is available
  if (!model) {
    console.warn('Gemini not available, skipping LLM extraction');
    return null;
  }

  // Check cache first
  const cacheKey = getCacheKey(subject, body);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const prompt = `You are an expert at analyzing job application emails.

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

    const result = await model.generateContent(prompt);
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
        throw parseError;
      }
    }

    // Validate result has required fields
    if (typeof parsedResult.isJobEmail !== 'boolean') {
      console.warn('Gemini response missing isJobEmail field:', parsedResult);
      return null;
    }

    // If not a job email, return early
    if (!parsedResult.isJobEmail) {
      const notJobResult = { isJobEmail: false };
      addToCache(cacheKey, notJobResult);
      return notJobResult;
    }

    // Validate extraction fields for job emails
    if (!parsedResult.company || !parsedResult.jobTitle || !parsedResult.status || !parsedResult.location) {
      console.warn('Gemini response missing required fields:', parsedResult);
      return null;
    }
    
    // Additional validation: jobTitle should not be empty or just whitespace
    if (parsedResult.jobTitle.trim() === '') {
      console.warn('Gemini returned empty jobTitle:', parsedResult);
      return null;
    }

    // Cache the result
    addToCache(cacheKey, parsedResult);

    return parsedResult;
  } catch (error) {
    console.error('Gemini extraction error:', error.message);
    return null;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache stats (useful for monitoring)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: CACHE_MAX_SIZE
  };
}

export default {
  extractWithLLM,
  clearCache,
  getCacheStats
};
