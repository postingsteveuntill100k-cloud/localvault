import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { SearchEngine } from '../../src/core/search.js';
import { FileRecord } from '../../src/core/types.js';

describe('SearchEngine: Deep Filter & Boundary Ranking (Spot Dev Delivery)', () => {
  let db: LocalVaultDatabase;
  let searchEngine: SearchEngine;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    searchEngine = new SearchEngine(db);

    const files: FileRecord[] = [
      {
        id: 'spot-1',
        path: '/projects/app/src/index.ts',
        filename: 'index.ts',
        extension: '.ts',
        category: 'CODE',
        mimeType: 'text/plain',
        sizeBytes: 1200,
        mtimeMs: 10000,
        ctimeMs: 10000,
        sha256: 'h-ts-1',
        indexedAt: 10000,
        status: 'ACTIVE'
      },
      {
        id: 'spot-2',
        path: '/projects/app/src/utils.ts',
        filename: 'utils.ts',
        extension: '.ts',
        category: 'CODE',
        mimeType: 'text/plain',
        sizeBytes: 3400,
        mtimeMs: 20000,
        ctimeMs: 20000,
        sha256: 'h-ts-2',
        indexedAt: 20000,
        status: 'ACTIVE'
      },
      {
        id: 'spot-3',
        path: '/projects/app/docs/spec.pdf',
        filename: 'spec.pdf',
        extension: '.pdf',
        category: 'DOCUMENT',
        mimeType: 'application/pdf',
        sizeBytes: 85000,
        mtimeMs: 30000,
        ctimeMs: 30000,
        sha256: 'h-pdf-1',
        indexedAt: 30000,
        status: 'ACTIVE'
      },
      {
        id: 'spot-4',
        path: '/archives/backup/spec_backup.pdf',
        filename: 'spec_backup.pdf',
        extension: '.pdf',
        category: 'DOCUMENT',
        mimeType: 'application/pdf',
        sizeBytes: 85000,
        mtimeMs: 35000,
        ctimeMs: 35000,
        sha256: 'h-pdf-1', // Duplicate of spot-3
        indexedAt: 35000,
        status: 'ACTIVE'
      }
    ];

    for (const f of files) db.upsertFile(f);
  });

  afterEach(() => {
    db.close();
  });

  it('combines directory prefix filtering with size boundaries', () => {
    const res = searchEngine.search({
      directory: '/projects/app',
      minSize: 1000,
      maxSize: 5000
    });
    expect(res.total).toBe(2);
    expect(res.results.map((r) => r.filename)).toEqual(['index.ts', 'utils.ts']);
  });

  it('filters duplicates confined within specific category', () => {
    const res = searchEngine.search({
      category: 'DOCUMENT',
      isDuplicate: true
    });
    expect(res.total).toBe(2);
    expect(res.results.map((r) => r.id)).toContain('spot-3');
    expect(res.results.map((r) => r.id)).toContain('spot-4');
  });

  it('correctly applies pagination limits and offsets', () => {
    const page1 = searchEngine.search({ limit: 2, offset: 0 });
    expect(page1.results.length).toBe(2);

    const page2 = searchEngine.search({ limit: 2, offset: 2 });
    expect(page2.results.length).toBe(2);

    expect(page1.results[0].id).not.toBe(page2.results[0].id);
  });
});
