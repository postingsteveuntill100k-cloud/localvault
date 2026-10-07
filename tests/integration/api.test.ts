import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createApp } from '../../src/server/app.js';
import { LocalVaultDatabase } from '../../src/core/database.js';

describe('LocalVault REST API Integration', () => {
  let db: LocalVaultDatabase;
  let app: any;
  let testDir: string;
  let targetDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    app = createApp(db);

    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-api-test-src-'));
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-api-test-tgt-'));

    // Populate test files
    fs.writeFileSync(path.join(testDir, 'doc1.pdf'), 'content-pdf-identical');
    fs.writeFileSync(path.join(testDir, 'doc2.pdf'), 'content-pdf-identical'); // Duplicate
    fs.writeFileSync(path.join(testDir, 'image.png'), 'image-bytes');
  });

  afterEach(() => {
    db.close();
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('GET /api/health returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.indexedFiles).toBe(0);
  });

  it('GET /dashboard renders the dashboard UI', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toContain('LocalVault 🔒');
    expect(res.text).toContain('Safe Reversible Organization Engine');
  });

  it('POST /api/index indexes directories and GET /api/files returns indexed files', async () => {
    const indexRes = await request(app)
      .post('/api/index')
      .send({ directoryPath: testDir });

    expect(indexRes.status).toBe(200);
    expect(indexRes.body.indexed).toBe(3);

    const listRes = await request(app).get('/api/files');
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(3);

    // Search query test by category
    const searchRes = await request(app).get('/api/files?category=IMAGE');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.total).toBe(1);
    expect(searchRes.body.files[0].filename).toBe('image.png');

    // Search query test by hash
    const imgHash = searchRes.body.files[0].sha256;
    const hashRes = await request(app).get(`/api/files?hash=${imgHash}`);
    expect(hashRes.status).toBe(200);
    expect(hashRes.body.total).toBe(1);
    expect(hashRes.body.files[0].filename).toBe('image.png');
  });

  it('GET /api/duplicates detects exact duplicates', async () => {
    await request(app).post('/api/index').send({ directoryPath: testDir });

    const dupRes = await request(app).get('/api/duplicates');
    expect(dupRes.status).toBe(200);
    expect(dupRes.body.groups.length).toBe(1);
    expect(dupRes.body.groups[0].fileCount).toBe(2);
    expect(dupRes.body.totalDuplicateFiles).toBe(2);
  });

  it('Full Organization Lifecycle: Plan -> Preview -> Confirm & Execute -> Rollback', async () => {
    await request(app).post('/api/index').send({ directoryPath: testDir });

    // 1. Plan
    const planRes = await request(app).post('/api/organize/plan').send({
      sourceDirectory: testDir,
      targetDirectory: targetDir,
      strategy: 'BY_CATEGORY'
    });
    expect(planRes.status).toBe(200);
    const planId = planRes.body.plan.id;

    // 2. Preview
    const previewRes = await request(app).get(`/api/organize/plan/${planId}`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.plan.actions.length).toBe(3);

    // 3. Execute without confirm fails
    const failExec = await request(app)
      .post('/api/organize/execute')
      .send({ planId, confirm: false });
    expect(failExec.status).toBe(400);

    // 4. Execute with confirm succeeds
    const execRes = await request(app)
      .post('/api/organize/execute')
      .send({ planId, confirm: true });
    expect(execRes.status).toBe(200);
    expect(execRes.body.executedCount).toBe(3);
    const batchId = execRes.body.batchId;

    // Verify files moved to target directories
    expect(fs.existsSync(path.join(targetDir, 'IMAGE', 'image.png'))).toBe(true);

    // 5. History recorded
    const historyRes = await request(app).get('/api/history');
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.history.length).toBe(3);

    // 6. Rollback
    const rollbackRes = await request(app).post(`/api/organize/rollback/${batchId}`);
    expect(rollbackRes.status).toBe(200);
    expect(rollbackRes.body.restoredCount).toBe(3);

    // Files restored to testDir
    expect(fs.existsSync(path.join(testDir, 'image.png'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'IMAGE', 'image.png'))).toBe(false);
  });

  it('GET /api/reports/summary returns analytical breakdown', async () => {
    await request(app).post('/api/index').send({ directoryPath: testDir });

    const repRes = await request(app).get('/api/reports/summary');
    expect(repRes.status).toBe(200);
    expect(repRes.body.totalFiles).toBe(3);
    expect(repRes.body.categoryBreakdown.DOCUMENT.count).toBe(2);
    expect(repRes.body.categoryBreakdown.IMAGE.count).toBe(1);
    expect(repRes.body.recentlyModifiedFiles).toBeDefined();
    expect(repRes.body.recentlyModifiedFiles.length).toBe(3);
  });

  it('GET /api/export supports both JSON and CSV formats', async () => {
    await request(app).post('/api/index').send({ directoryPath: testDir });

    const jsonRes = await request(app).get('/api/export?format=json');
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.totalFiles).toBe(3);

    const csvRes = await request(app).get('/api/export?format=csv');
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('id,path,filename,extension,category');
    expect(csvRes.text).toContain('doc1.pdf');
  });
});
