import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { ReportEngine } from '../../src/core/reporting.js';
import { FileRecord } from '../../src/core/types.js';

describe('ReportEngine', () => {
  let db: LocalVaultDatabase;
  let reporting: ReportEngine;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    reporting = new ReportEngine(db);

    const now = Date.now();
    const staleTime = now - 120 * 24 * 60 * 60 * 1000; // 120 days ago

    const files: FileRecord[] = [
      {
        id: '1',
        path: '/a/big.iso',
        filename: 'big.iso',
        extension: '.iso',
        category: 'ARCHIVE',
        mimeType: 'application/octet-stream',
        sizeBytes: 100_000_000,
        mtimeMs: now,
        ctimeMs: now,
        sha256: 'h-iso',
        indexedAt: now,
        status: 'ACTIVE'
      },
      {
        id: '2',
        path: '/b/old.txt',
        filename: 'old.txt',
        extension: '.txt',
        category: 'DOCUMENT',
        mimeType: 'text/plain',
        sizeBytes: 5_000,
        mtimeMs: staleTime,
        ctimeMs: staleTime,
        sha256: 'h-txt',
        indexedAt: now,
        status: 'ACTIVE'
      },
      {
        id: '3',
        path: '/c/dup1.jpg',
        filename: 'dup1.jpg',
        extension: '.jpg',
        category: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes: 20_000,
        mtimeMs: now,
        ctimeMs: now,
        sha256: 'h-dup',
        indexedAt: now,
        status: 'ACTIVE'
      },
      {
        id: '4',
        path: '/c/dup2.jpg',
        filename: 'dup2.jpg',
        extension: '.jpg',
        category: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes: 20_000,
        mtimeMs: now,
        ctimeMs: now,
        sha256: 'h-dup',
        indexedAt: now,
        status: 'ACTIVE'
      }
    ];

    for (const f of files) db.upsertFile(f);
  });

  afterEach(() => {
    db.close();
  });

  it('generates summary reports with category breakdown, largest files, and stale files', () => {
    const report = reporting.generateReport({ staleDays: 90, topLargest: 2 });

    expect(report.totalFiles).toBe(4);
    expect(report.totalStorageBytes).toBe(100_045_000);
    expect(report.duplicateGroupsCount).toBe(1);
    expect(report.duplicateWasteBytes).toBe(20_000);

    expect(report.largestFiles.length).toBe(2);
    expect(report.largestFiles[0].filename).toBe('big.iso');

    expect(report.staleFiles.length).toBe(1);
    expect(report.staleFiles[0].filename).toBe('old.txt');

    expect(report.categoryBreakdown.ARCHIVE.count).toBe(1);
    expect(report.categoryBreakdown.IMAGE.count).toBe(2);
    expect(report.categoryBreakdown.DOCUMENT.count).toBe(1);
  });
});
