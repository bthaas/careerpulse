/**
 * Test Data Generators
 * Generate random test data for property-based testing with fast-check
 */

import fc from 'fast-check';

// Keywords from emailParser.js
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

// Job boards to skip in domain extraction
const JOB_BOARD_DOMAINS = [
  'greenhouse',
  'lever',
  'indeed',
  'linkedin',
  'workday',
  'taleo',
  'icims',
  'smartrecruiters'
];

// Sample data for realistic generation
const COMPANIES = [
  'TechCorp', 'DataSystems', 'CloudWorks', 'InnovateLabs', 'StartupHub',
  'MegaCorp', 'DevTools', 'CodeFactory', 'DigitalSolutions', 'WebServices',
  'AppDynamics', 'SystemsInc', 'SoftwareCo', 'TechVentures', 'ByteWorks'
];

const JOB_TITLES = [
  'Software Engineer', 'Senior Developer', 'Frontend Developer', 'Backend Engineer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager',
  'Engineering Manager', 'Technical Lead', 'QA Engineer', 'Site Reliability Engineer',
  'Machine Learning Engineer', 'Security Engineer', 'Cloud Architect'
];

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Denver, CO', 'Portland, OR', 'Chicago, IL',
  'Remote', 'Los Angeles, CA', 'Atlanta, GA', 'Miami, FL'
];

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

/**
 * Generate a random job-related email
 * @param {Object} options - Configuration options
 * @param {string} options.status - Status type: 'Applied', 'Interview', 'Offer', 'Rejected'
 * @param {boolean} options.hasCompany - Whether to include company information
 * @param {boolean} options.hasRole - Whether to include role information
 * @param {boolean} options.hasLocation - Whether to include location information
 * @param {string} options.format - Email format: 'plain', 'html', 'multipart'
 * @returns {Object} Email object matching Gmail API format
 */
export function generateJobEmail(options = {}) {
  const {
    status = fc.sample(fc.constantFrom(...STATUSES), 1)[0],
    hasCompany = true,
    hasRole = true,
    hasLocation = true,
    format = 'plain'
  } = options;

  // Generate base data
  const company = hasCompany ? fc.sample(fc.constantFrom(...COMPANIES), 1)[0] : null;
  const role = hasRole ? fc.sample(fc.constantFrom(...JOB_TITLES), 1)[0] : null;
  const location = hasLocation ? fc.sample(fc.constantFrom(...LOCATIONS), 1)[0] : null;
  
  // Select appropriate keywords based on status
  let keywords;
  switch (status) {
    case 'Offer':
      keywords = OFFER_KEYWORDS;
      break;
    case 'Rejected':
      keywords = REJECTION_KEYWORDS;
      break;
    case 'Interview':
      keywords = INTERVIEW_KEYWORDS;
      break;
    case 'Applied':
    default:
      keywords = APPLICATION_KEYWORDS;
      break;
  }
  
  const keyword = fc.sample(fc.constantFrom(...keywords), 1)[0];
  
  // Generate email components
  const emailId = Math.random().toString(36).substring(2, 18);
  const threadId = Math.random().toString(36).substring(2, 18);
  
  // Generate from address
  const fromDomain = company ? company.toLowerCase().replace(/\s+/g, '') : 'example';
  const fromEmail = `jobs@${fromDomain}.com`;
  const from = `${company || 'Recruiting'} <${fromEmail}>`;
  
  // Generate subject
  let subject;
  if (status === 'Offer' && role) {
    subject = `Offer Letter - ${role}`;
  } else if (status === 'Rejected') {
    subject = `Application Status Update${role ? ` - ${role}` : ''}`;
  } else if (status === 'Interview' && role) {
    subject = `Interview Invitation - ${role}`;
  } else if (role) {
    subject = `Application Received - ${role}`;
  } else {
    subject = 'Thank you for your application';
  }
  
  if (company && !subject.includes(company)) {
    subject += ` at ${company}`;
  }
  
  // Generate body
  let body = generateEmailBody(status, keyword, company, role, location);
  
  // Apply format
  if (format === 'html') {
    body = wrapInHtml(body);
  } else if (format === 'multipart') {
    // For multipart, we'll just use plain text (the actual multipart handling is in gmailService)
    body = body;
  }
  
  // Generate date (within last 30 days)
  const daysAgo = fc.sample(fc.integer({ min: 0, max: 30 }), 1)[0];
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return {
    id: emailId,
    from,
    to: 'user@example.com',
    subject,
    body,
    date: date.toISOString(),
    snippet: body.substring(0, 100),
    threadId,
    labels: ['INBOX', 'UNREAD']
  };
}

/**
 * Generate email body content
 */
