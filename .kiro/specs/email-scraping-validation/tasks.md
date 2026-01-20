# Implementation Plan: Email Scraping Validation

## Overview

This implementation plan creates a comprehensive testing and validation framework for the JobFetch/CareerPulse email scraping functionality. The approach follows a layered testing strategy: test infrastructure setup, unit tests, property-based tests, integration tests, and end-to-end tests. Each layer builds upon the previous to ensure thorough validation coverage.

## Tasks

- [-] 1. Set up test infrastructure and dependencies
  - Install testing dependencies: vitest, fast-check, supertest (remove nock - using real API)
  - Create test directory structure: unit/, properties/, integration/, e2e/, fixtures/, helpers/
  - Configure vitest.config.js for backend tests
  - Set up test database configuration (use real SQLite DB)
  - Verify backend/.env has real OAuth credentials for r.w.chen88@gmail.com
  - Create test script to validate Gmail connection works with real API
  - Git commit: "feat: set up test infrastructure for email scraping validation"
  - _Requirements: 10.4, 10.5, 10.7_

- [~] 2. Create test data generators and helpers
  - [~] 2.1 Implement email generators in helpers/generators.js
    - Write generateJobEmail() with configurable status, format, and fields
    - Write generateNonJobEmail() for negative test cases
    - Write generateEdgeCaseEmail() for edge cases (empty, malformed, special chars)
    - Write generateApplication() for application records
    - _Requirements: 10.1, 10.2, 10.3, 10.6_
  
  - [~] 2.2 Create mock Gmail API helper in helpers/mockGmailAPI.js
    - Implement MockGmailAPI class with setMessages(), setError(), simulateRateLimit()
    - Add getCallHistory() for verifying API calls
    - Add reset() method for test cleanup
    - _Requirements: 2.1, 2.6_
  
  - [~] 2.3 Create test database manager in helpers/testSetup.js
    - Implement TestDatabaseManager class with initialize(), seed(), clean()
    - Add getConnection() and teardown() methods
    - Configure in-memory SQLite for unit tests
    - _Requirements: 10.4_
  
  - [~] 2.4 Create OAuth test helper in helpers/oauthHelper.js
    - Implement OAuthTestHelper class with generateMockTokens()
    - Add simulateTokenRefresh() and simulateCallback() methods
    - Add getMockAuthUrl() for testing auth flow
    - _Requirements: 1.1, 1.2_
  
  - [~] 2.5 Create assertion helpers in helpers/assertions.js
    - Write assertValidApplication() to validate application structure
    - Write assertConfidenceScore() to verify score calculation
    - Write assertValidDateFormat() for YYYY-MM-DD validation
    - Write assertValidStatus() for enum validation
    - Git commit: "feat: add test helpers and generators"
    - _Requirements: 5.1, 5.2_

- [~] 3. Create test fixtures
  - [~] 3.1 Create sample email fixtures in fixtures/sampleEmails.json
    - Add 10+ application confirmation emails
    - Add 10+ interview invitation emails
    - Add 10+ offer emails
    - Add 10+ rejection emails
    - Include emails from direct companies, job boards, and recruiters
    - _Requirements: 10.1, 10.6_
  
  - [~] 3.2 Create edge case fixtures in fixtures/edgeCaseEmails.json
    - Add emails with missing fields (no company, no role, no location)
    - Add malformed emails (invalid encoding, corrupted data)
    - Add emails with special characters (unicode, symbols, accents)
    - Add empty emails and non-job emails
    - Git commit: "feat: add test fixtures for email parsing"
    - _Requirements: 10.3_

