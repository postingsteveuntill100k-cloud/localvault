import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { OrganizationEngine } from '../../src/core/organizer.js';
import { FileRecord } from '../../src/core/types.js';

describe('OrganizationEngine', () => {
  let db: LocalVaultDatabase;
  let organizer: OrganizationEngine;
  let sourceDir: string;
  let targetDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    organizer = new OrganizationEngine(db);

    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-org-src-'));
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-org-tgt-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('creates plan, previews actions, enforces confirmation, and executes moves', async () => {
    // Create source files
    const file1Path = path.join(sourceDir, 'photo.jpg');
    const file2Path = path.join(sourceDir, 'report.pdf');
    fs.writeFileSync(file1Path, 'jpeg-content');
    fs.writeFileSync(file2Path, 'pdf-content');

    const rec1: FileRecord = {
      id: 'f1',
      path: file1Path,
      filename: 'photo.jpg',
      extension: '.jpg',
      category: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: fs.statSync(file1Path).size,
      mtimeMs: 100,
      ctimeMs: 100,
      sha256: crypto.createHash('sha256').update('jpeg-content').digest('hex'),
      indexedAt: 100,
      status: 'ACTIVE'
    };
    const rec2: FileRecord = {
      id: 'f2',
      path: file2Path,
      filename: 'report.pdf',
      extension: '.pdf',
      category: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: fs.statSync(file2Path).size,
      mtimeMs: 200,
      ctimeMs: 200,
      sha256: crypto.createHash('sha256').update('pdf-content').digest('hex'),
      indexedAt: 200,
      status: 'ACTIVE'
    };

    db.upsertFile(rec1);
    db.upsertFile(rec2);

    // 1. Create plan
    const plan = organizer.createPlan({
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });

    expect(plan.status).toBe('PENDING');
    expect(plan.actions.length).toBe(2);

    // 2. Preview
    const preview = organizer.previewPlan(plan.id);
    expect(preview.actions.map((a) => a.destinationPath)).toEqual([
      path.join(targetDir, 'IMAGE', 'photo.jpg'),
      path.join(targetDir, 'DOCUMENT', 'report.pdf')
    ]);

    // 3. Execution without confirmation fails closed!
    await expect(organizer.executePlan(plan.id, false)).rejects.toThrow(
      'Explicit user confirmation required'
    );

    // 4. Execution with confirmation moves files
    const execResult = await organizer.executePlan(plan.id, true);
    expect(execResult.executedCount).toBe(2);
    expect(execResult.failedCount).toBe(0);

    // Verify source files are moved
    expect(fs.existsSync(file1Path)).toBe(false);
    expect(fs.existsSync(file2Path)).toBe(false);

    // Verify target files exist
    const tgtPhoto = path.join(targetDir, 'IMAGE', 'photo.jpg');
    const tgtReport = path.join(targetDir, 'DOCUMENT', 'report.pdf');
    expect(fs.existsSync(tgtPhoto)).toBe(true);
    expect(fs.existsSync(tgtReport)).toBe(true);

    // Verify database path updated
    expect(db.getFileById('f1')?.path).toBe(tgtPhoto);
    expect(db.getFileById('f2')?.path).toBe(tgtReport);

    // 5. Test Rollback!
    const rollbackResult = await organizer.rollbackBatch(execResult.batchId);
    expect(rollbackResult.restoredCount).toBe(2);
    expect(rollbackResult.failedCount).toBe(0);

    // Files restored to original locations
    expect(fs.existsSync(file1Path)).toBe(true);
    expect(fs.existsSync(file2Path)).toBe(true);
    expect(fs.existsSync(tgtPhoto)).toBe(false);
    expect(fs.existsSync(tgtReport)).toBe(false);

    // Database restored
    expect(db.getFileById('f1')?.path).toBe(file1Path);
    expect(db.getFileById('f2')?.path).toBe(file2Path);
  });

  it('correctly filters and stages stale files with STALE_ARCHIVE strategy', async () => {
    const freshPath = path.join(sourceDir, 'fresh.txt');
    const stalePath = path.join(sourceDir, 'stale.txt');
    fs.writeFileSync(freshPath, 'fresh-content');
    fs.writeFileSync(stalePath, 'stale-content');

    const now = Date.now();
    const staleTime = now - 150 * 24 * 60 * 60 * 1000; // 150 days ago

    db.upsertFile({
      id: 'f-fresh',
      path: freshPath,
      filename: 'fresh.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 13,
      mtimeMs: now,
      ctimeMs: now,
      sha256: 'h-fresh',
      indexedAt: now,
      status: 'ACTIVE'
    });

    db.upsertFile({
      id: 'f-stale',
      path: stalePath,
      filename: 'stale.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 13,
      mtimeMs: staleTime,
      ctimeMs: staleTime,
      sha256: 'h-stale',
      indexedAt: now,
      status: 'ACTIVE'
    });

    const plan = organizer.createPlan({
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      strategy: 'STALE_ARCHIVE',
      staleDays: 90
    });

    // Only the stale file should be included in the plan
    expect(plan.actions.length).toBe(1);
    expect(plan.actions[0].fileId).toBe('f-stale');
    expect(plan.actions[0].destinationPath).toBe(
      path.join(targetDir, 'Stale_Archive', 'DOCUMENT', 'stale.txt')
    );
  });
});
