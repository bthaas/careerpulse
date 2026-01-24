#!/usr/bin/env node

import { GitHistoryAnalyzer } from './GitHistoryAnalyzer.js';
import { DocumentationOrganizer } from './DocumentationOrganizer.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('🧹 Repository Cleanup Tool\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be moved\n');
  }

  try {
    // Step 1: Analyze git history
    console.log('📊 Step 1: Analyzing git history for .md files...');
    const analyzer = new GitHistoryAnalyzer();
    const history = analyzer.getAllMarkdownFileHistory();
    console.log(`   Found ${history.size} documentation files\n`);

    // Step 2: Sort files by creation order
    console.log('📋 Step 2: Sorting files by creation date...');
    const sortedFiles = analyzer.sortFilesByCreationOrder(history);
    console.log(`   Sorted ${sortedFiles.length} files chronologically\n`);

    // Step 3: Preview documentation organization
    console.log('📁 Step 3: Planning documentation organization...');
    const organizer = new DocumentationOrganizer();
    const moves = organizer.getDocumentationMoves(sortedFiles);
    
    console.log('\n📝 Documentation files to be organized:\n');
    moves.forEach(move => {
      const date = history.get(move.originalPath);
      const dateStr = date ? date.toISOString().split('T')[0] : 'unknown';
      console.log(`   ${move.position}. ${move.originalPath}`);
      console.log(`      → docs/${move.numberedName} (created: ${dateStr})`);
    });

    if (DRY_RUN) {
      console.log('\n✅ Dry run complete! No files were moved.');
      console.log('   Run without --dry-run to actually move files.');
      return;
    }

    // Step 4: Actually move files
    console.log('\n🚀 Step 4: Moving files to docs/ folder...');
    const movedFiles = organizer.organizeAllDocumentation(sortedFiles);
    console.log(`   ✅ Moved ${movedFiles.size} files to docs/\n`);

    console.log('✨ Cleanup complete!');
    console.log(`   📁 ${movedFiles.size} documentation files organized in docs/`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

main();
