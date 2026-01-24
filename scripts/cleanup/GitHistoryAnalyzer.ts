import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { FileHistoryRecord } from './types.js';

export class GitHistoryAnalyzer {
  private repositoryRoot: string;

  constructor(repositoryRoot: string = process.cwd()) {
    this.repositoryRoot = repositoryRoot;
  }

  /**
   * Get the first commit date for a specific file using git log
   * Returns null if file has no git history
   */
  getFileCreationDate(filePath: string): Date | null {
    try {
      // Use git log with --follow to track file renames
      // --format=%aI gives ISO 8601 timestamp
      // --reverse shows oldest commits first
      const command = `git log --follow --format=%aI --reverse -- "${filePath}"`;
      const output = execSync(command, {
        cwd: this.repositoryRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      if (!output) {
        return null;
      }

      // Get the first line (oldest commit)
      const firstLine = output.split('\n')[0];
      const date = new Date(firstLine);

      // Validate the date
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (error) {
      // File has no git history or git command failed
      return null;
    }
  }

  /**
   * Find all .md files in the repository (excluding node_modules, .git, docs, misc)
   */
  private findAllMarkdownFiles(): string[] {
    const mdFiles: string[] = [];
    const excludeDirs = ['node_modules', '.git', 'docs', 'misc', '.kiro'];

    const walkDir = (dir: string) => {
      try {
        const files = readdirSync(dir);

        for (const file of files) {
          const filePath = join(dir, file);
          const relativePath = filePath.replace(this.repositoryRoot + '/', '');

          // Skip excluded directories - check if path starts with or contains excluded dir
          const shouldExclude = excludeDirs.some(excluded => {
            return relativePath === excluded || 
                   relativePath.startsWith(excluded + '/') ||
                   relativePath.includes('/' + excluded + '/');
          });
          
          if (shouldExclude) {
            continue;
          }

          try {
            const stat = statSync(filePath);

            if (stat.isDirectory()) {
              walkDir(filePath);
            } else if (file.endsWith('.md')) {
              mdFiles.push(relativePath);
            }
          } catch (err) {
            // Skip files we can't access
            continue;
          }
        }
      } catch (err) {
        // Skip directories we can't access
        return;
      }
    };

    walkDir(this.repositoryRoot);
    return mdFiles;
  }

  /**
   * Get creation dates for all .md files in repository
   * Excludes README.md from the list
   * Assigns current timestamp to files with no git history
   */
  getAllMarkdownFileHistory(): Map<string, Date> {
    const mdFiles = this.findAllMarkdownFiles();
    const history = new Map<string, Date>();
    const now = new Date();

    for (const file of mdFiles) {
      // Exclude README.md
      if (file === 'README.md') {
        continue;
      }

      const creationDate = this.getFileCreationDate(file);
      history.set(file, creationDate || now);
    }

    return history;
  }

  /**
   * Sort files by creation date (earliest first)
   * For files with same date, maintain alphabetical order (stable sort)
   */
  sortFilesByCreationOrder(files: Map<string, Date>): string[] {
    const entries = Array.from(files.entries());

    // Sort by date first, then alphabetically for same dates
    entries.sort((a, b) => {
      const dateA = a[1].getTime();
      const dateB = b[1].getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // Same date - sort alphabetically
      return a[0].localeCompare(b[0]);
    });

    return entries.map(entry => entry[0]);
  }
}
