import { AddonConfig, DEFAULT_CONFIG, PROVIDER_LIST } from "./types.js";
import { encodeConfig } from "./config.js";

export function buildConfigurePage(config: AddonConfig, baseUrl: string): string {
  const providers = PROVIDER_LIST;
  const encodedDefault = encodeConfig(DEFAULT_CONFIG);

  const providerCards = providers.map((p) => {
    const isEnabled = config.providers.includes(p.id);
    return `
    <div class="provider-card ${isEnabled ? "enabled" : ""}" data-id="${p.id}">
      <div class="provider-card-left">
        <div class="provider-logo-wrap">
          <img src="${p.logo}" alt="${p.name}" class="provider-logo" onerror="this.style.opacity='0'" />
        </div>
        <div class="provider-meta">
          <div class="provider-name">${p.name}</div>
          <div class="provider-desc">${p.description}</div>
        </div>
      </div>
      <label class="switch">
        <input type="checkbox" class="provider-toggle" value="${p.id}" ${isEnabled ? "checked" : ""} />
        <span class="slider"></span>
      </label>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Herum Na — Configure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #09090b;
      --surface: #111113;
      --surface2: #18181b;
      --surface3: #1e1e21;
      --border: rgba(255,255,255,0.07);
      --border-hover: rgba(255,255,255,0.14);
      --accent: #8b5cf6;
      --accent2: #a78bfa;
      --accent-glow: rgba(139,92,246,0.35);
      --green: #22c55e;
      --green-glow: rgba(34,197,94,0.25);
      --text: #fafafa;
      --text-2: #a1a1aa;
      --text-3: #71717a;
      --radius-sm: 8px;
      --radius: 14px;
      --radius-lg: 20px;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* ── HERO ── */
    .hero {
      position: relative;
      overflow: hidden;
      padding: 64px 24px 48px;
      text-align: center;
    }
    .hero::before {
      content: "";
      position: absolute;
      top: -120px; left: 50%;
      transform: translateX(-50%);
      width: 600px; height: 400px;
      background: radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(139,92,246,0.12);
      border: 1px solid rgba(139,92,246,0.3);
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--accent2);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .hero-badge::before { content: "●"; font-size: 8px; color: var(--green); }
    .hero-title {
      font-size: clamp(2rem, 6vw, 3.25rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      background: linear-gradient(135deg, #fff 30%, rgba(139,92,246,0.9) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 14px;
    }
    .hero-sub {
      font-size: 1rem;
      color: var(--text-2);
      max-width: 440px;
      margin: 0 auto;
      font-weight: 400;
    }

    /* ── LAYOUT ── */
    .page {
      max-width: 680px;
      margin: 0 auto;
      padding: 0 20px 80px;
    }

    /* ── CARD ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-bottom: 16px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: var(--border-hover); }
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 20px 0;
    }
    .card-icon {
      width: 30px; height: 30px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .card-icon.purple { background: rgba(139,92,246,0.15); }
    .card-icon.blue   { background: rgba(59,130,246,0.15); }
    .card-icon.green  { background: rgba(34,197,94,0.15); }
    .card-icon.orange { background: rgba(249,115,22,0.15); }
    .card-title { font-size: 0.9rem; font-weight: 600; color: var(--text); }
    .card-sub   { font-size: 0.78rem; color: var(--text-3); margin-left: auto; }
    .card-body  { padding: 16px 20px 20px; }

    /* ── PROVIDER CARDS ── */
    .provider-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      background: var(--surface2);
      border: 1px solid var(--border);
      margin-bottom: 8px;
      transition: all 0.2s;
      cursor: pointer;
    }
    .provider-card:last-child { margin-bottom: 0; }
    .provider-card.enabled {
      border-color: rgba(139,92,246,0.3);
      background: rgba(139,92,246,0.06);
    }
    .provider-card:hover { border-color: var(--border-hover); }
    .provider-card.enabled:hover { border-color: rgba(139,92,246,0.5); }
    .provider-card-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .provider-logo-wrap {
      width: 38px; height: 38px;
      border-radius: 10px;
      background: var(--surface3);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
      border: 1px solid var(--border);
    }
    .provider-logo { width: 100%; height: 100%; object-fit: cover; }
    .provider-meta { min-width: 0; }
    .provider-name { font-size: 0.88rem; font-weight: 600; white-space: nowrap; }
    .provider-desc { font-size: 0.75rem; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── TOGGLE SWITCH ── */
    .switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; inset: 0;
      background: var(--surface3);
      border-radius: 100px;
      cursor: pointer;
      border: 1px solid var(--border);
      transition: background 0.25s, border-color 0.25s;
    }
    .slider::before {
      content: "";
      position: absolute;
      width: 18px; height: 18px;
      top: 2px; left: 2px;
      background: var(--text-3);
      border-radius: 50%;
      transition: transform 0.25s, background 0.25s;
    }
    input:checked + .slider { background: var(--accent); border-color: var(--accent); }
    input:checked + .slider::before { transform: translateX(18px); background: #fff; }

    /* ── FORM ELEMENTS ── */
    .field { margin-bottom: 14px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 0.8rem; font-weight: 500;
      color: var(--text-2);
      margin-bottom: 8px;
    }
    .field-hint { font-size: 0.72rem; color: var(--text-3); font-weight: 400; }
    .input, .textarea {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      padding: 10px 14px;
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .input:focus, .textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
    }
    .textarea { resize: vertical; min-height: 72px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; line-height: 1.6; }

    /* ── CHIP PILLS ── */
    .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
    .chip {
      background: var(--surface3);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.72rem;
      font-family: 'SF Mono', 'Fira Code', monospace;
      color: var(--text-3);
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { border-color: var(--accent); color: var(--accent2); background: rgba(139,92,246,0.08); }

    /* ── PREVIEW BOX ── */
    .preview-wrap {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      margin-top: 14px;
    }
    .preview-eyebrow {
      font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 8px;
    }
    .preview-name { font-size: 1rem; font-weight: 700; color: #fff; }
    .preview-desc { font-size: 0.82rem; color: var(--text-2); margin-top: 3px; }

    /* ── RANGE SLIDER ── */
    .range-row { display: flex; align-items: center; gap: 14px; }
    .range-row input[type="range"] { flex: 1; accent-color: var(--accent); height: 4px; }
    .range-val { font-size: 0.85rem; font-weight: 600; color: var(--accent2); min-width: 40px; text-align: right; }

    /* ── MANIFEST SECTION ── */
    .manifest-url-box {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.75rem;
      color: var(--accent2);
      word-break: break-all;
      line-height: 1.6;
      min-height: 50px;
      margin-bottom: 14px;
    }
    .manifest-url-box.empty { color: var(--text-3); font-style: italic; font-family: 'Inter', sans-serif; font-size: 0.82rem; }

    /* ── BUTTONS ── */
    .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.85rem; font-weight: 600;
      cursor: pointer; border: none;
      transition: all 0.18s;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 0 0 0 var(--accent-glow);
    }
    .btn-primary:hover { background: var(--accent2); box-shadow: 0 0 20px var(--accent-glow); }
    .btn-ghost {
      background: var(--surface2);
      color: var(--text-2);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { border-color: var(--border-hover); color: var(--text); }
    .btn-green {
      background: rgba(34,197,94,0.12);
      color: var(--green);
      border: 1px solid rgba(34,197,94,0.2);
    }
    .btn-green:hover { background: rgba(34,197,94,0.2); box-shadow: 0 0 16px var(--green-glow); }

    /* ── INSTALL STEPS ── */
    .steps { display: flex; flex-direction: column; gap: 10px; }
    .step {
      display: flex; align-items: flex-start; gap: 12px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
    }
    .step-num {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: rgba(139,92,246,0.15);
      border: 1px solid rgba(139,92,246,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700;
      color: var(--accent2);
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-body { flex: 1; min-width: 0; }
    .step-title { font-size: 0.85rem; font-weight: 600; }
    .step-desc  { font-size: 0.78rem; color: var(--text-3); margin-top: 2px; }

    /* ── DIVIDER ── */
    .divider { height: 1px; background: var(--border); margin: 16px 0; }

    /* ── TOAST ── */
    .toast {
      position: fixed; bottom: 28px; left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: var(--green);
      color: #fff;
      padding: 10px 22px;
      border-radius: 100px;
      font-weight: 600; font-size: 0.85rem;
      opacity: 0; pointer-events: none;
      transition: all 0.3s; z-index: 9999;
      box-shadow: 0 8px 32px var(--green-glow);
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* ── FOOTER ── */
    .footer {
      text-align: center;
      padding: 32px 24px 16px;
      font-size: 0.75rem;
      color: var(--text-3);
    }
    .footer a { color: var(--accent2); text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    @media (max-width: 480px) {
      .hero { padding: 48px 16px 36px; }
      .page { padding: 0 12px 60px; }
      .btn-row { flex-direction: column; }
      .btn { justify-content: center; }
    }
  </style>
</head>
<body>

<div class="hero">
  <div class="hero-badge">Nuvio Addon</div>
  <h1 class="hero-title">Herum Na</h1>
  <p class="hero-sub">Multi-source streaming — configure your providers, copy your manifest link, and install in one click.</p>
</div>

<div class="page">

  <!-- PROVIDERS -->
  <div class="card">
    <div class="card-header">
      <div class="card-icon purple">📡</div>
      <span class="card-title">Stream Providers</span>
      <span class="card-sub" id="enabledCount">6 / 6 active</span>
    </div>
    <div class="card-body">
      ${providerCards}
    </div>
  </div>

  <!-- SHOWBOX COOKIE -->
  <div class="card">
    <div class="card-header">
      <div class="card-icon blue">🔑</div>
      <span class="card-title">ShowBox Authentication</span>
    </div>
    <div class="card-body">
      <div class="field">
        <div class="field-label">
          JWT Cookie Token
          <span class="field-hint">required for ShowBox streams</span>
        </div>
        <textarea class="textarea" id="showboxCookie" rows="3" placeholder="Paste your ShowBox JWT token here…">${config.showboxCookie}</textarea>
      </div>
    </div>
  </div>

  <!-- FORMATTER -->
  <div class="card">
    <div class="card-header">
      <div class="card-icon orange">✏️</div>
      <span class="card-title">Stream Formatter</span>
    </div>
    <div class="card-body">
      <div class="field">
        <div class="field-label">Name Template</div>
        <input type="text" class="input" id="nameTemplate" value="${escapeHtml(config.formatter.nameTemplate)}" placeholder="{provider} {quality}" />
        <div class="chips" id="nameChips"></div>
      </div>
      <div class="field">
        <div class="field-label">Description Template</div>
        <input type="text" class="input" id="descTemplate" value="${escapeHtml(config.formatter.descTemplate)}" placeholder="{size} {lang}" />
        <div class="chips" id="descChips"></div>
      </div>
      <div class="preview-wrap">
        <div class="preview-eyebrow">Live Preview</div>
        <div class="preview-name" id="previewName"></div>
        <div class="preview-desc" id="previewDesc"></div>
      </div>
      <div style="font-size:0.72rem;color:var(--text-3);margin-top:10px;">
        Variables: <code style="color:var(--accent2)">{provider}</code> <code style="color:var(--accent2)">{quality}</code> <code style="color:var(--accent2)">{size}</code> <code style="color:var(--accent2)">{lang}</code> <code style="color:var(--accent2)">{title}</code>
      </div>
    </div>
  </div>

  <!-- TIMEOUT -->
  <div class="card">
    <div class="card-header">
      <div class="card-icon green">⏱</div>
      <span class="card-title">Stream Timeout</span>
    </div>
    <div class="card-body">
      <div class="range-row">
        <input type="range" id="timeout" min="5000" max="30000" step="1000" value="${config.timeout}" />
        <span class="range-val" id="timeoutVal">${config.timeout / 1000}s</span>
      </div>
      <div style="font-size:0.75rem;color:var(--text-3);margin-top:10px;">Maximum wait time per provider. Higher = more streams found, slower results.</div>
    </div>
  </div>

  <!-- MANIFEST & INSTALL -->
  <div class="card">
    <div class="card-header">
      <div class="card-icon purple">🔗</div>
      <span class="card-title">Install in Nuvio</span>
    </div>
    <div class="card-body">
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">Configure your settings above</div>
            <div class="step-desc">Toggle providers, add ShowBox cookie, adjust formatter</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">Generate your manifest link</div>
            <div class="step-desc">A personalized URL encodes all your settings</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">Install in Nuvio with one click</div>
            <div class="step-desc">Or copy the link and paste it manually in Add-ons</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="manifest-url-box empty" id="manifestUrl">Click Generate to create your manifest link…</div>

      <div class="btn-row">
        <button class="btn btn-primary" id="generateBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg>
          Generate Link
        </button>
        <button class="btn btn-ghost" id="copyBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Link
        </button>
        <button class="btn btn-green" id="installBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Open in Nuvio
        </button>
      </div>
    </div>
  </div>

</div><!-- .page -->

<div class="footer">
  <strong>Herum Na</strong> · Nuvio Multi-Source Addon ·
  <a href="${baseUrl}/manifest.json" target="_blank">Default Manifest</a>
</div>

<div class="toast" id="toast">✓ Copied!</div>

<script>
const BASE_URL = ${JSON.stringify(baseUrl)};
const VARS = ["{provider}", "{quality}", "{size}", "{lang}", "{title}"];

function buildChips(containerId, inputId) {
  const c = document.getElementById(containerId);
  VARS.forEach(v => {
    const el = document.createElement("span");
    el.className = "chip";
    el.textContent = v;
    el.onclick = () => {
      const inp = document.getElementById(inputId);
      const pos = inp.selectionStart ?? inp.value.length;
      inp.value = inp.value.slice(0, pos) + v + inp.value.slice(pos);
      inp.focus(); inp.dispatchEvent(new Event("input"));
    };
    c.appendChild(el);
  });
}
buildChips("nameChips", "nameTemplate");
buildChips("descChips", "descTemplate");

const SAMPLE = { provider: "4KHDHub", quality: "4K", size: "25.3 GB", lang: "EN", title: "Interstellar (2014)" };

function renderTpl(tpl) {
  return tpl.replace(/\\{(\\w+)\\}/g, (_, k) => SAMPLE[k] ?? "").replace(/\\s+/g, " ").trim();
}

function updatePreview() {
  const n = renderTpl(document.getElementById("nameTemplate").value);
  const d = renderTpl(document.getElementById("descTemplate").value);
  document.getElementById("previewName").textContent = n || "—";
  document.getElementById("previewDesc").textContent = d;
}

document.getElementById("nameTemplate").addEventListener("input", updatePreview);
document.getElementById("descTemplate").addEventListener("input", updatePreview);
updatePreview();

document.getElementById("timeout").addEventListener("input", function() {
  document.getElementById("timeoutVal").textContent = (this.value / 1000) + "s";
});

function updateEnabledCount() {
  const total = document.querySelectorAll(".provider-toggle").length;
  const enabled = document.querySelectorAll(".provider-toggle:checked").length;
  document.getElementById("enabledCount").textContent = enabled + " / " + total + " active";
}

document.querySelectorAll(".provider-card").forEach(card => {
  const toggle = card.querySelector(".provider-toggle");
  card.addEventListener("click", (e) => {
    if (e.target === toggle) return;
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event("change"));
  });
  toggle.addEventListener("change", () => {
    card.classList.toggle("enabled", toggle.checked);
    updateEnabledCount();
  });
});
updateEnabledCount();

function getConfig() {
  return {
    providers: Array.from(document.querySelectorAll(".provider-toggle:checked")).map(el => el.value),
    showboxCookie: document.getElementById("showboxCookie").value.trim(),
    formatter: {
      nameTemplate: document.getElementById("nameTemplate").value,
      descTemplate: document.getElementById("descTemplate").value,
    },
    timeout: parseInt(document.getElementById("timeout").value, 10),
  };
}

function encodeConfig(cfg) {
  return btoa(JSON.stringify(cfg)).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");
}

function generateManifestUrl() {
  const cfg = getConfig();
  const enc = encodeConfig(cfg);
  const url = BASE_URL + "/" + enc + "/manifest.json";
  const box = document.getElementById("manifestUrl");
  box.textContent = url;
  box.classList.remove("empty");
  return url;
}

document.getElementById("generateBtn").addEventListener("click", generateManifestUrl);

document.getElementById("copyBtn").addEventListener("click", () => {
  let url = document.getElementById("manifestUrl").textContent;
  if (document.getElementById("manifestUrl").classList.contains("empty") || !url || url.includes("Click Generate")) {
    url = generateManifestUrl();
  }
  navigator.clipboard.writeText(url).then(() => toast("✓ Copied to clipboard!")).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    toast("✓ Copied!");
  });
});

document.getElementById("installBtn").addEventListener("click", () => {
  let url = document.getElementById("manifestUrl").textContent;
  if (document.getElementById("manifestUrl").classList.contains("empty") || !url || url.includes("Click Generate")) {
    url = generateManifestUrl();
  }
  window.location.href = "stremio://" + url.replace(/^https?:\\/\\//, "");
});

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

generateManifestUrl();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
