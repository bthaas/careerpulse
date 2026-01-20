# Design Document: System Verification and Health Check

## Overview

This document outlines the technical approach for verifying all connections, configurations, and integrations in the CareerPulse application. We'll create automated verification scripts and manual testing procedures to ensure system health.

## Verification Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Verification System                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Config     │  │  Connection  │  │  Integration │     │
│  │   Checker    │  │   Tester     │  │   Verifier   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  Health Report │                       │
│                    │   Generator    │                       │
│                    └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  System Status │
                    │   Dashboard    │
                    └────────────────┘
```

## Verification Components

### 1. Environment Configuration Checker

**Purpose**: Verify all environment variables are present and valid

**Location**: `backend/scripts/verify-env.js`

**Interface**:
```javascript
/**
 * Check if all required environment variables are set
 * @returns {Object} { valid: boolean, missing: string[], invalid: string[] }
 */
function checkEnvironmentVariables(): VerificationResult

/**
 * Validate format of environment variables
 * @param {string} key - Variable name
 * @param {string} value - Variable value
 * @returns {boolean} True if valid format
 */
function validateVariableFormat(key, value): boolean

/**
 * Generate environment report
 * @returns {string} Formatted report
 */
function generateEnvReport(): string
```

**Implementation**:
```javascript
const REQUIRED_VARS = {
  // Server
  PORT: { type: 'number', default: 3001 },
  DATABASE_PATH: { type: 'path', required: true },
  
  // Authentication
  JWT_SECRET: { type: 'string', minLength: 32, required: true },
  SESSION_SECRET: { type: 'string', minLength: 32, required: true },
  
  // Google OAuth
  GOOGLE_CLIENT_ID: { type: 'string', required: true },
  GOOGLE_CLIENT_SECRET: { type: 'string', required: true },
  GOOGLE_REDIRECT_URI: { type: 'url', required: true },
  
  // Gemini LLM
  GOOGLE_AI_API_KEY: { type: 'string', required: true },
  
  // Secret Manager (optional)
  USE_SECRET_MANAGER: { type: 'boolean', default: false },
  SECRET_MANAGER_PROJECT_ID: { type: 'string', required: false },
  
  // CORS
  FRONTEND_URL: { type: 'url', required: true }
};

function checkEnvironmentVariables() {
  const missing = [];
  const invalid = [];
  
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[key];
    
    if (!value && config.required) {
      missing.push(key);
      continue;
    }
    
    if (value && !validateVariableFormat(key, value, config)) {
      invalid.push(key);
    }
  }
  
  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid
  };
}
```

### 2. Database Connection Tester

**Purpose**: Verify database is accessible and properly structured

**Location**: `backend/scripts/verify-database.js`

**Interface**:
```javascript
/**
 * Test database connection
 * @returns {Promise<boolean>} True if connected
 */
async function testDatabaseConnection(): Promise<boolean>

/**
 * Verify all required tables exist
 * @returns {Promise<Object>} { valid: boolean, missing: string[] }
 */
async function verifyTables(): Promise<VerificationResult>

/**
 * Verify table schemas
 * @returns {Promise<Object>} { valid: boolean, issues: string[] }
 */
async function verifySchemas(): Promise<VerificationResult>

/**
 * Test read/write operations
 * @returns {Promise<boolean>} True if operations work
 */
async function testOperations(): Promise<boolean>
```

**Implementation**:
```javascript
const REQUIRED_TABLES = [
  'users',
  'applications',
  'status_history',
  'email_connections'
];

const TABLE_SCHEMAS = {
  users: ['id', 'email', 'password', 'name', 'created_at'],
  applications: ['id', 'userId', 'company', 'role', 'status', 'dateApplied'],
  status_history: ['id', 'applicationId', 'status', 'changedAt'],
  email_connections: ['id', 'userId', 'email', 'accessToken', 'refreshToken']
};

