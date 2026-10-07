# LocalVault Architecture Specification

## Overview
LocalVault is engineered as a local-first system designed for maximum data safety, minimal memory footprint, and instantaneous responsiveness.

## Architectural Layers

### 1. Ingestion & Indexing Pipeline (`src/core/indexer.ts`)
- **Directory Traversal**: Asynchronous, non-blocking recursion using `node:fs/promises`.
- **Filtering**: Automatically excludes known system patterns (e.g. `.git`, `node_modules`, `.DS_Store`) unless explicitly configured.
- **Streaming Cryptographic Hashing**: Uses `node:crypto.createHash('sha256')` piped through readable streams. Chunks are processed via Node.js stream backpressure, ensuring a constant memory profile (< 35 MB) regardless of multi-gigabyte file sizes.
- **Type Classification**: Maps extensions and magic headers to high-level categories:
  - `IMAGE`: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `tiff`, `bmp`, `raw`
  - `DOCUMENT`: `pdf`, `docx`, `doc`, `txt`, `md`, `csv`, `xlsx`, `pptx`, `odt`
  - `AUDIO`: `mp3`, `flac`, `wav`, `aac`, `ogg`, `m4a`
  - `VIDEO`: `mp4`, `mkv`, `mov`, `avi`, `webm`
  - `ARCHIVE`: `zip`, `tar`, `gz`, `7z`, `rar`, `bz2`
  - `CODE`: `ts`, `js`, `py`, `rs`, `go`, `c`, `cpp`, `html`, `css`, `json`
  - `OTHER`: Default fallback

### 2. Storage Subsystem (`src/core/database.ts`)
- Native SQLite via `node:sqlite.DatabaseSync` with zero external C++ build dependencies.
- WAL journal mode (`PRAGMA journal_mode=WAL`) enables concurrent reader operations without locking.
- Tables:
  - `files`: Master indexed file inventory (`id`, `path`, `filename`, `extension`, `category`, `size_bytes`, `mtime_ms`, `ctime_ms`, `sha256`, `indexed_at`, `status`).
  - `operation_history`: Audit trail for all executions (`id`, `batch_id`, `operation_type`, `source_path`, `destination_path`, `sha256`, `size_bytes`, `status`, `error`, `timestamp`).
  - `organization_plans`: Stored preview plans before execution (`id`, `title`, `created_at`, `confirmed_at`, `status`, `plan_json`).

### 3. Safety & Path Security Subsystem (`src/core/security.ts`)
- Canonicalization via `path.resolve` and `fs.realpathSync`.
- Rejection of path traversal tokens (`..`, null bytes, control characters).
- Symlink containment check: Prevents directory escapes to critical system roots (`/etc`, `/proc`, `~/.ssh`).
- Safe target collision resolver: If destination already exists, generate non-destructive suffixes (`name_1.ext`).

### 4. Duplicate Detection Subsystem (`src/core/duplicates.ts`)
- Two-phase query:
  - Phase 1: Group by `size_bytes > 0` and `sha256` where count > 1.
  - Phase 2: Compute wasted space (`size_bytes * (count - 1)`).
- Provides exact cluster views with original file paths and timestamps for user review.

### 5. Safe Organization Engine (`src/core/organizer.ts`)
- Implements the 5-step lifecycle:
  1. `PLAN`: Generate proposed reorganization (e.g. categorize into `Documents/`, `Images/`, etc. or consolidate duplicates).
  2. `PREVIEW`: Produce an immutable plan artifact listing each source -> destination transformation and collision status.
  3. `CONFIRM`: Require explicit user confirmation token.
  4. `EXECUTE`: Atomically move files using `fs.rename` with copy-fallback across filesystems, updating database and audit trail.
  5. `ROLLBACK`: Invert the operation batch, moving files back to their exact original sources.

### 6. Analytics & Reports (`src/core/reporting.ts`)
- Total file count, storage footprint, duplicate waste.
- Distribution by category and extension.
- Top 10 largest files.
- Stale file detection: Files untouched (mtime) > N days (default 90 days).

### 7. Export Engine (`src/core/export.ts`)
- JSON export with formatted metadata.
- RFC 4180 compliant CSV export with proper escaping and quote handling.
