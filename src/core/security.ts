import path from 'node:path';
import fs from 'node:fs';

export class PathSecurity {
  /**
   * Canonicalizes and normalizes an input path.
   * Throws if path contains malicious characters (null bytes, control characters).
   */
  static normalize(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path: must be a non-empty string');
    }

    // Check for null bytes and control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(inputPath)) {
      throw new Error('PathSecurity: Path contains illegal control characters or null bytes');
    }

    const resolved = path.resolve(inputPath);
    return resolved;
  }

  /**
   * Asserts that candidatePath resides strictly within rootDir.
   * Prevents directory traversal attacks.
   */
  static assertWithinRoot(candidatePath: string, rootDir: string): string {
    const normalCandidate = this.normalize(candidatePath);
    const normalRoot = this.normalize(rootDir);

    // Ensure boundary ends with delimiter for prefix check
    const rootWithSep = normalRoot.endsWith(path.sep) ? normalRoot : normalRoot + path.sep;

    if (normalCandidate !== normalRoot && !normalCandidate.startsWith(rootWithSep)) {
      throw new Error(
        `PathSecurity Violation: Path '${normalCandidate}' escapes root boundary '${normalRoot}'`
      );
    }

    return normalCandidate;
  }

  /**
   * Detects whether targetPath is a symlink that points outside rootDir.
   * Returns true if the symlink is an escape risk.
   */
  static isSymlinkEscape(targetPath: string, rootDir: string): boolean {
    try {
      const lstat = fs.lstatSync(targetPath);
      if (!lstat.isSymbolicLink()) {
        return false;
      }

      const realTarget = fs.realpathSync(targetPath);
      const normalRoot = this.normalize(rootDir);
      const rootWithSep = normalRoot.endsWith(path.sep) ? normalRoot : normalRoot + path.sep;

      return realTarget !== normalRoot && !realTarget.startsWith(rootWithSep);
    } catch {
      // If file doesn't exist or lstat fails, it's not a verified escape
      return false;
    }
  }

  /**
   * Sanitizes a filename, removing illegal filesystem characters and directory traversal tokens.
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed_file';
    }

    // Strip directory separators and null bytes
    let clean = filename.replace(/[\/\\:\*\?"<>\|\x00-\x1f]/g, '_');
    // Remove leading/trailing dots and spaces
    clean = clean.trim().replace(/^\.+/, '').replace(/\.+$/, '');

    return clean || 'sanitized_file';
  }

  /**
   * Generates a collision-free destination path.
   * If target path already exists on disk OR in reservedPaths set,
   * appends '_1', '_2', etc. before the extension until an unused candidate is found.
   */
  static resolveCollisionSafely(targetPath: string, reservedPaths?: Set<string>): string {
    const normalized = this.normalize(targetPath);
    if (!fs.existsSync(normalized) && (!reservedPaths || !reservedPaths.has(normalized))) {
      return normalized;
    }

    const dir = path.dirname(normalized);
    const ext = path.extname(normalized);
    const base = path.basename(normalized, ext);

    let counter = 1;
    let candidate = path.join(dir, `${base}_${counter}${ext}`);
    while (fs.existsSync(candidate) || (reservedPaths && reservedPaths.has(candidate))) {
      counter++;
      candidate = path.join(dir, `${base}_${counter}${ext}`);
    }

    return candidate;
  }
}
