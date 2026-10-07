# LocalVault Engineering Plan & Task Dependency Graph

## 1. Task Graph & Dependencies
```text
[LV-TASK-01-SKELETON] (Config, TypeScript, Vitest, AGENTS.md)
       │
       ├──▶ [LV-TASK-02-SECURITY] (PathSecurity, Sandboxing, Traversal Guard)
       │           │
       │           ▼
       ├──▶ [LV-TASK-03-DATABASE] (SQLite Schema, WAL, Indexes, DAL)
       │           │
       │           ├───────────────┬───────────────────────────────┐
       │           ▼               ▼                               ▼
       │  [LV-TASK-04-INDEXER]  [LV-TASK-05-DUPLICATES]  [LV-TASK-07-ORGANIZER]
       │  (Streaming SHA-256)   (Cluster by size+hash)   (Plan->Preview->Rollback)
       │           │                       │                       │
       │           ├───────────────────────┤                       │
       │           ▼                       ▼                       │
       │  [LV-TASK-06-SEARCH]     [LV-TASK-08-REPORTS]             │
       │  (Multi-facet filters)   (Storage reports, Stale, Export) │
       │           │                       │                       │
       └───────────┴───────────────────────┼───────────────────────┘
                                           │
                                           ▼
                                [LV-TASK-09-API-SERVER]
                                (Express REST API & CLI)
                                           │
                                           ├────────────────────────┐
                                           ▼                        ▼
                                [LV-TASK-10-WEB-UI]      [LV-TASK-11-TESTS-EDGE]
                                (Web Dashboard & Modals) (Large files, failures, security)
                                                                    │
                                                                    ▼
                                                         [LV-TASK-12-CRITIC-AUDIT]
                                                         (Independent Critic & Verification)
```

## 2. Invariant Verification Gates
- **Gate 1**: Every core engine component must have >90% branch coverage unit tests before integration.
- **Gate 2**: Security suite must attempt path traversal, symlink breakouts, null bytes, and malicious filenames.
- **Gate 3**: Organization engine must prove reversibility with 100% hash parity on rollbacks.
- **Gate 4**: Streaming hasher must pass large file test (>100MB) without memory spikes.
