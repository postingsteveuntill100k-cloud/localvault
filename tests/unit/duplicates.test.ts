import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { DuplicateDetector } from '../../src/core/duplicates.js';
import { FileRecord } from '../../src/core/types.js';

describe('DuplicateDetector', () => {
  let db: LocalVaultDatabase;
  let detector: DuplicateDetector;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    detector = new DuplicateDetector(db);
  });

  afterEach(() => {
    db.close();
  });

  it('identifies exact duplicate clusters and computes wasted storage', () => {
    const fileA: FileRecord = {
      id: 'f-1',
      path: '/downloads/doc1.pdf',
      filename: 'doc1.pdf',
      extension: '.pdf',
      category: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      mtimeMs: 100,
      ctimeMs: 100,
      sha256: 'hash-abc',
      indexedAt: 100,
      status: 'ACTIVE'
    };

    const fileB: FileRecord = {
      id: 'f-2',
      path: '/backup/doc2.pdf',
      filename: 'doc2.pdf',
      extension: '.pdf',
      category: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      mtimeMs: 200,
      ctimeMs: 200,
      sha256: 'hash-abc',
      indexedAt: 200,
      status: 'ACTIVE'
    };

    const fileC: FileRecord = {
      id: 'f-3',
      path: '/archive/doc3.pdf',
      filename: 'doc3.pdf',
      extension: '.pdf',
      category: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      mtimeMs: 300,
      ctimeMs: 300,
      sha256: 'hash-abc',
      indexedAt: 300,
      status: 'ACTIVE'
    };

    const uniqueFile: FileRecord = {
      id: 'f-4',
      path: '/unique.txt',
      filename: 'unique.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 500,
      mtimeMs: 400,
      ctimeMs: 400,
      sha256: 'hash-unique',
      indexedAt: 400,
      status: 'ACTIVE'
    };

    db.upsertFile(fileA);
    db.upsertFile(fileB);
    db.upsertFile(fileC);
    db.upsertFile(uniqueFile);

    const result = detector.findDuplicates();

    expect(result.groups.length).toBe(1);
    expect(result.groups[0].hash).toBe('hash-abc');
    expect(result.groups[0].fileCount).toBe(3);
    // 3 copies of 1000 bytes = 2 extra copies = 2000 wasted bytes
    expect(result.groups[0].wastedBytes).toBe(2000);
    expect(result.totalDuplicateFiles).toBe(3);
    expect(result.totalWastedBytes).toBe(2000);
  });

  it('ignores unique files and zero-byte files without false positives', () => {
    const zero1: FileRecord = {
      id: 'z-1',
      path: '/empty1.txt',
      filename: 'empty1.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 0,
      mtimeMs: 1,
      ctimeMs: 1,
      sha256: 'empty-hash',
      indexedAt: 1,
      status: 'ACTIVE'
    };

    const zero2: FileRecord = {
      id: 'z-2',
      path: '/empty2.txt',
      filename: 'empty2.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 0,
      mtimeMs: 2,
      ctimeMs: 2,
      sha256: 'empty-hash',
      indexedAt: 2,
      status: 'ACTIVE'
    };

    db.upsertFile(zero1);
    db.upsertFile(zero2);

    const result = detector.findDuplicates();
    expect(result.groups.length).toBe(0);
    expect(result.totalWastedBytes).toBe(0);
  });
});
