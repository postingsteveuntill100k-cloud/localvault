# ADR-001: Technology Stack and Storage Engine Selection

## Status: ACCEPTED
**Date**: 2026-10-07  
**Deciders**: Antigravity Chief Orchestrator, localvault-dev-01  

## Context
We need to select an implementation stack for LocalVault, a local-first personal file organizer that must perform streaming hashing, robust filesystem traversal, atomic audit logging, fast search, and safe file organization.

The host environment contains:
- Node.js v22.23.1
- PNPM 11.17.0
- Python 3.14.7
- Git 2.43.0, gh CLI 2.101.0
- SQLite 3.53.4

## Decision
1. **Language & Runtime**: Node.js v22 with TypeScript 5.9+.
   - Rationale: High-performance asynchronous non-blocking I/O (`fs/promises`), built-in streaming backpressure for SHA-256 without memory spikes, and rapid UI/API cohesion.
2. **Database Engine**: `node:sqlite` (Node.js native SQLite via `DatabaseSync`).
   - Rationale: Zero external native binary compilation hurdles (avoiding node-gyp C++ compiler issues), native WAL mode (`PRAGMA journal_mode=WAL`), transactional durability (`BEGIN IMMEDIATE`), sub-millisecond query latency.
3. **Testing**: Vitest 2.1.9.
   - Rationale: Ultra-fast in-memory test runner, native ESM and TypeScript support, full compatibility with Node standard libraries.
4. **API & Interface**: Express 4.22 + lightweight single-page Web Dashboard + typed CLI.

## Consequences
- Single runtime for API, CLI, and core engine.
- Zero cloud dependencies; completely air-gapped local execution.
- Deterministic and reproducible across environments.
