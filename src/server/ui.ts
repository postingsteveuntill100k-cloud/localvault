export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalVault 🔒 — Dashboard</title>
  <style>
    :root {
      --bg: #070b14;
      --sidebar-bg: #0d1322;
      --card-bg: rgba(15, 23, 42, 0.7);
      --card-hover: rgba(30, 41, 59, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.3);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --secondary: #8b5cf6;
      --accent: #10b981;
      --accent-cyan: #06b6d4;
      --danger: #ef4444;
      --warning: #f59e0b;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background-color: var(--bg);
      background-image:
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
      color: var(--text);
      line-height: 1.5;
      display: flex;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Layout */
    .sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 24px 16px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 28px;
      padding: 0 8px;
    }
    .sidebar-brand-badge {
      font-size: 10px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 9999px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
      user-select: none;
    }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
    }
    .nav-item.active {
      background: rgba(99, 102, 241, 0.15);
      color: #c7d2fe;
      border-color: var(--border-accent);
      font-weight: 600;
    }
    .nav-item svg { flex-shrink: 0; }
    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
    }
    .license-pill {
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid var(--border-accent);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
    }

    /* Main Content */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .topbar {
      height: 64px;
      border-bottom: 1px solid var(--border);
      background: rgba(7, 11, 20, 0.8);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .topbar-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .content-area {
      padding: 32px;
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* Components */
    .badge-safe {
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .card h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; }
    .card .stat { font-size: 32px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
    .section-title { font-size: 18px; margin-bottom: 8px; font-weight: 700; color: #e2e8f0; display: flex; align-items: center; gap: 8px; }
    .section-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 18px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border); color: #fff; }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.14); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-warning { background: var(--warning); color: #000; }
    .btn-success { background: var(--accent); color: #000; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    input, select {
      background: rgba(10, 15, 28, 0.8);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #fff;
      padding: 9px 14px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { border-color: var(--primary); }

    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    tr:hover { background: rgba(255, 255, 255, 0.02); }

    /* Category breakdown visual bar */
    .breakdown-bar-wrap {
      display: flex;
      height: 12px;
      border-radius: 9999px;
      overflow: hidden;
      margin: 16px 0 20px;
      background: rgba(255, 255, 255, 0.05);
    }
    .breakdown-segment { height: 100%; transition: width 0.4s ease; }
    .cat-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .cat-image { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .cat-document { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .cat-audio { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .cat-video { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .cat-archive { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
    .cat-code { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
    .cat-data { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .cat-other { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

    /* Tab views */
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* Modal */
    dialog.modal {
      background: #0f172a;
      border: 1px solid var(--border-accent);
      border-radius: 14px;
      padding: 28px;
      max-width: 680px;
      width: 90%;
      color: #fff;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
      margin: auto;
    }
    dialog.modal::backdrop {
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
    }

    /* Toast */
    #toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 100;
    }
    .toast {
      background: #1e293b;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 18px;
      font-size: 13px;
      color: #fff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.25s ease-out;
    }
    .toast.success { border-color: var(--accent); }
    .toast.error { border-color: var(--danger); }
    @keyframes toastIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 900px) {
      body { flex-direction: column; }
      .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
      .main { height: auto; }
    }
  </style>
</head>
<body>

  <!-- Toast Container -->
  <div id="toast-container"></div>

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>LocalVault 🔒</span>
      <span class="sidebar-brand-badge">Airgapped</span>
    </div>

    <nav class="nav-menu">
      <div class="nav-item active" onclick="switchTab('tab-overview')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Vault Overview</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-scan')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
        <span>Directory Scanner</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-duplicates')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1"/><rect width="13" height="13" x="8" y="8" rx="2"/></svg>
        <span>Duplicate Hunter</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-organize')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        <span>Smart Organizer</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-files')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Search & Explorer</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-analytics')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        <span>Storage Reports</span>
      </div>
      <div class="nav-item" onclick="switchTab('tab-settings')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>Settings & License</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="license-pill">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-weight: 700; color: #fff;" id="sidebar-tier-label">Community Tier</span>
          <span style="font-size: 10px; color: var(--accent);">ACTIVE</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">node:sqlite WAL Engine</div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px;">
        <span>Port 5633</span>
        <a href="/" style="color: var(--primary);">← Landing Page</a>
      </div>
    </div>
  </aside>

  <!-- Main Area -->
  <main class="main">
    <header class="topbar">
      <div class="topbar-title" id="page-title">Vault Overview</div>
      <div class="topbar-actions">
        <div class="badge-safe">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          LOCAL-FIRST SAFE • AIRGAPPED
        </div>
        <button class="btn btn-secondary" style="padding: 7px 12px;" onclick="refreshAllData()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Refresh</span>
        </button>
      </div>
    </header>

    <div class="content-area">

      <!-- ==================== TAB: OVERVIEW ==================== -->
      <section id="tab-overview" class="tab-content active">
        <div class="grid">
          <div class="card">
            <h3>Total Indexed Files</h3>
            <div class="stat" id="stat-files">-</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Active catalog records</div>
          </div>
          <div class="card">
            <h3>Managed Local Storage</h3>
            <div class="stat" id="stat-storage">-</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Across indexed directories</div>
          </div>
          <div class="card">
            <h3>Duplicate Storage Waste</h3>
            <div class="stat" id="stat-waste" style="color: var(--warning);">-</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Reclaimable duplicate copies</div>
          </div>
          <div class="card">
            <h3>Potentially Stale Files</h3>
            <div class="stat" id="stat-stale" style="color: var(--accent-cyan);">-</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Unmodified for >90 days</div>
          </div>
        </div>

        <!-- File Type Distribution Bar -->
        <div class="card" style="margin-bottom: 24px;">
          <h2 class="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Filesystem Category Composition
          </h2>
          <p class="section-desc">Real-time breakdown of managed files by classified MIME category:</p>

          <div class="breakdown-bar-wrap" id="breakdown-bar">
            <!-- Dynamic segments -->
          </div>

          <div id="breakdown-legend" style="display: flex; gap: 12px; flex-wrap: wrap;">
            <!-- Dynamic legend pills -->
          </div>
        </div>

        <!-- Quick Actions & Audit Feed -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div class="card">
            <h2 class="section-title">Quick Actions</h2>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
              <button class="btn btn-secondary" onclick="switchTab('tab-scan')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10 15 5-3-5-3v6z"/><circle cx="12" cy="12" r="10"/></svg>
                <span>Ingest & Index Target Directory</span>
              </button>
              <button class="btn btn-secondary" onclick="switchTab('tab-duplicates')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="13" height="13" x="8" y="8" rx="2"/></svg>
                <span>Inspect Duplicate Clusters & Waste</span>
              </button>
              <button class="btn btn-secondary" onclick="switchTab('tab-organize')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                <span>Run Safe Reorganization Planner</span>
              </button>
              <button class="btn btn-secondary" onclick="switchTab('tab-analytics')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>
                <span>Export CSV Catalog & Audit Reports</span>
              </button>
            </div>
          </div>

          <div class="card">
            <h2 class="section-title">Recent Operation Audit</h2>
            <p class="section-desc">Latest filesystem moves logged in SQLite WAL:</p>
            <div id="overview-recent-history" style="font-size: 12px; color: var(--text-muted); max-height: 200px; overflow-y: auto;">
              Loading audit log...
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB: SCANNER ==================== -->
      <section id="tab-scan" class="tab-content">
        <div class="card" style="margin-bottom: 24px;">
          <h2 class="section-title">Directory Ingestion & Indexer</h2>
          <p class="section-desc">Stream-hash all files in target folder with SHA-256 and store metadata in local SQLite WAL.</p>

          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <input type="text" id="index-path" placeholder="/path/to/local/directory" style="flex: 1;" />
            <button class="btn btn-primary" id="btn-start-index" onclick="startIndexing()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              <span>Scan & Index Directory</span>
            </button>
          </div>

          <!-- Quick Presets -->
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px; font-size: 12px; color: var(--text-muted);">
            <span>Quick Suggestions:</span>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="setScanPath('/home/abhinav/Desktop/projects/super ai agentic loop/localvault')">LocalVault Root</button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="setScanPath('/tmp')">/tmp</button>
          </div>

          <div id="index-status" style="padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); font-size: 13px; color: var(--text-muted); display: none;">
          </div>
        </div>
      </section>

      <!-- ==================== TAB: DUPLICATES ==================== -->
      <section id="tab-duplicates" class="tab-content">
        <div class="card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <h2 class="section-title">Exact Duplicate Clusters</h2>
              <p class="section-desc">Identical cryptographic SHA-256 digests and matching byte sizes.</p>
            </div>
            <button class="btn btn-warning" onclick="stageDuplicateConsolidation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              <span>1-Click Consolidate All Duplicates</span>
            </button>
          </div>

          <div id="duplicates-summary" style="margin-bottom: 16px; font-size: 13px; color: var(--text-muted);"></div>
          <div id="duplicates-container">Loading duplicate clusters...</div>
        </div>
      </section>

      <!-- ==================== TAB: ORGANIZE ==================== -->
      <section id="tab-organize" class="tab-content">
        <div class="card" style="margin-bottom: 24px;">
          <h2 class="section-title">Safe Reversible Organization Engine</h2>
          <p class="section-desc">
            Rule: No file is ever moved without an immutable preview and explicit user confirmation.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Source Directory</label>
              <input type="text" id="org-source" style="width: 100%;" placeholder="/path/to/source/folder" />
            </div>
            <div>
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Target Directory</label>
              <input type="text" id="org-target" style="width: 100%;" placeholder="/path/to/organized/folder" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Organization Strategy</label>
              <select id="org-strategy" style="width: 100%;" onchange="handleStrategyChange()">
                <option value="BY_CATEGORY">Sort by Category (Images/, Documents/, etc.)</option>
                <option value="BY_DATE">Sort by Date (YYYY/MM/)</option>
                <option value="DEDUPLICATE_CONSOLIDATE">Consolidate Duplicates to Archive</option>
                <option value="STALE_ARCHIVE">Archive Stale Files (>90 Days Unmodified)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Category Filter (Optional)</label>
              <select id="org-cat-filter" style="width: 100%;">
                <option value="">All Categories</option>
                <option value="IMAGE">Images Only</option>
                <option value="DOCUMENT">Documents Only</option>
                <option value="AUDIO">Audio Only</option>
                <option value="VIDEO">Video Only</option>
                <option value="ARCHIVE">Archives Only</option>
                <option value="CODE">Code Only</option>
              </select>
            </div>
            <div id="stale-days-wrap" style="display: none;">
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Stale Threshold (Days)</label>
              <input type="number" id="org-stale-days" value="90" min="1" style="width: 100%;" />
            </div>
          </div>

          <button class="btn btn-primary" onclick="generatePlan()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Generate Safe Preview Plan</span>
          </button>
        </div>

        <!-- History & Rollback Subcard -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 class="section-title">Audit History & Instant 1-Click Rollback</h2>
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="loadHistory()">Refresh History</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Source File</th>
                <th>Destination File</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="history-table-body">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No operation history yet</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ==================== TAB: SEARCH & EXPLORER ==================== -->
      <section id="tab-files" class="tab-content">
        <div class="card" style="margin-bottom: 24px;">
          <h2 class="section-title">Multi-Facet Catalog Explorer</h2>
          <p class="section-desc">Search files by name, extension, SHA-256 cryptographic digest, or size.</p>

          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <input type="text" id="search-input" placeholder="Search filename or path..." oninput="debounceSearch()" />
            <select id="category-filter" onchange="loadFiles()">
              <option value="">All Categories</option>
              <option value="IMAGE">Images</option>
              <option value="DOCUMENT">Documents</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
              <option value="ARCHIVE">Archives</option>
              <option value="CODE">Code</option>
              <option value="DATA">Data</option>
              <option value="OTHER">Other</option>
            </select>
            <input type="text" id="ext-filter" placeholder="Ext (e.g. pdf, png)" oninput="debounceSearch()" />
            <select id="dup-filter" onchange="loadFiles()">
              <option value="">All Files</option>
              <option value="true">Duplicates Only</option>
              <option value="false">Unique Only</option>
            </select>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
            <span id="files-count-label">Loading files...</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Category</th>
                <th>Size</th>
                <th>Path</th>
                <th>Modified</th>
                <th>Copy Path</th>
              </tr>
            </thead>
            <tbody id="files-table-body">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No files loaded</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ==================== TAB: ANALYTICS & REPORTS ==================== -->
      <section id="tab-analytics" class="tab-content">
        <div class="grid">
          <div class="card">
            <h2 class="section-title">Export Open Data</h2>
            <p class="section-desc">Export complete file catalog or duplicate listings to open machine-readable formats.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px;">
              <a href="/api/export?format=csv" target="_blank" class="btn btn-primary" style="text-decoration: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Download Files CSV (RFC 4180)</span>
              </a>
              <a href="/api/export?format=json" target="_blank" class="btn btn-secondary" style="text-decoration: none;">
                <span>Download Files JSON</span>
              </a>
              <a href="/api/duplicates?format=csv" target="_blank" class="btn btn-warning" style="text-decoration: none;">
                <span>Download Duplicates List (CSV)</span>
              </a>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
          <div class="card">
            <h2 class="section-title">Top Largest Files</h2>
            <div id="largest-files-list" style="font-size: 13px; max-height: 340px; overflow-y: auto;">
              Loading largest files...
            </div>
          </div>

          <div class="card">
            <h2 class="section-title">Recently Modified Files</h2>
            <div id="recent-files-list" style="font-size: 13px; max-height: 340px; overflow-y: auto;">
              Loading recent files...
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB: SETTINGS & LICENSE ==================== -->
      <section id="tab-settings" class="tab-content">
        <div class="card" style="margin-bottom: 24px;">
          <h2 class="section-title">Micro-SaaS License Management</h2>
          <p class="section-desc">Switch license tiers or activate a Pro / Team license key.</p>

          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Active License Tier</div>
                <div id="current-tier-display" style="font-size: 24px; font-weight: 800; color: #a5b4fc;">Community Free</div>
              </div>
              <span class="badge-safe">VALIDATED LOCAL KEY</span>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 14px;">
              <select id="license-tier-select" style="flex: 1;">
                <option value="COMMUNITY">Community Free (Up to 25k files)</option>
                <option value="PRO">Pro Lifetime Pass (Unlimited & Stale Archive)</option>
                <option value="TEAM">Team Privacy Vault (10 Workstations)</option>
              </select>
              <input type="text" id="license-key-input" placeholder="Enter license key (optional for demo)" style="flex: 1;" />
              <button class="btn btn-primary" onclick="updateLicense()">Update Tier</button>
            </div>
          </div>

          <div id="license-features-grid" style="font-size: 13px; color: var(--text-muted);">
            <!-- Dynamic features -->
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">Database Maintenance & Zero-Telemetry Status</h2>
          <p class="section-desc">Maintain local SQLite file integrity, execute vacuum compaction, and verify telemetry airgap.</p>

          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <button class="btn btn-secondary" onclick="runVacuum()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Run SQLite VACUUM & Optimize</span>
            </button>
          </div>

          <div style="font-size: 13px; color: var(--text-muted); line-height: 1.8;">
            <div>• Database Mode: <strong>node:sqlite WAL (Write-Ahead Logging)</strong></div>
            <div>• Telemetry: <strong>0% outbound network transmission</strong> (Airgapped)</div>
            <div>• Cryptographic Integrity: <strong>SHA-256 chunked streaming digest</strong></div>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- MODAL: PREVIEW & CONFIRMATION -->
  <dialog id="preview-modal" class="modal">
    <h3 style="font-size: 18px; margin-bottom: 8px; color: #e2e8f0;">Organization Plan Preview</h3>
    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
      Review planned file movements. Every change is logged in SQLite WAL with 1-click rollback support:
    </p>
    <div id="preview-actions-list" style="font-size: 12px; max-height: 320px; overflow-y: auto; margin-bottom: 20px; border: 1px solid var(--border); padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.3); font-family: monospace;"></div>

    <div style="margin-bottom: 20px;">
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
        <input type="checkbox" id="confirm-check" onchange="toggleExecuteBtn(this.checked)" />
        <span>I confirm execution of these operations (Reversible via Rollback).</span>
      </label>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 12px;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" id="confirm-execute-btn" disabled onclick="executeCurrentPlan()">Confirm & Execute</button>
    </div>
  </dialog>

  <script>
    let currentPlanId = null;
    let searchDebounceTimer = null;

    function showToast(msg, type = 'info') {
      const container = document.getElementById('toast-container');
      const t = document.createElement('div');
      t.className = 'toast ' + type;
      t.textContent = msg;
      container.appendChild(t);
      setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
      }, 3500);
    }

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');

      const titles = {
        'tab-overview': 'Vault Overview',
        'tab-scan': 'Directory Scanner',
        'tab-duplicates': 'Duplicate Hunter',
        'tab-organize': 'Smart Reversible Organizer',
        'tab-files': 'Search & File Explorer',
        'tab-analytics': 'Storage Analytics & Reports',
        'tab-settings': 'Settings & Micro-SaaS License'
      };
      document.getElementById('page-title').textContent = titles[tabId] || 'LocalVault';

      // Highlight sidebar
      document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('onclick')?.includes(tabId)) {
          item.classList.add('active');
        }
      });

      if (tabId === 'tab-duplicates') loadDuplicates();
      if (tabId === 'tab-organize') loadHistory();
      if (tabId === 'tab-files') loadFiles();
      if (tabId === 'tab-analytics') loadAnalytics();
      if (tabId === 'tab-settings') loadLicense();
    }

    async function refreshAllData() {
      await loadStats();
      await loadFiles();
      showToast('All system data reloaded from SQLite catalog', 'success');
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/reports/summary');
        const data = await res.json();
        document.getElementById('stat-files').textContent = (data.totalFiles || 0).toLocaleString();
        document.getElementById('stat-storage').textContent = formatBytes(data.totalStorageBytes || 0);
        document.getElementById('stat-waste').textContent = formatBytes(data.duplicateWasteBytes || 0);
        document.getElementById('stat-stale').textContent = (data.staleFiles ? data.staleFiles.length : 0).toLocaleString();

        // Render breakdown bar
        renderBreakdownBar(data.categoryBreakdown, data.totalStorageBytes);
      } catch (err) {
        console.error(err);
      }
    }

    function renderBreakdownBar(breakdown, totalBytes) {
      const bar = document.getElementById('breakdown-bar');
      const legend = document.getElementById('breakdown-legend');
      bar.innerHTML = '';
      legend.innerHTML = '';
      if (!breakdown || totalBytes === 0) {
        bar.innerHTML = '<div style="width: 100%; background: rgba(255,255,255,0.05);"></div>';
        legend.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">No indexed storage data</span>';
        return;
      }

      const colors = {
        IMAGE: '#34d399',
        DOCUMENT: '#818cf8',
        AUDIO: '#fbbf24',
        VIDEO: '#c084fc',
        ARCHIVE: '#fb7185',
        CODE: '#38bdf8',
        DATA: '#60a5fa',
        OTHER: '#94a3b8'
      };

      for (const [cat, info] of Object.entries(breakdown)) {
        if (info.bytes > 0) {
          const pct = Math.max(1, Math.round((info.bytes / totalBytes) * 100));
          const seg = document.createElement('div');
          seg.className = 'breakdown-segment';
          seg.style.width = pct + '%';
          seg.style.background = colors[cat] || '#94a3b8';
          seg.title = cat + ': ' + formatBytes(info.bytes) + ' (' + pct + '%)';
          bar.appendChild(seg);

          const pill = document.createElement('div');
          pill.style.display = 'flex';
          pill.style.alignItems = 'center';
          pill.style.gap = '6px';
          pill.style.fontSize = '12px';
          pill.innerHTML = '<span style="width: 8px; height: 8px; border-radius: 50%; background: ' + colors[cat] + ';"></span>' +
            '<span>' + cat + ' (' + formatBytes(info.bytes) + ' • ' + info.count + ')</span>';
          legend.appendChild(pill);
        }
      }
    }

    function setScanPath(path) {
      document.getElementById('index-path').value = path;
    }

    async function startIndexing() {
      const pathInput = document.getElementById('index-path').value.trim();
      if (!pathInput) return alert('Please enter a directory path');
      const btn = document.getElementById('btn-start-index');
      const statusDiv = document.getElementById('index-status');
      btn.disabled = true;
      statusDiv.style.display = 'block';
      statusDiv.textContent = 'Scanning and stream-hashing files with SHA-256...';

      try {
        const res = await fetch('/api/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directoryPath: pathInput })
        });
        const result = await res.json();
        btn.disabled = false;
        if (res.ok) {
          statusDiv.innerHTML = '<span style="color: var(--accent);">✓ Successfully indexed ' + result.indexed + ' files</span> (' + result.skipped + ' skipped) in ' + result.durationMs + 'ms.';
          showToast('Indexed ' + result.indexed + ' files successfully', 'success');
          loadStats();
          loadFiles();
        } else {
          statusDiv.innerHTML = '<span style="color: var(--danger);">✗ Indexing failed: ' + (result.error || 'Unknown error') + '</span>';
          showToast('Indexing failed: ' + result.error, 'error');
        }
      } catch (err) {
        btn.disabled = false;
        statusDiv.innerHTML = '<span style="color: var(--danger);">Error: ' + err.message + '</span>';
      }
    }

    function debounceSearch() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(loadFiles, 250);
    }

    async function loadFiles() {
      const term = document.getElementById('search-input')?.value.trim();
      const cat = document.getElementById('category-filter')?.value;
      const ext = document.getElementById('ext-filter')?.value.trim();
      const dup = document.getElementById('dup-filter')?.value;

      const query = new URLSearchParams();
      if (term) query.set('term', term);
      if (cat) query.set('category', cat);
      if (ext) query.set('extension', ext.startsWith('.') ? ext : '.' + ext);
      if (dup !== '') query.set('isDuplicate', dup);

      try {
        const res = await fetch('/api/files?' + query.toString());
        const data = await res.json();
        const tbody = document.getElementById('files-table-body');
        const countLabel = document.getElementById('files-count-label');
        if (countLabel) countLabel.textContent = 'Showing ' + (data.files?.length || 0) + ' of ' + (data.total || 0) + ' indexed files';

        tbody.innerHTML = '';
        if (!data.files || data.files.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching files found in catalog</td></tr>';
          return;
        }

        for (const f of data.files) {
          const tr = document.createElement('tr');
          const catClass = 'cat-' + f.category.toLowerCase();
          tr.innerHTML = '<td><strong>' + f.filename + '</strong></td>' +
            '<td><span class="cat-badge ' + catClass + '">' + f.category + '</span></td>' +
            '<td>' + formatBytes(f.sizeBytes) + '</td>' +
            '<td style="font-size: 12px; color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + f.path + '">' + f.path + '</td>' +
            '<td>' + new Date(f.mtimeMs).toLocaleDateString() + '</td>' +
            '<td><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="copyToClipboard(\\'' + f.path.replace(/\\\\/g, '\\\\\\\\') + '\\')">Copy Path</button></td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadDuplicates() {
      const container = document.getElementById('duplicates-container');
      const summary = document.getElementById('duplicates-summary');
      container.innerHTML = 'Loading duplicate clusters...';
      try {
        const res = await fetch('/api/duplicates');
        const data = await res.json();
        if (!data.groups || data.groups.length === 0) {
          container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--accent);">✓ Zero duplicate files detected in indexed directories!</div>';
          summary.textContent = '0 duplicate clusters found.';
          return;
        }

        summary.innerHTML = 'Found <strong>' + data.groups.length + ' duplicate clusters</strong> across ' + data.totalDuplicateFiles + ' copies, wasting <strong>' + formatBytes(data.totalWastedBytes) + '</strong> of storage.';
        container.innerHTML = '';

        for (const group of data.groups) {
          const card = document.createElement('div');
          card.style.marginBottom = '16px';
          card.style.padding = '16px';
          card.style.background = 'rgba(0,0,0,0.3)';
          card.style.border = '1px solid var(--border)';
          card.style.borderRadius = '10px';

          card.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<div>' +
            '  <span class="cat-badge" style="background: rgba(99,102,241,0.2); color: #c7d2fe; font-family: monospace;">SHA-256: ' + group.hash.slice(0, 16) + '...</span>' +
            '  <span style="margin-left: 10px; font-weight: 700;">' + group.fileCount + ' copies (' + formatBytes(group.sizeBytes) + ' each)</span>' +
            '</div>' +
            '<span style="color: var(--warning); font-weight: 700;">Waste: ' + formatBytes(group.wastedBytes) + '</span>' +
            '</div>' +
            '<div style="font-size: 13px; color: var(--text-muted);">' +
            group.files.map(f => '<div style="padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between;"><span>' + f.path + '</span><span>' + new Date(f.mtimeMs).toLocaleDateString() + '</span></div>').join('') +
            '</div>';
          container.appendChild(card);
        }
      } catch (err) {
        container.innerHTML = 'Failed to load duplicates: ' + err.message;
      }
    }

    function stageDuplicateConsolidation() {
      switchTab('tab-organize');
      document.getElementById('org-strategy').value = 'DEDUPLICATE_CONSOLIDATE';
      handleStrategyChange();
      showToast('Pre-selected Duplicate Consolidation strategy. Enter target directory to proceed.', 'info');
    }

    function handleStrategyChange() {
      const strat = document.getElementById('org-strategy').value;
      document.getElementById('stale-days-wrap').style.display = strat === 'STALE_ARCHIVE' ? 'block' : 'none';
    }

    async function generatePlan() {
      const source = document.getElementById('org-source').value.trim();
      const target = document.getElementById('org-target').value.trim();
      const strategy = document.getElementById('org-strategy').value;
      const categoryFilter = document.getElementById('org-cat-filter').value || undefined;
      const staleDays = strategy === 'STALE_ARCHIVE' ? Number(document.getElementById('org-stale-days').value) : undefined;

      if (!source || !target) return alert('Source and Target directories are required.');

      try {
        const res = await fetch('/api/organize/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceDirectory: source, targetDirectory: target, strategy, categoryFilter, staleDays })
        });
        const data = await res.json();
        if (!res.ok) return alert('Failed to create plan: ' + data.error);

        currentPlanId = data.plan.id;
        const list = document.getElementById('preview-actions-list');
        if (!data.plan.actions || data.plan.actions.length === 0) {
          list.innerHTML = '<div style="color: var(--text-muted); padding: 12px;">No matching files found under ' + source + ' to organize.</div>';
          document.getElementById('confirm-check').disabled = true;
        } else {
          document.getElementById('confirm-check').disabled = false;
          list.innerHTML = data.plan.actions.map(a =>
            '<div style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">' +
            '<div>' + a.sourcePath + '</div>' +
            '<div style="color: var(--accent);">↳ ' + a.destinationPath + (a.collisionResolvedPath ? ' <span style="color: var(--warning); font-size: 10px;">[Collision disambiguated]</span>' : '') + '</div>' +
            '</div>'
          ).join('');
        }

        document.getElementById('confirm-check').checked = false;
        document.getElementById('confirm-execute-btn').disabled = true;
        document.getElementById('preview-modal').showModal();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    function toggleExecuteBtn(checked) {
      document.getElementById('confirm-execute-btn').disabled = !checked;
    }

    function closeModal() {
      document.getElementById('preview-modal').close();
    }

    async function executeCurrentPlan() {
      if (!currentPlanId) return;
      try {
        const res = await fetch('/api/organize/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: currentPlanId, confirm: true })
        });
        const data = await res.json();
        closeModal();
        if (res.ok) {
          showToast('Successfully moved ' + data.executedCount + ' files with atomic rollback safety!', 'success');
          loadStats();
          loadFiles();
          loadHistory();
        } else {
          showToast('Execution failed: ' + data.error, 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function loadHistory() {
      const tbody = document.getElementById('history-table-body');
      const recentAudit = document.getElementById('overview-recent-history');
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        tbody.innerHTML = '';
        if (recentAudit) recentAudit.innerHTML = '';

        if (!data.history || data.history.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 16px;">No operation history recorded</td></tr>';
          if (recentAudit) recentAudit.textContent = 'No filesystem mutations executed yet.';
          return;
        }

        if (recentAudit) {
          recentAudit.innerHTML = data.history.slice(0, 5).map(h =>
            '<div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between;">' +
            '<span>' + h.operationType + ': ' + h.sourcePath.split('/').pop() + '</span>' +
            '<span style="color: var(--accent);">' + (h.status === 'SUCCESS' ? '✓' : '✗') + '</span>' +
            '</div>'
          ).join('');
        }

        for (const h of data.history) {
          const tr = document.createElement('tr');
          tr.innerHTML = '<td>' + new Date(h.timestamp).toLocaleTimeString() + '</td>' +
            '<td><span class="cat-badge" style="background: rgba(99,102,241,0.2); color: #c7d2fe;">' + h.operationType + '</span></td>' +
            '<td style="font-size: 12px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + h.sourcePath + '">' + h.sourcePath + '</td>' +
            '<td style="font-size: 12px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + h.destinationPath + '">' + h.destinationPath + '</td>' +
            '<td>' + (h.status === 'SUCCESS' ? '<span style="color: var(--accent);">✓</span>' : '<span style="color: var(--danger);">✗</span>') + '</td>' +
            '<td>' + (h.operationType === 'MOVE' ? '<button class="btn btn-warning" style="padding: 4px 8px; font-size: 11px;" onclick="rollbackBatch(\\'' + h.batchId + '\\')">Rollback</button>' : '') + '</td>';
          tbody.appendChild(tr);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function rollbackBatch(batchId) {
      if (!confirm('Rollback batch ' + batchId + '? All files will be restored to their original source locations.')) return;
      try {
        const res = await fetch('/api/organize/rollback/' + batchId, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast('Rollback successful! ' + data.restoredCount + ' files restored.', 'success');
          loadStats();
          loadFiles();
          loadHistory();
        } else {
          showToast('Rollback failed: ' + data.error, 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function loadAnalytics() {
      try {
        const res = await fetch('/api/reports/summary');
        const data = await res.json();
        const largestContainer = document.getElementById('largest-files-list');
        const recentContainer = document.getElementById('recent-files-list');

        if (data.largestFiles && data.largestFiles.length > 0) {
          largestContainer.innerHTML = data.largestFiles.map((f, i) =>
            '<div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center;">' +
            '<div><strong>#' + (i + 1) + ' ' + f.filename + '</strong><br/><span style="font-size: 11px; color: var(--text-muted);">' + f.path + '</span></div>' +
            '<span class="cat-badge" style="background: rgba(245,158,11,0.2); color: #fbbf24;">' + formatBytes(f.sizeBytes) + '</span>' +
            '</div>'
          ).join('');
        } else {
          largestContainer.innerHTML = '<div style="color: var(--text-muted);">No files found.</div>';
        }

        if (data.recentlyModifiedFiles && data.recentlyModifiedFiles.length > 0) {
          recentContainer.innerHTML = data.recentlyModifiedFiles.map(f =>
            '<div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center;">' +
            '<div><strong>' + f.filename + '</strong><br/><span style="font-size: 11px; color: var(--text-muted);">' + f.path + '</span></div>' +
            '<span style="font-size: 11px; color: var(--text-muted);">' + new Date(f.mtimeMs).toLocaleDateString() + '</span>' +
            '</div>'
          ).join('');
        } else {
          recentContainer.innerHTML = '<div style="color: var(--text-muted);">No recent files found.</div>';
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadLicense() {
      try {
        const res = await fetch('/api/license');
        const data = await res.json();
        document.getElementById('current-tier-display').textContent = data.tier + ' Tier';
        document.getElementById('sidebar-tier-label').textContent = data.tier + ' Tier';
        document.getElementById('license-tier-select').value = data.tier;

        const grid = document.getElementById('license-features-grid');
        grid.innerHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">' +
          '<div>' + (data.features.unlimitedFiles ? '✓' : '✗') + ' Unlimited Files Indexing</div>' +
          '<div>' + (data.features.sha256Deduplication ? '✓' : '✗') + ' Cryptographic SHA-256 Deduplication</div>' +
          '<div>' + (data.features.automatedRollback ? '✓' : '✗') + ' 1-Click Rollback Safety Engine</div>' +
          '<div>' + (data.features.staleArchive ? '✓' : '✗') + ' Stale File Auto-Archiving</div>' +
          '<div>' + (data.features.exportReports ? '✓' : '✗') + ' RFC 4180 CSV / JSON Export Engine</div>' +
          '<div>' + (data.features.airgappedZeroTelemetry ? '✓' : '✗') + ' 100% Airgapped Zero-Telemetry SLA</div>' +
          '</div>';
      } catch (err) {
        console.error(err);
      }
    }

    async function updateLicense() {
      const tier = document.getElementById('license-tier-select').value;
      const key = document.getElementById('license-key-input').value.trim();
      try {
        const res = await fetch('/api/license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, licenseKey: key })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('License updated to ' + data.tier + ' successfully!', 'success');
          loadLicense();
        } else {
          showToast('Failed to update license: ' + data.error, 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function runVacuum() {
      try {
        const res = await fetch('/api/maintenance/vacuum', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast('SQLite VACUUM & compaction complete!', 'success');
        } else {
          showToast('Vacuum failed: ' + data.error, 'error');
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied path to clipboard!', 'info');
      }).catch(() => {
        prompt('Copy path:', text);
      });
    }

    // Initial load
    loadStats();
    loadFiles();
  </script>
</body>
</html>`;
}
