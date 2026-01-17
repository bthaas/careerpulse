/**
 * Email Parser Service
 * Extracts job application data from email content
 */

// Keywords for detecting job application emails
const APPLICATION_KEYWORDS = [
  'application received',
  'thank you for applying',
  'applied successfully',
  'application submitted',
  'your application',
  'application for',
  'position applied',
  'role applied'
];

const INTERVIEW_KEYWORDS = [
  'interview',
  'schedule a call',
  'phone screen',
  'video call',
  'meet with',
  'speak with you',
  'next steps',
  'discussion about',
  'zoom meeting',
  'teams meeting'
];

const REJECTION_KEYWORDS = [
  'unfortunately',
  'not moving forward',
  'rejected',
  'declined',
  'not selected',
  'decided to pursue',
  'other candidates',
  'not a fit',
  'will not be moving'
];

const OFFER_KEYWORDS = [
  'offer',
  'congratulations',
  'pleased to offer',
  'we would like to offer',
  'extending an offer',
  'offer letter',
  'compensation package',
  'start date'
];

/**
 * Check if email is job-related
 */
export function isJobEmail(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  
  const allKeywords = [
    ...APPLICATION_KEYWORDS,
    ...INTERVIEW_KEYWORDS,
    ...REJECTION_KEYWORDS,
    ...OFFER_KEYWORDS
  ];
  
  return allKeywords.some(keyword => text.includes(keyword));
}

/**
 * Determine application status from email content
 */
export function detectStatus(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  
  // Check in priority order (most specific first)
  if (OFFER_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'Offer';
  }
  
  if (REJECTION_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'Rejected';
  }
  
  if (INTERVIEW_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'Interview';
  }
  
  if (APPLICATION_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'Applied';
  }
  
  return 'Applied'; // Default
}

/**
 * Extract company name from email
 * Tries multiple strategies:
 * 1. From email domain (e.g., jobs@company.com -> Company)
 * 2. From email body patterns
 */
export function extractCompany(from, subject, body) {
  // Strategy 1: Extract from email domain
  const emailMatch = from.match(/@([^.]+)\./);
  if (emailMatch) {
    const domain = emailMatch[1];
    // Skip common job board domains and generic domains
    const skipDomains = ['greenhouse', 'lever', 'indeed', 'linkedin', 'workday', 'taleo', 'icims', 'smartrecruiters', 'example', 'test', 'noreply', 'recruiting'];
    if (!skipDomains.includes(domain.toLowerCase())) {
      return capitalize(domain);
    }
  }
  
  // Strategy 2: Look for "at [Company]" patterns in subject
  const atMatch = subject.match(/at ([A-Z][A-Za-z0-9]+)/);
  if (atMatch) {
    return atMatch[1];
  }
  
  // Strategy 3: Look for company names in body (simple pattern)
  const companyPatterns = [
    /applying to ([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/,
    /(?:at|with|join) ([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/
  ];
  
  for (const pattern of companyPatterns) {
    const match = body.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback: Use sender name or domain
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  return emailMatch ? capitalize(emailMatch[1]) : 'Unknown Company';
}

/**
 * Extract job title from email
 */
export function extractJobTitle(subject, body) {
  // Common patterns in subject lines
  const patterns = [
    /-\s*(.+?)(?:\s*-|$)/i,  // "Subject - Job Title" or "Subject - Job Title -"
    /for (?:the )?(.+?) (?:position|role|job)/i,
    /(.+?) (?:position|role|job)/i,
    /application.*?for (?:the |a )?(.+?)(?:\sat|$)/i,
    /regarding.*?(.+?)(?:\sposition|role|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const title = cleanJobTitle(match[1]);
      // Make sure we got a reasonable title (not too short)
      if (title.length > 3 && !title.toLowerCase().includes('application')) {
        return title;
      }
    }
  }
  
  // Try body patterns
  const bodyPatterns = [
    /position of (?:the |a )?(.+?)(?:\.|$)/i,
    /(?:for|as) (?:the |a )?(.+?) (?:position|role)/i,
    /position:\s*(.+?)(?:\n|$)/i,
    /role:\s*(.+?)(?:\n|$)/i
  ];
  
  for (const pattern of bodyPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      return cleanJobTitle(match[1]);
    }
  }
  
  return 'Unknown Position';
}

/**
 * Extract location from email
 */
export function extractLocation(body) {
  // Common patterns
  const patterns = [
    /location:\s*(.+?)(?:\n|$)/i,
    /(?:in|at) ([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/,
    /remote/i
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const location = match[1] || match[0];
      return location.trim();
    }
  }
  
  return 'Not specified';
}

/**
 * Calculate confidence score (0-100)
 * Based on how many fields we successfully extracted
 */
export function calculateConfidence(company, role, status) {
  let score = 0;
  
  // Company extraction
  if (company && company !== 'Unknown Company') {
    score += 35;
  }
  
  // Job title extraction
  if (role && role !== 'Unknown Position') {
    score += 35;
  }
  
  // Status detection
  if (status) {
    score += 30;
  }
  
  return score;
}

/**
 * Parse email and extract application data
 */
export function parseEmail(email) {
  const { id, from, subject, body, date } = email;
  
  // Check if it's a job-related email
  if (!isJobEmail(subject, body)) {
    return null;
  }
  
  // Extract data
  const company = extractCompany(from, subject, body);
  const role = extractJobTitle(subject, body);
  const location = extractLocation(body);
  const status = detectStatus(subject, body);
  const confidenceScore = calculateConfidence(company, role, status);
  
  // Format dates
  const dateApplied = formatDate(date);
  const now = new Date().toISOString();
  
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
    remotePolicy: location.toLowerCase().includes('remote') ? 'Remote' : null,
    notes: `Extracted from email: "${subject}"`,
    emailId: id,
    confidenceScore,
    isDuplicate: 0
  };
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Clean job title
 */
function cleanJobTitle(title) {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(the|a|an)\s+/i, '');
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
  detectStatus,
  extractCompany,
  extractJobTitle,
  extractLocation,
  calculateConfidence,
  parseEmail
};
