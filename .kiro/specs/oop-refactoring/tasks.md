# Implementation Plan: OOP Refactoring

## Overview

This implementation plan transforms the codebase from functional to object-oriented architecture while maintaining complete backward compatibility. The approach creates new class-based implementations alongside existing code, then gradually migrates internal usage while keeping functional exports as wrappers.

## Tasks

- [x] 1. Create DatabaseService class
  - [x] 1.1 Implement DatabaseService class with all database operations
    - Create class in `backend/database/DatabaseService.js`
    - Implement constructor with optional database path parameter
    - Implement initialize() method for schema setup
    - Implement close() method for connection cleanup
    - Implement all CRUD methods for applications
    - Implement user management methods
    - Implement email connection methods
    - Implement status history methods
    - Use promisified database methods for async/await
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 1.2 Write property test for async/await support
    - **Property 1: Async/Await Support**
    - **Validates: Requirements 1.7**
    - Generate random database operations
    - Verify all methods return Promises
    - Test with async/await syntax
  
  - [x] 1.3 Write unit tests for DatabaseService
    - Test CRUD operations with sample data
    - Test connection initialization
    - Test connection cleanup
    - Test error handling for invalid queries
    - Test transaction behavior
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Create GmailService class
  - [x] 2.1 Implement GmailService class with Gmail API operations
    - Create class in `backend/services/GmailService.js`
    - Implement constructor accepting OAuth2 client config
    - Implement setCredentials() method
    - Implement refreshCredentials() method
    - Implement fetchEmails() method
    - Implement fetchJobEmails() method
    - Implement getGmailProfile() method
    - Handle automatic token refresh
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_
  
  - [x] 2.2 Write property test for OAuth token refresh
    - **Property 2: OAuth Token Refresh**
    - **Validates: Requirements 2.5, 2.6**
    - Generate random expired credentials
    - Verify automatic refresh before API calls
  
  - [x] 2.3 Write property test for Gmail API error handling
    - **Property 3: Gmail API Error Handling**
    - **Validates: Requirements 2.7**
    - Generate random API failures
    - Verify descriptive errors are thrown
  
  - [x] 2.4 Write unit tests for GmailService
    - Test email fetching with mocked Gmail API
    - Test token refresh with expired credentials
    - Test error handling for API failures
    - Test query building for different options
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7_

- [x] 3. Create LLMParser class
  - [x] 3.1 Implement LLMParser class with Gemini integration
    - Create class in `backend/services/LLMParser.js`
    - Implement constructor accepting Gemini API key
    - Implement extractWithLLM() method
    - Implement in-memory cache with size limit
    - Implement clearCache() method
    - Implement getCacheStats() method
    - Implement response validation
    - Handle API errors gracefully
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 3.2 Write property test for LLM result caching
    - **Property 7: LLM Result Caching**
    - **Validates: Requirements 4.3**
    - Generate random email content
    - Verify repeated calls use cache
  
  - [x] 3.3 Write property test for LLM error resilience
    - **Property 8: LLM Error Resilience**
    - **Validates: Requirements 4.5**
    - Generate random API errors
    - Verify null return without exceptions
  
  - [x] 3.4 Write property test for LLM response validation
    - **Property 9: LLM Response Validation**
    - **Validates: Requirements 4.7**
    - Generate random LLM responses (valid and invalid)
    - Verify validation rejects invalid responses
  
  - [x] 3.5 Write unit tests for LLMParser
    - Test extraction with mocked Gemini API
    - Test caching behavior
    - Test response validation
    - Test error handling for API failures
    - Test behavior when API key not configured
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 4. Create EmailParser class
  - [ ] 4.1 Implement EmailParser class with parsing logic
    - Create class in `backend/services/EmailParser.js`
    - Implement constructor accepting LLMParser instance
    - Implement isJobEmail() method
    - Implement calculateConfidence() method
    - Implement parseEmail() method
    - Maintain keyword lists as private properties
    - Delegate to LLMParser for extraction
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_
  
  - [ ] 4.2 Write property test for LLM parser delegation
    - **Property 4: LLM Parser Delegation**
    - **Validates: Requirements 3.5**
    - Generate random job emails
    - Verify LLMParser is called
  
  - [ ] 4.3 Write property test for non-job email filtering
    - **Property 5: Non-Job Email Filtering**
    - **Validates: Requirements 3.6**
    - Generate random non-job emails
    - Verify null return without LLM call
  
  - [ ] 4.4 Write property test for confidence score calculation
    - **Property 6: Confidence Score Calculation**
    - **Validates: Requirements 3.7**
    - Generate random parsed applications
    - Verify scores are 0-100 and follow rules
  
  - [ ] 4.5 Write unit tests for EmailParser
    - Test job email detection with various keywords
    - Test confidence score calculation
    - Test LLM delegation
    - Test null return for non-job emails
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 3.7_

