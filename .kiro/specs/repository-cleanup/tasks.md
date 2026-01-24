# Implementation Plan: Repository Cleanup and Documentation Organization

## Overview

This implementation plan breaks down the repository cleanup feature into discrete coding tasks. The approach follows a bottom-up strategy: build core utilities first, then compose them into the complete cleanup workflow. Each task builds on previous work and includes testing to validate correctness early.

## Tasks

- [x] 1. Set up project structure and testing framework
  - Create `scripts/cleanup/` directory for cleanup scripts
  - Install fast-check library for property-based testing: `npm install --save-dev fast-check @types/fast-check`
  - Create test directory: `scripts/cleanup/__tests__/`
  - Configure test runner to include cleanup tests
  - _Requirements: All (foundation for implementation)_

- [x] 2. Implement GitHistoryAnalyzer
  - [x] 2.1 Create GitHistoryAnalyzer class with git command execution
    - Implement `getFileCreationDate(filePath: string): Date | null` using `git log --follow --format=%aI --reverse -- <filepath>`
    - Parse ISO 8601 timestamps from git output
    - Handle files with no git history by returning null
    - Handle git command errors gracefully
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Write property test for git history extraction
    - **Property 1: Git history extraction completeness**
    - **Validates: Requirements 1.1, 1.2**
  
  - [x] 2.3 Implement getAllMarkdownFileHistory method
    - Find all .md files in repository (excluding node_modules, .git)
    - Call getFileCreationDate for each file
    - Assign current timestamp to files with null history
    - Exclude README.md from the list
    - Return Map<string, Date> of file paths to creation dates
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  
  - [x] 2.4 Implement sortFilesByCreationOrder method
    - Sort files by creation date (earliest first)
    - For files with same date, maintain alphabetical order (stable sort)
    - Return sorted array of file paths
    - _Requirements: 1.3_
  
  - [x] 2.5 Write property test for alphabetical ordering
    - **Property 2: Alphabetical ordering for same-date files**
    - **Validates: Requirements 1.3**
  
  - [x] 2.6 Write unit tests for GitHistoryAnalyzer
    - Test git command parsing with various date formats
    - Test handling of files with no git history
    - Test README.md exclusion
    - Test error handling for git command failures

