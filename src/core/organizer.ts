import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { LocalVaultDatabase } from './database.js';
import { HistoryManager } from './history.js';
import { PathSecurity } from './security.js';
import {
  FileCategory,
  FileRecord,
  OperationRecord,
  OrganizationPlan,
  OrganizationStrategy,
  ProposedAction
} from './types.js';

export class OrganizationEngine {
  private db: LocalVaultDatabase;
  private history: HistoryManager;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
    this.history = new HistoryManager(db);
  }

  /**
   * Generates an Organization Plan without executing any filesystem mutations.
   */
  createPlan(params: {
    sourceDirectory: string;
    targetDirectory: string;
    strategy: OrganizationStrategy;
    categoryFilter?: FileCategory;
    staleDays?: number;
  }): OrganizationPlan {
    const { sourceDirectory, targetDirectory, strategy, categoryFilter, staleDays = 90 } = params;

    const normalSource = PathSecurity.normalize(sourceDirectory);
    const normalTarget = PathSecurity.normalize(targetDirectory);
    const staleThresholdMs = Date.now() - staleDays * 24 * 60 * 60 * 1000;

    let candidateFiles = this.db.getAllFiles('ACTIVE').filter((f) => {
      if (!f.path.startsWith(normalSource)) return false;
      if (categoryFilter && f.category !== categoryFilter) return false;
      if (strategy === 'STALE_ARCHIVE' && f.mtimeMs >= staleThresholdMs) return false;
      return true;
    });

    if (strategy === 'DEDUPLICATE_CONSOLIDATE') {
      // Find duplicate hashes
      const dupHashes = new Set(this.db.getDuplicateHashes().map((h) => h.sha256));
      const dupFiles = candidateFiles.filter((f) => dupHashes.has(f.sha256));

      // Group by hash
      const grouped = new Map<string, FileRecord[]>();
      for (const f of dupFiles) {
        if (!grouped.has(f.sha256)) grouped.set(f.sha256, []);
        grouped.get(f.sha256)!.push(f);
      }

      // For each duplicate group, keep earliest original in place; consolidate secondary copies
      const filesToConsolidate: FileRecord[] = [];
      for (const group of grouped.values()) {
        group.sort((a, b) => a.mtimeMs - b.mtimeMs);
        for (let i = 1; i < group.length; i++) {
          filesToConsolidate.push(group[i]);
        }
      }
      candidateFiles = filesToConsolidate;
    }

    const actions: ProposedAction[] = [];
    const reservedPaths = new Set<string>();

    for (const file of candidateFiles) {
      let destDir = normalTarget;

      if (strategy === 'BY_CATEGORY') {
        destDir = path.join(normalTarget, file.category);
      } else if (strategy === 'BY_DATE') {
        const date = new Date(file.mtimeMs);
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0');
        destDir = path.join(normalTarget, year, month);
      } else if (strategy === 'DEDUPLICATE_CONSOLIDATE') {
        destDir = path.join(normalTarget, 'Duplicates_Archive', file.category);
      } else if (strategy === 'STALE_ARCHIVE') {
        destDir = path.join(normalTarget, 'Stale_Archive', file.category);
      }

      const initialDestination = path.join(destDir, file.filename);
      // Determine collision safety against disk and other plan actions
      const resolvedDestination = PathSecurity.resolveCollisionSafely(initialDestination, reservedPaths);
      reservedPaths.add(resolvedDestination);

      actions.push({
        id: crypto.randomUUID(),
        fileId: file.id,
        sourcePath: file.path,
        destinationPath: resolvedDestination,
        category: file.category,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256,
        actionType: 'MOVE',
        collisionResolvedPath:
          resolvedDestination !== initialDestination ? resolvedDestination : undefined,
        status: 'PLANNED'
      });
    }

    const plan: OrganizationPlan = {
      id: crypto.randomUUID(),
      strategy,
      sourceDirectory: normalSource,
      targetDirectory: normalTarget,
      createdAt: Date.now(),
      status: 'PENDING',
      actions
    };

    this.db.savePlan(plan);
    return plan;
  }

  /**
   * Preview an existing plan.
   */
  previewPlan(planId: string): OrganizationPlan {
    const plan = this.db.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan '${planId}' not found`);
    }
    return plan;
  }

  /**
   * Executes a confirmed plan.
   * STRICT SAFETY: Requires explicit confirmation parameter.
   */
  async executePlan(
    planId: string,
    confirm: boolean = false
  ): Promise<{
    batchId: string;
    executedCount: number;
    failedCount: number;
    actions: ProposedAction[];
    errors: string[];
  }> {
    if (!confirm) {
      throw new Error(
        'ORGANIZATION SAFETY REJECTION: Explicit user confirmation required to execute plan.'
      );
    }

    const plan = this.db.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan '${planId}' not found`);
    }

    if (plan.status !== 'PENDING') {
      throw new Error(`Plan '${planId}' is already in status '${plan.status}'`);
    }

    const batchId = crypto.randomUUID();
    let executedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const action of plan.actions) {
      try {
        // TOCTOU check 1: Source exists
        if (!fs.existsSync(action.sourcePath)) {
          throw new Error(`Source file missing: ${action.sourcePath}`);
        }

        // TOCTOU check 2: Verify size hasn't changed unexpectedly
        const currentStat = await fsp.stat(action.sourcePath);
        if (currentStat.size !== action.sizeBytes) {
          throw new Error(
            `Source file modified during planning: size changed from ${action.sizeBytes} to ${currentStat.size}`
          );
        }

        // TOCTOU check 3: Guard against destination collision if a file appeared since planning
        let actualDestination = action.destinationPath;
        if (fs.existsSync(actualDestination) && actualDestination !== action.sourcePath) {
          actualDestination = PathSecurity.resolveCollisionSafely(actualDestination);
          action.destinationPath = actualDestination;
          action.collisionResolvedPath = actualDestination;
        }

        // Ensure target directory exists
        const destDir = path.dirname(actualDestination);
        await fsp.mkdir(destDir, { recursive: true });

        // Atomic move with cross-filesystem copy fallback
        try {
          await fsp.rename(action.sourcePath, actualDestination);
        } catch (renameErr: any) {
          if (renameErr.code === 'EXDEV') {
            await fsp.copyFile(action.sourcePath, actualDestination);
            await fsp.unlink(action.sourcePath);
          } else {
            throw renameErr;
          }
        }

        // Update database file record
        const newFilename = path.basename(actualDestination);
        this.db.updateFilePath(action.fileId, actualDestination, newFilename);

        action.status = 'EXECUTED';
        executedCount++;

        // Log operation history
        this.history.log({
          id: crypto.randomUUID(),
          batchId,
          planId: plan.id,
          operationType: 'MOVE',
          sourcePath: action.sourcePath,
          destinationPath: actualDestination,
          sha256: action.sha256,
          sizeBytes: action.sizeBytes,
          status: 'SUCCESS',
          timestamp: Date.now()
        });
      } catch (err: any) {
        action.status = 'FAILED';
        action.error = err.message;
        failedCount++;
        errors.push(`${action.sourcePath}: ${err.message}`);

        this.history.log({
          id: crypto.randomUUID(),
          batchId,
          planId: plan.id,
          operationType: 'MOVE',
          sourcePath: action.sourcePath,
          destinationPath: action.destinationPath,
          sha256: action.sha256,
          sizeBytes: action.sizeBytes,
          status: 'FAILED',
          error: err.message,
          timestamp: Date.now()
        });
      }
    }

    plan.status = 'EXECUTED';
    plan.confirmedAt = Date.now();
    this.db.savePlan(plan);

    return {
      batchId,
      executedCount,
      failedCount,
      actions: plan.actions,
      errors
    };
  }

  /**
   * Reverses (rolls back) all operations performed in a batch.
   * Moves files back from destination to their exact original source paths.
   */
  async rollbackBatch(batchId: string): Promise<{
    batchId: string;
    restoredCount: number;
    failedCount: number;
    errors: string[];
  }> {
    const historyEntries = this.history.getBatchHistory(batchId);
    if (!historyEntries || historyEntries.length === 0) {
      throw new Error(`No history records found for batchId '${batchId}'`);
    }

    let restoredCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const rollbackBatchId = crypto.randomUUID();

    // Process successfully moved items in reverse order
    const successfulMoves = historyEntries.filter((h) => h.status === 'SUCCESS' && h.operationType === 'MOVE');

    for (const record of successfulMoves) {
      try {
        if (!fs.existsSync(record.destinationPath)) {
          throw new Error(`File at '${record.destinationPath}' not found for rollback`);
        }

        let targetRollback = record.sourcePath;
        if (fs.existsSync(targetRollback) && targetRollback !== record.destinationPath) {
          targetRollback = PathSecurity.resolveCollisionSafely(targetRollback);
        }

        const sourceDir = path.dirname(targetRollback);
        await fsp.mkdir(sourceDir, { recursive: true });

        try {
          await fsp.rename(record.destinationPath, targetRollback);
        } catch (renameErr: any) {
          if (renameErr.code === 'EXDEV') {
            await fsp.copyFile(record.destinationPath, targetRollback);
            await fsp.unlink(record.destinationPath);
          } else {
            throw renameErr;
          }
        }

        // Find file record by destination path and update back to source path
        const file = this.db.getFileByPath(record.destinationPath);
        if (file) {
          const originalFilename = path.basename(targetRollback);
          this.db.updateFilePath(file.id, targetRollback, originalFilename);
        }

        restoredCount++;

        this.history.log({
          id: crypto.randomUUID(),
          batchId: rollbackBatchId,
          planId: record.planId,
          operationType: 'ROLLBACK',
          sourcePath: record.destinationPath,
          destinationPath: targetRollback,
          sha256: record.sha256,
          sizeBytes: record.sizeBytes,
          status: 'SUCCESS',
          timestamp: Date.now()
        });
      } catch (err: any) {
        failedCount++;
        errors.push(`${record.destinationPath} -> ${record.sourcePath}: ${err.message}`);

        this.history.log({
          id: crypto.randomUUID(),
          batchId: rollbackBatchId,
          planId: record.planId,
          operationType: 'ROLLBACK',
          sourcePath: record.destinationPath,
          destinationPath: record.sourcePath,
          sha256: record.sha256,
          sizeBytes: record.sizeBytes,
          status: 'FAILED',
          error: err.message,
          timestamp: Date.now()
        });
      }
    }

    // Update plan status if applicable
    if (successfulMoves.length > 0 && successfulMoves[0].planId) {
      const plan = this.db.getPlan(successfulMoves[0].planId);
      if (plan) {
        plan.status = 'ROLLED_BACK';
        this.db.savePlan(plan);
      }
    }

    return {
      batchId: rollbackBatchId,
      restoredCount,
      failedCount,
      errors
    };
  }
}