- [~] 4. Implement unit tests for email parser
  - [~] 4.1 Create unit/emailParser.test.js
    - Write tests for isJobEmail() with various keyword combinations
    - Write tests for detectStatus() for each status type
    - Write tests for extractCompany() with domain, subject, and body patterns
    - Write tests for extractJobTitle() with subject and body patterns
    - Write tests for extractLocation() with various formats
    - Write tests for calculateConfidence() with different field combinations
    - Write tests for parseEmail() with sample fixtures
    - Test HTML stripping and entity decoding
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [ ] 5. Implement property-based tests for email parsing
  - [ ] 5.1 Create properties/parsingProperties.test.js
    - **Property 1: Job Email Classification** - For any email with job keywords, parser should not return null
    - **Validates: Requirements 3.1**
  
  - [ ] 5.2 Write property test for status detection priority
    - **Property 2: Status Detection Priority** - For any email with multiple status keywords, highest priority should win
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  
  - [ ] 5.3 Write property test for company extraction strategy
    - **Property 3: Company Extraction Strategy Order** - For any email, extraction should try domain → subject → body
    - **Validates: Requirements 3.6, 3.7**
  
  - [ ] 5.4 Write property test for job title extraction
    - **Property 4: Job Title Extraction Priority** - For any email, subject patterns should be tried before body patterns
    - **Validates: Requirements 3.8**
  
  - [ ] 5.5 Write property test for confidence score calculation
    - **Property 5: Confidence Score Calculation** - For any parsed application, score should equal sum of field scores
    - **Validates: Requirements 3.10**
  
  - [ ] 5.6 Write property test for non-job email rejection
    - **Property 6: Non-Job Email Rejection** - For any email without job keywords, parser should return null
    - **Validates: Requirements 3.11**
  
  - [ ] 5.7 Write property test for HTML content handling
    - **Property 7: HTML Content Handling** - For any HTML email, tags should be stripped before parsing
    - **Validates: Requirements 3.12**
  
  - [ ] 5.8 Write property test for special character preservation
    - **Property 12: Special Character Preservation** - For any email with special characters, they should be preserved
    - **Validates: Requirements 5.7**

- [ ] 6. Implement unit tests for data quality validation
  - [ ] 6.1 Create unit/dataValidation.test.js
    - Write tests for date formatting (YYYY-MM-DD)
    - Write tests for status enum validation
    - Write tests for fallback value assignment
    - Write tests for emailId inclusion
    - Test field truncation prevention
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 7. Implement property-based tests for data quality
  - [ ] 7.1 Create properties/dataQualityProperties.test.js
    - **Property 8: Date Format Consistency** - For any parsed application, dateApplied should match YYYY-MM-DD
    - **Validates: Requirements 5.1**
  
  - [ ] 7.2 Write property test for status enum validation
    - **Property 9: Status Enum Validation** - For any parsed application, status should be valid enum value
    - **Validates: Requirements 5.2**
  
  - [ ] 7.3 Write property test for fallback values
    - **Property 10: Fallback Value Assignment** - For any email with extraction failures, fallbacks should be used
    - **Validates: Requirements 5.3, 5.4, 5.5**
  
  - [ ] 7.4 Write property test for email traceability
    - **Property 11: Email Traceability** - For any saved application, emailId should contain original message ID
    - **Validates: Requirements 5.6**

- [ ] 8. Implement unit tests for duplicate detection
  - [ ] 8.1 Create unit/duplicateDetector.test.js
    - Write tests for exact match detection
    - Write tests for non-duplicate detection
    - Write tests with various field combinations
    - Test with same company/role but different dates
    - Test with similar but different companies/roles
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Implement property-based tests for duplicate detection
  - [ ] 9.1 Create properties/duplicateProperties.test.js
    - **Property 13: Duplicate Detection Correctness** - For any application, duplicate should be detected iff exact match exists
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ] 9.2 Write property test for duplicate skipping
    - **Property 14: Duplicate Skipping During Sync** - For any sync with duplicates, they should be skipped and counted
    - **Validates: Requirements 4.4**

- [ ] 10. Implement unit tests for Gmail service
  - [ ] 10.1 Create unit/gmailService.test.js
    - Write tests for fetchEmails() with various query parameters
    - Write tests for fetchJobEmails() with default query
    - Write tests for getGmailProfile()
    - Test date range filter application
    - Test maxResults parameter
    - Test empty inbox scenario
    - Test error handling (rate limits, network failures)
    - Mock Gmail API responses using nock
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 11. Implement property-based tests for Gmail service
  - [ ] 11.1 Create properties/gmailProperties.test.js
    - **Property 19: Date Range Filter Application** - For any afterDate parameter, filter should be included in query
    - **Validates: Requirements 2.2**
  
  - [ ] 11.2 Write property test for result limit enforcement
    - **Property 20: Result Limit Enforcement** - For any maxResults parameter, at most that many emails should be returned
    - **Validates: Requirements 2.3**
  
  - [ ] 11.3 Write property test for full message fetching
    - **Property 21: Full Message Detail Fetching** - For any message IDs, full details should be fetched for each
    - **Validates: Requirements 2.4**
  
  - [ ] 11.4 Write property test for error context propagation
    - **Property 22: Error Context Propagation** - For any Gmail API error, it should be wrapped with context
    - **Validates: Requirements 2.7**

