import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import { LocalVaultDatabase } from '../core/database.js';
import { FileIndexer } from '../core/indexer.js';
import { DuplicateDetector } from '../core/duplicates.js';
import { SearchEngine } from '../core/search.js';
import { OrganizationEngine } from '../core/organizer.js';
import { HistoryManager } from '../core/history.js';
import { ReportEngine } from '../core/reporting.js';
import { ExportEngine } from '../core/export.js';
import { renderDashboardHtml } from './ui.js';
import { renderLandingPageHtml } from './landing.js';
import { FileCategory, OrganizationStrategy } from '../core/types.js';

export function createApp(db?: LocalVaultDatabase): Express {
  const database = db || new LocalVaultDatabase();
  const indexer = new FileIndexer(database);
  const duplicates = new DuplicateDetector(database);
  const search = new SearchEngine(database);
  const organizer = new OrganizationEngine(database);
  const history = new HistoryManager(database);
  const reporting = new ReportEngine(database);

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Landing Page
  app.get('/', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(renderLandingPageHtml());
  });

  // Web UI Dashboard
  app.get(['/dashboard', '/app'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(renderDashboardHtml());
  });

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      indexedFiles: database.getAllFiles().length
    });
  });

  // Index Directory
  app.post('/api/index', async (req: Request, res: Response) => {
    try {
      const { directoryPath, options } = req.body;
      if (!directoryPath) {
        return res.status(400).json({ error: 'directoryPath is required' });
      }
      const result = await indexer.indexDirectory(directoryPath, options);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // List & Search Files
  app.get('/api/files', (req: Request, res: Response) => {
    try {
      const {
        term,
        hash,
        extension,
        category,
        minSize,
        maxSize,
        modifiedAfter,
        modifiedBefore,
        directory,
        isDuplicate,
        limit,
        offset
      } = req.query;

      const query = {
        term: term ? String(term) : undefined,
        hash: hash ? String(hash) : undefined,
        extension: extension ? String(extension) : undefined,
        category: category ? (String(category) as FileCategory) : undefined,
        minSize: minSize ? Number(minSize) : undefined,
        maxSize: maxSize ? Number(maxSize) : undefined,
        modifiedAfter: modifiedAfter ? Number(modifiedAfter) : undefined,
        modifiedBefore: modifiedBefore ? Number(modifiedBefore) : undefined,
        directory: directory ? String(directory) : undefined,
        isDuplicate: isDuplicate !== undefined ? isDuplicate === 'true' : undefined,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0
      };

      const result = search.search(query);
      return res.json({ total: result.total, files: result.results });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get File by ID
  app.get('/api/files/:id', (req: Request, res: Response) => {
    const file = database.getFileById(String(req.params.id));
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.json({ file });
  });

  // Duplicate Inspection
  app.get('/api/duplicates', (req: Request, res: Response) => {
    const result = duplicates.findDuplicates();
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="duplicates.csv"');
      return res.send(ExportEngine.exportDuplicatesToCsv(result.groups));
    }
    return res.json(result);
  });

  // Safe Organization: Create Plan
  app.post('/api/organize/plan', (req: Request, res: Response) => {
    try {
      const { sourceDirectory, targetDirectory, strategy, categoryFilter, staleDays } = req.body;
      if (!sourceDirectory || !targetDirectory) {
        return res.status(400).json({ error: 'sourceDirectory and targetDirectory are required' });
      }

      const plan = organizer.createPlan({
        sourceDirectory,
        targetDirectory,
        strategy: (strategy || 'BY_CATEGORY') as OrganizationStrategy,
        categoryFilter,
        staleDays: req.body.staleDays !== undefined ? Number(req.body.staleDays) : undefined
      });

      return res.json({ plan });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Safe Organization: Preview Plan
  app.get('/api/organize/plan/:id', (req: Request, res: Response) => {
    try {
      const plan = organizer.previewPlan(String(req.params.id));
      return res.json({ plan });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  });

  // Safe Organization: Execute Plan (Enforces confirmation!)
  app.post('/api/organize/execute', async (req: Request, res: Response) => {
    try {
      const { planId, confirm } = req.body;
      if (!planId) {
        return res.status(400).json({ error: 'planId is required' });
      }
      if (confirm !== true) {
        return res.status(400).json({
          error: 'Explicit user confirmation required (confirm: true)'
        });
      }

      const result = await organizer.executePlan(planId, confirm);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Rollback Batch
  app.post('/api/organize/rollback/:batchId', async (req: Request, res: Response) => {
    try {
      const result = await organizer.rollbackBatch(String(req.params.batchId));
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Operation History
  app.get('/api/history', (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const historyList = history.getRecentHistory(limit);
    return res.json({ history: historyList });
  });

  // Reports
  app.get('/api/reports/summary', (req: Request, res: Response) => {
    const staleDays = req.query.staleDays ? Number(req.query.staleDays) : 90;
    const recentDays = req.query.recentDays ? Number(req.query.recentDays) : 7;
    const report = reporting.generateReport({ staleDays, recentDays });
    return res.json(report);
  });

  // Export
  app.get('/api/export', (req: Request, res: Response) => {
    const format = (req.query.format as string)?.toLowerCase();
    const files = database.getAllFiles();

    if (format === 'csv') {
      const csv = ExportEngine.exportFilesToCsv(files);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="localvault_files.csv"');
      return res.send(csv);
    }

    return res.json({
      exportedAt: new Date().toISOString(),
      totalFiles: files.length,
      files
    });
  });

  // Micro-SaaS License Management
  app.get('/api/license', (_req: Request, res: Response) => {
    res.json(database.getLicense());
  });

  app.post('/api/license', (req: Request, res: Response) => {
    try {
      const { tier, licenseKey } = req.body;
      if (!tier) {
        return res.status(400).json({ error: 'tier is required (COMMUNITY, PRO, TEAM)' });
      }
      const updated = database.setLicense(tier.toUpperCase(), licenseKey);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Database Maintenance: Vacuum & Optimize
  app.post('/api/maintenance/vacuum', (_req: Request, res: Response) => {
    try {
      database.vacuum();
      return res.json({ status: 'ok', vacuumed: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return app;
}
