import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  isJobEmail,
  detectStatus,
  extractCompany,
  extractJobTitle,
  extractLocation,
  calculateConfidence,
  parseEmail
} from '../services/emailParser.js';

describe('Email Detection', () => {
  test('should detect application confirmation emails', () => {
    const subject = 'Application Received - Software Engineer';
    const body = 'Thank you for applying to our company.';
    
    assert.strictEqual(isJobEmail(subject, body), true);
  });

  test('should detect interview invitation emails', () => {
    const subject = 'Interview Request';
    const body = 'We would like to schedule a phone screen with you.';
    
    assert.strictEqual(isJobEmail(subject, body), true);
  });

  test('should detect rejection emails', () => {
    const subject = 'Update on your application';
    const body = 'Unfortunately, we have decided not to move forward.';
    
    assert.strictEqual(isJobEmail(subject, body), true);
  });

  test('should detect offer emails', () => {
    const subject = 'Job Offer';
    const body = 'Congratulations! We are pleased to offer you the position.';
    
    assert.strictEqual(isJobEmail(subject, body), true);
  });

  test('should reject non-job-related emails', () => {
    const subject = 'Weekly Newsletter';
    const body = 'Check out our latest blog posts.';
    
    assert.strictEqual(isJobEmail(subject, body), false);
  });
});

describe('Status Detection', () => {
  test('should detect Applied status', () => {
    const subject = 'Application Received';
    const body = 'Thank you for your application.';
    
    assert.strictEqual(detectStatus(subject, body), 'Applied');
  });

  test('should detect Interview status', () => {
    const subject = 'Next Steps';
    const body = 'We would like to schedule an interview with you.';
    
    assert.strictEqual(detectStatus(subject, body), 'Interview');
  });

  test('should detect Rejected status', () => {
    const subject = 'Application Update';
    const body = 'Unfortunately, we are not moving forward with your application.';
    
    assert.strictEqual(detectStatus(subject, body), 'Rejected');
  });

  test('should detect Offer status', () => {
    const subject = 'Job Offer - Software Engineer';
    const body = 'We are pleased to extend an offer for the position.';
    
    assert.strictEqual(detectStatus(subject, body), 'Offer');
  });

  test('should prioritize Offer over other statuses', () => {
    const subject = 'Interview Offer Letter';
    const body = 'Congratulations! We are pleased to offer you the position after your interview.';
    
    // Should detect Offer even though "interview" is also present
    assert.strictEqual(detectStatus(subject, body), 'Offer');
  });
});

describe('Company Extraction', () => {
  test('should extract company from email domain', () => {
    const from = 'jobs@google.com';
    const subject = 'Application Received';
    const body = 'Thank you for applying.';
    
    const company = extractCompany(from, subject, body);
    assert.strictEqual(company, 'Google');
  });

  test('should skip common job board domains', () => {
    const from = 'noreply@greenhouse.io';
    const subject = 'Application at Microsoft';
    const body = 'Thank you for applying.';
    
    const company = extractCompany(from, subject, body);
    // Should extract from subject instead of greenhouse domain
    assert.strictEqual(company, 'Microsoft');
  });

  test('should extract company from "at [Company]" pattern', () => {
    const from = 'noreply@lever.co';
    const subject = 'Application for Software Engineer at Tesla';
    const body = 'Thank you for applying.';
    
    const company = extractCompany(from, subject, body);
    assert.strictEqual(company, 'Tesla');
  });

  test('should extract company from email body', () => {
    const from = 'recruiting@example.com';
    const subject = 'Application Received';
    const body = 'Thank you for applying to Amazon. We are excited to review your application.';
    
    const company = extractCompany(from, subject, body);
    assert.strictEqual(company, 'Amazon');
  });
});

describe('Job Title Extraction', () => {
  test('should extract job title from "for [title] position" pattern', () => {
    const subject = 'Application for Software Engineer position';
    const body = 'Thank you.';
    
    const title = extractJobTitle(subject, body);
    assert.strictEqual(title, 'Software Engineer');
  });

  test('should extract job title from "[title] role" pattern', () => {
    const subject = 'Senior Backend Developer role - Application received';
    const body = 'Thank you.';
    
    const title = extractJobTitle(subject, body);
    assert.strictEqual(title, 'Senior Backend Developer');
  });

  test('should extract job title from body if not in subject', () => {
    const subject = 'Application Received';
    const body = 'Position: Full Stack Engineer\nThank you for applying.';
    
    const title = extractJobTitle(subject, body);
    assert.strictEqual(title, 'Full Stack Engineer');
  });

  test('should handle titles with articles', () => {
    const subject = 'Application for the Senior Engineer position';
    const body = '';
    
    const title = extractJobTitle(subject, body);
    // Should remove "the"
    assert.strictEqual(title, 'Senior Engineer');
  });
});