- [ ] 12. Checkpoint - Ensure all unit and property tests pass
  - Run all tests: npm test
  - Verify coverage meets goals (90%+ statements)
  - Fix any failing tests
  - Git commit: "test: complete unit and property tests for email parsing"
  - Git push to remote
  - Ask the user if questions arise

- [ ] 13. Implement unit tests for OAuth handling
  - [ ] 13.1 Create unit/oauthHandler.test.js
    - Write tests for authorization URL generation
    - Write tests for token exchange
    - Write tests for token storage
    - Write tests for automatic token refresh
    - Write tests for failed refresh handling
    - Write tests for multi-user token isolation
    - Use real OAuth flow where possible, mock only for error scenarios
    - Git commit: "test: add OAuth handling tests"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 14. Implement property-based tests for OAuth
  - [ ] 14.1 Create properties/oauthProperties.test.js
    - **Property 15: Token Storage Completeness** - For any successful token exchange, all three values should be stored
    - **Validates: Requirements 1.3**
  
  - [ ] 14.2 Write property test for automatic token refresh
    - **Property 16: Automatic Token Refresh** - For any expired token with valid refresh token, new token should be obtained
    - **Validates: Requirements 1.4**
  
  - [ ] 14.3 Write property test for failed refresh handling
    - **Property 17: Failed Refresh Handling** - For any refresh failure, connection should be disconnected
    - **Validates: Requirements 1.5**
  
  - [ ] 14.4 Write property test for user token isolation
    - **Property 18: User Token Isolation** - For any set of users, tokens should be stored independently
    - **Validates: Requirements 1.6**

- [ ] 15. Implement integration tests for API endpoints
  - [ ] 15.1 Create integration/emailRoutes.test.js
    - Write tests for POST /api/email/sync with valid auth (REAL Gmail API calls)
    - Write tests for GET /api/email/profile with valid auth (REAL Gmail API)
    - Write tests for GET /api/email/status with valid auth
    - Test authentication enforcement (401 for missing auth)
    - Test Gmail connection requirement (401 for no connection)
    - Use supertest for HTTP testing
    - Use test database with real schema
    - Git commit: "test: add integration tests for email routes"
    - _Requirements: 9.1, 9.2, 9.3, 6.5, 6.6_
  
  - [ ] 15.2 Create integration/authRoutes.test.js
    - Write tests for GET /api/auth/gmail with valid auth
    - Write tests for GET /api/auth/gmail/callback with valid code
    - Write tests for GET /api/auth/status with valid auth
    - Write tests for POST /api/auth/disconnect with valid auth
    - Test authentication enforcement
    - Git commit: "test: add integration tests for auth routes"
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 16. Implement property-based tests for integration
  - [ ] 16.1 Create properties/integrationProperties.test.js
    - **Property 23: Sync Workflow Completeness** - For any sync request, all steps should execute in sequence
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ] 16.2 Write property test for error isolation
    - **Property 24: Error Isolation During Sync** - For any sync with errors, processing should continue
    - **Validates: Requirements 6.3, 7.3, 7.4**
  
  - [ ] 16.3 Write property test for sync result availability
    - **Property 25: Sync Result Availability** - For any successful sync, applications should be queryable
    - **Validates: Requirements 6.4**
  
  - [ ] 16.4 Write property test for authentication enforcement
    - **Property 26: Authentication Enforcement** - For any protected endpoint, unauthenticated requests should return 401
    - **Validates: Requirements 6.5, 9.8**
  
  - [ ] 16.5 Write property test for Gmail connection requirement
    - **Property 27: Gmail Connection Requirement** - For any email endpoint without connection, should return 401
    - **Validates: Requirements 6.6**

- [ ] 17. Implement property-based tests for API endpoints
  - [ ] 17.1 Create properties/apiProperties.test.js
    - **Property 28: Email Sync Endpoint Behavior** - For any valid sync request, response should contain all statistics
    - **Validates: Requirements 9.1**
  
  - [ ] 17.2 Write property test for profile endpoint
    - **Property 29: Profile Endpoint Response** - For any valid profile request, should return email and counts
    - **Validates: Requirements 9.2**
  
  - [ ] 17.3 Write property test for status endpoint
    - **Property 30: Status Endpoint Response** - For any valid status request, should return connection status
    - **Validates: Requirements 9.3**
  
  - [ ] 17.4 Write property test for OAuth URL generation
    - **Property 31: OAuth URL Generation** - For any valid request, should return valid OAuth URL
    - **Validates: Requirements 9.4**
  
  - [ ] 17.5 Write property test for OAuth callback
    - **Property 32: OAuth Callback Token Exchange** - For any valid code, should exchange and save tokens
    - **Validates: Requirements 9.5**
  
  - [ ] 17.6 Write property test for connection status endpoint
    - **Property 33: Connection Status Endpoint** - For any valid request, should return connection info
    - **Validates: Requirements 9.6**
  
  - [ ] 17.7 Write property test for disconnect endpoint
    - **Property 34: Disconnect Endpoint Behavior** - For any valid disconnect request, should mark as disconnected
    - **Validates: Requirements 9.7**

