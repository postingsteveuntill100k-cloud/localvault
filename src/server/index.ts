import path from 'node:path';
import { createApp } from './app.js';
import { LocalVaultDatabase } from '../core/database.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5633;
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'localvault.db');

const db = new LocalVaultDatabase(DB_PATH);
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`[LocalVault] Service online at http://localhost:${PORT}`);
  console.log(`[LocalVault] Database active at: ${DB_PATH}`);
  console.log(`[LocalVault] Landing page: http://localhost:${PORT}/`);
  console.log(`[LocalVault] Dashboard ready: http://localhost:${PORT}/dashboard or http://localhost:${PORT}/app`);
});