- [ ] 5. Create DuplicateDetector class
  - [ ] 5.1 Implement DuplicateDetector class with detection logic
    - Create class in `backend/services/DuplicateDetector.js`
    - Implement constructor accepting DatabaseService instance
    - Implement checkDuplicate() method
    - Implement findSimilarApplications() method
    - Implement string similarity as private method
    - Delegate database queries to DatabaseService
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [ ] 5.2 Write property test for database service delegation
    - **Property 10: Database Service Delegation**
    - **Validates: Requirements 5.5**
    - Generate random duplicate checks
    - Verify DatabaseService is called
  
  - [ ] 5.3 Write property test for duplicate result structure
    - **Property 11: Duplicate Result Structure**
    - **Validates: Requirements 5.6**
    - Generate random duplicate checks
    - Verify result has all required fields
  
  - [ ] 5.4 Write unit tests for DuplicateDetector
    - Test exact duplicate detection
    - Test similarity calculation
    - Test database delegation
    - Test result structure
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

- [ ] 6. Create AuthService class
  - [ ] 6.1 Implement AuthService class with authentication operations
    - Create class in `backend/services/AuthService.js`
    - Implement constructor accepting JWT secret and config
    - Implement hashPassword() method
    - Implement comparePassword() method
    - Implement generateToken() method
    - Implement verifyToken() method
    - Implement authMiddleware() method
    - Implement optionalAuthMiddleware() method
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_
  
  - [ ] 6.2 Write property test for JWT token expiration
    - **Property 12: JWT Token Expiration**
    - **Validates: Requirements 6.5**
    - Generate random expired tokens
    - Verify verifyToken returns null
  
  - [ ] 6.3 Write property test for password hashing round trip
    - **Property 13: Password Hashing Round Trip**
    - **Validates: Requirements 6.6**
    - Generate random passwords
    - Verify hash/compare round trip
  
  - [ ] 6.4 Write unit tests for AuthService
    - Test password hashing and comparison
    - Test JWT token generation and verification
    - Test middleware behavior
    - Test token expiration
    - _Requirements: 6.2, 6.4, 6.5, 6.6_

- [x] 7. Create FileParserService class
  - [x] 7.1 Implement FileParserService class with file parsing
    - Create class in `backend/services/FileParserService.js`
    - Implement constructor accepting parsing config
    - Implement parseCSV() method
    - Implement parseExcel() method
    - Implement validateFormat() method
    - Handle parsing errors gracefully
    - Return data in consistent format
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 7.2 Write property test for file format validation
    - **Property 14: File Format Validation**
    - **Validates: Requirements 7.3**
    - Generate random invalid files
    - Verify rejection before parsing
  
  - [x] 7.3 Write property test for file parsing error handling
    - **Property 15: File Parsing Error Handling**
    - **Validates: Requirements 7.4**
    - Generate random malformed files
    - Verify descriptive errors without crashes
  
  - [x] 7.4 Write property test for parsed data consistency
    - **Property 16: Parsed Data Consistency**
    - **Validates: Requirements 7.5**
    - Generate random valid files
    - Verify consistent Application structure
  
  - [x] 7.5 Write unit tests for FileParserService
    - Test CSV parsing with sample files
    - Test Excel parsing with sample files
    - Test format validation
    - Test error handling for malformed files
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Create ApiClient class (Frontend)
  - [ ] 8.1 Implement ApiClient class with API communication
    - Create class in `services/ApiClient.ts`
    - Implement constructor accepting base URL and token
    - Implement all API methods (applications, auth, email sync)
    - Implement setToken() method
    - Implement setBaseUrl() method
    - Implement addInterceptor() method
    - Handle authentication headers automatically
    - Provide consistent error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 8.2 Write property test for automatic authentication headers
    - **Property 17: Automatic Authentication Headers**
    - **Validates: Requirements 8.4**
    - Generate random API requests with token
    - Verify Authorization header is added
  
  - [ ] 8.3 Write property test for consistent API error handling
    - **Property 18: Consistent API Error Handling**
    - **Validates: Requirements 8.5**
    - Generate random API failures
    - Verify consistent error structure
  
  - [ ] 8.4 Write property test for request/response interceptors
    - **Property 19: Request/Response Interceptors**
    - **Validates: Requirements 8.6**
    - Generate random requests with interceptors
    - Verify interceptors are called
  
  - [ ] 8.5 Write unit tests for ApiClient
    - Test request building with authentication
    - Test error handling for failed requests
    - Test interceptor execution
    - Test response parsing
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [ ] 9. Create dependency injection container
  - Create `backend/services/container.js`
  - Instantiate all service classes with dependencies
  - Export singleton instances for use in routes
  - Document dependency graph
  - _Requirements: 9.1, 9.3_

