# LocalVault REST API Reference

The LocalVault API runs by default on port `4100` (configurable via `PORT` environment variable).

## Endpoints

### 1. Health & Status
- **`GET /api/health`**
  - Response: `{ status: "ok", timestamp: string, version: string, indexedFiles: number }`

### 2. Filesystem Indexing
- **`POST /api/index`**
  - Body: `{ directoryPath: string, options?: { skipHidden?: boolean, maxDepth?: number } }`
  - Response: `{ status: "success", indexedCount: number, errors: string[] }`
- **`GET /api/files`**
  - Query: `limit`, `offset`, `category`, `search`, `extension`, `minSize`, `maxSize`, `staleDays`
  - Response: `{ total: number, files: FileRecord[] }`
- **`GET /api/files/:id`**
  - Response: `{ file: FileRecord }`

### 3. Duplicates
- **`GET /api/duplicates`**
  - Response: `{ duplicateGroups: DuplicateGroup[], totalDuplicateFiles: number, wastedStorageBytes: number }`

### 4. Organization Engine (Safe, Preview-First)
- **`POST /api/organize/plan`**
  - Body: `{ targetDirectory: string, strategy: "BY_TYPE" | "BY_DATE" | "DEDUPLICATE_TRASH", filter?: SearchFilter }`
  - Response: `{ planId: string, actionsCount: number, preview: ProposedAction[] }`
- **`POST /api/organize/execute`**
  - Body: `{ planId: string, confirm: boolean }`
  - Response: `{ batchId: string, executedCount: number, failedCount: number, errors: string[] }`
- **`POST /api/organize/rollback/:batchId`**
  - Response: `{ batchId: string, restoredCount: number, failedCount: number, errors: string[] }`

### 5. Operation History & Audit
- **`GET /api/history`**
  - Query: `limit`, `offset`, `batchId`
  - Response: `{ history: OperationRecord[] }`

### 6. Reports & Analytics
- **`GET /api/reports/summary`**
  - Response: `{ totalFiles: number, totalBytes: number, categoryBreakdown: Record<string, number>, largestFiles: FileRecord[], duplicateWasteBytes: number, staleFilesCount: number }`

### 7. Export
- **`GET /api/export?format=json|csv`**
  - Response: JSON object or RFC 4180 CSV file stream
