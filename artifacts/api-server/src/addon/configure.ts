import { AddonConfig, DEFAULT_CONFIG, PROVIDER_LIST } from "./types.js";
import { encodeConfig } from "./config.js";

export function buildConfigurePage(config: AddonConfig, baseUrl: string): string {
  const providers = PROVIDER_LIST;
  const providerRows = providers.map((p) => {
    const checked = config.providers.includes(p.id) ? "checked" : "";
    return `
      <div class="provider-row">
        <label class="toggle-label">
          <input type="checkbox" class="provider-toggle" value="${p.id}" ${checked} />
          <span class="toggle-slider"></span>
        </label>
        <img src="${p.logo}" alt="${p.name}" class="provider-logo" onerror="this.style.display='none'" />
        <div class="provider-info">
          <div class="provider-name">${p.name}</div>
          <div class="provider-desc">${p.description}</div>
        </div>
      </div>`;
  }).join("");

  const encodedDefault = encodeConfig(DEFAULT_CONFIG);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Herum Na — Configure</title>
  <style>
    :root {
      --bg: #0f0f13;
      --surface: #1a1a24;
      --surface2: #22222e;
      --border: #2e2e3e;
      --accent: #7c5cfc;
      --accent-hover: #9b7ffd;
      --text: #e8e8f0;
      --text-muted: #888899;
      --success: #4caf7d;
      --danger: #f44336;
      --radius: 10px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; padding: 24px 16px 60px; }
    .container { max-width: 720px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 36px; }
    .header h1 { font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #7c5cfc, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    .header p { color: var(--text-muted); font-size: 0.95rem; }
    .section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; }
    .section-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 16px; }
    .provider-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .provider-row:last-child { border-bottom: none; }
    .toggle-label { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle-label input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: #333; border-radius: 24px; cursor: pointer; transition: 0.3s; }
    .toggle-slider::before { content: ""; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    input:checked + .toggle-slider { background: var(--accent); }
    input:checked + .toggle-slider::before { transform: translateX(20px); }
    .provider-logo { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
    .provider-info { flex: 1; min-width: 0; }
    .provider-name { font-weight: 600; font-size: 0.95rem; }
    .provider-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 6px; color: var(--text-muted); }
    .form-control { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 10px 12px; font-size: 0.9rem; font-family: "Courier New", monospace; transition: border-color 0.2s; }
    .form-control:focus { outline: none; border-color: var(--accent); }
    textarea.form-control { resize: vertical; min-height: 80px; }
    .vars-hint { font-size: 0.78rem; color: var(--text-muted); margin-top: 6px; line-height: 1.5; }
    .vars-hint code { background: var(--surface2); border-radius: 4px; padding: 1px 5px; font-size: 0.75rem; color: var(--accent-hover); }
    .preview-box { background: var(--surface2); border-radius: 8px; padding: 14px 16px; margin-top: 12px; font-size: 0.88rem; }
    .preview-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 8px; }
    .preview-name { font-weight: 700; font-size: 1rem; color: white; }
    .preview-desc { color: var(--text-muted); margin-top: 2px; }
    .manifest-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; font-family: "Courier New", monospace; font-size: 0.82rem; word-break: break-all; color: var(--accent-hover); }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { border-color: var(--accent); color: var(--accent-hover); }
    .btn-success { background: var(--success); color: white; }
    .action-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    .range-row { display: flex; align-items: center; gap: 12px; }
    .range-row input[type="range"] { flex: 1; accent-color: var(--accent); }
    .range-val { min-width: 52px; text-align: right; font-size: 0.85rem; font-weight: 600; color: var(--accent-hover); }
    .snippet-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .snippet { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 3px 9px; font-size: 0.75rem; font-family: monospace; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
    .snippet:hover { border-color: var(--accent); color: var(--accent-hover); }
    .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--success); color: white; padding: 10px 20px; border-radius: 24px; font-weight: 600; font-size: 0.9rem; opacity: 0; pointer-events: none; transition: all 0.3s; z-index: 9999; }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>⚡ Herum Na</h1>
    <p>Multi-source Nuvio addon — configure providers, formatter, and copy your manifest link</p>
  </div>

  <div class="section">
    <div class="section-title">Providers</div>
    ${providerRows}
  </div>

  <div class="section">
    <div class="section-title">ShowBox Cookie (JWT)</div>
    <div class="form-group">
      <label>Cookie token — required for ShowBox streams</label>
      <textarea class="form-control" id="showboxCookie" rows="3" placeholder="Paste JWT token...">${config.showboxCookie}</textarea>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Stream Formatter</div>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px;">Global formatter applied to all stream names and descriptions. Click a snippet to insert.</p>

    <div class="form-group">
      <label>Name Template</label>
      <input type="text" class="form-control" id="nameTemplate" value="${escapeHtml(config.formatter.nameTemplate)}" placeholder="{provider} {quality}" />
      <div class="snippet-chips" id="nameSnippets"></div>
      <div class="vars-hint">
        Variables: <code>{provider}</code> <code>{quality}</code> <code>{size}</code> <code>{lang}</code> <code>{type}</code> <code>{name}</code> <code>{title}</code>
      </div>
    </div>

    <div class="form-group">
      <label>Description Template</label>
      <input type="text" class="form-control" id="descTemplate" value="${escapeHtml(config.formatter.descTemplate)}" placeholder="{size} {lang}" />
      <div class="snippet-chips" id="descSnippets"></div>
    </div>

    <div class="preview-label">PREVIEW</div>
    <div class="preview-box">
      <div class="preview-name" id="previewName"></div>
      <div class="preview-desc" id="previewDesc"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Timeout</div>
    <div class="range-row">
      <input type="range" id="timeout" min="5000" max="30000" step="1000" value="${config.timeout}" />
      <span class="range-val" id="timeoutVal">${config.timeout / 1000}s</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Manifest Link</div>
    <div class="manifest-box" id="manifestUrl"></div>
    <div class="action-row">
      <button class="btn btn-primary" id="generateBtn">Generate Link</button>
      <button class="btn btn-secondary" id="copyBtn">Copy Link</button>
      <button class="btn btn-secondary" id="installBtn">Install in Nuvio</button>
    </div>
  </div>
