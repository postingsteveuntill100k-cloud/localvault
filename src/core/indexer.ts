import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { FileCategory, FileRecord } from './types.js';
import { LocalVaultDatabase } from './database.js';
import { PathSecurity } from './security.js';

export interface IndexerOptions {
  skipHidden?: boolean;
  maxDepth?: number;
  excludedPatterns?: string[];
}

export class FileIndexer {
  private db: LocalVaultDatabase;

  constructor(db: LocalVaultDatabase) {
    this.db = db;
  }

  /**
   * Streaming SHA-256 calculation.
   * Streams file chunks directly into crypto hash without loading file into memory.
   */
  async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Classifies a file into a high-level category based on its extension.
   */
  classifyFile(extension: string): { category: FileCategory; mimeType: string } {
    const ext = extension.toLowerCase().replace(/^\./, '');

    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
      case 'tiff':
        return { category: 'IMAGE', mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}` };

      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'md':
      case 'rtf':
      case 'odt':
        return { category: 'DOCUMENT', mimeType: ext === 'pdf' ? 'application/pdf' : 'text/plain' };

      case 'csv':
      case 'xlsx':
      case 'xls':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return { category: 'DATA', mimeType: ext === 'json' ? 'application/json' : 'text/csv' };

      case 'mp3':
      case 'flac':
      case 'wav':
      case 'aac':
      case 'ogg':
      case 'm4a':
        return { category: 'AUDIO', mimeType: `audio/${ext}` };

      case 'mp4':
      case 'mkv':
      case 'mov':
      case 'avi':
      case 'webm':
        return { category: 'VIDEO', mimeType: `video/${ext}` };

      case 'zip':
      case 'tar':
      case 'gz':
      case '7z':
      case 'rar':
      case 'bz2':
        return { category: 'ARCHIVE', mimeType: 'application/zip' };

      case 'ts':
      case 'js':
      case 'py':
      case 'rs':
      case 'go':
      case 'c':
      case 'cpp':
      case 'h':
      case 'html':
      case 'css':
      case 'sh':
      case 'sql':
        return { category: 'CODE', mimeType: 'text/plain' };

      default:
        return { category: 'OTHER', mimeType: 'application/octet-stream' };
    }
  }

  /**
   * Recursively scans and indexes a directory.
   */
  async indexDirectory(
    dirPath: string,
    options: IndexerOptions = {}
  ): Promise<{ indexed: number; skipped: number; errors: { path: string; error: string }[] }> {
    const normalizedRoot = PathSecurity.normalize(dirPath);
    const stat = await fsp.stat(normalizedRoot);
    if (!stat.isDirectory()) {
      throw new Error(`Target path '${normalizedRoot}' is not a directory`);
    }

    const {
      skipHidden = true,
      maxDepth = 20,
      excludedPatterns = ['node_modules', '.git', '.cache', '.DS_Store']
    } = options;

    let indexedCount = 0;
    let skippedCount = 0;
    const errors: { path: string; error: string }[] = [];

    const traverse = async (currentDir: string, currentDepth: number): Promise<void> => {
      if (currentDepth > maxDepth) return;

      let entries: fs.Dirent[];
      try {
        entries = await fsp.readdir(currentDir, { withFileTypes: true });
      } catch (err: any) {
        errors.push({ path: currentDir, error: err.message });
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Check hidden files
        if (skipHidden && entry.name.startsWith('.')) {
          skippedCount++;
          continue;
        }

        // Check exclusions
        if (excludedPatterns.some((pattern) => entry.name === pattern)) {
          skippedCount++;
          continue;
        }

        // Symlink checks: skip external symlinks
        if (entry.isSymbolicLink()) {
          if (PathSecurity.isSymlinkEscape(fullPath, normalizedRoot)) {
            skippedCount++;
            continue;
          }
        }

        if (entry.isDirectory()) {
          await traverse(fullPath, currentDepth + 1);
        } else if (entry.isFile()) {
          try {
            const fileStat = await fsp.stat(fullPath);
            const ext = path.extname(entry.name);
            const { category, mimeType } = this.classifyFile(ext);

            // Compute streaming hash
            const sha256 = await this.computeFileHash(fullPath);

            const fileRecord: FileRecord = {
              id: crypto.randomUUID(),
              path: fullPath,
              filename: entry.name,
              extension: ext.toLowerCase(),
              category,
              mimeType,
              sizeBytes: fileStat.size,
              mtimeMs: Math.round(fileStat.mtimeMs),
              ctimeMs: Math.round(fileStat.ctimeMs),
              sha256,
              indexedAt: Date.now(),
              status: 'ACTIVE'
            };

            this.db.upsertFile(fileRecord);
            indexedCount++;
          } catch (err: any) {
            errors.push({ path: fullPath, error: err.message });
          }
        }
      }
    };

    await traverse(normalizedRoot, 0);

    return { indexed: indexedCount, skipped: skippedCount, errors };
  }
}
