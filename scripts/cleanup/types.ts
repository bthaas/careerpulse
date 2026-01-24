// Type definitions for repository cleanup system

export interface FileHistoryRecord {
  filePath: string;           // Relative path from repository root
  creationDate: Date | null;  // First commit date, null if no history
  exists: boolean;            // Whether file currently exists
}

export interface DocumentationMove {
  originalPath: string;    // Original file path
  originalName: string;    // Original filename
  numberedName: string;    // New filename with number prefix
  newPath: string;         // New path in docs/ folder
  position: number;        // Position in chronological order
}

export interface UnnecessaryFile {
  filePath: string;        // Path to unnecessary file
  justification: string;   // Reason why it's unnecessary
  movedTo: string;         // New path in misc/ folder
  success: boolean;        // Whether move succeeded
}

export interface CleanupReport {
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
