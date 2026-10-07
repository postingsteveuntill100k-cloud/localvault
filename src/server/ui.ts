export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalVault — Privacy-First File Organizer</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --accent: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .header h1 { font-size: 24px; font-weight: 700; color: var(--primary); }
    .badge-safe {
      background: rgba(16, 185, 129, 0.2);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .card h3 { font-size: 14px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .card .stat { font-size: 28px; font-weight: 700; color: var(--text); }
    .section-title { font-size: 18px; margin-bottom: 12px; font-weight: 600; color: var(--primary); }
    .btn {
      background: var(--primary);
      color: #0f172a;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary { background: #475569; color: #fff; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-warning { background: var(--warning); color: #000; }
    input, select {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #fff;
      padding: 8px 12px;
      font-size: 14px;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 12px; text-transform: uppercase; }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    .tab-btn.active { background: var(--border); color: #fff; font-weight: 600; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal.open { display: flex; }
    .modal-content {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      max-width: 650px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>LocalVault 🔒</h1>
      <p style="color: var(--text-muted); font-size: 13px;">Privacy-First Local File Organizer & Deduplicator</p>
    </div>
    <div class="badge-safe">LOCAL-FIRST SAFE • AIRGAPPED</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Total Indexed Files</h3>
      <div class="stat" id="stat-files">-</div>
    </div>
    <div class="card">
      <h3>Total Managed Storage</h3>
      <div class="stat" id="stat-storage">-</div>
    </div>
    <div class="card">
      <h3>Duplicate Storage Waste</h3>
      <div class="stat" id="stat-waste" style="color: var(--warning);">-</div>
    </div>
    <div class="card">
      <h3>Potentially Stale Files</h3>
      <div class="stat" id="stat-stale">-</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 24px;">
    <h2 class="section-title">Directory Ingestion & Indexer</h2>
    <div style="display: flex; gap: 12px; margin-top: 8px;">
      <input type="text" id="index-path" placeholder="/path/to/local/directory" style="flex: 1;" />
      <button class="btn" onclick="startIndexing()">Scan & Index Directory</button>
    </div>
    <div id="index-status" style="margin-top: 8px; font-size: 13px; color: var(--text-muted);"></div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('tab-files')">Files Browser</button>
    <button class="tab-btn" onclick="switchTab('tab-duplicates')">Duplicate Clusters</button>
    <button class="tab-btn" onclick="switchTab('tab-organize')">Safe Organizer</button>
    <button class="tab-btn" onclick="switchTab('tab-history')">Audit & Rollback</button>
    <button class="tab-btn" onclick="switchTab('tab-export')">Export Data</button>
  </div>

  <!-- TAB: FILES -->
  <div id="tab-files" class="tab-content active card">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <input type="text" id="search-input" placeholder="Search filename or path..." style="flex: 1;" oninput="loadFiles()" />
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
    </div>
    <table>
      <thead>
        <tr>
          <th>Filename</th>
          <th>Category</th>
          <th>Size</th>
          <th>Path</th>
          <th>Modified</th>
        </tr>
      </thead>
      <tbody id="files-table-body">
        <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No files loaded</td></tr>
      </tbody>
    </table>
  </div>

  <!-- TAB: DUPLICATES -->
  <div id="tab-duplicates" class="tab-content card">
    <h2 class="section-title">Exact Duplicate Clusters</h2>
    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">Files with identical cryptographic SHA-256 hashes and sizes.</p>
    <div id="duplicates-container">Loading duplicates...</div>
  </div>

  <!-- TAB: ORGANIZE -->
  <div id="tab-organize" class="tab-content card">
    <h2 class="section-title">Safe Reversible Organization Engine</h2>
    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
      Rule: No file is ever moved without an immutable preview and explicit user confirmation.
    </p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
      <div>
        <label style="font-size: 12px; color: var(--text-muted);">Source Directory</label>
        <input type="text" id="org-source" style="width: 100%; margin-top: 4px;" placeholder="/source/folder" />
      </div>
      <div>
        <label style="font-size: 12px; color: var(--text-muted);">Target Directory</label>
        <input type="text" id="org-target" style="width: 100%; margin-top: 4px;" placeholder="/organized/folder" />
      </div>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
      <select id="org-strategy">
        <option value="BY_CATEGORY">Sort by Category (Images/, Documents/, etc.)</option>
        <option value="BY_DATE">Sort by Date (YYYY/MM/)</option>
        <option value="DEDUPLICATE_CONSOLIDATE">Consolidate Duplicates to Archive</option>
      </select>
      <button class="btn" onclick="generatePlan()">Generate Safe Preview Plan</button>
    </div>
  </div>

  <!-- TAB: HISTORY -->
  <div id="tab-history" class="tab-content card">
    <h2 class="section-title">Operation History & Instant Rollback</h2>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Type</th>
          <th>Source</th>
          <th>Destination</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="history-table-body">
        <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No operation history yet</td></tr>
      </tbody>
    </table>
  </div>

  <!-- TAB: EXPORT -->
  <div id="tab-export" class="tab-content card">
    <h2 class="section-title">Export Indexed Data</h2>
    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Export complete file catalog or duplicate listings to open machine-readable formats.</p>
    <div style="display: flex; gap: 12px;">
      <a href="/api/export?format=csv" target="_blank" class="btn" style="text-decoration: none;">Download Files CSV (RFC 4180)</a>
      <a href="/api/export?format=json" target="_blank" class="btn btn-secondary" style="text-decoration: none;">Download Files JSON</a>
      <a href="/api/duplicates?format=csv" target="_blank" class="btn btn-warning" style="text-decoration: none;">Download Duplicates List</a>
    </div>
  </div>

  <!-- MODAL: PREVIEW & CONFIRMATION -->
  <div id="preview-modal" class="modal">
    <div class="modal-content">
      <h3 style="font-size: 18px; margin-bottom: 12px; color: var(--primary);">Organization Plan Preview</h3>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Review planned operations before executing:</p>
      <div id="preview-actions-list" style="font-size: 13px; max-height: 300px; overflow-y: auto; margin-bottom: 16px; border: 1px solid var(--border); padding: 8px; border-radius: 6px;"></div>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-execute-btn" onclick="executeCurrentPlan()">Confirm & Execute</button>
      </div>
    </div>
  </div>

  <script>
    let currentPlanId = null;

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/reports/summary');
        const data = await res.json();
        document.getElementById('stat-files').textContent = data.totalFiles.toLocaleString();
        document.getElementById('stat-storage').textContent = formatBytes(data.totalStorageBytes);
        document.getElementById('stat-waste').textContent = formatBytes(data.duplicateWasteBytes);
        document.getElementById('stat-stale').textContent = data.staleFiles ? data.staleFiles.length : 0;
      } catch (err) {}
    }

    async function startIndexing() {
      const pathInput = document.getElementById('index-path').value.trim();
      if (!pathInput) return alert('Please enter a directory path');
      const statusDiv = document.getElementById('index-status');
      statusDiv.textContent = 'Scanning and indexing directory in background...';
      try {
        const res = await fetch('/api/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directoryPath: pathInput })
        });
        const result = await res.json();
        if (res.ok) {
          statusDiv.textContent = 'Successfully indexed ' + result.indexed + ' files (' + result.skipped + ' skipped).';
          loadStats();
          loadFiles();
        } else {
          statusDiv.textContent = 'Indexing failed: ' + (result.error || 'Unknown error');
        }
      } catch (err) {
        statusDiv.textContent = 'Error: ' + err.message;
      }
    }

    async function loadFiles() {
      const term = document.getElementById('search-input').value.trim();
      const cat = document.getElementById('category-filter').value;
      const query = new URLSearchParams();
      if (term) query.set('term', term);
      if (cat) query.set('category', cat);

      const res = await fetch('/api/files?' + query.toString());
      const data = await res.json();
      const tbody = document.getElementById('files-table-body');
      tbody.innerHTML = '';
      if (!data.files || data.files.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No matching files</td></tr>';
        return;
      }
      for (const f of data.files) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td><strong>' + f.filename + '</strong></td>' +
          '<td><span class="badge-safe">' + f.category + '</span></td>' +
          '<td>' + formatBytes(f.sizeBytes) + '</td>' +
          '<td style="font-size: 12px; color: var(--text-muted);">' + f.path + '</td>' +
          '<td>' + new Date(f.mtimeMs).toLocaleDateString() + '</td>';
        tbody.appendChild(tr);
      }
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.target.classList.add('active');
      if (tabId === 'tab-duplicates') loadDuplicates();
      if (tabId === 'tab-history') loadHistory();
    }

    async function loadDuplicates() {
      const container = document.getElementById('duplicates-container');
      container.innerHTML = 'Loading duplicate clusters...';
      const res = await fetch('/api/duplicates');
      const data = await res.json();
      if (!data.groups || data.groups.length === 0) {
        container.innerHTML = '<p style="color: var(--accent);">No duplicate files found!</p>';
        return;
      }
      container.innerHTML = '';
      for (const group of data.groups) {
        const div = document.createElement('div');
        div.style.marginBottom = '16px';
        div.style.padding = '12px';
        div.style.background = '#0f172a';
        div.style.borderRadius = '6px';
        div.innerHTML = '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
          '<strong>Hash: ' + group.hash.slice(0, 16) + '... (' + group.fileCount + ' copies)</strong>' +
          '<span style="color: var(--warning);">Wasted: ' + formatBytes(group.wastedBytes) + '</span>' +
          '</div>' +
          '<ul style="font-size: 13px; color: var(--text-muted); list-style: disc inside;">' +
          group.files.map(f => '<li>' + f.path + '</li>').join('') +
          '</ul>';
        container.appendChild(div);
      }
    }

    async function generatePlan() {
      const source = document.getElementById('org-source').value.trim();
      const target = document.getElementById('org-target').value.trim();
      const strategy = document.getElementById('org-strategy').value;
      if (!source || !target) return alert('Source and target directories are required');

      const res = await fetch('/api/organize/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDirectory: source, targetDirectory: target, strategy })
      });
      const data = await res.json();
      if (!res.ok) return alert('Failed to create plan: ' + data.error);

      currentPlanId = data.plan.id;
      const list = document.getElementById('preview-actions-list');
      list.innerHTML = data.plan.actions.map(a =>
        '<div style="margin-bottom: 6px;"><code>' + a.sourcePath + '</code><br/>&nbsp;↳ <strong>' + a.destinationPath + '</strong></div>'
      ).join('');
      document.getElementById('preview-modal').classList.add('open');
    }

    function closeModal() {
      document.getElementById('preview-modal').classList.remove('open');
    }

    async function executeCurrentPlan() {
      if (!currentPlanId) return;
      const res = await fetch('/api/organize/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlanId, confirm: true })
      });
      const data = await res.json();
      closeModal();
      if (res.ok) {
        alert('Plan executed successfully: ' + data.executedCount + ' files moved.');
        loadStats();
        loadFiles();
      } else {
        alert('Execution failed: ' + data.error);
      }
    }

    async function loadHistory() {
      const tbody = document.getElementById('history-table-body');
      const res = await fetch('/api/history');
      const data = await res.json();
      tbody.innerHTML = '';
      if (!data.history || data.history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No history recorded</td></tr>';
        return;
      }
      for (const h of data.history) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + new Date(h.timestamp).toLocaleTimeString() + '</td>' +
          '<td>' + h.operationType + '</td>' +
          '<td style="font-size: 12px; color: var(--text-muted);">' + h.sourcePath + '</td>' +
          '<td style="font-size: 12px;">' + h.destinationPath + '</td>' +
          '<td>' + (h.status === 'SUCCESS' ? '✓' : '✗') + '</td>' +
          '<td>' + (h.operationType === 'MOVE' ? '<button class="btn btn-warning" style="padding: 4px 8px; font-size: 11px;" onclick="rollbackBatch(\\'' + h.batchId + '\\')">Rollback</button>' : '') + '</td>';
        tbody.appendChild(tr);
      }
    }

    async function rollbackBatch(batchId) {
      if (!confirm('Are you sure you want to rollback batch ' + batchId + '?')) return;
      const res = await fetch('/api/organize/rollback/' + batchId, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('Batch rolled back: ' + data.restoredCount + ' files restored.');
        loadStats();
        loadFiles();
        loadHistory();
      } else {
        alert('Rollback failed: ' + data.error);
      }
    }

    loadStats();
    loadFiles();
  </script>
</body>
</html>`;
}
