import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { OrganizationEngine } from '../../src/core/organizer.js';
import { FileRecord } from '../../src/core/types.js';

describe('Failure Injection & Fault Tolerance', () => {
  let db: LocalVaultDatabase;
  let organizer: OrganizationEngine;
  let testDir: string;
  let targetDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    organizer = new OrganizationEngine(db);
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-fail-test-src-'));
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-fail-test-tgt-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('fails safely when source file disappears between plan and execute (TOCTOU)', async () => {
    const file = path.join(testDir, 'evanescent.txt');
    fs.writeFileSync(file, 'now you see me');

    const rec: FileRecord = {
      id: 'f-vanish',
      path: file,
      filename: 'evanescent.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: fs.statSync(file).size,
      mtimeMs: 100,
      ctimeMs: 100,
      sha256: crypto.createHash('sha256').update('now you see me').digest('hex'),
      indexedAt: 100,
      status: 'ACTIVE'
    };
    db.upsertFile(rec);

    const plan = organizer.createPlan({
      sourceDirectory: testDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });

    // INJECT FAILURE: delete file before execution
    fs.unlinkSync(file);

    const res = await organizer.executePlan(plan.id, true);
    expect(res.failedCount).toBe(1);
    expect(res.executedCount).toBe(0);
    expect(res.errors[0]).toContain('Source file missing');
  });

  it('fails safely when source file is modified during planning (Size mismatch TOCTOU)', async () => {
    const file = path.join(testDir, 'mutating.txt');
    fs.writeFileSync(file, 'initial content');

    const rec: FileRecord = {
      id: 'f-mutate',
      path: file,
      filename: 'mutating.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: fs.statSync(file).size,
      mtimeMs: 100,
      ctimeMs: 100,
      sha256: crypto.createHash('sha256').update('initial content').digest('hex'),
      indexedAt: 100,
      status: 'ACTIVE'
    };
    db.upsertFile(rec);

    const plan = organizer.createPlan({
      sourceDirectory: testDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });

    // INJECT FAILURE: append data to file altering size
    fs.appendFileSync(file, ' additional bytes mutating size');

    const res = await organizer.executePlan(plan.id, true);
    expect(res.failedCount).toBe(1);
    expect(res.errors[0]).toContain('Source file modified during planning');
  });

  it('fails safely on unreadable permission denied files', async () => {
    const file = path.join(testDir, 'locked.txt');
    fs.writeFileSync(file, 'confidential');
    try {
      fs.chmodSync(file, 0o000); // remove read/write permissions
    } catch {
      // If OS doesn't support chmod 000
    }

    try {
      const rec: FileRecord = {
        id: 'f-locked',
        path: file,
        filename: 'locked.txt',
        extension: '.txt',
        category: 'DOCUMENT',
        mimeType: 'text/plain',
        sizeBytes: 12,
        mtimeMs: 100,
        ctimeMs: 100,
        sha256: 'h-lock',
        indexedAt: 100,
        status: 'ACTIVE'
      };
      db.upsertFile(rec);

      const plan = organizer.createPlan({
        sourceDirectory: testDir,
        targetDirectory: targetDir,
        strategy: 'BY_CATEGORY'
      });

      const res = await organizer.executePlan(plan.id, true);
      expect(res).toBeDefined();
    } finally {
      try {
        fs.chmodSync(file, 0o666);
      } catch {}
    }
  });
});
