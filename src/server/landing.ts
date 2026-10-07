export function renderLandingPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalVault — Privacy-First File Organizer & Duplicate Hunter</title>
  <meta name="description" content="100% Local, Zero-Knowledge file organization, streaming SHA-256 deduplication, and safe reversible batch reorganization.">
  <style>
    :root {
      --bg: #070b14;
      --bg-card: rgba(15, 23, 42, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.3);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --secondary: #8b5cf6;
      --accent-emerald: #10b981;
      --accent-cyan: #06b6d4;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background-color: var(--bg);
      background-image:
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 10%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 60%, rgba(16, 185, 129, 0.06) 0px, transparent 50%);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }

    /* Nav */
    .nav {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(7, 11, 20, 0.8);
      border-bottom: 1px solid var(--border);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-badge {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--accent-emerald);
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }
    .nav-links {
      display: flex;
      gap: 24px;
      align-items: center;
      font-size: 14px;
      color: var(--text-muted);
    }
    .nav-links a:hover { color: var(--text); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #fff;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
    }
    .btn-primary:hover {
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Hero */
    .hero {
      padding: 80px 0 60px;
      text-align: center;
      position: relative;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid var(--border-accent);
      color: #c7d2fe;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .hero-title {
      font-size: 54px;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.03em;
      max-width: 900px;
      margin: 0 auto 20px;
    }
    .hero-title span {
      background: linear-gradient(135deg, #a5b4fc, #38bdf8, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 18px;
      color: var(--text-muted);
      max-width: 700px;
      margin: 0 auto 36px;
      line-height: 1.6;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      align-items: center;
      margin-bottom: 48px;
    }
    .trust-strip {
      display: flex;
      justify-content: center;
      gap: 32px;
      color: var(--text-muted);
      font-size: 13px;
      padding: 16px;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      max-width: 860px;
      margin: 0 auto 60px;
      flex-wrap: wrap;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Interactive Demo Card */
    .demo-wrapper {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      margin-bottom: 100px;
    }
    .demo-header {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }
    .demo-dots {
      display: flex;
      gap: 6px;
    }
    .demo-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .demo-dot.red { background: #ef4444; }
    .demo-dot.yellow { background: #f59e0b; }
    .demo-dot.green { background: #10b981; }
    .demo-tabs {
      display: flex;
      gap: 8px;
    }
    .demo-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }
    .demo-tab-btn.active {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .demo-body {
      padding: 32px;
    }
    .demo-pane { display: none; }
    .demo-pane.active { display: block; }

    /* Features Grid */
    .section-title {
      font-size: 32px;
      font-weight: 700;
      text-align: center;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .section-desc {
      text-align: center;
      color: var(--text-muted);
      font-size: 16px;
      max-width: 600px;
      margin: 0 auto 50px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 100px;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      transition: all 0.25s;
    }
    .feature-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-accent);
      transform: translateY(-2px);
    }
    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .icon-cyan { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
    .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .icon-rose { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
    .icon-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .feature-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .feature-text { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

    /* Comparison Table */
    .comparison-section {
      margin-bottom: 100px;
    }
    .comparison-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow-x: auto;
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }
    .comp-table th, .comp-table td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .comp-table th {
      background: rgba(0, 0, 0, 0.2);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .highlight-col {
      background: rgba(99, 102, 241, 0.06);
      border-left: 1px solid rgba(99, 102, 241, 0.2);
      border-right: 1px solid rgba(99, 102, 241, 0.2);
      font-weight: 600;
      color: #c7d2fe;
    }

    /* Pricing Section */
    .pricing-section {
      margin-bottom: 100px;
    }
    .pricing-toggle-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
    }
    .toggle-switch {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      padding: 4px;
      display: flex;
      cursor: pointer;
      user-select: none;
    }
    .toggle-opt {
      padding: 6px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.2s;
    }
    .toggle-opt.active {
      background: var(--primary);
      color: #fff;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px 28px;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .pricing-card.featured {
      border-color: var(--primary);
      box-shadow: 0 0 40px rgba(99, 102, 241, 0.2);
      background: rgba(20, 27, 50, 0.85);
    }
    .popular-tag {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 9999px;
    }
    .pricing-tier { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .pricing-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; min-height: 40px; }
    .pricing-amount {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .pricing-cadence { font-size: 12px; color: var(--text-muted); margin-bottom: 24px; }
    .pricing-list {
      list-style: none;
      margin-bottom: 32px;
      flex: 1;
    }
    .pricing-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      margin-bottom: 12px;
      color: #cbd5e1;
    }
    .pricing-list li svg { flex-shrink: 0; margin-top: 2px; }

    /* CTA Section */
    .cta-banner {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
      border: 1px solid var(--border-accent);
      border-radius: 20px;
      padding: 60px 40px;
      text-align: center;
      margin-bottom: 100px;
    }
    .cta-title { font-size: 36px; font-weight: 800; margin-bottom: 16px; }
    .cta-desc { font-size: 16px; color: var(--text-muted); max-width: 600px; margin: 0 auto 32px; }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border);
      padding: 40px 0;
      color: var(--text-muted);
      font-size: 13px;
    }
    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 36px; }
      .hero-actions { flex-direction: column; }
      .trust-strip { gap: 16px; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav">
    <div class="brand">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
      <span>LocalVault</span>
      <span class="brand-badge">Airgapped Local-First</span>
    </div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#demo">Interactive Demo</a>
      <a href="#comparison">Why Local?</a>
      <a href="#pricing">Pricing</a>
      <a href="/api/health" target="_blank">System API</a>
    </div>
    <div>
      <a href="/app" class="btn btn-primary">
        <span>Launch Web App</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero container">
    <div class="hero-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
      100% Zero-Knowledge • 0 Bytes Cloud Transmission • Instant Rollback
    </div>
    <h1 class="hero-title">
      Clean Your Local Files.<br/>
      <span>Without Surrendering Your Privacy.</span>
    </h1>
    <p class="hero-subtitle">
      Stop uploading personal documents and media to third-party clouds. LocalVault gives you industrial-grade streaming SHA-256 deduplication, intelligent category sorting, and safe reversible organization — completely offline.
    </p>
    <div class="hero-actions">
      <a href="/dashboard" class="btn btn-primary" style="font-size: 16px; padding: 14px 28px;">
        <span>Open LocalVault Dashboard</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
      <a href="#demo" class="btn btn-secondary" style="font-size: 16px; padding: 14px 24px;">
        <span>Try Interactive Simulator</span>
      </a>
    </div>

    <!-- Trust Strip -->
    <div class="trust-strip">
      <div class="trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Zero Telemetry / 0% Cloud Transmission</span>
      </div>
      <div class="trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span>Streaming SHA-256 Backpressure</span>
      </div>
      <div class="trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <span>Embedded SQLite WAL Engine</span>
      </div>
      <div class="trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        <span>1-Click Atomic Rollback</span>
      </div>
    </div>

    <!-- Interactive Simulator Component -->
    <div id="demo" class="demo-wrapper">
      <div class="demo-header">
        <div class="demo-dots">
          <div class="demo-dot red"></div>
          <div class="demo-dot yellow"></div>
          <div class="demo-dot green"></div>
        </div>
        <div class="demo-tabs">
          <button class="demo-tab-btn active" onclick="switchDemoTab('calc', this)">Storage Savings Calculator</button>
          <button class="demo-tab-btn" onclick="switchDemoTab('organizer', this)">Live Reorganizer Preview</button>
          <button class="demo-tab-btn" onclick="switchDemoTab('hasher', this)">SHA-256 Stream Hasher</button>
        </div>
        <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">sandbox-live-v1.0</span>
      </div>

      <div class="demo-body">
        <!-- PANE 1: CALCULATOR -->
        <div id="demo-calc" class="demo-pane active">
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Estimate Your Local Disk Waste & Cloud Savings</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px;">Adjust your estimated local filesystem size to calculate reclaimable space from redundant media and duplicate files:</p>

          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 760px; margin: 0 auto 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600;">
              <span>Total Drive Storage: <strong id="calc-gb-display" style="color: var(--primary);">500 GB</strong></span>
              <span style="color: var(--accent-emerald);">~23% Typical Redundancy</span>
            </div>
            <input type="range" id="calc-range" min="50" max="2000" step="25" value="500" style="width: 100%; height: 8px; cursor: pointer; accent-color: var(--primary);" oninput="updateCalculator(this.value)">

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; text-align: left;">
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Reclaimable Space</div>
                <div id="calc-waste" style="font-size: 26px; font-weight: 800; color: var(--accent-amber); margin: 4px 0;">115 GB</div>
                <div style="font-size: 12px; color: var(--text-muted);">Exact duplicate copies</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Cloud Fees Avoided</div>
                <div id="calc-savings" style="font-size: 26px; font-weight: 800; color: var(--accent-emerald); margin: 4px 0;">$144 / year</div>
                <div style="font-size: 12px; color: var(--text-muted);">Saved vs cloud storage tier</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Cloud Transmission</div>
                <div style="font-size: 26px; font-weight: 800; color: #38bdf8; margin: 4px 0;">0 KB</div>
                <div style="font-size: 12px; color: var(--text-muted);">100% on-device processing</div>
              </div>
            </div>
          </div>
          <a href="/app" class="btn btn-primary">Scan Your Real Drive Now</a>
        </div>

        <!-- PANE 2: REORGANIZER -->
        <div id="demo-organizer" class="demo-pane">
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Interactive Reorganization Preview</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">Choose a strategy to see how messy chaotic files get structured safely with collision resolution:</p>

          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 24px;">
            <button class="btn btn-secondary active-sim-strat" id="strat-cat-btn" onclick="setSimStrategy('category')">By Category</button>
            <button class="btn btn-secondary" id="strat-date-btn" onclick="setSimStrategy('date')">By Date (YYYY/MM)</button>
            <button class="btn btn-secondary" id="strat-dup-btn" onclick="setSimStrategy('dup')">Consolidate Duplicates</button>
            <button class="btn btn-secondary" id="strat-stale-btn" onclick="setSimStrategy('stale')">Archive Stale Files</button>
          </div>

          <div style="background: #090d16; border: 1px solid var(--border); border-radius: 10px; padding: 16px; font-family: monospace; font-size: 13px; text-align: left; max-width: 760px; margin: 0 auto 20px;" id="sim-plan-output">
            <!-- Simulated Plan Content dynamically injected -->
          </div>
          <span style="font-size: 12px; color: var(--accent-emerald);">✓ Guaranteed collision-safe: files with identical names receive atomic (1), (2) qualifiers</span>
        </div>

        <!-- PANE 3: HASHER -->
        <div id="demo-hasher" class="demo-pane">
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Streaming Cryptographic Hash Pipeline</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px;">Simulate streaming SHA-256 chunk hashing without memory spikes:</p>
          <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="simulateHashRun()">Hash 4.2 GB 4K Video Chunk</button>
          </div>
          <div style="background: #090d16; border: 1px solid var(--border); border-radius: 10px; padding: 20px; font-family: monospace; font-size: 13px; text-align: left; max-width: 760px; margin: 0 auto;" id="hasher-terminal">
            <div style="color: var(--text-muted);">> Ready for stream ingestion... click button above.</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Feature Grid -->
  <section id="features" class="container">
    <h2 class="section-title">Engineered for Absolute Local Sovereignty</h2>
    <p class="section-desc">Traditional cleaners sell your telemetry or upload indexes to the cloud. LocalVault operates in total isolation on your machine.</p>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon icon-indigo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <h3 class="feature-title">Streaming SHA-256 Indexer</h3>
        <p class="feature-text">High-performance backpressure pipeline hashes multi-gigabyte RAW video and archive files in stream chunks without RAM bloat.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon icon-emerald">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h3 class="feature-title">Safe Reversible Engine</h3>
        <p class="feature-text">Strict 5-stage lifecycle: Plan → Preview → Explicit Confirm → Atomic Execute → 1-Click Rollback. Zero accidental file deletions.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon icon-cyan">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
        </div>
        <h3 class="feature-title">Deterministic Deduplication</h3>
        <p class="feature-text">Pairs files by exact cryptographic digest and size. Smart retention filters preserve originals and consolidate redundant clones.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon icon-amber">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </div>
        <h3 class="feature-title">Offline-First SQLite WAL</h3>
        <p class="feature-text">Native node:sqlite Write-Ahead Logging catalog enables instant sub-millisecond multi-facet searches across 500,000+ files.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon icon-rose">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        </div>
        <h3 class="feature-title">Zero Cloud Transmission</h3>
        <p class="feature-text">Not a single packet leaves your system. No telemetry pings, no cloud tracking beacons, no analytics, and no vendor lock-in.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <h3 class="feature-title">RFC 4180 Open Data Export</h3>
        <p class="feature-text">Full catalog and duplicate cluster reports can be exported anytime into universal RFC 4180 CSV or structured JSON formats.</p>
      </div>
    </div>
  </section>

  <!-- Comparison Matrix -->
  <section id="comparison" class="container comparison-section">
    <h2 class="section-title">LocalVault vs Cloud Sync & Traditional Utilities</h2>
    <p class="section-desc">Why power users, developers, and privacy advocates choose 100% on-device architecture.</p>

    <div class="comparison-card">
      <table class="comp-table">
        <thead>
          <tr>
            <th>Architecture Capability</th>
            <th class="highlight-col">LocalVault (Self-Hosted)</th>
            <th>Cloud Sync (Dropbox/GDrive)</th>
            <th>Commercial Mac/PC Cleaners</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Cloud Transmission / Privacy Risk</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">0% / Airgapped Complete Privacy</td>
            <td style="color: var(--accent-rose);">100% Cloud Ingestion & Scanning</td>
            <td style="color: var(--accent-amber);">Telemetry & Diagnostics Uploaded</td>
          </tr>
          <tr>
            <td><strong>Cryptographic Digest Verification</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">Streaming SHA-256 (Bit-level)</td>
            <td>Proprietary Sync Chunk Hashes</td>
            <td>Basic Size & Name matching</td>
          </tr>
          <tr>
            <td><strong>Reversible Operations & Rollback</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">1-Click Atomic Batch Rollback</td>
            <td>Limited Version History (Retention Caps)</td>
            <td style="color: var(--accent-rose);">Irreversible Immediate Deletion</td>
          </tr>
          <tr>
            <td><strong>Database / Query Architecture</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">Local SQLite WAL Embedded</td>
            <td>Proprietary Cloud Catalog</td>
            <td>Proprietary Cache Blobs</td>
          </tr>
          <tr>
            <td><strong>Open Data Export</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">RFC 4180 CSV & JSON Included</td>
            <td>Restricted API Limits</td>
            <td>None</td>
          </tr>
          <tr>
            <td><strong>Subscription Lock-In</strong></td>
            <td class="highlight-col" style="color: var(--accent-emerald);">Free Forever & Lifetime Pass</td>
            <td style="color: var(--accent-rose);">$120 - $240 / year forever</td>
            <td style="color: var(--accent-amber);">$40 - $70 / year renewal</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="container pricing-section">
    <h2 class="section-title">Simple, Transparent SaaS Pricing</h2>
    <p class="section-desc">Run it completely free for personal folders, or upgrade to a Pro lifetime pass for unlimited power.</p>

    <div class="pricing-toggle-wrap">
      <div class="toggle-switch" onclick="togglePricing()">
        <div class="toggle-opt active" id="toggle-lifetime">Lifetime Pass (Pay Once)</div>
        <div class="toggle-opt" id="toggle-monthly">Monthly Subscription</div>
      </div>
    </div>

    <div class="pricing-grid">
      <!-- Community -->
      <div class="pricing-card">
        <h3 class="pricing-tier">Free Community</h3>
        <p class="pricing-desc">For personal drives, essential duplicate hunting, and category sorting.</p>
        <div class="pricing-amount">$0</div>
        <div class="pricing-cadence">Free forever • Open Architecture</div>
        <ul class="pricing-list">
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Up to 25,000 indexed files per session
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Cryptographic SHA-256 duplicate hunter
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Category organization preview & execution
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            1-Click Atomic Rollback engine
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Zero telemetry guarantee
          </li>
        </ul>
        <a href="/app?tab=tab-settings&tier=COMMUNITY" class="btn btn-secondary" style="width: 100%;">Get Started Free</a>
      </div>

      <!-- Pro -->
      <div class="pricing-card featured">
        <div class="popular-tag">Most Popular</div>
        <h3 class="pricing-tier" style="color: #a5b4fc;">Pro Lifetime Pass</h3>
        <p class="pricing-desc">For power users, creators, and developers with large multi-terabyte drives.</p>
        <div class="pricing-amount" id="pro-price">$49</div>
        <div class="pricing-cadence" id="pro-cadence">One-time payment • Lifetime updates</div>
        <ul class="pricing-list">
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <strong>Unlimited</strong> indexed files & multi-TB drives
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            All Advanced Strategies (Date, Consolidate, Stale Archive)
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Multi-facet search & SHA-256 hash explorer
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            RFC 4180 CSV & JSON automated export
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Streaming backpressure priority performance
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Permanent airgapped license key
          </li>
        </ul>
        <a href="/app?tab=tab-settings&tier=PRO" class="btn btn-primary" style="width: 100%;">Upgrade to Pro</a>
      </div>

      <!-- Team -->
      <div class="pricing-card">
        <h3 class="pricing-tier">Team Privacy Vault</h3>
        <p class="pricing-desc">For studios, agencies, and enterprise labs requiring privacy compliance.</p>
        <div class="pricing-amount" id="team-price">$149</div>
        <div class="pricing-cadence" id="team-cadence">One-time payment • Up to 10 machines</div>
        <ul class="pricing-list">
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Everything in Pro included
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Multi-workstation license (10 nodes)
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Custom organization policy rules & templates
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Airgap compliance SLA & audit reports
          </li>
        </ul>
        <a href="/app?tab=tab-settings&tier=TEAM" class="btn btn-secondary" style="width: 100%;">Get Team Vault</a>
      </div>
    </div>
  </section>

  <!-- CTA Banner -->
  <section class="container">
    <div class="cta-banner">
      <h2 class="cta-title">Ready to Clean Your Drives Safely?</h2>
      <p class="cta-desc">Launch the local web application right now. No sign-up, no credit card, and zero bytes ever sent to any remote server.</p>
      <a href="/dashboard" class="btn btn-primary" style="font-size: 16px; padding: 14px 32px;">
        <span>Launch Local Dashboard</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer container">
    <div class="footer-inner">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span><strong>LocalVault</strong> — Privacy-First File Organizer & Deduplicator</span>
      </div>
      <div>
        <a href="/dashboard" style="margin-right: 20px;">Dashboard</a>
        <a href="/api/health" style="margin-right: 20px;">API Health</a>
        <a href="/api/export?format=csv" style="margin-right: 20px;">Export CSV</a>
        <span>Port 5633 • node:sqlite WAL</span>
      </div>
    </div>
  </footer>

  <script>
    // Tab switching for interactive demo
    function switchDemoTab(tabName, btn) {
      document.querySelectorAll('.demo-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.demo-pane').forEach(p => p.classList.remove('active'));
      if (btn) {
        btn.classList.add('active');
      } else if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
      }
      const targetPane = document.getElementById('demo-' + tabName);
      if (targetPane) targetPane.classList.add('active');
    }

    // Storage Savings Calculator
    function updateCalculator(gb) {
      document.getElementById('calc-gb-display').textContent = gb + ' GB';
      const wasteGb = Math.round(gb * 0.23);
      document.getElementById('calc-waste').textContent = wasteGb + ' GB';
      const annualSavings = Math.round(gb * 0.288);
      document.getElementById('calc-savings').textContent = '$' + (annualSavings < 48 ? 48 : annualSavings) + ' / year';
    }

    // Reorganizer Simulator
    const simStrategies = {
      category: [
        { src: "/Downloads/IMG_2041.PNG", dst: "/Organized/IMAGE/IMG_2041.PNG", cat: "IMAGE" },
        { src: "/Downloads/invoice_q3.pdf", dst: "/Organized/DOCUMENT/invoice_q3.pdf", cat: "DOCUMENT" },
        { src: "/Downloads/backup_oct.zip", dst: "/Organized/ARCHIVE/backup_oct.zip", cat: "ARCHIVE" },
        { src: "/Downloads/raw_footage.mp4", dst: "/Organized/VIDEO/raw_footage.mp4", cat: "VIDEO" }
      ],
      date: [
        { src: "/Downloads/IMG_2041.PNG", dst: "/Organized/2026/09/IMG_2041.PNG", cat: "2026/09" },
        { src: "/Downloads/invoice_q3.pdf", dst: "/Organized/2026/08/invoice_q3.pdf", cat: "2026/08" },
        { src: "/Downloads/backup_oct.zip", dst: "/Organized/2026/10/backup_oct.zip", cat: "2026/10" }
      ],
      dup: [
        { src: "/Downloads/backup_copy.zip", dst: "/Organized/Duplicates_Archive/ARCHIVE/backup_copy.zip", cat: "DUPLICATE [Hash: e3b0c44...]" },
        { src: "/Downloads/IMG_2041 (1).PNG", dst: "/Organized/Duplicates_Archive/IMAGE/IMG_2041 (1).PNG", cat: "DUPLICATE [Hash: 9f86d08...]" }
      ],
      stale: [
        { src: "/Downloads/old_archive_2023.tar", dst: "/Organized/Stale_Archive/ARCHIVE/old_archive_2023.tar", cat: "STALE (>90 days)" },
        { src: "/Downloads/draft_spec_v1.docx", dst: "/Organized/Stale_Archive/DOCUMENT/draft_spec_v1.docx", cat: "STALE (>180 days)" }
      ]
    };

    function setSimStrategy(name) {
      document.querySelectorAll('#demo-organizer .btn').forEach(b => b.classList.remove('btn-primary'));
      document.querySelectorAll('#demo-organizer .btn').forEach(b => b.classList.add('btn-secondary'));
      document.getElementById('strat-' + name.slice(0, 3) + '-btn')?.classList.add('btn-primary');

      const items = simStrategies[name] || simStrategies.category;
      const html = items.map(i =>
        '<div style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">' +
        '  <span style="color: #94a3b8;">' + i.src + '</span><br/>' +
        '  <span style="color: #6366f1;">↳ ' + i.dst + '</span> ' +
        '  <span style="color: #10b981; font-size: 11px; margin-left: 8px;">[' + i.cat + ']</span>' +
        '</div>'
      ).join('');
      document.getElementById('sim-plan-output').innerHTML = html;
    }

    setSimStrategy('category');

    // SHA-256 stream simulator
    function simulateHashRun() {
      const term = document.getElementById('hasher-terminal');
      term.innerHTML = '<div style="color: #38bdf8;">[1/4] Initializing Node.js streaming backpressure pipe...</div>';
      setTimeout(() => {
        term.innerHTML += '<div style="color: #a5b4fc;">[2/4] Processing chunks: 64KB | 128MB | 512MB | 1.8GB | 4.2GB (RAM: 14MB stable)</div>';
      }, 300);
      setTimeout(() => {
        term.innerHTML += '<div style="color: #34d399;">[3/4] SHA-256 Digest: c9f27a4b82103f7e651e08d6c702c2dbfe4691e84a6b2978018e62f026a76082</div>';
      }, 700);
      setTimeout(() => {
        term.innerHTML += '<div style="color: #fbbf24;">[4/4] Checked SQLite files table in 0.42ms: 1 identical duplicate found!</div>';
      }, 1000);
    }

    // Pricing toggle
    let isMonthly = false;
    function togglePricing() {
      isMonthly = !isMonthly;
      document.getElementById('toggle-lifetime').classList.toggle('active', !isMonthly);
      document.getElementById('toggle-monthly').classList.toggle('active', isMonthly);

      if (isMonthly) {
        document.getElementById('pro-price').textContent = '$9';
        document.getElementById('pro-cadence').textContent = 'per month • Cancel anytime';
        document.getElementById('team-price').textContent = '$29';
        document.getElementById('team-cadence').textContent = 'per month • Up to 10 machines';
      } else {
        document.getElementById('pro-price').textContent = '$49';
        document.getElementById('pro-cadence').textContent = 'One-time payment • Lifetime updates';
        document.getElementById('team-price').textContent = '$149';
        document.getElementById('team-cadence').textContent = 'One-time payment • Up to 10 machines';
      }
    }
  </script>
</body>
</html>`;
}
