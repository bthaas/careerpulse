/**
 * Email Parser Service
 * Extracts job application data from email content
 * Uses 3-stage pipeline: Gmail query → Keyword filter → LLM extraction
 */

import { extractWithLLM } from './llmParser.js';

// Stage 2: Quick keyword filter for job-related emails
const JOB_KEYWORDS = [
  'application', 'apply', 'applied', 'interview', 'offer', 'position', 
  'role', 'job', 'career', 'hiring', 'recruit', 'candidate', 'rejection', 
  'rejected', 'thank you for', 'thanks for applying', 'congratulations',
  'schedule', 'phone screen', 'video call', 'meet with', 'next steps'
];

// Keywords that indicate non-job emails (marketing, spam)
const SPAM_KEYWORDS = [
  'unsubscribe', 'promotional', 'sale', 'discount', 'deal', 'coupon',
  'newsletter', 'update your', 'verify your', 'reset password', 'confirm email'
];

/**
 * Stage 2: Quick keyword filter
 * Check if email is potentially job-related (fast, no cost)
 */
export function isJobEmail(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  
  // Check for job keywords
  const hasJobKeyword = JOB_KEYWORDS.some(keyword => text.includes(keyword));
  
  // Check for spam keywords
  const hasSpamKeyword = SPAM_KEYWORDS.some(keyword => text.includes(keyword));
  
  // If has spam keywords but no job keywords, skip
  if (hasSpamKeyword && !hasJobKeyword) {
    return false;
  }
  
  // If has job keywords, proceed to LLM
  return hasJobKeyword;
}

/**
 * Calculate confidence score (0-100)
 * Higher confidence for LLM results
 */
export function calculateConfidence(company, role, status, usedLLM) {
  let score = 0;
  
  // Base score for LLM vs manual
  if (usedLLM) {
    score = 60; // LLM starts with higher confidence
  } else {
    score = 30; // Manual parsing starts lower
  }
  
  // Company extraction
  if (company && company !== 'Unknown Company' && company !== 'Not specified') {
    score += 15;
  }
  
  // Job title extraction
  if (role && role !== 'Unknown Position' && role !== 'Not specified') {
    score += 15;
  }
  
  // Status detection
  if (status && status !== 'Applied') {
    score += 10; // Higher confidence for specific statuses
  }
  
  return Math.min(score, 100);
}

/**
 * Parse email and extract application data
 * Uses 3-stage pipeline: Gmail query → Keyword filter → LLM extraction
 */
export async function parseEmail(email) {
  const { id, from, subject, body, date } = email;
  
  // Stage 2: Quick keyword filter
  if (!isJobEmail(subject, body)) {
    return null;
  }
  
  // Stage 3: LLM extraction (classify + extract)
  let company, role, location, status;
  let usedLLM = false;
  
  try {
    const llmResult = await extractWithLLM(from, subject, body);
    if (llmResult) {
      // Check if LLM classified it as a job email
      if (llmResult.isJobEmail === false) {
        return null; // LLM says not a job email
      }
      
      company = llmResult.company;
      role = llmResult.jobTitle;
      status = llmResult.status;
      location = llmResult.location;
      usedLLM = true;
    }
  } catch (error) {
    console.warn('LLM extraction failed:', error.message);
    // Will skip this email since we don't have manual parsing fallback
  }
  
  // If LLM failed or not available, skip this email
  if (!usedLLM) {
    console.warn(`Skipping email (LLM unavailable): ${subject}`);
    return null;
  }
  
  // Calculate confidence score
  const confidenceScore = calculateConfidence(company, role, status, usedLLM);
  
  // Format dates (manual parsing - simple and reliable)
  const dateApplied = formatDate(date);
  const now = new Date().toISOString();
  
  // Determine remote policy from location
  const remotePolicy = location && location.toLowerCase().includes('remote') ? 'Remote' : null;
  
  return {
    id: `email-${id}-${Date.now()}`,
    company,
    role,
    location,
    dateApplied,
    lastUpdate: dateApplied,
    createdAt: now,
    status,
    source: 'Email',
    salary: null,
    remotePolicy,
    notes: `Extracted from email: "${subject}" (LLM-enhanced)`,
    emailId: id,
    confidenceScore,
    isDuplicate: 0
  };
}

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export default {
  isJobEmail,
  calculateConfidence,
  parseEmail
};
