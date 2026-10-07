import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { FileIndexer } from '../../src/core/indexer.js';

describe('FileIndexer', () => {
  let db: LocalVaultDatabase;
  let indexer: FileIndexer;
  let testDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    indexer = new FileIndexer(db);
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-indexer-test-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('computes streaming SHA-256 hash matching known crypto digest', async () => {
    const filePath = path.join(testDir, 'sample.txt');
    const content = 'Hello LocalVault! Streaming hash test content.';
    fs.writeFileSync(filePath, content);

    const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
    const computedHash = await indexer.computeFileHash(filePath);

    expect(computedHash).toBe(expectedHash);
  });

  it('recursively indexes files with correct metadata and classification', async () => {
    // Create directory hierarchy
    fs.mkdirSync(path.join(testDir, 'nested', 'images'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'notes.md'), '# Notes\nSome content.');
    fs.writeFileSync(path.join(testDir, 'nested', 'data.csv'), 'a,b,c\n1,2,3');
    fs.writeFileSync(path.join(testDir, 'nested', 'images', 'pic.png'), 'fake-png-bytes');
    fs.writeFileSync(path.join(testDir, '.hidden.txt'), 'hidden content');

    const result = await indexer.indexDirectory(testDir, { skipHidden: true });

    expect(result.indexed).toBe(3);
    expect(result.skipped).toBeGreaterThanOrEqual(1); // .hidden.txt skipped
    expect(result.errors.length).toBe(0);

    const files = db.getAllFiles();
    expect(files.length).toBe(3);

    const notes = files.find((f) => f.filename === 'notes.md');
    expect(notes?.category).toBe('DOCUMENT');

    const csv = files.find((f) => f.filename === 'data.csv');
    expect(csv?.category).toBe('DATA');

    const png = files.find((f) => f.filename === 'pic.png');
    expect(png?.category).toBe('IMAGE');
  });

  it('fails gracefully when indexing a non-existent directory', async () => {
    await expect(indexer.indexDirectory('/non/existent/path/12345')).rejects.toThrow();
  });
});