- [-] 3. Implement DocumentationOrganizer
  - [x] 3.1 Create DocumentationOrganizer class
    - Implement `generateNumberedFilename(originalName: string, position: number): string`
    - Format as `{position}-{originalName}`
    - Implement `ensureDocsDirectory(): void` to create docs/ if needed
    - _Requirements: 2.1, 2.2, 2.3, 3.1_
  
  - [x] 3.2 Write property tests for numbering
    - **Property 3: Sequential numbering**
    - **Property 4: Prefix format consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [ ] 3.3 Implement moveToDocsFolder method
    - Read original file content
    - Create numbered filename
    - Move file to docs/ folder with new name
    - Verify content preservation
    - Handle file move errors
    - _Requirements: 3.2, 3.3_
  
  - [ ] 3.4 Write property test for content preservation
    - **Property 5: File content preservation during moves**
    - **Validates: Requirements 3.3, 5.4**
  
  - [ ] 3.5 Implement relative path reference updating
    - Scan moved file content for relative path patterns (../, ./)
    - Update paths to remain valid from docs/ location
    - Write updated content to file
    - _Requirements: 3.4_
  
  - [ ] 3.6 Write property test for path updates
    - **Property 7: Relative path updates**
    - **Validates: Requirements 3.4**
  
  - [ ] 3.7 Implement organizeAllDocumentation method
    - Take sorted list of files
    - Generate numbered names for each
    - Move each file to docs/ folder
    - Return Map<string, string> of original → new paths
    - _Requirements: 2.1, 2.2, 2.3, 3.2_
  
  - [ ] 3.8 Write property test for docs/ organization
    - **Property 6: Documentation files moved to docs/**
    - **Validates: Requirements 3.2**
  
  - [ ] 3.9 Write unit tests for DocumentationOrganizer
    - Test numbered filename generation with edge cases
    - Test directory creation when docs/ exists and doesn't exist
    - Test file move error handling

- [ ] 4. Checkpoint - Ensure documentation organization works
  - Run tests for GitHistoryAnalyzer and DocumentationOrganizer
  - Manually test on a small test repository
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Implement FileNecessityAnalyzer
  - [ ] 5.1 Create FileNecessityAnalyzer class with essential file patterns
    - Define essential file patterns: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `package.json`, `tsconfig.json`, `*.config.*`, `.env*`, `.gitignore`, `.vercelignore`, `README.md`
    - Implement `isEssentialFile(filePath: string): boolean` using pattern matching
    - _Requirements: 4.3, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 5.2 Write property test for essential file detection
    - **Property 8: Essential files never moved**
    - **Validates: Requirements 4.5, 6.1, 6.2, 6.3, 6.4, 6.5**
  
  - [ ] 5.3 Implement isFileReferenced method
    - Search all files in repository for references to target file
    - Check for import statements, require statements, file path mentions
    - Use grep or text search across repository
    - Return true if any references found
    - _Requirements: 4.1_
  
  - [ ] 5.4 Write property test for reference detection
    - **Property 9: Reference detection**
    - **Validates: Requirements 4.1**
  
  - [ ] 5.5 Implement hasUniqueContent method
    - Compare file content with other files
    - Check for exact duplicates
    - Check for substantial content overlap (>80% similar)
    - Return true if content is unique
    - _Requirements: 4.2_
  
  - [ ] 5.6 Implement isUnnecessary method
    - Check all three criteria: not referenced, not essential, not unique
    - Return true only if all criteria met (conservative approach)
    - _Requirements: 4.4, 5.5_
  
  - [ ] 5.7 Write property test for unnecessary file criteria
    - **Property 10: Unnecessary file criteria**
    - **Validates: Requirements 4.4**
  
  - [ ] 5.8 Implement findUnnecessaryFiles method
    - Get all files in repository (excluding node_modules, .git, docs/, misc/)
    - Filter to files not already organized
    - Check each file with isUnnecessary
    - Generate justification string for each unnecessary file
    - Return Map<string, string> of file path → justification
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 5.9 Write unit tests for FileNecessityAnalyzer
    - Test essential file pattern matching with various filenames
    - Test reference detection with different reference formats
    - Test specific examples of necessary vs unnecessary files
    - Test edge cases: empty files, binary files

- [ ] 6. Implement FileMover
  - [ ] 6.1 Create FileMover class
    - Implement `ensureMiscDirectory(): void` to create misc/ if needed
    - Implement `moveToMiscFolder(filePath: string): void` to move single file
    - Preserve original filename (no renaming)
    - Verify content preservation
    - Handle file move errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 6.2 Write property test for filename preservation
    - **Property 11: Filename preservation in misc/**
    - **Validates: Requirements 5.3**
  
  - [ ] 6.3 Implement moveMultipleFiles method
    - Take array of file paths
    - Move each file to misc/ folder
    - Track success/failure for each file
    - Return Map<string, boolean> of file path → success status
    - _Requirements: 5.2_
  
  - [ ] 6.4 Write unit tests for FileMover
    - Test moving single file
    - Test moving multiple files
    - Test handling of move failures
    - Test directory creation

- [ ] 7. Implement ReportGenerator
  - [ ] 7.1 Create ReportGenerator class with data structures
    - Create arrays to store documentation moves, unnecessary files, skipped files
    - Implement `addDocumentationMove(original: string, numbered: string): void`
    - Implement `addUnnecessaryFileMove(file: string, justification: string): void`
    - Implement `addSkippedFile(file: string, reason: string): void`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 7.2 Implement generateReport method
    - Format report as markdown with sections:
      - Summary statistics
      - Documentation files organized (with original → numbered mapping)
      - Unnecessary files archived (with justifications)
      - Skipped files (with reasons)
    - Calculate statistics (total docs organized, files archived, skipped)
    - Save report to repository root as CLEANUP_REPORT.md
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 7.3 Write property tests for report completeness
    - **Property 13: Report completeness for docs/**
    - **Property 14: Report completeness for misc/**
    - **Property 15: Report includes failures**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [ ] 7.4 Write unit tests for ReportGenerator
    - Test report formatting with various data
    - Test markdown generation
    - Test statistics calculation
    - Test empty report (no files moved)

- [ ] 8. Checkpoint - Ensure all components work independently
  - Run all unit and property tests
  - Verify each component handles errors gracefully
  - Ensure all tests pass, ask the user if questions arise

- [ ] 9. Implement main cleanup orchestrator
  - [ ] 9.1 Create CleanupOrchestrator class
    - Instantiate all component classes
    - Implement main `runCleanup(): void` method that orchestrates the workflow
    - _Requirements: All_
  
  - [ ] 9.2 Implement documentation organization phase
    - Call GitHistoryAnalyzer to get sorted file list
    - Call DocumentationOrganizer to move files to docs/
    - Add each move to ReportGenerator
    - Handle errors and add to skipped files
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 9.3 Implement file cleanup phase
    - Call FileNecessityAnalyzer to find unnecessary files
    - Call FileMover to move files to misc/
    - Add each move to ReportGenerator with justification
    - Handle errors and add to skipped files
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 9.4 Implement report generation phase
    - Call ReportGenerator to create final report
    - Save report to repository root
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 9.5 Add comprehensive error handling
    - Wrap each phase in try-catch
    - Log errors with context
    - Continue to next phase even if one fails
    - Ensure report is always generated
    - _Requirements: All (error handling)_

- [ ] 10. Create command-line interface
  - [ ] 10.1 Create cleanup script entry point
    - Create `scripts/cleanup/index.ts` as main entry point
    - Parse command-line arguments (dry-run mode, verbose mode)
    - Instantiate CleanupOrchestrator
    - Call runCleanup()
    - _Requirements: All_
  
  - [ ] 10.2 Add dry-run mode
    - Implement flag to preview changes without moving files
    - Show what would be moved to docs/ and misc/
    - Generate preview report
    - _Requirements: All (safety feature)_
  
  - [ ] 10.3 Add package.json script
    - Add `"cleanup": "ts-node scripts/cleanup/index.ts"` to package.json scripts
    - Add `"cleanup:dry-run": "ts-node scripts/cleanup/index.ts --dry-run"` for preview
    - _Requirements: All_

- [ ] 11. Write integration tests
  - [ ] 11.1 Create end-to-end cleanup test
    - Create test repository with known structure
    - Run full cleanup
    - Verify all requirements met
    - **Property 12: No file deletions**
    - **Validates: Requirements 6.6**
  
  - [ ] 11.2 Create idempotency test
    - Run cleanup twice on same repository
    - Verify second run makes no changes
    - Verify report shows no files moved
  
  - [ ] 11.3 Create report accuracy test
    - Run cleanup
    - Verify report matches actual file system state
    - Check all moved files are listed
    - Check all justifications are present
  
  - [ ] 11.4 Create error recovery test
    - Introduce errors during cleanup (permissions, missing files)
    - Verify graceful handling
    - Verify errors appear in report

- [ ] 12. Final checkpoint and documentation
  - Run full test suite (unit, property, integration)
  - Test on actual repository with dry-run mode
  - Review generated report for accuracy
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations each
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript as indicated by the design document interfaces
- Dry-run mode is recommended for initial testing to preview changes safely
