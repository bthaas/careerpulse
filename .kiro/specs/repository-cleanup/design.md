# Design Document: Repository Cleanup and Documentation Organization

## Overview

This system provides automated repository cleanup and documentation organization by analyzing git history to chronologically order documentation files and identifying truly unnecessary files for archival. The design emphasizes safety and conservatism - preserving all essential files while organizing documentation and archiving only definitively unnecessary files.

The system operates in three main phases:
1. **Analysis Phase**: Extract git history and analyze file relationships
2. **Organization Phase**: Rename and move documentation files to docs/ folder
3. **Cleanup Phase**: Identify and move unnecessary files to misc/ folder

## Architecture

The system follows a pipeline architecture with three main stages:

```
Git Repository
     ↓
[Git History Analyzer] → File Creation Timeline
     ↓
[Documentation Organizer] → Numbered files in docs/
     ↓
[File Necessity Analyzer] → Unnecessary files list
     ↓
[File Mover] → Files moved to misc/
     ↓
[Report Generator] → Cleanup summary report
```

### Key Design Decisions

1. **Read-only git analysis**: Use git log commands to extract history without modifying repository state
2. **Conservative file classification**: Only mark files as unnecessary when all criteria confirm they're not needed
3. **No deletions**: All files are preserved, just reorganized into appropriate folders
4. **Atomic operations**: Each file move is independent to prevent cascading failures
5. **Detailed reporting**: Generate comprehensive report for user verification

## Components and Interfaces

### 1. GitHistoryAnalyzer

**Purpose**: Extract creation timestamps for all .md files from git history

**Interface**:
```typescript
interface GitHistoryAnalyzer {
  // Get the first commit date for a specific file
  getFileCreationDate(filePath: string): Date | null;
  
  // Get creation dates for all .md files in repository
  getAllMarkdownFileHistory(): Map<string, Date>;
  
  // Sort files by creation date, maintaining alphabetical order for ties
  sortFilesByCreationOrder(files: Map<string, Date>): string[];
}
```

**Implementation approach**:
- Execute `git log --follow --format=%aI --reverse -- <filepath>` to get first commit date
- Parse ISO 8601 timestamp from git output
- Handle files with no git history by assigning current timestamp
- Sort using stable sort algorithm to maintain alphabetical order for same-date files

### 2. DocumentationOrganizer

**Purpose**: Rename documentation files with numbered prefixes and move to docs/ folder

**Interface**:
```typescript
interface DocumentationOrganizer {
  // Generate numbered filename based on position in sorted list
  generateNumberedFilename(originalName: string, position: number): string;
  
  // Create docs/ directory if it doesn't exist
  ensureDocsDirectory(): void;
  
  // Move and rename a file to docs/ folder
  moveToDocsFolder(originalPath: string, numberedName: string): void;
  
  // Process all documentation files
  organizeAllDocumentation(sortedFiles: string[]): Map<string, string>;
}
```

**Implementation approach**:
- Format prefix as `{position}-{originalName}`
- Use filesystem operations to create directory and move files
- Return mapping of original → new paths for reporting
- Skip README.md explicitly

### 3. FileNecessityAnalyzer

**Purpose**: Determine which files are truly unnecessary and safe to archive

**Interface**:
```typescript
interface FileNecessityAnalyzer {
  // Check if a file is referenced by any other file in the repository
  isFileReferenced(filePath: string): boolean;
  
  // Check if file contains unique information not found elsewhere
  hasUniqueContent(filePath: string): boolean;
  
  // Check if file is essential to application operation
  isEssentialFile(filePath: string): boolean;
  
  // Determine if file can be safely moved to misc/
  isUnnecessary(filePath: string): boolean;
  
  // Get all unnecessary files with justification
  findUnnecessaryFiles(): Map<string, string>;
}
```

**Implementation approach**:
- Search all files for references to target file using grep/text search
- Compare file content with other files to detect duplicates
- Maintain whitelist of essential file patterns (package.json, *.ts, *.tsx, .env*, .gitignore, etc.)
- Only mark as unnecessary if: not referenced AND not unique AND not essential
- Generate justification string explaining why file is unnecessary

### 4. FileMover

**Purpose**: Safely move files to misc/ folder while preserving content

**Interface**:
```typescript
interface FileMover {
  // Create misc/ directory if it doesn't exist
  ensureMiscDirectory(): void;
  
  // Move a file to misc/ folder
  moveToMiscFolder(filePath: string): void;
  
  // Move multiple files to misc/ folder
  moveMultipleFiles(files: string[]): Map<string, boolean>;
}
```

**Implementation approach**:
- Use filesystem move operations (preserves content)
- Handle errors gracefully (log but continue with other files)
- Return success/failure status for each file
- Preserve original filename in misc/ folder

### 5. ReportGenerator

**Purpose**: Generate comprehensive cleanup summary report

**Interface**:
```typescript
interface ReportGenerator {
  // Add documentation organization entry
  addDocumentationMove(original: string, numbered: string): void;
  
  // Add unnecessary file entry with justification
  addUnnecessaryFileMove(file: string, justification: string): void;
  
  // Add skipped file entry
  addSkippedFile(file: string, reason: string): void;
  
  // Generate and save final report
  generateReport(outputPath: string): void;
}
```

