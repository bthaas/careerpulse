# Requirements Document: OOP Refactoring

## Introduction

This feature refactors the JobFetch/CareerPulse codebase from a functional programming style to an Object-Oriented Programming (OOP) architecture using classes. The refactoring aims to improve code maintainability, testability, and extensibility while maintaining all existing functionality without breaking changes.

## Glossary

- **Service_Class**: A class that encapsulates related functionality and state
- **Dependency_Injection**: A design pattern where dependencies are provided to a class rather than created internally
- **Encapsulation**: The bundling of data and methods that operate on that data within a class
- **Interface**: A TypeScript/JavaScript contract that defines the structure of a class
- **SOLID_Principles**: Five design principles for object-oriented programming (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **Backward_Compatibility**: The ability for new code to work with existing code without modifications
- **Functional_Module**: The current implementation style using exported functions
- **Class_Instance**: An object created from a class definition

## Requirements

### Requirement 1: Database Service Class

**User Story:** As a developer, I want database operations encapsulated in a class, so that I can manage database connections and transactions more effectively.

#### Acceptance Criteria

1. THE System SHALL create a DatabaseService class that encapsulates all database operations
2. THE DatabaseService SHALL provide methods for all existing database functions (getAllApplications, createApplication, updateApplication, deleteApplication, etc.)
3. THE DatabaseService SHALL manage the database connection as private state
4. THE DatabaseService SHALL provide a method to initialize the database schema
5. THE DatabaseService SHALL provide a method to close the database connection
6. WHEN the DatabaseService is instantiated, THE System SHALL initialize the database connection
7. THE DatabaseService SHALL use promisified database methods for async/await support

### Requirement 2: Gmail Service Class

**User Story:** As a developer, I want Gmail API operations encapsulated in a class, so that I can manage OAuth credentials and API calls more effectively.

#### Acceptance Criteria

1. THE System SHALL create a GmailService class that encapsulates all Gmail API operations
2. THE GmailService SHALL accept OAuth credentials through dependency injection
3. THE GmailService SHALL provide methods for fetchEmails, fetchJobEmails, and getGmailProfile
4. THE GmailService SHALL manage the Gmail API client as private state
5. THE GmailService SHALL handle OAuth token refresh automatically
6. WHEN OAuth credentials expire, THE GmailService SHALL refresh them using the refresh token
7. THE GmailService SHALL throw descriptive errors when Gmail API calls fail

### Requirement 3: Email Parser Service Class

**User Story:** As a developer, I want email parsing logic encapsulated in a class, so that I can manage parsing strategies and dependencies more effectively.

#### Acceptance Criteria

1. THE System SHALL create an EmailParser class that encapsulates email parsing logic
2. THE EmailParser SHALL accept an LLMParser instance through dependency injection
3. THE EmailParser SHALL provide methods for isJobEmail, calculateConfidence, and parseEmail
4. THE EmailParser SHALL maintain keyword lists as private class properties
5. THE EmailParser SHALL use the injected LLMParser for LLM-based extraction
6. THE EmailParser SHALL return null for non-job emails
7. THE EmailParser SHALL calculate confidence scores based on extraction quality

### Requirement 4: LLM Parser Service Class

**User Story:** As a developer, I want LLM operations encapsulated in a class, so that I can manage API clients and caching more effectively.

#### Acceptance Criteria

1. THE System SHALL create an LLMParser class that encapsulates LLM extraction logic
2. THE LLMParser SHALL manage the Gemini API client as private state
3. THE LLMParser SHALL implement an in-memory cache for LLM results
4. THE LLMParser SHALL provide methods for extractWithLLM, clearCache, and getCacheStats
5. THE LLMParser SHALL handle Gemini API errors gracefully
6. WHEN the Gemini API key is not configured, THE LLMParser SHALL return null without throwing errors
7. THE LLMParser SHALL validate LLM responses before returning them

### Requirement 5: Duplicate Detector Service Class

**User Story:** As a developer, I want duplicate detection logic encapsulated in a class, so that I can manage detection strategies and database queries more effectively.

#### Acceptance Criteria

1. THE System SHALL create a DuplicateDetector class that encapsulates duplicate detection logic
2. THE DuplicateDetector SHALL accept a DatabaseService instance through dependency injection
3. THE DuplicateDetector SHALL provide methods for checkDuplicate and findSimilarApplications
4. THE DuplicateDetector SHALL implement string similarity comparison as a private method
5. THE DuplicateDetector SHALL use the injected DatabaseService for database queries
6. THE DuplicateDetector SHALL return duplicate information including similarity score and reason

### Requirement 6: Auth Service Class

**User Story:** As a developer, I want authentication operations encapsulated in a class, so that I can manage JWT tokens and password hashing more effectively.

#### Acceptance Criteria

1. THE System SHALL create an AuthService class that encapsulates authentication operations
2. THE AuthService SHALL provide methods for hashPassword, comparePassword, generateToken, and verifyToken
3. THE AuthService SHALL manage JWT secret and configuration as private state
4. THE AuthService SHALL provide middleware methods for authMiddleware and optionalAuthMiddleware
5. THE AuthService SHALL handle token expiration and validation
6. THE AuthService SHALL use bcrypt for password hashing with configurable salt rounds

### Requirement 7: File Parser Service Class

**User Story:** As a developer, I want CSV/Excel parsing logic encapsulated in a class, so that I can manage file parsing strategies more effectively.

#### Acceptance Criteria

1. THE System SHALL create a FileParserService class that encapsulates file parsing logic
2. THE FileParserService SHALL provide methods for parsing CSV and Excel files
3. THE FileParserService SHALL validate file formats before parsing
4. THE FileParserService SHALL handle parsing errors gracefully
5. THE FileParserService SHALL return parsed data in a consistent format

### Requirement 8: Frontend API Client Class

**User Story:** As a developer, I want API calls encapsulated in a class, so that I can manage HTTP requests and error handling more effectively.

#### Acceptance Criteria

1. THE System SHALL create an ApiClient class that encapsulates all API calls
2. THE ApiClient SHALL manage the base URL and authentication token as private state
3. THE ApiClient SHALL provide methods for all existing API functions
4. THE ApiClient SHALL handle authentication headers automatically
5. THE ApiClient SHALL provide consistent error handling for all API calls
6. THE ApiClient SHALL support request/response interceptors for logging and debugging

### Requirement 9: Dependency Injection

**User Story:** As a developer, I want classes to receive dependencies through injection, so that I can easily test and swap implementations.

#### Acceptance Criteria

1. WHEN a Service_Class requires another service, THE System SHALL accept it through the constructor
2. THE System SHALL NOT create service dependencies internally within classes
3. THE System SHALL provide factory functions or dependency injection containers for creating service instances
4. THE System SHALL document required dependencies in class constructors
5. THE System SHALL use interfaces to define dependency contracts where appropriate

### Requirement 10: Backward Compatibility

**User Story:** As a developer, I want the refactored code to maintain backward compatibility, so that existing code continues to work without modifications.

#### Acceptance Criteria

1. THE System SHALL maintain all existing exported functions as wrappers around class methods
2. THE System SHALL ensure all existing API endpoints continue to work unchanged
3. THE System SHALL ensure all existing tests pass without modification
4. THE System SHALL ensure the database schema remains unchanged
5. THE System SHALL ensure deployment processes work without changes
6. WHEN existing code calls a functional export, THE System SHALL delegate to the appropriate class method

### Requirement 11: Error Handling

**User Story:** As a developer, I want consistent error handling across all classes, so that I can debug issues more effectively.

#### Acceptance Criteria

1. THE System SHALL define custom error classes for different error types
2. THE System SHALL throw descriptive errors with context information
3. THE System SHALL log errors with appropriate severity levels
4. THE System SHALL handle errors gracefully without crashing the application
5. THE System SHALL provide error recovery mechanisms where appropriate

### Requirement 12: Type Safety

**User Story:** As a developer, I want TypeScript interfaces for all classes, so that I can catch type errors at compile time.

#### Acceptance Criteria

1. THE System SHALL define TypeScript interfaces for all service classes
2. THE System SHALL use TypeScript types for all method parameters and return values
3. THE System SHALL use TypeScript generics where appropriate for reusable code
4. THE System SHALL enable strict TypeScript checking for all class files
5. THE System SHALL document type definitions in JSDoc comments for JavaScript files

### Requirement 13: Testing Support

**User Story:** As a developer, I want classes designed for testability, so that I can write comprehensive unit tests.

#### Acceptance Criteria

1. THE System SHALL design classes with single responsibilities for easier testing
2. THE System SHALL use dependency injection to allow mock dependencies in tests
3. THE System SHALL provide factory methods for creating test instances
4. THE System SHALL separate business logic from I/O operations for easier mocking
5. THE System SHALL ensure all class methods are testable in isolation

### Requirement 14: SOLID Principles Compliance

**User Story:** As a developer, I want the codebase to follow SOLID principles, so that it's easier to maintain and extend.

#### Acceptance Criteria

1. THE System SHALL ensure each class has a single, well-defined responsibility (Single Responsibility Principle)
2. THE System SHALL design classes to be open for extension but closed for modification (Open/Closed Principle)
3. THE System SHALL ensure derived classes can substitute base classes without breaking functionality (Liskov Substitution Principle)
4. THE System SHALL create focused interfaces rather than large, general-purpose ones (Interface Segregation Principle)
5. THE System SHALL depend on abstractions rather than concrete implementations (Dependency Inversion Principle)

### Requirement 15: Documentation

**User Story:** As a developer, I want comprehensive documentation for all classes, so that I can understand how to use them.

#### Acceptance Criteria

1. THE System SHALL provide JSDoc comments for all classes and methods
2. THE System SHALL document constructor parameters and their purposes
3. THE System SHALL document method parameters, return values, and exceptions
4. THE System SHALL provide usage examples in documentation
5. THE System SHALL document design decisions and architectural patterns
