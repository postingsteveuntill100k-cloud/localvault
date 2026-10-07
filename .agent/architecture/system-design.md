# LocalVault System Design & Invariant Blueprint

## Subsystem Architecture
```text
                       [CLI / REST API]
                              │
               [PathSecurity Sandbox Boundary]
                              │
  ┌───────────────────────────┼───────────────────────────┐
  ▼                           ▼                           ▼
[FileIndexer]         [Search & Duplicates]       [Organizer & History]
  │                           │                           │
  │ (Streaming SHA-256)       │ (Indexed Queries)         │ (Plan/Preview/Rollback)
  └─────────────┬─────────────┴─────────────┬─────────────┘
                │                           │
                ▼                           ▼
          [node:sqlite]            [Target Filesystem]
         (localvault.db)
```

## Security Invariants
1. Path canonicalization via `path.resolve` and strict traversal validation (`..` guard).
2. Symlink escape detection: Never traverse symlinks pointing above project root.
3. Fail-closed error handling: I/O errors abort transaction and release resources cleanly.
4. Non-destructive moves: In-place deletes are prohibited; moves require preview approval.