**Implementation approach**:
- Accumulate all operations during execution
- Format as markdown with clear sections
- Include statistics (total files moved, organized, archived)
- Save to repository root as CLEANUP_REPORT.md

## Data Models

### FileHistoryRecord
```typescript
interface FileHistoryRecord {
  filePath: string;           // Relative path from repository root
  creationDate: Date | null;  // First commit date, null if no history
  exists: boolean;            // Whether file currently exists
}
```

### DocumentationMove
```typescript
interface DocumentationMove {
  originalPath: string;    // Original file path
  originalName: string;    // Original filename
  numberedName: string;    // New filename with number prefix
  newPath: string;         // New path in docs/ folder
  position: number;        // Position in chronological order
}
```

### UnnecessaryFile
```typescript
interface UnnecessaryFile {
  filePath: string;        // Path to unnecessary file
  justification: string;   // Reason why it's unnecessary
  movedTo: string;         // New path in misc/ folder
  success: boolean;        // Whether move succeeded
}
```

### CleanupReport
```typescript
interface CleanupReport {
  timestamp: Date;
  documentationMoves: DocumentationMove[];
  unnecessaryFiles: UnnecessaryFile[];
  skippedFiles: Array<{file: string, reason: string}>;
  statistics: {
    totalDocsOrganized: number;
    totalFilesArchived: number;
    totalSkipped: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Git history extraction completeness

*For any* repository with .md files, the system should extract creation dates for all .md files that have git history, and assign current timestamp to files without history.

**Validates: Requirements 1.1, 1.2**

### Property 2: Alphabetical ordering for same-date files

*For any* set of .md files created in the same commit, the system should maintain alphabetical order among them in the final sorted list.

**Validates: Requirements 1.3**

### Property 3: Sequential numbering

*For any* list of files to be organized, the system should assign sequential numbers starting from 1 with no gaps (1, 2, 3, ..., n).

**Validates: Requirements 2.1, 2.4**

### Property 4: Prefix format consistency

*For any* numbered file, the filename should match the pattern `{number}-{originalName}` where number is a positive integer and originalName is the original filename.

**Validates: Requirements 2.2, 2.3**

### Property 5: File content preservation during moves

*For any* file that is moved (to docs/ or misc/), the file content before the move should be identical to the content after the move.

**Validates: Requirements 3.3, 5.4**

### Property 6: Documentation files moved to docs/

*For any* .md file (except README.md) that is numbered, it should be located in the docs/ folder after organization.

**Validates: Requirements 3.2**

### Property 7: Relative path updates

*For any* file that is moved to docs/, if it contains relative file path references, those references should be updated to remain valid from the new location.

**Validates: Requirements 3.4**

### Property 8: Essential files never moved

*For any* file matching essential patterns (code files, configuration files, .env files, .gitignore, .vercelignore, README.md), the file should remain in its original location and be unmodified.

**Validates: Requirements 4.5, 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 9: Reference detection

*For any* file in the repository, if it is referenced by another file (via import, require, or file path mention), the system should detect that reference.

**Validates: Requirements 4.1**

### Property 10: Unnecessary file criteria

*For any* file marked as unnecessary, it must satisfy all three conditions: not referenced by other files, not an essential file, and not containing unique information.

**Validates: Requirements 4.4**

### Property 11: Filename preservation in misc/

*For any* file moved to misc/, the filename should remain unchanged (no numbering or renaming).

**Validates: Requirements 5.3**

### Property 12: No file deletions

*For any* repository state before and after cleanup, the total number of files should remain constant (files are only moved, never deleted).

**Validates: Requirements 6.6**

### Property 13: Report completeness for docs/

*For any* file moved to docs/, the cleanup report should contain an entry with both the original filename and the new numbered filename.

**Validates: Requirements 7.2**

### Property 14: Report completeness for misc/

*For any* file moved to misc/, the cleanup report should contain an entry with the filename and a justification string explaining why it was deemed unnecessary.

**Validates: Requirements 7.3**

### Property 15: Report includes failures

*For any* file that could not be processed or was skipped, the cleanup report should contain an entry with the filename and reason for skipping.

**Validates: Requirements 7.4**

## Error Handling

### Git Command Failures

**Scenario**: Git commands fail or return unexpected output

**Handling**:
- Catch git command execution errors
- Log error details for debugging
- For files where git history cannot be determined, assign current timestamp
- Continue processing other files
- Include failed files in skipped files section of report

### File System Errors

**Scenario**: Cannot create directories or move files

**Handling**:
- Check directory creation success before attempting moves
- Catch file move errors individually (don't fail entire operation)
- Log specific error (permissions, file not found, etc.)
- Mark failed operations in report with error reason
- Preserve original file if move fails

### File Reference Detection Errors

**Scenario**: Cannot read files to detect references

**Handling**:
- Catch file read errors
- Assume file might be referenced (conservative approach)
- Do not mark as unnecessary if references cannot be verified
- Log warning about incomplete analysis

### Invalid File Paths

**Scenario**: File paths contain special characters or are malformed

**Handling**:
- Validate file paths before processing
- Skip files with invalid paths
- Include in skipped files section with reason
- Log warning for manual review

### Concurrent Modifications

**Scenario**: Repository is modified during cleanup operation

**Handling**:
- Check file existence before each operation
- Skip files that no longer exist
- Include in skipped files section
- Recommend running cleanup when repository is stable

## Testing Strategy

### Unit Testing

Unit tests will focus on specific examples, edge cases, and error conditions:

**GitHistoryAnalyzer**:
- Test parsing of git log output with various date formats
- Test handling of files with no git history
- Test handling of git command failures
- Test README.md exclusion

**DocumentationOrganizer**:
- Test numbered filename generation with various inputs
- Test directory creation when docs/ doesn't exist
- Test directory creation when docs/ already exists
- Test file move operations
- Test handling of file move failures

**FileNecessityAnalyzer**:
- Test reference detection with various reference formats (import, require, file paths)
- Test essential file pattern matching
- Test specific examples of necessary vs unnecessary files
- Test edge case: empty files
- Test edge case: binary files

**FileMover**:
- Test moving single file to misc/
- Test moving multiple files
- Test handling of move failures
- Test filename preservation

**ReportGenerator**:
- Test report formatting with various data
- Test markdown generation
- Test statistics calculation
- Test empty report (no files moved)

### Property-Based Testing

Property tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

**Configuration**: Use fast-check (for TypeScript/JavaScript) or appropriate PBT library for chosen language.

**Property Test 1: Git history extraction completeness**
- Generate random repository structures with .md files
- Verify all .md files have timestamps assigned
- **Tag: Feature: repository-cleanup, Property 1: Git history extraction completeness**

**Property Test 2: Alphabetical ordering for same-date files**
- Generate files with identical timestamps
- Verify alphabetical ordering is maintained
- **Tag: Feature: repository-cleanup, Property 2: Alphabetical ordering for same-date files**

**Property Test 3: Sequential numbering**
- Generate random lists of files
- Verify numbering is sequential with no gaps
- **Tag: Feature: repository-cleanup, Property 3: Sequential numbering**

**Property Test 4: Prefix format consistency**
- Generate random filenames
- Verify all numbered files match the pattern
- **Tag: Feature: repository-cleanup, Property 4: Prefix format consistency**

**Property Test 5: File content preservation during moves**
- Generate random file contents
- Move files and verify content unchanged
- **Tag: Feature: repository-cleanup, Property 5: File content preservation during moves**

**Property Test 6: Documentation files moved to docs/**
- Generate random .md files
- Verify all numbered files are in docs/
- **Tag: Feature: repository-cleanup, Property 6: Documentation files moved to docs/**

**Property Test 7: Relative path updates**
- Generate files with relative path references
- Verify paths are updated correctly after move
- **Tag: Feature: repository-cleanup, Property 7: Relative path updates**

**Property Test 8: Essential files never moved**
- Generate random mix of essential and non-essential files
- Verify essential files remain in original location
- **Tag: Feature: repository-cleanup, Property 8: Essential files never moved**

**Property Test 9: Reference detection**
- Generate files with various reference formats
- Verify all references are detected
- **Tag: Feature: repository-cleanup, Property 9: Reference detection**

**Property Test 10: Unnecessary file criteria**
- Generate files marked as unnecessary
- Verify all three criteria are met
- **Tag: Feature: repository-cleanup, Property 10: Unnecessary file criteria**

**Property Test 11: Filename preservation in misc/**
- Generate random filenames
- Verify filenames unchanged in misc/
- **Tag: Feature: repository-cleanup, Property 11: Filename preservation in misc/**

**Property Test 12: No file deletions**
- Generate random repository state
- Count files before and after cleanup
- Verify counts are equal
- **Tag: Feature: repository-cleanup, Property 12: No file deletions**

**Property Test 13: Report completeness for docs/**
- Generate random documentation moves
- Verify all appear in report with both names
- **Tag: Feature: repository-cleanup, Property 13: Report completeness for docs/**

**Property Test 14: Report completeness for misc/**
- Generate random unnecessary files
- Verify all appear in report with justification
- **Tag: Feature: repository-cleanup, Property 14: Report completeness for misc/**

**Property Test 15: Report includes failures**
- Generate scenarios with failures
- Verify failures appear in report
- **Tag: Feature: repository-cleanup, Property 15: Report includes failures**

### Integration Testing

Integration tests will verify the complete workflow:

1. **End-to-end cleanup test**: Create test repository, run full cleanup, verify all requirements met
2. **Idempotency test**: Run cleanup twice, verify second run makes no changes
3. **Report accuracy test**: Verify report matches actual file system state after cleanup
4. **Error recovery test**: Introduce errors during cleanup, verify graceful handling

### Test Data

- Create test repositories with known git history
- Include various .md file types (deployment guides, setup guides, etc.)
- Include essential files that should never be moved
- Include files with and without git history
- Include files with relative path references
