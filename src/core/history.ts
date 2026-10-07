import { LocalVaultDatabase } from './database.js';
import { OperationRecord } from './types.js';

export class HistoryManager {
  private db: LocalVaultDatabase;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
  }

  log(record: OperationRecord): void {
    this.db.logOperation(record);
  }

  getBatchHistory(batchId: string): OperationRecord[] {
    return this.db.getHistoryByBatchId(batchId);
  }

  getRecentHistory(limit: number = 100): OperationRecord[] {
    return this.db.getAllHistory(limit);
  }
}
