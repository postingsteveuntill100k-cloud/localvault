# LocalVault Safety & Reversibility Model

## Core Philosophy
LocalVault operates on user filesystems. User files are sacred and irreplaceable. Our core directive is **Fail-Closed, Zero Data Loss, Strict Reversibility**.

## Invariants & Defenses

### 1. Mandatory Preview Phase
Under no circumstances may a file movement or modification occur without an existing `OrganizationPlan`.
```text
State Transition:
DRAFT_PLAN ──▶ PREVIEW ──(Explicit User Confirmation)──▶ EXECUTING ──▶ COMPLETED
                                                              │
                                                        (On Failure)
                                                              ▼
                                                          ABORTED / ROLLED_BACK
```

### 2. Path Traversal & Jailbreak Mitigation
- **Relative Escapes**: Patterns containing `..` or leading `/` where relative paths are expected are strictly disallowed.
- **Symlink Escape Guard**: Symlinks pointing outside the indexed project tree are detected and blocked from write operations to prevent attacks on sensitive paths like `/home/user/.ssh/id_rsa` or `/etc/passwd`.
- **Null-Byte Injection**: Filenames containing `\0` or non-printable ASCII characters below 32 are rejected.

### 3. Collision Protection
When moving `file.txt` to a target directory:
- LocalVault verifies `destination_path` doesn't collide with existing files.
- If a collision is detected, user selects one of:
  - `AUTOSUFFIX`: Append numeric counter `file_1.txt`
  - `SKIP`: Leave original file in place
  - `ABORT`: Halt plan execution immediately

### 4. Time-of-Check to Time-of-Use (TOCTOU) Protection
Between the moment a plan is generated and the moment it is executed:
- The source file could be modified or deleted by another process.
- LocalVault checks `fs.statSync()` before moving:
  - If source file is missing: Mark step failed, continue or abort based on transaction policy.
  - If file size or modified timestamp has mutated: Abort step to prevent moving inconsistent data.

### 5. Reversibility & Rollback Ledger
Every execution batch produces rows in `operation_history` with:
- `batch_id`: UUID grouping the plan execution
- `source_path`: Original absolute path
- `destination_path`: Target absolute path
- `sha256`: Hash at time of move
- `status`: SUCCESS or FAILED

Calling `rollback(batch_id)` reads the batch in reverse order and moves each file from `destination_path` back to `source_path`.
