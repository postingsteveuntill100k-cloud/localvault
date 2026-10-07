#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { LocalVaultDatabase } from '../core/database.js';
import { FileIndexer } from '../core/indexer.js';
import { DuplicateDetector } from '../core/duplicates.js';
import { SearchEngine } from '../core/search.js';
import { OrganizationEngine } from '../core/organizer.js';
import { ReportEngine } from '../core/reporting.js';
import { ExportEngine } from '../core/export.js';
import { OrganizationStrategy } from '../core/types.js';

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'localvault.db');
const db = new LocalVaultDatabase(dbPath);

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'index': {
      const targetDir = args[1];
      if (!targetDir) {
        console.error('Usage: localvault index <directory>');
        process.exit(1);
      }
      console.log(`[LocalVault] Indexing directory: ${targetDir}`);
      const indexer = new FileIndexer(db);
      const res = await indexer.indexDirectory(targetDir);
      console.log(`[LocalVault] Finished! Indexed: ${res.indexed}, Skipped: ${res.skipped}, Errors: ${res.errors.length}`);
      break;
    }

    case 'duplicates': {
      const detector = new DuplicateDetector(db);
      const res = detector.findDuplicates();
      console.log(`\n=== LocalVault Duplicate Clusters ===`);
      console.log(`Clusters found: ${res.groups.length}`);
      console.log(`Total duplicate files: ${res.totalDuplicateFiles}`);
      console.log(`Total wasted storage: ${(res.totalWastedBytes / (1024 * 1024)).toFixed(2)} MB\n`);
      for (const g of res.groups) {
        console.log(`• Hash: ${g.hash.slice(0, 16)}... | Size: ${g.sizeBytes} bytes | Copies: ${g.fileCount}`);
        for (const f of g.files) {
          console.log(`   - ${f.path}`);
        }
      }
      break;
    }

    case 'search': {
      const term = args[1];
      const engine = new SearchEngine(db);
      const res = engine.search({ term });
      console.log(`Found ${res.total} matching files:`);
      for (const f of res.results.slice(0, 50)) {
        console.log(`  [${f.category}] ${f.filename} (${f.sizeBytes} B) -> ${f.path}`);
      }
      break;
    }

    case 'organize': {
      const source = args[1];
      const target = args[2];
      const strategy = (args[3] || 'BY_CATEGORY') as OrganizationStrategy;
      if (!source || !target) {
        console.error('Usage: localvault organize <sourceDir> <targetDir> [strategy: BY_CATEGORY|BY_DATE]');
        process.exit(1);
      }

      const organizer = new OrganizationEngine(db);
      const plan = organizer.createPlan({
        sourceDirectory: source,
        targetDirectory: target,
        strategy
      });

      console.log(`\n[LocalVault] Created Organization Plan: ${plan.id}`);
      console.log(`Total planned actions: ${plan.actions.length}`);
      for (const a of plan.actions.slice(0, 10)) {
        console.log(`  ${a.sourcePath} -> ${a.destinationPath}`);
      }
      if (plan.actions.length > 10) {
        console.log(`  ... and ${plan.actions.length - 10} more actions`);
      }
      console.log(`\nTo execute, run:\nlocalvault execute ${plan.id}\n`);
      break;
    }

    case 'execute': {
      const planId = args[1];
      if (!planId) {
        console.error('Usage: localvault execute <planId>');
        process.exit(1);
      }
      const organizer = new OrganizationEngine(db);
      console.log(`[LocalVault] Executing plan ${planId}...`);
      const res = await organizer.executePlan(planId, true);
      console.log(`Execution complete! Batch ID: ${res.batchId}`);
      console.log(`Moved: ${res.executedCount}, Failed: ${res.failedCount}`);
      break;
    }

    case 'rollback': {
      const batchId = args[1];
      if (!batchId) {
        console.error('Usage: localvault rollback <batchId>');
        process.exit(1);
      }
      const organizer = new OrganizationEngine(db);
      console.log(`[LocalVault] Rolling back batch ${batchId}...`);
      const res = await organizer.rollbackBatch(batchId);
      console.log(`Rollback complete! Restored: ${res.restoredCount}, Failed: ${res.failedCount}`);
      break;
    }

    case 'report': {
      const reporting = new ReportEngine(db);
      const rep = reporting.generateReport();
      console.log(`\n=== LocalVault Storage Report ===`);
      console.log(`Total Files: ${rep.totalFiles}`);
      console.log(`Total Storage: ${(rep.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Duplicate Waste: ${(rep.duplicateWasteBytes / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Stale Files (>90d): ${rep.staleFiles.length}`);
      console.log(`Recently Modified (<7d): ${rep.recentlyModifiedFiles.length}`);
      console.log(`\nCategory Breakdown:`);
      for (const [cat, data] of Object.entries(rep.categoryBreakdown)) {
        console.log(`  - ${cat}: ${data.count} files (${(data.bytes / 1024).toFixed(1)} KB)`);
      }
      break;
    }

    case 'export': {
      const format = (args[1] || 'json').toLowerCase();
      const files = db.getAllFiles();
      if (format === 'csv') {
        const csv = ExportEngine.exportFilesToCsv(files);
        console.log(csv);
      } else {
        console.log(ExportEngine.exportToJson(files));
      }
      break;
    }

    default:
      console.log(`LocalVault — Privacy-First Personal File Organizer

Commands:
  index <dir>                   Recursively index a directory
  duplicates                    Find and list duplicate clusters
  search <term>                 Search files by name or path
  organize <src> <tgt> [strat]  Generate safe organization plan
  execute <planId>              Execute confirmed organization plan
  rollback <batchId>            Undo an executed organization batch
  report                        Print storage analytics report
  export [csv|json]             Export indexed files to CSV or JSON
`);
  }
}

main().catch((err) => {
  console.error(`Error:`, err.message);
  process.exit(1);
});
