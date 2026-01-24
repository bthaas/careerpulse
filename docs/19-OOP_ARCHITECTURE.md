# OOP Architecture Documentation

## Overview

The CareerPulse/JobFetch backend has been refactored from a functional programming style to an Object-Oriented Programming (OOP) architecture. This document describes the new architecture, migration approach, and usage patterns.

## Architecture Principles

### 1. Encapsulation
Each service class encapsulates related functionality and manages its own state:
- **DatabaseService**: All database operations
- **GmailService**: Gmail API interactions and OAuth management
- **EmailParser**: Email parsing and job detection logic
- **LLMParser**: LLM-based extraction with caching
- **DuplicateDetector**: Duplicate detection algorithms
- **AuthService**: Authentication and authorization
- **FileParserService**: CSV and Excel file parsing

### 2. Dependency Injection
Services receive their dependencies through constructor injection, making them:
- Easier to test (can inject mocks)
- More flexible (can swap implementations)
- Loosely coupled (services don't create their own dependencies)

Example:
```javascript
// EmailParser depends on LLMParser
const llmParser = new LLMParser(apiKey);
const emailParser = new EmailParser(llmParser);

// DuplicateDetector depends on DatabaseService
const databaseService = new DatabaseService();
const duplicateDetector = new DuplicateDetector(databaseService);
```

### 3. Single Responsibility
Each class has a single, well-defined responsibility:
- DatabaseService: Database operations only
- GmailService: Gmail API operations only
- AuthService: Authentication operations only

### 4. Backward Compatibility
All existing functional exports remain available as wrappers that delegate to class instances. This ensures:
- Zero breaking changes for existing code
- Gradual migration path
- Existing tests continue to pass

## Service Classes

### DatabaseService

**Purpose**: Manages all SQLite database operations

**Key Methods**:
- `initialize()`: Set up database connection and schema
- `close()`: Close database connection
- `getAllApplications(userId)`: Get all applications for a user
- `getApplicationById(id, userId)`: Get single application
- `createApplication(application)`: Create new application
- `updateApplication(id, userId, updates)`: Update application
- `deleteApplication(id, userId)`: Delete application
- `createUser(user)`: Create new user
- `getUserByEmail(email)`: Find user by email
- `saveEmailConnection(connection)`: Save Gmail OAuth credentials
- `getEmailConnection(userId)`: Get Gmail OAuth credentials

**Usage**:
```javascript
import { DatabaseService } from './services/DatabaseService.js';

const db = new DatabaseService();
await db.initialize();

const apps = await db.getAllApplications('user-123');
console.log(`Found ${apps.length} applications`);

await db.close();
```

### GmailService

**Purpose**: Handles Gmail API operations and OAuth credential management

**Key Methods**:
- `setCredentials(credentials)`: Set OAuth2 credentials
- `refreshCredentials()`: Refresh expired access token
- `fetchEmails(options)`: Fetch emails with query
- `fetchJobEmails(options)`: Fetch job-related emails
- `getGmailProfile()`: Get user's Gmail profile

**Usage**:
```javascript
import { GmailService } from './services/GmailService.js';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

const gmailService = new GmailService(oauth2Client, databaseService);
gmailService.setCredentials(userCredentials);

const emails = await gmailService.fetchJobEmails({
  maxResults: 50,
  afterDate: '2024/01/01'
});
```

### EmailParser

**Purpose**: Parses emails to extract job application information

**Key Methods**:
- `isJobEmail(subject, body)`: Check if email is job-related
- `calculateConfidence(company, role, status, usedLLM)`: Calculate confidence score
- `parseEmail(email)`: Parse email into Application object

**Usage**:
```javascript
import { EmailParser } from './services/EmailParser.js';
import { LLMParser } from './services/LLMParser.js';

const llmParser = new LLMParser(apiKey);
const emailParser = new EmailParser(llmParser);

const application = await emailParser.parseEmail({
  id: 'email-123',
  from: 'jobs@company.com',
  subject: 'Application Received',
  body: 'Thank you for applying...',
  date: '2024-01-15'
});

if (application) {
  console.log(`Found application at ${application.company}`);
}
```

### LLMParser

**Purpose**: Uses Google Gemini to extract structured data from emails

**Key Methods**:
- `extractWithLLM(from, subject, body)`: Extract job info using LLM
- `clearCache()`: Clear result cache
- `getCacheStats()`: Get cache statistics

**Features**:
- In-memory caching (FIFO eviction)
- Response validation
- Graceful error handling
- Returns null when API key not configured

**Usage**:
```javascript
import { LLMParser } from './services/LLMParser.js';

const llmParser = new LLMParser(process.env.GOOGLE_AI_API_KEY, {
  cacheMaxSize: 1000,
  temperature: 0.1
});

const result = await llmParser.extractWithLLM(
  'jobs@acme.com',
  'Application Received',
  'Thank you for applying to Software Engineer position...'
);

if (result && result.isJobEmail) {
  console.log(`Company: ${result.company}`);
  console.log(`Role: ${result.jobTitle}`);
  console.log(`Status: ${result.status}`);
}
```

### DuplicateDetector

**Purpose**: Detects duplicate job applications

**Key Methods**:
- `checkDuplicate(application)`: Check if application is duplicate
- `findSimilarApplications(application, threshold)`: Find similar applications

**Usage**:
```javascript
import { DuplicateDetector } from './services/DuplicateDetector.js';

const duplicateDetector = new DuplicateDetector(databaseService);

const result = await duplicateDetector.checkDuplicate({
  userId: 'user-123',
  company: 'Acme Corp',
  role: 'Software Engineer',
  dateApplied: '2024-01-15'
});

if (result.isDuplicate) {
  console.log(`Duplicate of application ${result.duplicateId}`);
  console.log(`Similarity: ${result.similarity * 100}%`);
}
```

### AuthService

**Purpose**: Manages authentication with JWT and bcrypt

**Key Methods**:
- `hashPassword(password)`: Hash password with bcrypt
- `comparePassword(password, hash)`: Verify password
- `generateToken(payload)`: Generate JWT token
- `verifyToken(token)`: Verify and decode JWT token
- `authMiddleware(req, res, next)`: Express middleware for route protection
- `optionalAuthMiddleware(req, res, next)`: Optional auth middleware

**Usage**:
```javascript
import { AuthService } from './services/AuthService.js';

const authService = new AuthService(process.env.JWT_SECRET, {
  expiresIn: '7d',
  saltRounds: 10
});

// Hash password
const hash = await authService.hashPassword('mypassword');

// Generate token
const token = authService.generateToken({
  userId: 'user-123',
  email: 'user@example.com'
});

// Protect route
app.get('/api/protected',
  authService.authMiddleware.bind(authService),
  (req, res) => {
    res.json({ userId: req.user.userId });
  }
);
```

### FileParserService

**Purpose**: Parses CSV and Excel files into Application objects

**Key Methods**:
- `parseCSV(file)`: Parse CSV file
- `parseExcel(file)`: Parse Excel file
- `validateFormat(file, type)`: Validate file format

**Features**:
- Flexible column name mapping
- Status normalization
- Format validation
- Consistent error handling

**Usage**:
```javascript
import { FileParserService } from './services/FileParserService.js';

const fileParser = new FileParserService({
  columnMappings: {
    company: ['company', 'employer'],
    role: ['position', 'title']
  }
});

const applications = fileParser.parseCSV(csvContent);
console.log(`Parsed ${applications.length} applications`);
```

## Dependency Injection Container

The `container.js` file creates and manages singleton instances of all services with proper dependency injection:

```javascript
// backend/services/container.js
import { DatabaseService } from './DatabaseService.js';
import { LLMParser } from './LLMParser.js';
import { EmailParser } from './EmailParser.js';
// ... other imports

// Create singleton instances with dependencies
export const databaseService = new DatabaseService();
export const llmParser = new LLMParser(process.env.GOOGLE_AI_API_KEY);
export const emailParser = new EmailParser(llmParser);
export const duplicateDetector = new DuplicateDetector(databaseService);
export const authService = new AuthService(process.env.JWT_SECRET);

// Initialize database on startup
await databaseService.initialize();

// Export all services
export default {
  databaseService,
  llmParser,
  emailParser,
  duplicateDetector,
  authService
};
```

### Using the Container in Routes

```javascript
import container from '../services/container.js';

// Use services from container
router.get('/applications', async (req, res) => {
  const apps = await container.databaseService.getAllApplications(req.user.userId);
  res.json(apps);
});
```

## Backward Compatibility

All existing functional exports remain available as wrappers:

```javascript
// backend/database/db.js
import { DatabaseService } from './DatabaseService.js';

// Create singleton instance
const dbService = new DatabaseService();
await dbService.initialize();

// Export class for new code
export { DatabaseService };

// Export functional wrappers for backward compatibility
export async function getAllApplications(userId) {
  return dbService.getAllApplications(userId);
}

export async function createApplication(application) {
  return dbService.createApplication(application);
}

// ... all other functions as wrappers
```

This means existing code continues to work:

```javascript
// Old functional style still works
import { getAllApplications } from './database/db.js';
const apps = await getAllApplications('user-123');

// New OOP style also works
import { DatabaseService } from './database/DatabaseService.js';
const db = new DatabaseService();
await db.initialize();
const apps = await db.getAllApplications('user-123');
```

## Error Handling

### Custom Error Classes

Each service defines custom error classes for better error handling:

```javascript
// DatabaseService
export class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

// GmailService
export class GmailAPIError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'GmailAPIError';
    this.originalError = originalError;
  }
}

// FileParserService
export class ParsingError extends Error {
  constructor(type, message, originalError = null) {
    super(`${type} parsing failed: ${message}`);
    this.name = 'ParsingError';
    this.type = type;
    this.originalError = originalError;
  }
}
```

### Error Handling Patterns

```javascript
try {
  const app = await databaseService.getApplicationById('app-123', 'user-123');
  if (!app) {
    throw new NotFoundError('Application', 'app-123');
  }
} catch (error) {
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
  } else if (error instanceof DatabaseError) {
    res.status(500).json({ error: 'Database error occurred' });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Testing

### Unit Testing

Test individual service classes with mocked dependencies:

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../services/DatabaseService.js';

describe('DatabaseService', () => {
  let db;

  beforeAll(async () => {
    db = new DatabaseService(':memory:');
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create and retrieve application', async () => {
    const app = {
      id: 'app-123',
      userId: 'user-123',
      company: 'Acme Corp',
      role: 'Engineer',
      // ... other fields
    };

    await db.createApplication(app);
    const retrieved = await db.getApplicationById('app-123', 'user-123');

    expect(retrieved).not.toBeNull();
    expect(retrieved.company).toBe('Acme Corp');
  });
});
```

### Property-Based Testing

Test universal properties across all inputs:

```javascript
import fc from 'fast-check';

describe('Property: Async/Await Support', () => {
  it('should return Promises for all async methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        async (userId) => {
          const result = db.getAllApplications(userId);
          expect(result).toBeInstanceOf(Promise);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Test services working together:

```javascript
describe('Email Sync Integration', () => {
  it('should sync emails end-to-end', async () => {
    // Set up services
    const db = new DatabaseService(':memory:');
    await db.initialize();
    
    const llmParser = new LLMParser(apiKey);
    const emailParser = new EmailParser(llmParser);
    const gmailService = new GmailService(oauth2Client, db);
    
    // Perform sync
    gmailService.setCredentials(credentials);
    const emails = await gmailService.fetchJobEmails({ maxResults: 10 });
    
    for (const email of emails) {
      const app = await emailParser.parseEmail(email);
      if (app) {
        await db.createApplication(app);
      }
    }
    
    // Verify results
    const apps = await db.getAllApplications('user-123');
    expect(apps.length).toBeGreaterThan(0);
  });
});
```

## Migration Guide

### For Developers

#### 1. Using Services in New Code

```javascript
// Import from container for singleton instances
import container from './services/container.js';

// Use services
const apps = await container.databaseService.getAllApplications(userId);
```

#### 2. Creating Custom Service Instances

```javascript
// Import service class
import { DatabaseService } from './services/DatabaseService.js';

// Create instance (e.g., for testing)
const db = new DatabaseService(':memory:');
await db.initialize();
```

#### 3. Migrating Existing Code

Old functional style:
```javascript
import { getAllApplications, createApplication } from './database/db.js';

const apps = await getAllApplications(userId);
await createApplication(newApp);
```

New OOP style:
```javascript
import container from './services/container.js';

const apps = await container.databaseService.getAllApplications(userId);
await container.databaseService.createApplication(newApp);
```

#### 4. Testing with Dependency Injection

```javascript
// Create test doubles
const mockLLMParser = {
  extractWithLLM: vi.fn().mockResolvedValue({
    isJobEmail: true,
    company: 'Test Corp',
    jobTitle: 'Engineer',
    status: 'Applied',
    location: 'Remote'
  })
};

// Inject mock
const emailParser = new EmailParser(mockLLMParser);

// Test with mock
const result = await emailParser.parseEmail(testEmail);
expect(mockLLMParser.extractWithLLM).toHaveBeenCalled();
```

## Benefits of OOP Architecture

### 1. Testability
- Easy to mock dependencies
- Isolated unit tests
- Property-based testing support

### 2. Maintainability
- Clear separation of concerns
- Single responsibility per class
- Easy to locate and modify functionality

### 3. Flexibility
- Swap implementations easily
- Configure services with options
- Extend classes for custom behavior

### 4. Type Safety
- JSDoc comments provide IDE autocomplete
- Clear interfaces and contracts
- Better error detection

### 5. Reusability
- Services can be used in multiple contexts
- Dependency injection enables composition
- Backward compatibility ensures gradual adoption

## Best Practices

### 1. Always Use Dependency Injection

```javascript
// Good: Dependencies injected
class EmailParser {
  constructor(llmParser) {
    this.llmParser = llmParser;
  }
}

// Bad: Creates own dependencies
class EmailParser {
  constructor() {
    this.llmParser = new LLMParser(apiKey); // Hard to test!
  }
}
```

### 2. Use Container for Singletons

```javascript
// Good: Use container
import container from './services/container.js';
const apps = await container.databaseService.getAllApplications(userId);

// Avoid: Creating multiple instances
const db1 = new DatabaseService();
const db2 = new DatabaseService(); // Multiple connections!
```

### 3. Handle Errors Appropriately

```javascript
// Good: Specific error handling
try {
  await databaseService.createApplication(app);
} catch (error) {
  if (error instanceof DuplicateError) {
    // Handle duplicate
  } else if (error instanceof DatabaseError) {
    // Handle database error
  }
}

// Bad: Generic error handling
try {
  await databaseService.createApplication(app);
} catch (error) {
  console.error(error); // Lost context!
}
```

### 4. Document with JSDoc

```javascript
/**
 * Create a new application
 * 
 * @param {Object} application - Application data
 * @param {string} application.company - Company name
 * @param {string} application.role - Job role
 * @returns {Promise<void>}
 * @throws {DatabaseError} If creation fails
 */
async createApplication(application) {
  // Implementation
}
```

## Conclusion

The OOP refactoring provides a solid foundation for future development while maintaining complete backward compatibility. The new architecture is more testable, maintainable, and flexible than the previous functional approach.

For questions or issues, please refer to the individual service class documentation or contact the development team.
