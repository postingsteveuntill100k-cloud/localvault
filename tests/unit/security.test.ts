import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { PathSecurity } from '../../src/core/security.js';

describe('PathSecurity', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-sec-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('normalizes valid paths cleanly', () => {
    const raw = path.join(tempDir, 'a', '..', 'b');
    const normalized = PathSecurity.normalize(raw);
    expect(normalized).toBe(path.resolve(path.join(tempDir, 'b')));
  });

  it('rejects null bytes and control characters', () => {
    expect(() => PathSecurity.normalize('safe/path\0evil.txt')).toThrow('illegal control characters');
    expect(() => PathSecurity.normalize('safe/path\x07bell.txt')).toThrow('illegal control characters');
  });

  it('asserts paths strictly within root directory', () => {
    const child = path.join(tempDir, 'subdir', 'file.txt');
    expect(PathSecurity.assertWithinRoot(child, tempDir)).toBe(child);

    const escape = path.join(tempDir, '..', 'outside.txt');
    expect(() => PathSecurity.assertWithinRoot(escape, tempDir)).toThrow('escapes root boundary');
  });

  it('detects symlink escapes outside the root directory', () => {
    const outsideFile = path.join(os.tmpdir(), 'outside_secret.txt');
    fs.writeFileSync(outsideFile, 'secret-data');

    const insideSymlink = path.join(tempDir, 'sym_escape.txt');
    fs.symlinkSync(outsideFile, insideSymlink);

    const isEscape = PathSecurity.isSymlinkEscape(insideSymlink, tempDir);
    expect(isEscape).toBe(true);

    fs.rmSync(outsideFile, { force: true });
  });

  it('sanitizes unsafe filenames', () => {
    expect(PathSecurity.sanitizeFilename('evil/path:test?.txt')).toBe('evil_path_test_.txt');
    expect(PathSecurity.sanitizeFilename('...hidden...')).toBe('hidden');
    expect(PathSecurity.sanitizeFilename('')).toBe('unnamed_file');
  });

  it('resolves collision safely with non-destructive suffixes', () => {
    const target = path.join(tempDir, 'sample.txt');
    fs.writeFileSync(target, 'version 0');

    const safe1 = PathSecurity.resolveCollisionSafely(target);
    expect(safe1).toBe(path.join(tempDir, 'sample_1.txt'));

    fs.writeFileSync(safe1, 'version 1');
    const safe2 = PathSecurity.resolveCollisionSafely(target);
    expect(safe2).toBe(path.join(tempDir, 'sample_2.txt'));
  });
});