function generateEmailBody(status, keyword, company, role, location) {
  const companyName = company || 'our company';
  const roleName = role || 'the position';
  const locationInfo = location ? `\nLocation: ${location}\n` : '\n';
  
  let body = '';
  
  switch (status) {
    case 'Offer':
      body = `Dear Candidate,

${keyword.charAt(0).toUpperCase() + keyword.slice(1)}! We are pleased to offer you the ${roleName} position at ${companyName}.
${locationInfo}
We believe you would be a great addition to our team. Please review the attached offer letter with details about compensation and benefits.

Best regards,
${companyName} Recruiting Team`;
      break;
      
    case 'Rejected':
      body = `Dear Candidate,

Thank you for your interest in the ${roleName} position at ${companyName}.
${locationInfo}
${keyword.charAt(0).toUpperCase() + keyword.slice(1)}, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you invested in the application process and wish you the best in your job search.

Best regards,
${companyName} Recruiting Team`;
      break;
      
    case 'Interview':
      body = `Dear Candidate,

Thank you for your application to the ${roleName} position at ${companyName}.
${locationInfo}
We would like to ${keyword} to discuss your qualifications and learn more about your experience.

Please let us know your availability for next week.

Best regards,
${companyName} Recruiting Team`;
      break;
      
    case 'Applied':
    default:
      body = `Dear Candidate,

${keyword.charAt(0).toUpperCase() + keyword.slice(1)} for the ${roleName} position at ${companyName}.
${locationInfo}
We have received your application and our team will review it carefully. We will contact you if your qualifications match our requirements.

Thank you for your interest in joining ${companyName}.

Best regards,
${companyName} Recruiting Team`;
      break;
  }
  
  return body;
}

/**
 * Wrap plain text in HTML
 */
