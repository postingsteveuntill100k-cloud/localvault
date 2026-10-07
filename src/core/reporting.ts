import { LocalVaultDatabase } from './database.js';
import { DuplicateDetector } from './duplicates.js';
import { FileCategory, FileRecord, StorageReport } from './types.js';

export class ReportEngine {
  private db: LocalVaultDatabase;
  private duplicateDetector: DuplicateDetector;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
    this.duplicateDetector = new DuplicateDetector(db);
  }

  generateReport(
    options: { staleDays?: number; topLargest?: number; recentDays?: number; topRecent?: number } = {}
  ): StorageReport {
    const { staleDays = 90, topLargest = 10, recentDays = 7, topRecent = 10 } = options;

    const files = this.db.getAllFiles('ACTIVE');
    const { groups, totalWastedBytes } = this.duplicateDetector.findDuplicates();

    let totalStorageBytes = 0;
    const categoryBreakdown: Record<FileCategory, { count: number; bytes: number }> = {
      IMAGE: { count: 0, bytes: 0 },
      DOCUMENT: { count: 0, bytes: 0 },
      AUDIO: { count: 0, bytes: 0 },
      VIDEO: { count: 0, bytes: 0 },
      ARCHIVE: { count: 0, bytes: 0 },
      CODE: { count: 0, bytes: 0 },
      DATA: { count: 0, bytes: 0 },
      OTHER: { count: 0, bytes: 0 }
    };

    const staleThresholdMs = Date.now() - staleDays * 24 * 60 * 60 * 1000;
    const recentThresholdMs = Date.now() - recentDays * 24 * 60 * 60 * 1000;
    const staleFiles: FileRecord[] = [];

    for (const f of files) {
      totalStorageBytes += f.sizeBytes;
      if (categoryBreakdown[f.category]) {
        categoryBreakdown[f.category].count++;
        categoryBreakdown[f.category].bytes += f.sizeBytes;
      }

      if (f.mtimeMs < staleThresholdMs) {
        staleFiles.push(f);
      }
    }

    // Top largest files
    const largestFiles = [...files]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, topLargest);

    // Sort stale files by oldest first
    staleFiles.sort((a, b) => a.mtimeMs - b.mtimeMs);

    // Recently modified files (newest first)
    const recentCandidates = [...files].filter((f) => f.mtimeMs >= recentThresholdMs);
    const recentlyModifiedFiles = (
      recentCandidates.length > 0 ? recentCandidates : [...files]
    )
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, topRecent);

    return {
      totalFiles: files.length,
      totalStorageBytes,
      categoryBreakdown,
      duplicateGroupsCount: groups.length,
      duplicateWasteBytes: totalWastedBytes,
      largestFiles,
      staleFiles,
      recentlyModifiedFiles,
      generatedAt: Date.now()
    };
  }
}
