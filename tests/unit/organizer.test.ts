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

  it('safely handles in-flight name collisions across nested directories without overwriting', async () => {
    const dirA = path.join(sourceDir, 'folder_a');
    const dirB = path.join(sourceDir, 'folder_b');
    fs.mkdirSync(dirA, { recursive: true });
    fs.mkdirSync(dirB, { recursive: true });

    const fileA = path.join(dirA, 'notes.txt');
    const fileB = path.join(dirB, 'notes.txt');
    fs.writeFileSync(fileA, 'content from folder A');
    fs.writeFileSync(fileB, 'content from folder B');

    db.upsertFile({
      id: 'f-notes-a',
      path: fileA,
      filename: 'notes.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: fs.statSync(fileA).size,
      mtimeMs: 1000,
      ctimeMs: 1000,
      sha256: 'h-notes-a',
      indexedAt: 1000,
      status: 'ACTIVE'
    });

    db.upsertFile({
      id: 'f-notes-b',
      path: fileB,
      filename: 'notes.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: fs.statSync(fileB).size,
      mtimeMs: 2000,
      ctimeMs: 2000,
      sha256: 'h-notes-b',
      indexedAt: 2000,
      status: 'ACTIVE'
    });

    const plan = organizer.createPlan({
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });

    expect(plan.actions.length).toBe(2);
    const dest1 = plan.actions[0].destinationPath;
    const dest2 = plan.actions[1].destinationPath;

    // Both actions MUST have distinct destination paths to prevent data loss!
    expect(dest1).not.toBe(dest2);
    expect(dest2).toBe(path.join(targetDir, 'DOCUMENT', 'notes_1.txt'));

    // Execute plan
    const execRes = await organizer.executePlan(plan.id, true);
    expect(execRes.executedCount).toBe(2);
    expect(execRes.failedCount).toBe(0);

    // Verify both files exist and retain original distinct contents
    expect(fs.readFileSync(dest1, 'utf-8')).toBe('content from folder A');
    expect(fs.readFileSync(dest2, 'utf-8')).toBe('content from folder B');

    // Rollback and verify both files restored to original locations
    const rollRes = await organizer.rollbackBatch(execRes.batchId);
    expect(rollRes.restoredCount).toBe(2);
    expect(fs.readFileSync(fileA, 'utf-8')).toBe('content from folder A');
    expect(fs.readFileSync(fileB, 'utf-8')).toBe('content from folder B');
  });

  it('consolidates only redundant duplicate copies while preserving original and unique files', async () => {
    const origPath = path.join(sourceDir, 'original.jpg');
    const dupPath = path.join(sourceDir, 'duplicate_copy.jpg');
    const uniquePath = path.join(sourceDir, 'unique.png');

    fs.writeFileSync(origPath, 'image-bits');
    fs.writeFileSync(dupPath, 'image-bits');
    fs.writeFileSync(uniquePath, 'unique-bits');

    const dupHash = 'shared-img-hash';
    db.upsertFile({
      id: 'f-orig',
      path: origPath,
      filename: 'original.jpg',
      extension: '.jpg',
      category: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 10,
      mtimeMs: 100, // Older: primary
      ctimeMs: 100,
      sha256: dupHash,
      indexedAt: 100,
      status: 'ACTIVE'
    });

    db.upsertFile({
      id: 'f-dup',
      path: dupPath,
      filename: 'duplicate_copy.jpg',
      extension: '.jpg',
      category: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 10,
      mtimeMs: 200, // Newer: redundant copy
      ctimeMs: 200,
      sha256: dupHash,
      indexedAt: 200,
      status: 'ACTIVE'
    });

    db.upsertFile({
      id: 'f-unique',
      path: uniquePath,
      filename: 'unique.png',
      extension: '.png',
      category: 'IMAGE',
      mimeType: 'image/png',
      sizeBytes: 11,
      mtimeMs: 300,
      ctimeMs: 300,
      sha256: 'unique-hash',
      indexedAt: 300,
      status: 'ACTIVE'
    });

    const plan = organizer.createPlan({
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      strategy: 'DEDUPLICATE_CONSOLIDATE'
    });

    // ONLY the duplicate copy should be staged for moving!
    expect(plan.actions.length).toBe(1);
    expect(plan.actions[0].fileId).toBe('f-dup');
    expect(plan.actions[0].destinationPath).toBe(
      path.join(targetDir, 'Duplicates_Archive', 'IMAGE', 'duplicate_copy.jpg')
    );

    // Execute
    const execRes = await organizer.executePlan(plan.id, true);
    expect(execRes.executedCount).toBe(1);

    // Original and unique remain in sourceDir; only duplicate moved to targetDir
    expect(fs.existsSync(origPath)).toBe(true);
    expect(fs.existsSync(uniquePath)).toBe(true);
    expect(fs.existsSync(dupPath)).toBe(false);
    expect(fs.existsSync(plan.actions[0].destinationPath)).toBe(true);
  });

  it('guards against destination file appearance before execution without data loss', async () => {
    const srcFile = path.join(sourceDir, 'clash.txt');
    fs.writeFileSync(srcFile, 'my source data');

    db.upsertFile({
      id: 'f-clash',
      path: srcFile,
      filename: 'clash.txt',
      extension: '.txt',
      category: 'DOCUMENT',
      mimeType: 'text/plain',
      sizeBytes: 14,
      mtimeMs: 100,
      ctimeMs: 100,
      sha256: 'h-clash',
      indexedAt: 100,
      status: 'ACTIVE'
    });

    const plan = organizer.createPlan({
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });

    // INJECT TOCTOU: external process creates a file at planned destination before execution!
    const destDir = path.join(targetDir, 'DOCUMENT');
    fs.mkdirSync(destDir, { recursive: true });
    const preExistingTarget = path.join(destDir, 'clash.txt');
    fs.writeFileSync(preExistingTarget, 'pre-existing file that must not be overwritten');

    const execRes = await organizer.executePlan(plan.id, true);
    expect(execRes.executedCount).toBe(1);

    // Pre-existing file is safe!
    expect(fs.readFileSync(preExistingTarget, 'utf-8')).toBe(
      'pre-existing file that must not be overwritten'
    );
    // Source file moved to safe non-conflicting path
    const resolvedPath = path.join(destDir, 'clash_1.txt');
    expect(fs.existsSync(resolvedPath)).toBe(true);
    expect(fs.readFileSync(resolvedPath, 'utf-8')).toBe('my source data');
  });
});
