/**
 * Core type definitions for LocalVault.
 */

export type FileCategory =
  | 'IMAGE'
  | 'DOCUMENT'
  | 'AUDIO'
  | 'VIDEO'
  | 'ARCHIVE'
  | 'CODE'
  | 'DATA'
  | 'OTHER';

export interface FileRecord {
  id: string;
  path: string;
  filename: string;
  extension: string;
  category: FileCategory;
  mimeType: string;
  sizeBytes: number;
  mtimeMs: number;
  ctimeMs: number;
  sha256: string;
  indexedAt: number;
  status: 'ACTIVE' | 'MOVED' | 'MISSING';
}

export interface DuplicateGroup {
  hash: string;
  sizeBytes: number;
  fileCount: number;
  wastedBytes: number;
  files: FileRecord[];
}

export type OrganizationStrategy =
  | 'BY_CATEGORY'
  | 'BY_DATE'
  | 'DEDUPLICATE_CONSOLIDATE'
  | 'STALE_ARCHIVE';

export interface ProposedAction {
  id: string;
  fileId: string;
  sourcePath: string;
  destinationPath: string;
  category: FileCategory;
  sizeBytes: number;
  sha256: string;
  actionType: 'MOVE';
  collisionResolvedPath?: string;
  status: 'PLANNED' | 'EXECUTED' | 'FAILED' | 'SKIPPED';
  error?: string;
}

export interface OrganizationPlan {
  id: string;
  strategy: OrganizationStrategy;
  sourceDirectory: string;
  targetDirectory: string;
  createdAt: number;
  confirmedAt?: number;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED' | 'ROLLED_BACK';
  actions: ProposedAction[];
}

export interface OperationRecord {
  id: string;
  batchId: string;
  planId?: string;
  operationType: 'MOVE' | 'ROLLBACK';
  sourcePath: string;
  destinationPath: string;
  sha256: string;
  sizeBytes: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  timestamp: number;
}

export interface SearchQuery {
  term?: string;
  hash?: string;
  extension?: string;
  category?: FileCategory;
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: number;
  modifiedBefore?: number;
  directory?: string;
  isDuplicate?: boolean;
  limit?: number;
  offset?: number;
}

export interface StorageReport {
  totalFiles: number;
  totalStorageBytes: number;
  categoryBreakdown: Record<FileCategory, { count: number; bytes: number }>;
  duplicateGroupsCount: number;
  duplicateWasteBytes: number;
  largestFiles: FileRecord[];
  staleFiles: FileRecord[];
  recentlyModifiedFiles: FileRecord[];
  generatedAt: number;
}

export type ExportFormat = 'JSON' | 'CSV';
