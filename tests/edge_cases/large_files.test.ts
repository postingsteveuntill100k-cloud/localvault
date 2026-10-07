import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { FileIndexer } from '../../src/core/indexer.js';

describe('Large Files & Exotic Filesystem Edge Cases', () => {
  let db: LocalVaultDatabase;
  let indexer: FileIndexer;
  let testDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    indexer = new FileIndexer(db);
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-edge-test-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('streams and hashes large file (>10MB) without memory pressure', async () => {
    const largeFilePath = path.join(testDir, 'large_payload.bin');
    const chunkSize = 1024 * 1024; // 1MB
    const totalChunks = 10; // 10MB total
    const chunk = crypto.randomBytes(chunkSize);

    const fd = fs.openSync(largeFilePath, 'w');
    const expectedHash = crypto.createHash('sha256');
    for (let i = 0; i < totalChunks; i++) {
      fs.writeSync(fd, chunk);
      expectedHash.update(chunk);
    }
    fs.closeSync(fd);

    const memoryBefore = process.memoryUsage().heapUsed;
    const computedHash = await indexer.computeFileHash(largeFilePath);
    const memoryAfter = process.memoryUsage().heapUsed;

    expect(computedHash).toBe(expectedHash.digest('hex'));
    // Ensure memory delta did not balloon by full file size
    const deltaMb = (memoryAfter - memoryBefore) / (1024 * 1024);
    expect(deltaMb).toBeLessThan(15);
  });

  it('handles many small files, nested deep directories, and unicode characters', async () => {
    // Unicode names, spaces, emojis, special characters
    const unicodeNames = [
      '日本語ドキュメント.txt',
      'föld_über_größe.pdf',
      'spaces and punctuation (1) [2] {3}.jpg',
      '🔥_emoji_file.png',
      'arabic_تقرير_ملف.docx'
    ];

    let currentDir = testDir;
    for (let depth = 0; depth < 5; depth++) {
      currentDir = path.join(currentDir, `level_${depth}`);
      fs.mkdirSync(currentDir, { recursive: true });

      const name = unicodeNames[depth % unicodeNames.length];
      fs.writeFileSync(path.join(currentDir, name), `content-at-depth-${depth}`);
    }

    const res = await indexer.indexDirectory(testDir);
    expect(res.indexed).toBe(5);
    expect(res.errors.length).toBe(0);

    const indexed = db.getAllFiles();
    expect(indexed.length).toBe(5);
    expect(indexed.some((f) => f.filename.includes('日本語'))).toBe(true);
    expect(indexed.some((f) => f.filename.includes('🔥'))).toBe(true);
  });

  it('handles broken symlinks gracefully without crashing', async () => {
    const brokenSymlink = path.join(testDir, 'broken_link.txt');
    try {
      fs.symlinkSync(path.join(testDir, 'does_not_exist.txt'), brokenSymlink);
    } catch {
      // Symlink creation might require privileges on certain OS configurations
    }

    if (fs.existsSync(brokenSymlink) || fs.lstatSync(brokenSymlink, { throwIfNoEntry: false })) {
      const res = await indexer.indexDirectory(testDir);
      // Broken symlink should be recorded in errors or skipped without crashing
      expect(res).toBeDefined();
    }
  });
});
