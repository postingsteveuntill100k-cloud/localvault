import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { SearchEngine } from '../../src/core/search.js';
import { FileRecord } from '../../src/core/types.js';

describe('SearchEngine', () => {
  let db: LocalVaultDatabase;
  let searchEngine: SearchEngine;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    searchEngine = new SearchEngine(db);

    const testFiles: FileRecord[] = [
      {
        id: '1',
        path: '/photos/vacation.jpg',
        filename: 'vacation.jpg',
        extension: '.jpg',
        category: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeBytes: 5000,
        mtimeMs: 1000,
        ctimeMs: 1000,
        sha256: 'h-img1',
        indexedAt: 1000,
        status: 'ACTIVE'
      },
      {
        id: '2',
        path: '/docs/resume.pdf',
        filename: 'resume.pdf',
        extension: '.pdf',
        category: 'DOCUMENT',
        mimeType: 'application/pdf',
        sizeBytes: 15000,
        mtimeMs: 2000,
        ctimeMs: 2000,
        sha256: 'h-doc1',
        indexedAt: 2000,
        status: 'ACTIVE'
      },
      {
        id: '3',
        path: '/docs/resume_copy.pdf',
        filename: 'resume_copy.pdf',
        extension: '.pdf',
        category: 'DOCUMENT',
        mimeType: 'application/pdf',
        sizeBytes: 15000,
        mtimeMs: 2500,
        ctimeMs: 2500,
        sha256: 'h-doc1', // duplicate of resume.pdf
        indexedAt: 2500,
        status: 'ACTIVE'
      },
      {
        id: '4',
        path: '/music/song.mp3',
        filename: 'song.mp3',
        extension: '.mp3',
        category: 'AUDIO',
        mimeType: 'audio/mp3',
        sizeBytes: 80000,
        mtimeMs: 3000,
        ctimeMs: 3000,
        sha256: 'h-audio1',
        indexedAt: 3000,
        status: 'ACTIVE'
      }
    ];

    for (const f of testFiles) {
      db.upsertFile(f);
    }
  });

  afterEach(() => {
    db.close();
  });

  it('filters by search term substring', () => {
    const res = searchEngine.search({ term: 'resume' });
    expect(res.total).toBe(2);
    expect(res.results.map((r) => r.filename)).toContain('resume.pdf');
    expect(res.results.map((r) => r.filename)).toContain('resume_copy.pdf');
  });

  it('filters by category and extension', () => {
    const imgRes = searchEngine.search({ category: 'IMAGE' });
    expect(imgRes.total).toBe(1);
    expect(imgRes.results[0].filename).toBe('vacation.jpg');

    const pdfRes = searchEngine.search({ extension: 'pdf' });
    expect(pdfRes.total).toBe(2);
  });

  it('filters by size range', () => {
    const res = searchEngine.search({ minSize: 10000, maxSize: 50000 });
    expect(res.total).toBe(2); // resume.pdf and resume_copy.pdf (15000 bytes)
  });

  it('filters by duplicate status', () => {
    const dups = searchEngine.search({ isDuplicate: true });
    expect(dups.total).toBe(2);

    const nonDups = searchEngine.search({ isDuplicate: false });
    expect(nonDups.total).toBe(2);
  });

  it('filters by SHA-256 hash and matches hash substring in search term', () => {
    // Exact/prefix hash query
    const hashRes = searchEngine.search({ hash: 'h-img1' });
    expect(hashRes.total).toBe(1);
    expect(hashRes.results[0].filename).toBe('vacation.jpg');

    // Search term containing hash
    const termHashRes = searchEngine.search({ term: 'h-doc1' });
    expect(termHashRes.total).toBe(2);
    expect(termHashRes.results.map((r) => r.filename)).toContain('resume.pdf');
    expect(termHashRes.results.map((r) => r.filename)).toContain('resume_copy.pdf');
  });
});
