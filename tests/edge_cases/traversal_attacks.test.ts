import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { PathSecurity } from '../../src/core/security.js';
import { OrganizationEngine } from '../../src/core/organizer.js';
import { LocalVaultDatabase } from '../../src/core/database.js';

describe('Security: Traversal Attacks & Sandbox Defense', () => {
  let db: LocalVaultDatabase;
  let organizer: OrganizationEngine;
  let sandboxDir: string;

  beforeEach(() => {
    db = new LocalVaultDatabase(':memory:');
    organizer = new OrganizationEngine(db);
    sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-sec-jail-'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  });

  it('rejects dot-dot (..) traversal breakout attempts', () => {
    const maliciousPaths = [
      path.join(sandboxDir, '..', '..', 'etc', 'passwd'),
      path.join(sandboxDir, 'nested', '..', '..', '..', 'root', '.ssh'),
      '../../../escape.txt'
    ];

    for (const p of maliciousPaths) {
      expect(() => PathSecurity.assertWithinRoot(p, sandboxDir)).toThrow();
    }
  });

  it('detects symlinks targeting sensitive external directories', () => {
    const sensitiveFile = path.join(os.tmpdir(), 'mock_private_key');
    fs.writeFileSync(sensitiveFile, '--- PRIVATE KEY ---');

    const internalLink = path.join(sandboxDir, 'key_symlink');
    try {
      fs.symlinkSync(sensitiveFile, internalLink);
    } catch {}

    if (fs.existsSync(internalLink)) {
      expect(PathSecurity.isSymlinkEscape(internalLink, sandboxDir)).toBe(true);
    }

    fs.rmSync(sensitiveFile, { force: true });
  });

  it('rejects null byte injection in filenames', () => {
    expect(() => PathSecurity.normalize('important_file.pdf\0.exe')).toThrow('null bytes');
  });
});