- [ ] 18. Implement property-based tests for error handling
  - [ ] 18.1 Create properties/errorProperties.test.js
    - **Property 35: Token Refresh Failure Recovery** - For any refresh failure, should disconnect and clear tokens
    - **Validates: Requirements 7.1**
  
  - [ ] 18.2 Write property test for Gmail API error wrapping
    - **Property 36: Gmail API Error Wrapping** - For any Gmail API error, should wrap with context
    - **Validates: Requirements 7.2**
  
  - [x] 18.3 Write property test for concurrent request isolation
    - **Property 37: Concurrent Request Isolation** - For any concurrent requests, should process independently
    - **Validates: Requirements 7.5**
  
  - [ ] 18.4 Write property test for malformed content handling
    - **Property 38: Malformed Content Handling** - For any malformed email, should handle gracefully
    - **Validates: Requirements 7.6**

- [ ] 19. Implement end-to-end tests
  - [x] 19.1 Create e2e/emailSync.test.js
    - Write full workflow test: OAuth → Fetch → Parse → Save → Display (REAL Gmail API)
    - Test with REAL emails from r.w.chen88@gmail.com inbox
    - Test with multiple email formats (plain text, HTML, multipart) from real inbox
    - Test with different email providers (direct companies, job boards) from real inbox
    - Test incremental sync (sync twice, verify no duplicates)
    - Test with existing applications in database
    - Validate ACTUAL data extraction quality from real emails
    - Git commit: "test: add end-to-end email sync tests"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.7, 10.8_

- [x] 20. Implement performance benchmarks
  - [ ] 20.1 Create performance/emailScraping.bench.js
    - Benchmark email parsing speed (target: < 100ms per email) with REAL emails
    - Benchmark duplicate detection speed (target: < 50ms per check)
    - Benchmark database write speed (target: < 100ms per write)
    - Benchmark full sync with 100 emails (target: < 30 seconds) using REAL Gmail API
    - Benchmark API response time (target: < 35 seconds for 100 emails)
    - Use vitest benchmark utilities
    - Git commit: "test: add performance benchmarks"
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 21. Create test documentation and scripts
  - [ ] 21.1 Update package.json with test scripts
    - Add "test": "vitest run"
    - Add "test:unit": "vitest run unit/"
    - Add "test:properties": "vitest run properties/"
    - Add "test:integration": "vitest run integration/"
    - Add "test:e2e": "vitest run e2e/"
    - Add "test:coverage": "vitest run --coverage"
    - Add "test:performance": "vitest bench"
    - Add "test:watch": "vitest watch"
    - Git commit: "chore: add test scripts to package.json"
  
  - [ ] 21.2 Create test documentation in backend/tests/README.md
    - Document test structure and organization
    - Document how to run tests
    - Document test data generators
    - Document real Gmail API testing approach
    - Document coverage goals
    - Include examples of adding new tests
    - Git commit: "docs: add test documentation"

- [ ] 22. Final checkpoint - Run full test suite
  - Run all tests: npm test
  - Run with coverage: npm run test:coverage
  - Verify coverage meets goals (90%+ statements, 85%+ branches)
  - Run performance benchmarks: npm run test:performance
  - Verify all 38 properties are tested
  - Generate test report
  - Git commit: "test: complete email scraping validation test suite"
  - Git push to remote
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive validation coverage
- Each property test should run minimum 100 iterations
- Property tests use fast-check library for randomized input generation
- Unit tests focus on specific examples and edge cases
- Integration tests use REAL Gmail API with r.w.chen88@gmail.com account
- E2E tests validate complete workflows with REAL email data
- Performance benchmarks measure actual Gmail API performance
- All tests should clean up after themselves (database, etc.)
- Git commits are made after each major milestone
- Git pushes occur at checkpoints to save progress remotely
- Tests use REAL OAuth credentials from backend/.env
- Mock only for specific error simulation scenarios (rate limits, network failures)
