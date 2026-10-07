# LocalVault — Autonomous Workforce Engineering Blueprint & AGENTS.md

> **Root Governance Document**  
> Target: `localvault` (Privacy-First Personal File Organizer)  
> Authority: Antigravity Chief Orchestrator  
> Strict Invariant: No rapidly changing task state in this document. Use `.agent/` for transient state.

---

## 1. Project Purpose
LocalVault is a high-assurance, local-first personal file organization system. It allows users to point the application at local directories to:
- Recursively index files and extract file metadata (sizes, timestamps, MIME types, extensions)
- Compute streaming cryptographic hashes (SHA-256) without high memory overhead
- Detect duplicate files accurately via `(size, sha256)` clustering
- Search files across metadata, paths, content types, and duplicate status
- Safely plan, preview, confirm, execute, and rollback file organization operations
- Maintain a tamper-evident audit history of all filesystem operations
- Generate analytical reports (storage consumption, duplicates, largest files, stale candidates)
- Export data to machine-readable formats (JSON, RFC 4180 CSV)
- Guarantee zero data loss, zero destructive moves without preview, and strict local privacy.

---

## 2. Technology Stack & Environment Decisions
- **Runtime**: Node.js v22.23.1 (LTS)
- **Language**: TypeScript 5.9+ (strict mode, NodeNext module resolution, ESM native)
- **Database**: SQLite via Node.js native `node:sqlite` (`DatabaseSync` / WAL mode)
  - Synchronous disk durability, atomic transactions, zero native rebuild vulnerabilities.
- **Hashing**: Node.js streaming `node:crypto` (`createHash('sha256')`) with chunked backpressure.
- **Testing**: Vitest 2.1.9 (unit, integration, failure injection, traversal attacks)
- **API & Server**: Express 4.22 + CORS for REST service; CLI for scriptable terminal workflows.
- **Package Manager**: PNPM 11.17+

---

## 3. Architecture Overview
LocalVault follows a layered, modular, fail-closed architecture:
```text
┌────────────────────────────────────────────────────────┐
│                   User Interfaces                      │
│        Web Dashboard (REST)     │       CLI Runner     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    API Service Layer                   │
│         Express Router & Request Validation            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Core Domain Engines                  │
│  - PathSecurity (Sandbox & Traversal Validator)        │
│  - FileIndexer (Streaming SHA-256, Stat, MIME)         │
│  - DuplicateDetector (Size + Hash Clusterer)           │
│  - SearchEngine (Multi-facet SQLite Query Builder)     │
│  - OrganizationEngine (Plan -> Preview -> Apply)       │
│  - OperationHistory (Audit Trail & Undo / Rollback)    │
│  - ReportEngine (Storage Analytics & Stale Detector)   │
│  - ExportEngine (JSON & RFC 4180 CSV Exporters)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Storage & Filesystem                  │
│       SQLite WAL Database  │  Local Filesystem         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Repository Structure
```text
localvault/
├── AGENTS.md                  # System invariants and worker guidelines
├── README.md                  # Project overview and quickstart
├── package.json               # Scripts and dependencies
├── tsconfig.json              # TypeScript compilation configuration
├── vitest.config.ts           # Vitest test runner configuration
├── .gitignore                 # Version control exclusions
├── docs/                      # Architectural, API, and safety specifications
│   ├── ARCHITECTURE.md
│   ├── SAFETY_MODEL.md
│   └── API.md
├── .agent/                    # Durable project memory & state layer
│   ├── architecture/          # Architecture blueprints
│   ├── checkpoints/           # Worker execution checkpoints
│   ├── decisions/             # Architecture Decision Records (ADRs)
│   ├── handoffs/              # Inter-session handoff documentation
│   ├── state/                 # Project state snapshot
│   ├── tasks/                 # Task dependency graph
│   ├── verification/          # Evidence records & test reports
│   └── worker/                # Worker registrations & persistent profiles
├── src/
│   ├── core/                  # Pure domain logic (independent of HTTP)
│   │   ├── types.ts           # Core interfaces and data models
│   │   ├── security.ts        # Path validation, traversal prevention, sandbox checks
│   │   ├── database.ts        # SQLite storage adapter & migrations
│   │   ├── indexer.ts         # Directory scanner & streaming hasher
│   │   ├── duplicates.ts      # Duplicate clustering and storage calculator
│   │   ├── search.ts          # Search filter & query engine
│   │   ├── organizer.ts       # Reversible organization engine
│   │   ├── history.ts         # Audit trail and rollback manager
│   │   ├── reporting.ts       # Storage reports and stale file analyzer
│   │   └── export.ts          # JSON and CSV export engine
│   ├── server/                # REST API service
│   │   ├── app.ts             # Express app setup and endpoints
│   │   └── index.ts           # Server bootstrap
│   └── cli/                   # Command-line interface
│       └── index.ts           # CLI command handlers
└── tests/
    ├── unit/                  # Fast component unit tests
    ├── integration/           # End-to-end pipeline & API tests
    └── edge_cases/            # Large files, symlinks, failures, security attacks