async function verifyTables() {
  const db = await getDatabase();
  const tables = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  
  const existingTables = tables.map(t => t.name);
  const missing = REQUIRED_TABLES.filter(t => !existingTables.includes(t));
  
  return {
    valid: missing.length === 0,
    missing
  };
}
```

### 3. OAuth Configuration Verifier

**Purpose**: Verify Google OAuth is properly configured

**Location**: `backend/scripts/verify-oauth.js`

**Interface**:
```javascript
/**
 * Verify Google Sign-In configuration
 * @returns {Object} { valid: boolean, issues: string[] }
 */
function verifyGoogleSignIn(): VerificationResult

/**
 * Verify Gmail OAuth configuration
 * @returns {Object} { valid: boolean, issues: string[] }
 */
function verifyGmailOAuth(): VerificationResult

/**
 * Test OAuth URL generation
 * @returns {boolean} True if URLs can be generated
 */
function testOAuthURLGeneration(): boolean

/**
 * Verify OAuth state parameter
 * @returns {boolean} True if state generation/validation works
 */
function verifyOAuthState(): boolean
```

### 4. Gemini LLM Connection Tester

**Purpose**: Verify Gemini LLM is accessible and working

**Location**: `backend/scripts/verify-gemini.js`

**Interface**:
```javascript
/**
 * Test Gemini API connection
 * @returns {Promise<boolean>} True if API is accessible
 */
async function testGeminiConnection(): Promise<boolean>

/**
 * Test email parsing with sample data
 * @returns {Promise<Object>} Parsed result
 */
async function testEmailParsing(): Promise<ParsedEmail>

/**
 * Verify model configuration
 * @returns {Object} { valid: boolean, issues: string[] }
 */
function verifyModelConfig(): VerificationResult

/**
 * Test caching mechanism
 * @returns {Promise<boolean>} True if caching works
 */
async function testCaching(): Promise<boolean>
```

**Implementation**:
```javascript
const TEST_EMAIL = {
  from: 'jobs@company.com',
  subject: 'Application Received: Software Engineer',
  body: 'Thank you for applying to the Software Engineer position at TechCorp...'
};