function wrapInHtml(text) {
  const paragraphs = text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email</title>
</head>
<body>
  ${paragraphs}
</body>
</html>`;
}

/**
 * Generate a random non-job-related email
 * @returns {Object} Email object without job-related content
 */
export function generateNonJobEmail() {
  const emailId = Math.random().toString(36).substring(2, 18);
  const threadId = Math.random().toString(36).substring(2, 18);
  
  const subjects = [
    'Newsletter: Weekly Tech Updates',
    'Your Amazon Order Has Shipped',
    'Meeting Reminder: Team Sync',
    'Invoice for Your Recent Purchase',
    'Welcome to Our Service',
    'Password Reset Request',
    'Your Subscription is Expiring Soon',
    'New Comment on Your Post'
  ];
  
  const bodies = [
    'This is your weekly newsletter with the latest tech news and updates.',
    'Your order #12345 has been shipped and will arrive in 3-5 business days.',
    'Reminder: Team sync meeting tomorrow at 10 AM.',
    'Please find attached the invoice for your recent purchase.',
    'Welcome! We are excited to have you as a customer.',
    'You requested a password reset. Click the link below to reset your password.',
    'Your subscription will expire in 7 days. Renew now to continue enjoying our service.',
    'Someone commented on your post. Click here to view the comment.'
  ];
  
  const subject = fc.sample(fc.constantFrom(...subjects), 1)[0];
  const body = fc.sample(fc.constantFrom(...bodies), 1)[0];
  
  const daysAgo = fc.sample(fc.integer({ min: 0, max: 30 }), 1)[0];
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return {
    id: emailId,
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject,
    body,
    date: date.toISOString(),
    snippet: body.substring(0, 100),
    threadId,
    labels: ['INBOX']
  };
}

/**
 * Generate an edge case email
 * @param {string} type - Edge case type: 'empty', 'malformed', 'special-chars', 'missing-fields'
 * @returns {Object} Email object with edge case characteristics
 */
export function generateEdgeCaseEmail(type) {
  const emailId = Math.random().toString(36).substring(2, 18);
  const threadId = Math.random().toString(36).substring(2, 18);
  
  const date = new Date().toISOString();
  
  switch (type) {
    case 'empty':
      return {
        id: emailId,
        from: '',
        to: '',
        subject: '',
        body: '',
        date,
        snippet: '',
        threadId,
        labels: []
      };
      
    case 'malformed':
      return {
        id: emailId,
        from: 'invalid-email-format',
        to: 'also-invalid',
        subject: 'Application for \x00\x01\x02 invalid chars',
        body: 'This email contains \uFFFD replacement characters and \x00 null bytes',
        date: 'invalid-date-format',
        snippet: 'Malformed content',
        threadId,
        labels: ['INBOX']
      };
      
    case 'special-chars':
      return {
        id: emailId,
        from: 'José García <jose@empresa.com>',
        to: 'user@example.com',
        subject: 'Application Received - Développeur Senior at Café™ Inc. 🎉',
        body: `Dear Candidate,

Thank you for applying to the Développeur Senior position at Café™ Inc.

We appreciate your interest in joining our team. Your résumé shows excellent qualifications for this rôle.

Location: Montréal, QC
Salary: €50,000 - €70,000

Best regards,
José García
Café™ Inc. — "Excellence in every cup" ☕`,
        date,
        snippet: 'Thank you for applying to the Développeur Senior position',
        threadId,
        labels: ['INBOX']
      };
      
    case 'missing-fields':
      return {
        id: emailId,
        from: 'unknown@example.com',
        to: 'user@example.com',
        subject: 'Thanks for applying',
        body: 'We received your application. Thank you for your interest.',
        date,
        snippet: 'We received your application',
        threadId,
        labels: ['INBOX']
      };
      
    default:
      throw new Error(`Unknown edge case type: ${type}`);
  }
}

/**
 * Generate a random application record
 * @param {Object} options - Configuration options
 * @param {string} options.userId - User ID for the application
 * @param {boolean} options.includeOptionalFields - Whether to include optional fields
 * @returns {Object} Application object matching database schema
 */
export function generateApplication(options = {}) {
  const {
    userId = 'test-user-' + Math.random().toString(36).substring(2, 10),
    includeOptionalFields = true
  } = options;
  
  const company = fc.sample(fc.constantFrom(...COMPANIES), 1)[0];
  const role = fc.sample(fc.constantFrom(...JOB_TITLES), 1)[0];
  const location = fc.sample(fc.constantFrom(...LOCATIONS), 1)[0];
  const status = fc.sample(fc.constantFrom(...STATUSES), 1)[0];
  
  // Generate dates
  const daysAgo = fc.sample(fc.integer({ min: 0, max: 60 }), 1)[0];
  const dateApplied = new Date();
  dateApplied.setDate(dateApplied.getDate() - daysAgo);
  const dateAppliedStr = dateApplied.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const now = new Date().toISOString();
  
  // Calculate confidence score
  let confidenceScore = 0;
  if (company !== 'Unknown Company') confidenceScore += 35;
  if (role !== 'Unknown Position') confidenceScore += 35;
  if (status) confidenceScore += 30;
  
  const application = {
    id: `app-${Math.random().toString(36).substring(2, 18)}`,
    userId,
    company,
    role,
    location,
    dateApplied: dateAppliedStr,
    lastUpdate: dateAppliedStr,
    createdAt: now,
    status,
    source: 'Email',
    salary: null,
    remotePolicy: null,
    notes: `Test application for ${role} at ${company}`,
    emailId: `email-${Math.random().toString(36).substring(2, 18)}`,
    confidenceScore,
    isDuplicate: 0
  };
  
  // Add optional fields if requested
  if (includeOptionalFields) {
    const salaries = ['$80k-$120k', '$100k-$150k', '$120k-$180k', null];
    const remotePolicies = ['Remote', 'Hybrid', 'On-site', null];
    
    application.salary = fc.sample(fc.constantFrom(...salaries), 1)[0];
    application.remotePolicy = fc.sample(fc.constantFrom(...remotePolicies), 1)[0];
  }
  
  return application;
}

/**
 * Fast-check arbitrary for generating job emails
 * Use this with fc.assert for property-based testing
 */
export const jobEmailArbitrary = fc.record({
  status: fc.constantFrom('Applied', 'Interview', 'Offer', 'Rejected'),
  hasCompany: fc.boolean(),
  hasRole: fc.boolean(),
  hasLocation: fc.boolean(),
  format: fc.constantFrom('plain', 'html', 'multipart')
}).map(options => generateJobEmail(options));

/**
 * Fast-check arbitrary for generating applications
 */
export const applicationArbitrary = fc.record({
  userId: fc.string({ minLength: 8, maxLength: 16 }).map(s => `user-${s}`),
  includeOptionalFields: fc.boolean()
}).map(options => generateApplication(options));

/**
 * Fast-check arbitrary for generating edge case emails
 */
export const edgeCaseEmailArbitrary = fc.constantFrom('empty', 'malformed', 'special-chars', 'missing-fields')
  .map(type => generateEdgeCaseEmail(type));

/**
 * Fast-check arbitrary for generating non-job emails
 */
export const nonJobEmailArbitrary = fc.constant(null).map(() => generateNonJobEmail());

/**
 * Generate an email from a job board domain
 * These should skip domain extraction and use alternative methods
 */
export function generateJobBoardEmail(options = {}) {
  const email = generateJobEmail(options);
  const jobBoard = fc.sample(fc.constantFrom(...JOB_BOARD_DOMAINS), 1)[0];
  
  // Override the from address to use a job board domain
  email.from = `Recruiting Team <noreply@${jobBoard}.com>`;
  
  return email;
}

export default {
  generateJobEmail,
  generateNonJobEmail,
  generateEdgeCaseEmail,
  generateApplication,
  generateJobBoardEmail,
  jobEmailArbitrary,
  applicationArbitrary,
  edgeCaseEmailArbitrary,
  nonJobEmailArbitrary
};
