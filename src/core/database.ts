import { createRequire } from 'node:module';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
import { FileRecord, LicenseInfo, LicenseTier, OperationRecord, OrganizationPlan, ProposedAction } from './types.js';

export class LocalVaultDatabase {
  private db: DatabaseSyncType;

  constructor(dbPath: string = ':memory:') {
    this.db = new DatabaseSync(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec('PRAGMA foreign_keys = ON;');
    // In on-disk mode, enable WAL for concurrency
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
    } catch {
      // Memory db ignores journal_mode WAL
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        extension TEXT NOT NULL,
        category TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        mtime_ms INTEGER NOT NULL,
        ctime_ms INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE INDEX IF NOT EXISTS idx_files_sha256 ON files(sha256);
      CREATE INDEX IF NOT EXISTS idx_files_size ON files(size_bytes);
      CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
      CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);
      CREATE INDEX IF NOT EXISTS idx_files_mtime ON files(mtime_ms);
      CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);

      CREATE TABLE IF NOT EXISTS organization_plans (
        id TEXT PRIMARY KEY,
        strategy TEXT NOT NULL,
        source_directory TEXT NOT NULL,
        target_directory TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        confirmed_at INTEGER,
        status TEXT NOT NULL,
        actions_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS operation_history (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        plan_id TEXT,
        operation_type TEXT NOT NULL,
        source_path TEXT NOT NULL,
        destination_path TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_history_batch_id ON operation_history(batch_id);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON operation_history(timestamp);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  // --- File Operations ---

  upsertFile(file: FileRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO files (
        id, path, filename, extension, category, mime_type,
        size_bytes, mtime_ms, ctime_ms, sha256, indexed_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        filename = excluded.filename,
        extension = excluded.extension,
        category = excluded.category,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        mtime_ms = excluded.mtime_ms,
        ctime_ms = excluded.ctime_ms,
        sha256 = excluded.sha256,
        indexed_at = excluded.indexed_at,
        status = excluded.status;
    `);

    stmt.run(
      file.id,
      file.path,
      file.filename,
      file.extension,
      file.category,
      file.mimeType,
      file.sizeBytes,
      file.mtimeMs,
      file.ctimeMs,
      file.sha256,
      file.indexedAt,
      file.status
    );
  }

  getFileById(id: string): FileRecord | null {
    const stmt = this.db.prepare('SELECT * FROM files WHERE id = ?');
    const row = stmt.get(id) as Record<string, any> | undefined;
    return row ? this.mapRowToFile(row) : null;
  }

  getFileByPath(path: string): FileRecord | null {
    const stmt = this.db.prepare('SELECT * FROM files WHERE path = ?');
    const row = stmt.get(path) as Record<string, any> | undefined;
    return row ? this.mapRowToFile(row) : null;
  }

  getAllFiles(status: string = 'ACTIVE'): FileRecord[] {
    const stmt = this.db.prepare('SELECT * FROM files WHERE status = ? ORDER BY path ASC');
    const rows = stmt.all(status) as Record<string, any>[];
    return rows.map((r) => this.mapRowToFile(r));
  }

  updateFileStatus(id: string, status: 'ACTIVE' | 'MOVED' | 'MISSING'): void {
    const stmt = this.db.prepare('UPDATE files SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  updateFilePath(id: string, newPath: string, newFilename: string): void {
    const stmt = this.db.prepare('UPDATE files SET path = ?, filename = ? WHERE id = ?');
    stmt.run(newPath, newFilename, id);
  }

  // --- Duplicate Queries ---

  getDuplicateHashes(): { sha256: string; sizeBytes: number; count: number }[] {
    const stmt = this.db.prepare(`
      SELECT sha256, size_bytes as sizeBytes, COUNT(*) as count
      FROM files
      WHERE status = 'ACTIVE' AND size_bytes > 0
      GROUP BY sha256, size_bytes
      HAVING count > 1
      ORDER BY (size_bytes * count) DESC;
    `);
    return stmt.all() as any[];
  }

  getFilesByHash(sha256: string): FileRecord[] {
    const stmt = this.db.prepare(
      "SELECT * FROM files WHERE sha256 = ? AND status = 'ACTIVE' ORDER BY mtime_ms ASC"
    );
    const rows = stmt.all(sha256) as Record<string, any>[];
    return rows.map((r) => this.mapRowToFile(r));
  }

  // --- Organization Plans ---

  savePlan(plan: OrganizationPlan): void {
    const stmt = this.db.prepare(`
      INSERT INTO organization_plans (
        id, strategy, source_directory, target_directory, created_at, confirmed_at, status, actions_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        confirmed_at = excluded.confirmed_at,
        status = excluded.status,
        actions_json = excluded.actions_json;
    `);

    stmt.run(
      plan.id,
      plan.strategy,
      plan.sourceDirectory,
      plan.targetDirectory,
      plan.createdAt,
      plan.confirmedAt || null,
      plan.status,
      JSON.stringify(plan.actions)
    );
  }

  getPlan(id: string): OrganizationPlan | null {
    const stmt = this.db.prepare('SELECT * FROM organization_plans WHERE id = ?');
    const row = stmt.get(id) as Record<string, any> | undefined;
    if (!row) return null;

    return {
      id: row.id,
      strategy: row.strategy,
      sourceDirectory: row.source_directory,
      targetDirectory: row.target_directory,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at || undefined,
      status: row.status,
      actions: JSON.parse(row.actions_json) as ProposedAction[]
    };
  }

  // --- Operation History ---

  logOperation(record: OperationRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO operation_history (
        id, batch_id, plan_id, operation_type, source_path, destination_path,
        sha256, size_bytes, status, error, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.batchId,
      record.planId || null,
      record.operationType,
      record.sourcePath,
      record.destinationPath,
      record.sha256,
      record.sizeBytes,
      record.status,
      record.error || null,
      record.timestamp
    );
  }

  getHistoryByBatchId(batchId: string): OperationRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM operation_history WHERE batch_id = ? ORDER BY timestamp DESC'
    );
    const rows = stmt.all(batchId) as Record<string, any>[];
    return rows.map((r) => this.mapRowToHistory(r));
  }

  getAllHistory(limit: number = 100): OperationRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM operation_history ORDER BY timestamp DESC LIMIT ?'
    );
    const rows = stmt.all(limit) as Record<string, any>[];
    return rows.map((r) => this.mapRowToHistory(r));
  }

  // --- Transactions ---

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  // --- Settings & License ---

  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `);
    stmt.run(key, value);
  }

  getLicense(): LicenseInfo {
    const rawTier = (this.getSetting('license_tier') || 'COMMUNITY').toUpperCase() as LicenseTier;
    const tier: LicenseTier = ['COMMUNITY', 'PRO', 'TEAM'].includes(rawTier) ? rawTier : 'COMMUNITY';
    const key = this.getSetting('license_key') || undefined;
    const activatedAt = Number(this.getSetting('license_activated_at')) || Date.now();

    const isPro = tier === 'PRO' || tier === 'TEAM';

    return {
      tier,
      licenseKey: key,
      status: 'ACTIVE',
      activatedAt,
      features: {
        unlimitedFiles: isPro,
        sha256Deduplication: true,
        automatedRollback: true,
        batchOrganization: true,
        exportReports: true,
        priorityIndexing: isPro,
        staleArchive: isPro,
        airgappedZeroTelemetry: true
      },
      telemetry: {
        enabled: false,
        cloudSync: false,
        mode: '100% Offline Airgapped'
      }
    };
  }

  setLicense(tier: LicenseTier, key?: string): LicenseInfo {
    this.setSetting('license_tier', tier);
    if (key) {
      this.setSetting('license_key', key);
    }
    this.setSetting('license_activated_at', String(Date.now()));
    return this.getLicense();
  }

  vacuum(): void {
    this.db.exec('VACUUM;');
  }

  getDatabaseStats(): {
    totalFiles: number;
    activeFiles: number;
    historyCount: number;
    plansCount: number;
  } {
    const totalFilesRow = this.db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };
    const activeFilesRow = this.db.prepare("SELECT COUNT(*) as count FROM files WHERE status = 'ACTIVE'").get() as { count: number };
    const historyRow = this.db.prepare('SELECT COUNT(*) as count FROM operation_history').get() as { count: number };
    const plansRow = this.db.prepare('SELECT COUNT(*) as count FROM organization_plans').get() as { count: number };

    return {
      totalFiles: Number(totalFilesRow?.count || 0),
      activeFiles: Number(activeFilesRow?.count || 0),
      historyCount: Number(historyRow?.count || 0),
      plansCount: Number(plansRow?.count || 0)
    };
  }

  close(): void {
    this.db.close();
  }

  private mapRowToFile(row: Record<string, any>): FileRecord {
    return {
      id: row.id,
      path: row.path,
      filename: row.filename,
      extension: row.extension,
      category: row.category,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      mtimeMs: Number(row.mtime_ms),
      ctimeMs: Number(row.ctime_ms),
      sha256: row.sha256,
      indexedAt: Number(row.indexed_at),
      status: row.status
    };
  }

  private mapRowToHistory(row: Record<string, any>): OperationRecord {
    return {
      id: row.id,
      batchId: row.batch_id,
      planId: row.plan_id || undefined,
      operationType: row.operation_type,
      sourcePath: row.source_path,
      destinationPath: row.destination_path,
      sha256: row.sha256,
      sizeBytes: Number(row.size_bytes),
      status: row.status,
      error: row.error || undefined,
      timestamp: Number(row.timestamp)
    };
  }
}