async function testEmailParsing() {
  try {
    const result = await extractWithLLM(
      TEST_EMAIL.from,
      TEST_EMAIL.subject,
      TEST_EMAIL.body
    );
    
    return {
      success: true,
      result,
      hasCompany: !!result.company,
      hasTitle: !!result.title,
      hasStatus: !!result.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 5. API Endpoint Tester

**Purpose**: Verify all API endpoints are accessible

**Location**: `backend/scripts/verify-api.js`

**Interface**:
```javascript
/**
 * Test all API endpoints
 * @returns {Promise<Object>} Results for each endpoint
 */
async function testAllEndpoints(): Promise<EndpointResults>

/**
 * Test specific endpoint
 * @param {string} method - HTTP method
 * @param {string} path - Endpoint path
 * @param {Object} data - Request data
 * @returns {Promise<Object>} { success: boolean, status: number, error?: string }
 */
async function testEndpoint(method, path, data): Promise<TestResult>

/**
 * Generate API health report
 * @returns {string} Formatted report
 */
function generateAPIReport(results): string
```

**Endpoints to Test**:
```javascript
const ENDPOINTS = [
  // Auth
  { method: 'POST', path: '/api/auth/signup', requiresAuth: false },
  { method: 'POST', path: '/api/auth/login', requiresAuth: false },
  { method: 'POST', path: '/api/auth/logout', requiresAuth: true },
  { method: 'GET', path: '/api/auth/status', requiresAuth: true },
  
  // Applications
  { method: 'GET', path: '/api/applications', requiresAuth: true },
  { method: 'POST', path: '/api/applications', requiresAuth: true },
  
  // Email
  { method: 'POST', path: '/api/email/sync', requiresAuth: true },
  
  // User
  { method: 'GET', path: '/api/user/me', requiresAuth: true }
];
```

### 6. Integration Flow Tester

**Purpose**: Test complete user flows end-to-end

**Location**: `backend/scripts/verify-flows.js`

**Interface**:
```javascript
/**
 * Test complete signup flow
 * @returns {Promise<Object>} Flow result
 */
async function testSignupFlow(): Promise<FlowResult>

/**
 * Test complete login flow
 * @returns {Promise<Object>} Flow result
 */
async function testLoginFlow(): Promise<FlowResult>

/**
 * Test Gmail connection flow
 * @returns {Promise<Object>} Flow result
 */
async function testGmailConnectionFlow(): Promise<FlowResult>

/**
 * Test email sync flow
 * @returns {Promise<Object>} Flow result
 */
async function testEmailSyncFlow(): Promise<FlowResult>
```

### 7. Health Report Generator

**Purpose**: Generate comprehensive system health report

**Location**: `backend/scripts/generate-health-report.js`

**Interface**:
```javascript
/**
 * Run all verification checks
 * @returns {Promise<Object>} Complete health report
 */
async function runAllChecks(): Promise<HealthReport>

/**
 * Generate formatted report
 * @param {Object} results - Check results
 * @returns {string} Formatted report
 */
function formatReport(results): string

/**
 * Save report to file
 * @param {string} report - Report content
 * @param {string} filename - Output filename
 */
function saveReport(report, filename): void
```

**Report Format**:
```
================================================================================
                    CAREERPULSE SYSTEM HEALTH REPORT
================================================================================
Generated: 2026-01-19 10:30:00 PST

OVERALL STATUS: ✅ HEALTHY

--------------------------------------------------------------------------------
ENVIRONMENT CONFIGURATION
--------------------------------------------------------------------------------
✅ All required variables present
✅ All variables valid format
⚠️  Optional variables missing: SECRET_MANAGER_PROJECT_ID

Variables checked: 11
Missing: 0
Invalid: 0

--------------------------------------------------------------------------------
DATABASE CONNECTION
--------------------------------------------------------------------------------
✅ Database accessible
✅ All tables present
✅ All schemas valid
✅ Read/write operations working

Tables: 4/4
Indexes: 8/8

--------------------------------------------------------------------------------
OAUTH CONFIGURATION
--------------------------------------------------------------------------------
✅ Google Sign-In configured
✅ Gmail OAuth configured
✅ OAuth URLs generate correctly
✅ OAuth state parameter working

--------------------------------------------------------------------------------
GEMINI LLM INTEGRATION
--------------------------------------------------------------------------------
✅ API connection successful
✅ Email parsing working
✅ Model configuration valid
✅ Caching mechanism working

Test parse time: 2.3s
Cache hit rate: 95%

--------------------------------------------------------------------------------
API ENDPOINTS
--------------------------------------------------------------------------------
✅ Auth endpoints: 8/8 working
✅ Application endpoints: 4/4 working
✅ Email endpoints: 1/1 working
✅ User endpoints: 1/1 working

Total endpoints: 14/14

--------------------------------------------------------------------------------
INTEGRATION FLOWS
--------------------------------------------------------------------------------
✅ Signup flow: Working
✅ Login flow: Working
✅ Gmail connection flow: Working
✅ Email sync flow: Working

--------------------------------------------------------------------------------
TEST SUITE
--------------------------------------------------------------------------------
✅ Unit tests: 200/200 passing
✅ Integration tests: 97/97 passing
✅ Property tests: 80/80 passing
✅ E2E tests: 20/20 passing

Total: 397/397 passing
Coverage: 85.3%

--------------------------------------------------------------------------------
SECURITY
--------------------------------------------------------------------------------
✅ Helmet headers configured
✅ Rate limiting active
✅ CORS configured
✅ JWT validation working
✅ OAuth CSRF protection active

--------------------------------------------------------------------------------
RECOMMENDATIONS
--------------------------------------------------------------------------------
1. Consider adding SECRET_MANAGER_PROJECT_ID for production
2. Monitor Gemini API usage and costs
3. Set up automated health checks
4. Configure log aggregation

================================================================================
```

## Verification Scripts

### Master Verification Script

**Location**: `backend/scripts/verify-system.js`

```javascript
#!/usr/bin/env node

import { checkEnvironmentVariables } from './verify-env.js';
import { verifyDatabase } from './verify-database.js';
import { verifyOAuth } from './verify-oauth.js';
import { testGeminiConnection } from './verify-gemini.js';
import { testAllEndpoints } from './verify-api.js';
import { runAllFlows } from './verify-flows.js';

async function main() {
  console.log('🔍 Starting system verification...\n');
  
  const results = {
    environment: await checkEnvironmentVariables(),
    database: await verifyDatabase(),
    oauth: await verifyOAuth(),
    gemini: await testGeminiConnection(),
    api: await testAllEndpoints(),
    flows: await runAllFlows()
  };
  
  const report = generateReport(results);
  console.log(report);
  
  // Save to file
  saveReport(report, 'health-report.txt');
  
  // Exit with appropriate code
  const allPassed = Object.values(results).every(r => r.valid);
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
```

### Quick Health Check Script

**Location**: `backend/scripts/health-check.js`

```javascript
#!/usr/bin/env node

// Quick health check for monitoring
async function quickCheck() {
  const checks = {
    env: checkCriticalEnvVars(),
    db: await testDatabaseConnection(),
    api: await testHealthEndpoint()
  };
  
  const healthy = Object.values(checks).every(c => c);
  
  console.log(JSON.stringify({
    healthy,
    timestamp: new Date().toISOString(),
    checks
  }));
  
  process.exit(healthy ? 0 : 1);
}

quickCheck().catch(() => process.exit(1));
```

## Manual Testing Procedures

### 1. Local Development Testing

```bash
# 1. Start backend
cd backend
npm start

# 2. Start frontend (new terminal)
npm run dev

# 3. Test signup
# - Open http://localhost:5173
# - Click "Sign Up"
# - Enter email/password
# - Verify account created

# 4. Test Google Sign-In
# - Click "Sign in with Google"
# - Complete OAuth flow
# - Verify logged in

# 5. Test Gmail connection
# - Click "Connect Gmail"
# - Complete OAuth flow
# - Verify connection saved

# 6. Test email sync
# - Click "Sync Gmail"
# - Wait for completion
# - Verify applications extracted
```

### 2. Production Testing

```bash
# 1. Check deployment status
railway status

# 2. Check logs
railway logs

# 3. Test health endpoint
curl https://your-app.railway.app/health

# 4. Test API endpoints
curl https://your-app.railway.app/api/auth/status

# 5. Manual UI testing
# - Open production URL
# - Test all critical flows
# - Check browser console for errors
```

## Monitoring and Alerts

### Health Check Endpoint

**Location**: `backend/routes/health.js`

```javascript
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      gemini: await checkGemini(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  const allHealthy = Object.values(health.checks)
    .every(c => c.status === 'ok');
  
  res.status(allHealthy ? 200 : 503).json(health);
});
```

### Automated Monitoring

```bash
# Cron job for health checks (every 5 minutes)
*/5 * * * * curl -f https://your-app.railway.app/health || echo "Health check failed"

# Log aggregation
railway logs --tail 100 > logs/$(date +%Y%m%d).log

# Alert on errors
railway logs --tail 100 | grep -i error && notify-send "Errors detected"
```

## Performance Considerations

- Health checks should complete in < 5 seconds
- Database queries should use indexes
- API tests should use test database
- Gemini tests should use cached responses when possible
- Verification scripts should run in parallel where possible

## Security Considerations

- Never log sensitive data (API keys, passwords)
- Verification scripts should not modify production data
- Health endpoint should not expose sensitive information
- Test accounts should have limited permissions
- OAuth tests should use test credentials

## Success Metrics

- All verification checks pass
- Health report shows 100% healthy
- All 397 tests pass
- API response times < 500ms
- Zero critical errors in logs
- All integrations working