describe('Location Extraction', () => {
  test('should extract location from "Location:" pattern', () => {
    const body = 'Position: Engineer\nLocation: San Francisco, CA\nThank you.';
    
    const location = extractLocation(body);
    assert.strictEqual(location, 'San Francisco, CA');
  });

  test('should detect remote positions', () => {
    const body = 'This is a remote position.';
    
    const location = extractLocation(body);
    assert.ok(location.toLowerCase().includes('remote'));
  });

  test('should extract city from body', () => {
    const body = 'Join our team in Seattle!';
    
    const location = extractLocation(body);
    assert.strictEqual(location, 'Seattle');
  });
});

describe('Confidence Score Calculation', () => {
  test('should give full score for complete data', () => {
    const score = calculateConfidence('Google', 'Software Engineer', 'Applied');
    assert.strictEqual(score, 100);
  });

  test('should give partial score for incomplete data', () => {
    const score = calculateConfidence('Unknown Company', 'Software Engineer', 'Applied');
    assert.strictEqual(score, 65); // Missing company (35 points)
  });

  test('should give low score for minimal data', () => {
    const score = calculateConfidence('Unknown Company', 'Unknown Position', 'Applied');
    assert.strictEqual(score, 30); // Only status detected
  });

  test('should give zero score for no data', () => {
    const score = calculateConfidence('Unknown Company', 'Unknown Position', null);
    assert.strictEqual(score, 0);
  });
});

describe('Full Email Parsing', () => {
  test('should parse application confirmation email', () => {
    const email = {
      id: 'email-123',
      from: 'jobs@google.com',
      subject: 'Application Received - Software Engineer',
      body: 'Thank you for applying to the Software Engineer position at Google. We will review your application.',
      date: '2024-01-15T10:00:00Z'
    };
    
    const result = parseEmail(email);
    
    assert.ok(result);
    assert.strictEqual(result.company, 'Google');
    assert.strictEqual(result.role, 'Software Engineer');
    assert.strictEqual(result.status, 'Applied');
    assert.strictEqual(result.source, 'Email');
    assert.strictEqual(result.emailId, 'email-123');
    assert.strictEqual(result.dateApplied, '2024-01-15');
    assert.ok(result.confidenceScore > 0);
  });

  test('should parse interview invitation email', () => {
    const email = {
      id: 'email-456',
      from: 'recruiting@microsoft.com',
      subject: 'Interview Request - Senior Developer',
      body: 'We would like to schedule a phone screen with you for the Senior Developer role.',
      date: '2024-01-16T14:00:00Z'
    };
    
    const result = parseEmail(email);
    
    assert.ok(result);
    assert.strictEqual(result.company, 'Microsoft');
    assert.strictEqual(result.status, 'Interview');
    assert.ok(result.role.includes('Developer'));
  });

  test('should parse rejection email', () => {
    const email = {
      id: 'email-789',
      from: 'noreply@greenhouse.io',
      subject: 'Update on your application at Tesla',
      body: 'Unfortunately, we have decided not to move forward with your application at this time.',
      date: '2024-01-17T09:00:00Z'
    };
    
    const result = parseEmail(email);
    
    assert.ok(result);
    assert.strictEqual(result.company, 'Tesla');
    assert.strictEqual(result.status, 'Rejected');
  });

  test('should parse offer email', () => {
    const email = {
      id: 'email-101',
      from: 'hr@amazon.com',
      subject: 'Job Offer - Software Development Engineer',
      body: 'Congratulations! We are pleased to offer you the position of Software Development Engineer.',
      date: '2024-01-18T11:00:00Z'
    };
    
    const result = parseEmail(email);
    
    assert.ok(result);
    assert.strictEqual(result.company, 'Amazon');
    assert.strictEqual(result.status, 'Offer');
    assert.ok(result.role.includes('Engineer'));
  });

  test('should return null for non-job emails', () => {
    const email = {
      id: 'email-999',
      from: 'newsletter@example.com',
      subject: 'Weekly Tech News',
      body: 'Here are this week\'s top tech stories.',
      date: '2024-01-19T08:00:00Z'
    };
    
    const result = parseEmail(email);
    assert.strictEqual(result, null);
  });

  test('should detect remote policy from location', () => {
    const email = {
      id: 'email-202',
      from: 'jobs@stripe.com',
      subject: 'Application Received',
      body: 'Thank you for applying. This is a fully remote position.',
      date: '2024-01-20T10:00:00Z'
    };
    
    const result = parseEmail(email);
    
    assert.ok(result);
    assert.strictEqual(result.remotePolicy, 'Remote');
  });
});
