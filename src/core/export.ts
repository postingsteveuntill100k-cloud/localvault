import { FileRecord, DuplicateGroup, StorageReport } from './types.js';

export class ExportEngine {
  /**
   * Escapes a single string value according to RFC 4180 rules.
   */
  static escapeCsvValue(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Exports an array of FileRecords to an RFC 4180 compliant CSV string.
   */
  static exportFilesToCsv(files: FileRecord[]): string {
    const headers = [
      'id',
      'path',
      'filename',
      'extension',
      'category',
      'mimeType',
      'sizeBytes',
      'mtimeMs',
      'ctimeMs',
      'sha256',
      'status'
    ];

    const rows = files.map((f) => [
      this.escapeCsvValue(f.id),
      this.escapeCsvValue(f.path),
      this.escapeCsvValue(f.filename),
      this.escapeCsvValue(f.extension),
      this.escapeCsvValue(f.category),
      this.escapeCsvValue(f.mimeType),
      this.escapeCsvValue(f.sizeBytes),
      this.escapeCsvValue(new Date(f.mtimeMs).toISOString()),
      this.escapeCsvValue(new Date(f.ctimeMs).toISOString()),
      this.escapeCsvValue(f.sha256),
      this.escapeCsvValue(f.status)
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  /**
   * Exports DuplicateGroups to an RFC 4180 CSV string.
   */
  static exportDuplicatesToCsv(groups: DuplicateGroup[]): string {
    const headers = ['groupHash', 'fileSizeBytes', 'fileCount', 'wastedBytes', 'filePath'];
    const lines: string[] = [headers.join(',')];

    for (const group of groups) {
      for (const file of group.files) {
        lines.push(
          [
            this.escapeCsvValue(group.hash),
            this.escapeCsvValue(group.sizeBytes),
            this.escapeCsvValue(group.fileCount),
            this.escapeCsvValue(group.wastedBytes),
            this.escapeCsvValue(file.path)
          ].join(',')
        );
      }
    }

    return lines.join('\r\n');
  }

  /**
   * Exports data to formatted JSON.
   */
  static exportToJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}
