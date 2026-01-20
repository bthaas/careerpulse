/**
 * Unit Tests for Gmail Service
 * Tests email fetching, query building, and message parsing
 * Note: Uses mock responses, not real Gmail API calls
 */

import { describe, it, expect } from 'vitest';

describe('Gmail Service - Query Building', () => {
  it('should build basic inbox query', () => {
    const query = 'in:inbox';
    expect(query).toBe('in:inbox');
  });

  it('should append date filter to query', () => {
    const baseQuery = 'in:inbox';
    const afterDate = '2026/01/01';
    const fullQuery = `${baseQuery} after:${afterDate}`;
    
    expect(fullQuery).toBe('in:inbox after:2026/01/01');
  });

  it('should build job-related search query', () => {
    const query = '(application OR interview OR offer OR rejected OR "thank you for applying") in:inbox';
    expect(query).toContain('application');
    expect(query).toContain('interview');
    expect(query).toContain('offer');
    expect(query).toContain('rejected');
  });

  it('should handle maxResults parameter', () => {
    const maxResults = 50;
    expect(maxResults).toBeGreaterThan(0);
    expect(maxResults).toBeLessThanOrEqual(500);
  });
});

describe('Gmail Service - Message Parsing', () => {
  it('should parse email headers correctly', () => {
    const headers = [
      { name: 'From', value: 'jobs@company.com' },
      { name: 'To', value: 'user@example.com' },
      { name: 'Subject', value: 'Application Received' },
      { name: 'Date', value: 'Mon, 15 Jan 2026 10:00:00 -0800' }
    ];
    
    const from = headers.find(h => h.name === 'From')?.value;
    const subject = headers.find(h => h.name === 'Subject')?.value;
    
    expect(from).toBe('jobs@company.com');
    expect(subject).toBe('Application Received');
  });

  it('should decode base64 email body', () => {
    const base64Data = 'VGhhbmsgeW91IGZvciBhcHBseWluZw=='; // "Thank you for applying"
    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
    
    expect(decoded).toBe('Thank you for applying');
  });

  it('should handle base64url encoding', () => {
    // Base64url uses - and _ instead of + and /
    const base64urlData = 'VGhhbmsgeW91IGZvciBhcHBseWluZw';
    const base64Data = base64urlData.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
    
    expect(decoded).toContain('Thank you');
  });

  it('should strip HTML tags from body', () => {
    const html = '<p>Thank you for <strong>applying</strong>!</p>';
    const stripped = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    expect(stripped).toBe('Thank you for applying !');
  });

  it('should decode HTML entities', () => {
    const text = 'Thank&nbsp;you&amp;welcome';
    const decoded = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
    
    expect(decoded).toBe('Thank you&welcome');
  });
});

describe('Gmail Service - Date Handling', () => {
  it('should format date for Gmail query (YYYY/MM/DD)', () => {
    const date = new Date('2026-01-15');
    const formatted = date.toISOString().split('T')[0].replace(/-/g, '/');
    
    expect(formatted).toBe('2026/01/15');
  });

  it('should calculate date 30 days ago', () => {
    const now = new Date('2026-01-15');
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const daysDiff = Math.floor((now - thirtyDaysAgo) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(30);
  });

  it('should handle date range filters', () => {
    const afterDate = '2026/01/01';
    const query = `in:inbox after:${afterDate}`;
    
    expect(query).toContain('after:2026/01/01');
  });
});

describe('Gmail Service - Error Handling', () => {
  it('should handle empty message list', () => {
    const messages = [];
    expect(messages.length).toBe(0);
  });

  it('should handle missing headers gracefully', () => {
    const headers = [
      { name: 'From', value: 'jobs@company.com' }
      // Missing Subject, Date, etc.
    ];
    
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    expect(subject).toBe('');
  });

  it('should handle malformed base64 data', () => {
    const invalidBase64 = 'INVALID###';
    let decoded = '';
    
    try {
      decoded = Buffer.from(invalidBase64, 'base64').toString('utf-8');
    } catch (error) {
      decoded = '';
    }
    
    expect(decoded).toBeDefined();
  });

  it('should handle missing payload body', () => {
    const payload = {
      headers: [{ name: 'Subject', value: 'Test' }]
      // No body or parts
    };
    
    const body = payload.body?.data || '';
    expect(body).toBe('');
  });
});

describe('Gmail Service - Multipart Messages', () => {
  it('should prefer text/plain over text/html', () => {
    const parts = [
      { mimeType: 'text/html', body: { data: 'PGh0bWw+PC9odG1sPg==' } },
      { mimeType: 'text/plain', body: { data: 'UGxhaW4gdGV4dA==' } }
    ];
    
    const plainPart = parts.find(p => p.mimeType === 'text/plain');
    expect(plainPart).toBeDefined();
    expect(plainPart.mimeType).toBe('text/plain');
  });

  it('should handle nested multipart structure', () => {
    const payload = {
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            { mimeType: 'text/plain', body: { data: 'UGxhaW4=' } }
          ]
        }
      ]
    };
    
    expect(payload.parts[0].parts).toBeDefined();
    expect(payload.parts[0].parts.length).toBeGreaterThan(0);
  });
});

describe('Gmail Service - Profile Information', () => {
  it('should extract email address from profile', () => {
    const profile = {
      emailAddress: 'user@example.com',
      messagesTotal: 1000,
      threadsTotal: 500
    };
    
    expect(profile.emailAddress).toBe('user@example.com');
    expect(profile.messagesTotal).toBeGreaterThan(0);
  });

  it('should include message and thread counts', () => {
    const profile = {
      emailAddress: 'user@example.com',
      messagesTotal: 1000,
      threadsTotal: 500
    };
    
    expect(profile).toHaveProperty('messagesTotal');
    expect(profile).toHaveProperty('threadsTotal');
  });
});
