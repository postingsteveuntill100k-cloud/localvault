import { LocalVaultDatabase } from './database.js';
import { DuplicateGroup } from './types.js';

export class DuplicateDetector {
  private db: LocalVaultDatabase;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
  }

  /**
   * Finds all duplicate clusters in the indexed database.
   * Clusters are grouped strictly by (size_bytes > 0 AND sha256).
   */
  findDuplicates(): {
    groups: DuplicateGroup[];
    totalDuplicateFiles: number;
    totalWastedBytes: number;
  } {
    const rawHashes = this.db.getDuplicateHashes();

    const groups: DuplicateGroup[] = [];
    let totalDuplicateFiles = 0;
    let totalWastedBytes = 0;

    for (const item of rawHashes) {
      const files = this.db.getFilesByHash(item.sha256);
      if (files.length > 1) {
        const wasted = item.sizeBytes * (files.length - 1);
        groups.push({
          hash: item.sha256,
          sizeBytes: item.sizeBytes,
          fileCount: files.length,
          wastedBytes: wasted,
          files
        });

        totalDuplicateFiles += files.length;
        totalWastedBytes += wasted;
      }
    }

    return {
      groups,
      totalDuplicateFiles,
      totalWastedBytes
    };
  }
}
