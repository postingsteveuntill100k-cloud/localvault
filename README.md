# LocalVault 🔒📁

**Privacy-First Personal File Organizer with Safe, Reversible Operations**

[![Tests](https://img.shields.io/badge/tests-vitest-green.svg)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](#architecture)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-lightgrey.svg)](#database)
[![Security](https://img.shields.io/badge/Security-Fail--Closed-red.svg)](#security)

---

## What is LocalVault?
LocalVault is a modern, privacy-focused desktop/local-first application designed to organize chaotic personal directories (e.g. `Downloads`, `Documents`, `Photos`) without transmitting any metadata or content to external cloud providers.

It combines recursive streaming file indexing, cryptographic deduplication, multi-facet search, analytical reporting, and a **fail-closed, preview-first organization engine** that guarantees all file movements can be audited and reversed.

---

## Core Capabilities
- 📂 **Streaming Filesystem Indexing**: Recursively traverses local directories, computes streaming SHA-256 hashes without loading large files into memory, and classifies content by MIME/type.
- 👯 **Deterministic Duplicate Detection**: Identifies exact duplicate groups via `(file_size, sha256)` clustering. Calculates wasted storage across drives.
- 🔍 **Instant Multi-Facet Search**: Filter indexed files by filename, extension, MIME category, date modified, size range, and duplicate status.
- 🛡️ **Safe Reversible Organization**: Proposes organization plans (e.g. grouping by type, date, or deduplication). Generates an interactive preview for user review. Never moves files destructively without explicit confirmation.
- ⏪ **Full Audit & Rollback History**: Every atomic move is logged in SQLite with source/destination path history. Instant single-click rollback reverses any prior operation batch.
- 📊 **Storage Reports & Stale File Identification**: Breaks down disk usage by file category, highlights top storage hogs, and identifies stale files untouched for months.
- 📤 **Machine-Readable Export**: End-to-end export to standard JSON and RFC 4180 CSV formats.
- 🌐 **Web & CLI Interfaces**: Rich dashboard and scriptable CLI.

---

## Quick Start

### Prerequisites
- Node.js >= 22.0.0
- PNPM >= 10.0.0

### Installation
```bash
git clone https://github.com/postingsteveuntill100k-cloud/localvault.git
cd localvault
pnpm install
```

### Running Tests
```bash
pnpm test          # Run all Vitest suites
pnpm test:unit     # Run unit tests
pnpm test:edge     # Run edge case & failure injection tests
```

### CLI Usage
```bash
# Index a directory
pnpm cli index /path/to/my/folder

# Find duplicates
pnpm cli duplicates

# Search files
pnpm cli search --ext png --min-size 1024

# Generate storage report
pnpm cli report

# Export metadata to CSV
pnpm cli export --format csv --output report.csv
```

### Web API & Dashboard
```bash
pnpm dev           # Starts API server on http://localhost:4100
```
