# ADR-002: Reversible Safe Organization Engine Architecture

## Status: ACCEPTED
**Date**: 2026-10-07  
**Deciders**: Antigravity Chief Orchestrator, localvault-security-01, localvault-dev-01  

## Context
Filesystem reorganization tools frequently cause silent data loss through race conditions, unverified overwrites, accidental deletes, or ambiguous renaming schemes. LocalVault requires an ironclad safety model.

## Decision
1. **Mandatory 5-Step Lifecycle**:
   - `PLAN` -> `PREVIEW` -> `CONFIRM` -> `EXECUTE` -> `ROLLBACK`
2. **Explicit Plan Artifacts**:
   - Every proposal creates an immutable `OrganizationPlan` in SQLite with unique ID.
   - Plans can be previewed repeatedly before confirmation.
3. **Collision Disambiguation**:
   - Default to safe numbered suffix (`foo_1.pdf`) if destination path already exists. Never overwrite.
4. **Audit Trail & Rollback**:
   - Every file move is recorded in `operation_history` with `batch_id`, `source_path`, `destination_path`, and `sha256`.
   - `rollback(batch_id)` performs an inverted undo sequence.
5. **TOCTOU Guard**:
   - Verify source file exists and hasn't changed size/mtime between plan generation and execution.

## Consequences
- Operations are fully transparent and reversible.
- Zero destructive automatic moves.