- [ ] 10. Add backward compatible functional exports
  - [ ] 10.1 Update database/db.js with functional wrappers
    - Keep existing functional exports
    - Delegate to DatabaseService instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.2 Update services/gmailService.js with functional wrappers
    - Keep existing functional exports
    - Delegate to GmailService instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.3 Update services/emailParser.js with functional wrappers
    - Keep existing functional exports
    - Delegate to EmailParser instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.4 Update services/llmParser.js with functional wrappers
    - Keep existing functional exports
    - Delegate to LLMParser instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.5 Update services/duplicateDetector.js with functional wrappers
    - Keep existing functional exports
    - Delegate to DuplicateDetector instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.6 Update utils/auth.js with functional wrappers
    - Keep existing functional exports
    - Delegate to AuthService instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.7 Update services/api.ts with functional wrappers
    - Keep existing functional exports
    - Delegate to ApiClient instance
    - Ensure all existing functions work unchanged
    - _Requirements: 10.1, 10.6_
  
  - [ ] 10.8 Write property test for backward compatible functional exports
    - **Property 20: Backward Compatible Functional Exports**
    - **Validates: Requirements 10.1, 10.6**
    - Generate random function calls
    - Verify delegation to class methods

- [ ] 11. Checkpoint - Ensure all existing tests pass
  - Run all existing unit tests
  - Run all existing integration tests
  - Verify no breaking changes
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 10.3_

- [x] 12. Migrate routes to use class instances
  - Update application routes to use DatabaseService
  - Update auth routes to use AuthService
  - Update email routes to use GmailService, EmailParser
  - Update sync logic to use all services
  - Keep functional exports for external use
  - _Requirements: 9.1, 9.2_

- [x] 13. Write property test for API endpoint compatibility
  - **Property 21: API Endpoint Compatibility**
  - **Validates: Requirements 10.2**
  - Generate random API requests
  - Verify responses match original format

- [x] 14. Write property tests for error handling
  - [x] 14.1 Write property test for descriptive error context
    - **Property 22: Descriptive Error Context**
    - **Validates: Requirements 11.2**
    - Generate random error scenarios
    - Verify errors include context
  
  - [x] 14.2 Write property test for comprehensive error handling
    - **Property 23: Comprehensive Error Handling**
    - **Validates: Requirements 11.3, 11.4, 11.5**
    - Generate random errors in all services
    - Verify logging, graceful handling, recovery

- [x] 15. Write property test for Liskov Substitution Principle
  - **Property 24: Liskov Substitution Principle**
  - **Validates: Requirements 14.3**
  - Generate random derived class instances
  - Verify substitutability for base classes

- [ ] 16. Write integration tests
  - Test full email sync flow with class-based services
  - Test authentication flow with class-based services
  - Test backward compatibility with functional exports
  - Verify all services work together correctly
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 17. Add TypeScript interfaces and JSDoc comments
  - Define TypeScript interfaces for all service classes
  - Add JSDoc comments to all classes and methods
  - Document constructor parameters
  - Document method parameters and return values
  - Provide usage examples
  - _Requirements: 12.1, 12.2, 15.1, 15.2, 15.3, 15.4_

- [ ] 18. Create custom error classes
  - Define DatabaseError class
  - Define GmailAPIError class
  - Define ParsingError class
  - Define AuthenticationError class
  - Update services to use custom errors
  - _Requirements: 11.1_

- [x] 19. Update documentation
  - Document OOP architecture in README
  - Create migration guide for developers
  - Document dependency injection pattern
  - Document backward compatibility approach
  - Add class usage examples
  - _Requirements: 15.4, 15.5_

- [x] 20. Final checkpoint - Verify feature completeness
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Verify all existing tests pass
  - Verify API endpoints unchanged
  - Verify database schema unchanged
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 10.2, 10.3, 10.4_

## Notes

- Each property test should run minimum 100 iterations
- Maintain backward compatibility throughout implementation
- All existing tests must pass without modification
- Use dependency injection for all service dependencies
- Document all classes with JSDoc comments
