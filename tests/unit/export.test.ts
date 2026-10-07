import { describe, it, expect } from 'vitest';
import { ExportEngine } from '../../src/core/export.js';
import { FileRecord, DuplicateGroup } from '../../src/core/types.js';

describe('ExportEngine', () => {
  it('correctly escapes values according to RFC 4180', () => {
    expect(ExportEngine.escapeCsvValue('normal')).toBe('normal');
    expect(ExportEngine.escapeCsvValue('with,comma')).toBe('"with,comma"');
    expect(ExportEngine.escapeCsvValue('with"quote')).toBe('"with""quote"');
    expect(ExportEngine.escapeCsvValue('with\nnewline')).toBe('"with\nnewline"');
  });

  it('exports files to valid CSV format', () => {
    const files: FileRecord[] = [
      {
        id: '1',
        path: '/docs/my,file.txt',
        filename: 'my,file.txt',
        extension: '.txt',
        category: 'DOCUMENT',
        mimeType: 'text/plain',
        sizeBytes: 100,
        mtimeMs: 1700000000000,
        ctimeMs: 1700000000000,
        sha256: 'h1',
        indexedAt: 1700000000000,
        status: 'ACTIVE'
      }
    ];

    const csv = ExportEngine.exportFilesToCsv(files);
    expect(csv).toContain('id,path,filename,extension,category');
    expect(csv).toContain('"/docs/my,file.txt"');
    expect(csv).toContain('"my,file.txt"');
  });

  it('exports duplicate groups to valid CSV format', () => {
    const groups: DuplicateGroup[] = [
      {
        hash: 'dup-hash',
        sizeBytes: 500,
        fileCount: 2,
        wastedBytes: 500,
        files: [
          {
            id: '1',
            path: '/path/1.jpg',
            filename: '1.jpg',
            extension: '.jpg',
            category: 'IMAGE',
            mimeType: 'image/jpeg',
            sizeBytes: 500,
            mtimeMs: 1,
            ctimeMs: 1,
            sha256: 'dup-hash',
            indexedAt: 1,
            status: 'ACTIVE'
          },
          {
            id: '2',
            path: '/path/2.jpg',
            filename: '2.jpg',
            extension: '.jpg',
            category: 'IMAGE',
            mimeType: 'image/jpeg',
            sizeBytes: 500,
            mtimeMs: 2,
            ctimeMs: 2,
            sha256: 'dup-hash',
            indexedAt: 2,
            status: 'ACTIVE'
          }
        ]
      }
    ];

    const csv = ExportEngine.exportDuplicatesToCsv(groups);
    expect(csv).toContain('groupHash,fileSizeBytes,fileCount,wastedBytes,filePath');
    expect(csv).toContain('dup-hash,500,2,500,/path/1.jpg');
    expect(csv).toContain('dup-hash,500,2,500,/path/2.jpg');
  });

  it('exports objects to formatted JSON', () => {
    const json = ExportEngine.exportToJson({ test: 123 });
    expect(JSON.parse(json)).toEqual({ test: 123 });
  });
});
