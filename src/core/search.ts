import { LocalVaultDatabase } from './database.js';
import { FileRecord, SearchQuery } from './types.js';

export class SearchEngine {
  private db: LocalVaultDatabase;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
  }

  /**
   * Searches the database against multi-facet criteria.
   */
  search(query: SearchQuery): { total: number; results: FileRecord[] } {
    const allFiles = this.db.getAllFiles('ACTIVE');

    // Duplicate hashes set if filter requested
    let duplicateHashes: Set<string> | null = null;
    if (query.isDuplicate !== undefined) {
      const hashes = this.db.getDuplicateHashes().map((h) => h.sha256);
      duplicateHashes = new Set(hashes);
    }

    const filtered = allFiles.filter((file) => {
      // Filename / Term
      if (query.term) {
        const lowerTerm = query.term.toLowerCase();
        if (
          !file.filename.toLowerCase().includes(lowerTerm) &&
          !file.path.toLowerCase().includes(lowerTerm)
        ) {
          return false;
        }
      }

      // Extension
      if (query.extension) {
        const cleanExt = query.extension.toLowerCase().replace(/^\./, '');
        if (file.extension.replace(/^\./, '') !== cleanExt) {
          return false;
        }
      }

      // Category
      if (query.category && file.category !== query.category) {
        return false;
      }

      // Size
      if (query.minSize !== undefined && file.sizeBytes < query.minSize) {
        return false;
      }
      if (query.maxSize !== undefined && file.sizeBytes > query.maxSize) {
        return false;
      }

      // Modified Date
      if (query.modifiedAfter !== undefined && file.mtimeMs < query.modifiedAfter) {
        return false;
      }
      if (query.modifiedBefore !== undefined && file.mtimeMs > query.modifiedBefore) {
        return false;
      }

      // Directory prefix
      if (query.directory) {
        if (!file.path.startsWith(query.directory)) {
          return false;
        }
      }

      // Duplicate status
      if (duplicateHashes !== null) {
        const isDup = duplicateHashes.has(file.sha256);
        if (query.isDuplicate === true && !isDup) return false;
        if (query.isDuplicate === false && isDup) return false;
      }

      return true;
    });

    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      total: filtered.length,
      results: paginated
    };
  }
}
