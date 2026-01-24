import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'fs';
import { join, dirname, basename } from 'path';
import { DocumentationMove } from './types.js';

export class DocumentationOrganizer {
  private repositoryRoot: string;
  private docsFolder: string;

  constructor(repositoryRoot: string = process.cwd()) {
    this.repositoryRoot = repositoryRoot;
    this.docsFolder = join(repositoryRoot, 'docs');
  }

  /**
   * Generate numbered filename based on position in sorted list
   * Format: {position}-{originalName}
   */
  generateNumberedFilename(originalName: string, position: number): string {
    return `${position}-${originalName}`;
  }

  /**
   * Create docs/ directory if it doesn't exist
   */
  ensureDocsDirectory(): void {
    if (!existsSync(this.docsFolder)) {
      mkdirSync(this.docsFolder, { recursive: true });
    }
  }

  /**
   * Update relative path references in file content
   * When moving from root to docs/, paths like ./file.txt need to become ../file.txt
   */
  private updateRelativePaths(content: string, originalPath: string): string {
    // Only update if file was in root directory
    if (originalPath.includes('/')) {
      return content; // File was in subdirectory, don't update paths
    }

    // Replace relative paths that start with ./ or ../
    // When moving from root to docs/, ./ becomes ../
    let updatedContent = content;

    // Replace ./path with ../path
    updatedContent = updatedContent.replace(/\.\//g, '../');

    // Replace ../path with ../../path (if it was already going up)
    // This is a simple heuristic - may need refinement for complex cases
    updatedContent = updatedContent.replace(/\.\.\.\//g, '../../');

    return updatedContent;
  }

  /**
   * Move and rename a file to docs/ folder
   * Preserves file content and updates relative paths
   */
  moveToDocsFolder(originalPath: string, numberedName: string): void {
    const fullOriginalPath = join(this.repositoryRoot, originalPath);
    const newPath = join(this.docsFolder, numberedName);

    // Read original content
    const content = readFileSync(fullOriginalPath, 'utf-8');

    // Update relative paths in content
    const updatedContent = this.updateRelativePaths(content, originalPath);

    // Ensure docs directory exists
    this.ensureDocsDirectory();

    // Write to new location with updated content
    writeFileSync(newPath, updatedContent, 'utf-8');

    // Remove original file (we've already copied it)
    unlinkSync(fullOriginalPath);
  }

  /**
   * Process all documentation files
   * Returns mapping of original → new paths
   */
  organizeAllDocumentation(sortedFiles: string[]): Map<string, string> {
    const moves = new Map<string, string>();

    this.ensureDocsDirectory();

    sortedFiles.forEach((file, index) => {
      const position = index + 1; // Start numbering from 1
      const originalName = basename(file);
      const numberedName = this.generateNumberedFilename(originalName, position);
      const newPath = join('docs', numberedName);

      try {
        this.moveToDocsFolder(file, numberedName);
        moves.set(file, newPath);
      } catch (error) {
        console.error(`Failed to move ${file}:`, error);
        // Continue with other files
      }
    });

    return moves;
  }

  /**
   * Get documentation move details for reporting
   */
  getDocumentationMoves(sortedFiles: string[]): DocumentationMove[] {
    const moves: DocumentationMove[] = [];

    sortedFiles.forEach((file, index) => {
      const position = index + 1;
      const originalName = basename(file);
      const numberedName = this.generateNumberedFilename(originalName, position);
      const newPath = join('docs', numberedName);

      moves.push({
        originalPath: file,
        originalName,
        numberedName,
        newPath,
        position
      });
    });

    return moves;
  }
}
