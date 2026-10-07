import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalVaultDatabase } from '../../src/core/database.js';
import { FileRecord, OperationRecord, OrganizationPlan } from '../../src/core/types.js';

describe('LocalVaultDatabase', () => {
  let db: LocalVaultDatabase;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('upserts and retrieves files by ID and path', () => {
    const file: FileRecord = {
      id: 'f-1',
      path: '/data/photo.jpg',
      filename: 'photo.jpg',
      extension: '.jpg',
      category: 'IMAGE',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      mtimeMs: 1000,
      ctimeMs: 900,
      sha256: 'deadbeef123',
      indexedAt: 2000,
      status: 'ACTIVE'
    };

    db.upsertFile(file);

    const retrieved = db.getFileById('f-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe('photo.jpg');
    expect(retrieved?.sizeBytes).toBe(1024);

    const byPath = db.getFileByPath('/data/photo.jpg');
    expect(byPath?.id).toBe('f-1');
  });

  it('updates file status and path on organization', () => {
    const file: FileRecord = {
      id: 'f-2',
      path: '/orig/doc.pdf',
      filename: 'doc.pdf',
      extension: '.pdf',
      category: 'DOCUMENT',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      mtimeMs: 1500,
      ctimeMs: 1400,
      sha256: 'cafebabe456',
      indexedAt: 2500,
      status: 'ACTIVE'
    };

    db.upsertFile(file);
    db.updateFilePath('f-2', '/new/Documents/doc.pdf', 'doc.pdf');

    const updated = db.getFileById('f-2');
    expect(updated?.path).toBe('/new/Documents/doc.pdf');

    db.updateFileStatus('f-2', 'MOVED');
    expect(db.getFileById('f-2')?.status).toBe('MOVED');
  });

  it('persists and retrieves organization plans', () => {
    const plan: OrganizationPlan = {
      id: 'plan-100',
      strategy: 'BY_CATEGORY',
      sourceDirectory: '/source',
      targetDirectory: '/target',
      createdAt: 123456,
      status: 'PENDING',
      actions: [
        {
          id: 'act-1',
          fileId: 'f-2',
          sourcePath: '/source/doc.pdf',
          destinationPath: '/target/DOCUMENT/doc.pdf',
          category: 'DOCUMENT',
          sizeBytes: 2048,
          sha256: 'cafebabe456',
          actionType: 'MOVE',
          status: 'PLANNED'
        }
      ]
    };

    db.savePlan(plan);
    const loaded = db.getPlan('plan-100');
    expect(loaded).not.toBeNull();
    expect(loaded?.strategy).toBe('BY_CATEGORY');
    expect(loaded?.actions.length).toBe(1);
    expect(loaded?.actions[0].sourcePath).toBe('/source/doc.pdf');
  });

  it('logs and queries operation history', () => {
    const record: OperationRecord = {
      id: 'op-1',
      batchId: 'batch-99',
      planId: 'plan-100',
      operationType: 'MOVE',
      sourcePath: '/source/doc.pdf',
      destinationPath: '/target/DOCUMENT/doc.pdf',
      sha256: 'cafebabe456',
      sizeBytes: 2048,
      status: 'SUCCESS',
      timestamp: 999999
    };

    db.logOperation(record);
    const history = db.getHistoryByBatchId('batch-99');
    expect(history.length).toBe(1);
    expect(history[0].sourcePath).toBe('/source/doc.pdf');
    expect(history[0].status).toBe('SUCCESS');
  });

  it('rolls back database transactions on failure', () => {
    expect(() => {
      db.transaction(() => {
        db.upsertFile({
          id: 'tx-1',
          path: '/tx/a.txt',
          filename: 'a.txt',
          extension: '.txt',
          category: 'DOCUMENT',
          mimeType: 'text/plain',
          sizeBytes: 10,
          mtimeMs: 1,
          ctimeMs: 1,
          sha256: 'h1',
          indexedAt: 1,
          status: 'ACTIVE'
        });
        throw new Error('Transaction abort');
      });
    }).toThrow('Transaction abort');

    expect(db.getFileById('tx-1')).toBeNull();
  });
});