```

---

## 5. Filesystem Safety & Security Rules (MANDATORY)
LocalVault interacts directly with user files. All workers MUST observe these non-negotiable rules:
1. **Never Perform Destructive In-Place Moves Without Preview**:
   - Every file movement operation MUST originate from a formal `OrganizationPlan`.
   - The user MUST inspect the preview containing all planned source -> destination pairs.
   - Operations are executed ONLY upon explicit confirmation.
2. **Reversibility Guarantee**:
   - Every movement operation writes an atomic record to the `operation_history` table containing full rollback metadata.
   - A corresponding `rollback()` operation MUST exist to restore files to their exact previous paths.
3. **Path Traversal & Sandboxing**:
   - All input paths MUST be normalized via `path.resolve()` and `fs.realpathSync()`.
   - Symlinks pointing outside the indexed root directory are flagged or skipped based on policy to prevent symlink traversal attacks.
   - Relative traversal components (`../`) MUST be rejected.
4. **Collision & Overwrite Prevention**:
   - Never overwrite an existing destination file unless explicitly specified in a verified conflict policy.
   - If a destination file already exists, the engine MUST fail-closed or auto-disambiguate with conflict numbering (e.g. `file_1.ext`).
5. **TOCTOU (Time-of-Check to Time-of-Use) Mitigation**:
   - Check file existence and integrity immediately before moving. If source hash or size has mutated between planning and execution, abort.

---

## 6. Database Conventions
1. **Engine**: SQLite in WAL (`PRAGMA journal_mode=WAL;`) and foreign keys enabled (`PRAGMA foreign_keys=ON;`).
2. **Synchronous Writes**: `PRAGMA synchronous=NORMAL;` for high throughput with ACID safety.
3. **Indexes**:
   - `files(path)`: Primary unique index
   - `files(sha256)`: Fast duplicate group lookups
   - `files(size)`: Fast candidate duplicate pruning
   - `files(extension)`, `files(category)`: Fast search and reporting
   - `operation_history(batch_id)`: Atomic transaction rollbacks
4. **Zero Raw Leaks**: All dynamic queries MUST use parameterized SQL bindings (`?`).

---

## 7. Development & Verification Commands
- **Install Dependencies**: `pnpm install`
- **Build Project**: `pnpm build` (`tsc`)
- **Typecheck**: `pnpm typecheck` (`tsc --noEmit`)
- **Run All Tests**: `pnpm test` (`vitest run`)
- **Run Unit Tests**: `pnpm test:unit`
- **Run Integration Tests**: `pnpm test:integration`
- **Run Edge / Security Tests**: `pnpm test:edge`
- **Start Dev Server**: `pnpm dev`
- **Run CLI**: `pnpm cli <command> [args]`

---

## 8. Worker Responsibilities & Allocation
1. **`localvault-dev-01` (Primary Development Owner)**:
   - Owns core engines: Indexer, Database, Duplicates, Organizer, History, Search, Reports, Export.
   - Maintains continuous domain context across all implementation tasks.
2. **`localvault-ui-01` (Frontend / UX Specialist)**:
   - Owns web dashboard and interactive preview / confirmation modals.
3. **`localvault-test-01` (QA / Testing Specialist)**:
   - Implements automated integration, regression, and property-based test suites.
4. **`localvault-security-01` (Security Auditor)**:
   - Audits filesystem traversal, permission handling, symlink jail escapes, and TOCTOU safety.
5. **`localvault-critic-01` (Architecture / Quality Critic)**:
   - Rigorously critiques proposed plans, diffs, and verification evidence.
6. **Spot Dev Workforce (`spot-01` .. `spot-05`)**:
   - Narrow, decoupled assistance tasks (e.g. writing isolated edge-case tests while permanent worker is blocked).

---

## 9. Do-Not-Touch Areas
- Do NOT alter core database schema migration history once applied.
- Do NOT bypass `PathSecurity` validation functions in any core engine.
- Do NOT remove rollback logging from `OrganizationEngine`.