</div>

<div class="toast" id="toast">Copied!</div>

<script>
const BASE_URL = ${JSON.stringify(baseUrl)};
const SNIPPETS = ["{provider}", "{quality}", "{size}", "{lang}", "{type}", "{name}", "{title}"];

function addSnippets(containerId, inputId) {
  const c = document.getElementById(containerId);
  SNIPPETS.forEach(s => {
    const el = document.createElement("span");
    el.className = "snippet";
    el.textContent = s;
    el.onclick = () => {
      const inp = document.getElementById(inputId);
      const pos = inp.selectionStart ?? inp.value.length;
      inp.value = inp.value.slice(0, pos) + s + inp.value.slice(pos);
      inp.focus();
      updatePreview();
    };
    c.appendChild(el);
  });
}
addSnippets("nameSnippets", "nameTemplate");
addSnippets("descSnippets", "descTemplate");

const SAMPLE = { provider: "4KHDHub", quality: "1080p", size: "3.2 GB", lang: "en", type: "MKV", name: "4KHDHub 1080p", title: "Movie Title (2024)" };

function renderTpl(tpl) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => SAMPLE[k] ?? "").replace(/\s+/g, " ").trim();
}

function updatePreview() {
  document.getElementById("previewName").textContent = renderTpl(document.getElementById("nameTemplate").value) || "—";
  document.getElementById("previewDesc").textContent = renderTpl(document.getElementById("descTemplate").value) || "";
}

document.getElementById("nameTemplate").addEventListener("input", updatePreview);
document.getElementById("descTemplate").addEventListener("input", updatePreview);
updatePreview();

document.getElementById("timeout").addEventListener("input", function() {
  document.getElementById("timeoutVal").textContent = (this.value / 1000) + "s";
});

function getConfig() {
  const providers = Array.from(document.querySelectorAll(".provider-toggle:checked")).map(el => el.value);
  return {
    providers,
    showboxCookie: document.getElementById("showboxCookie").value.trim(),
    formatter: {
      nameTemplate: document.getElementById("nameTemplate").value,
      descTemplate: document.getElementById("descTemplate").value,
    },
    timeout: parseInt(document.getElementById("timeout").value, 10),
  };
}

function encodeConfig(config) {
  return btoa(JSON.stringify(config)).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");
}

function generateManifestUrl() {
  const config = getConfig();
  const encoded = encodeConfig(config);
  const url = BASE_URL + "/" + encoded + "/manifest.json";
  document.getElementById("manifestUrl").textContent = url;
  return url;
}

document.getElementById("generateBtn").addEventListener("click", generateManifestUrl);

document.getElementById("copyBtn").addEventListener("click", () => {
  const url = document.getElementById("manifestUrl").textContent;
  if (!url) { generateManifestUrl(); }
  const finalUrl = document.getElementById("manifestUrl").textContent;
  navigator.clipboard.writeText(finalUrl).then(() => showToast("Copied!")).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = finalUrl;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copied!");
  });
});

document.getElementById("installBtn").addEventListener("click", () => {
  const url = document.getElementById("manifestUrl").textContent || generateManifestUrl();
  window.open("nuvio://addon?url=" + encodeURIComponent(url));
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

generateManifestUrl();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
