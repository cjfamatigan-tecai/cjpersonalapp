/* ============================================================
   FLUX shared runtime — shell, auth guard, SVG charts, exports
   No dependencies. Exposes window.Flux
============================================================ */
(function () {
  const root = document.documentElement;
  if (localStorage.getItem('flux-theme')) root.setAttribute('data-theme', localStorage.getItem('flux-theme'));

  /* ---------- icons ---------- */
  const I = {
    logo: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7l8-4 8 4-8 4-8-4z" fill="currentColor"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.5 12h10L20 7H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" stroke-linejoin="round"/><path d="M15 8a4 4 0 010 8M18 5a8 8 0 010 14" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11l8-7 8 7M6 10v9h12v-9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3c2 0 2.5 1 5 1s3-1 5-1c2.5 0 3.5 2.5 2.5 6-.7 2.4-.8 4-1.3 6.5C19.5 20 19 21 18 21s-1.3-1.2-1.7-3.2C15.9 15.5 15.7 14 14 14h-4c-1.7 0-1.9 1.5-2.3 3.8C7.3 19.8 7 21 6 21s-1.5-1-2.2-3.5C3.3 15 3.2 13.4 2.5 11 1.5 7.5 2.5 5 5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hvac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="10" rx="2"/><path d="M6 19h2M11 19h2M16 19h2M7 9h.01M11 9h6" stroke-linecap="round"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.79 1.17V21a2 2 0 11-4 0v-.09A1.65 1.65 0 006 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.31.22.65.22 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" stroke-linejoin="round"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12H4m0 0l4-4m-4 4l4 4M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 11l5 4 5-4M5 21h14" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 15l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4" stroke-linecap="round"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke-linecap="round"/></svg>',
    docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v4h4M8 13h8M8 17h5" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  function personalNav(active) {
    const tasksIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke-linecap="round"/></svg>';
    return [
      ['overview', 'dashboard.html', 'Overview', I.grid],
      ['calendar', 'calendar.html', 'Calendar', I.calendar],
      ['mytasks', 'mytasks.html', 'My Tasks', tasksIcon],
      ['statistics', 'statistics.html', 'Statistics', I.stats],
      ['documents', 'documents.html', 'Documents', I.docs],
    ].map(([id, href, label, icon]) => `<a class="nav-item${id === active ? ' active' : ''}" href="${href}">${icon}${label}</a>`).join('');
  }

  const APPS = [
    { id: 'personal',  href: 'dashboard.html',  label: 'Personal',     icon: I.grid },
    { id: 'ecommerce', href: 'ecommerce.html',  label: 'E-commerce',   icon: I.cart },
    { id: 'marketing', href: 'marketing.html',  label: 'Marketing',    icon: I.megaphone },
    { id: 'realestate',href: 'realestate.html', label: 'Real Estate',  icon: I.home },
    { id: 'dental',    href: 'dental.html',     label: 'Dental',       icon: I.tooth },
    { id: 'hvac',      href: 'hvac.html',       label: 'HVAC',         icon: I.hvac },
  ];

  /* ---------- toast ---------- */
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  /* ---------- formatting ---------- */
  const CUR = { symbol: (() => { try { return localStorage.getItem('flux-currency') || '₱'; } catch { return '₱'; } })() };
  const nf = new Intl.NumberFormat('en-US');
  const fmt = n => nf.format(Math.round(n));
  const money = n => CUR.symbol + nf.format(Math.round(n));
  const money2 = n => CUR.symbol + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = n => (n > 0 ? '+' : '') + n.toFixed(1) + '%';

  /* ---------- API ---------- */
  async function api(path, method = 'GET', body) {
    const opts = { method, headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const r = await fetch('/api' + path, opts);
    if (r.status === 401) { location.href = '/login.html'; throw new Error('unauth'); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast(data.error || 'Something went wrong'); throw new Error(data.error || 'failed'); }
    return data;
  }

  /* ---------- shell (sidebar + topbar) ---------- */
  async function mountShell({ active, subtitle, extraNav }) {
    // guard: must be logged in
    // tolerate a guest (public demo) — don't redirect to login on these viewable dashboards
    let user = { name: '' };
    try { const r = await fetch('/api/me'); if (r.ok) user = (await r.json()).user; } catch {}
    let avatarUrl = null;
    try { const rp = await fetch('/api/prefs'); if (rp.ok) avatarUrl = (await rp.json()).prefs.avatar || null; } catch {}

    // sidebar
    const side = document.getElementById('side');
    if (side) {
      const items = APPS.map(a =>
        `<a class="nav-item${a.id === active ? ' active' : ''}" href="${a.href}">${a.icon}${a.label}</a>`).join('');
      const extra = extraNav ? `<div class="nav-label">This dashboard</div><div class="nav-group">${extraNav}</div>` : '';
      side.innerHTML = `
        <div class="brand"><div class="brand-mark">${I.logo}</div><span class="brand-name">Flux</span></div>
        <div class="nav-label">Dashboards</div>
        <nav class="nav-group">${items}</nav>
        ${extra}
        <a class="nav-item" style="margin-top:auto" href="#" id="navSettings">${I.settings}Settings</a>
        <a class="nav-item" href="#" id="navLogout">${I.logout}Log out</a>`;
      side.querySelector('#navSettings').addEventListener('click', e => { e.preventDefault(); toast('Settings coming soon'); });
      side.querySelector('#navLogout').addEventListener('click', async e => {
        e.preventDefault(); try { await fetch('/api/logout', { method: 'POST' }); } catch {} location.href = '/login.html';
      });
    }

    // topbar
    const top = document.getElementById('topbar');
    if (top) {
      const first = (user.name || '').split(' ')[0] || 'there';
      const parts = String(user.name || '').trim().split(/\s+/).filter(Boolean);
      const initials = parts.length ? (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase() : '👤';
      top.innerHTML = `
        <div class="greeting"><h1>Hi, ${escapeHtml(first)}! 👋</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>
        <div class="topbar-actions">
          <button class="btn" id="tbExport">${I.download} Export report</button>
          <button class="icon-btn" id="tbSearch" title="Search (Ctrl+K)">${I.search}</button>
          <button class="icon-btn" id="tbTheme" title="Theme">${I.moon}</button>
          <div class="avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover">` : escapeHtml(initials)}</div>
        </div>`;
      top.querySelector('#tbSearch').addEventListener('click', openShellSearch);
      top.querySelector('#tbTheme').addEventListener('click', toggleTheme);
      top.querySelector('#tbExport').addEventListener('click', () => {
        if (typeof window.onExportReport === 'function') window.onExportReport();
        else window.print();
      });
    }
    return user;
  }

  function toggleTheme() {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('flux-theme', next);
    toast(next === 'dark' ? 'Dark mode 🌙' : 'Light mode ☀️');
    document.dispatchEvent(new Event('flux:theme'));
  }

  const escapeHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ============================================================
     CHARTS (inline SVG, monochrome)
  ============================================================ */
  const cvar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';

  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const cx = (p0[0] + p1[0]) / 2;
      d += ` C${cx},${p0[1]} ${cx},${p1[1]} ${p1[0]},${p1[1]}`;
    }
    return d;
  }

  // area/line chart. series: [{values:[], color, dashed, fill}]
  function areaChart(el, { series, labels, height = 150, pad = 8 }) {
    const W = 320, H = height;
    const all = series.flatMap(s => s.values);
    const max = Math.max(...all) * 1.12 || 1, min = Math.min(0, ...all);
    const n = series[0].values.length;
    const x = i => (i / (n - 1)) * (W - pad * 2) + pad;
    const y = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    let defs = '', body = '';
    series.forEach((s, si) => {
      const color = s.color || cvar('--ink');
      const pts = s.values.map((v, i) => [x(i), y(v)]);
      const line = smoothPath(pts);
      if (s.fill) {
        const gid = 'g' + Math.random().toString(36).slice(2, 7);
        defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".16"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`;
        body += `<path class="fx-fill" d="${line} L${x(n-1)},${H-pad} L${x(0)},${H-pad} Z" fill="url(#${gid})"/>`;
      }
      // dashed comparison line fades in; solid line draws on via pathLength
      if (s.dashed) {
        body += `<path class="fx-fill" d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6"/>`;
      } else {
        body += `<path class="fx-line" pathLength="1" d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`;
        const last = pts[pts.length - 1];
        body += `<circle class="fx-dot" cx="${last[0]}" cy="${last[1]}" r="4" fill="${cvar('--card')}" stroke="${color}" stroke-width="2.5"/>`;
      }
    });
    el.innerHTML = `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg></div>` +
      (labels ? `<div class="axis-x">${labels.map(l => `<span>${escapeHtml(l)}</span>`).join('')}</div>` : '');
  }

  // vertical bars. data: [{label, value}], optional compare values via data2
  function barChart(el, { data, height = 150 }) {
    const W = 320, H = height, pad = 8, gap = 10;
    const max = Math.max(...data.map(d => d.value)) * 1.12 || 1;
    const bw = (W - pad * 2 - gap * (data.length - 1)) / data.length;
    let body = '', labels = '';
    data.forEach((d, i) => {
      const bh = (d.value / max) * (H - pad * 2 - 4);
      const bx = pad + i * (bw + gap), by = H - pad - bh;
      const col = i === data.length - 1 ? cvar('--ink') : cvar('--c3');
      body += `<rect class="fx-bar" style="animation-delay:${i * 0.06}s" x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="${col}"/>`;
      labels += `<span style="width:${100/data.length}%;text-align:center">${escapeHtml(d.label)}</span>`;
    });
    el.innerHTML = `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">${body}</svg></div><div class="axis-x">${labels}</div>`;
  }

  // donut. segments:[{label,value,color}]
  function donut(el, { segments, center, sub, size = 150, thickness = 16 }) {
    const r = (size - thickness) / 2, c = 2 * Math.PI * r, cx = size / 2;
    let off = 0, arcs = '';
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const palette = [cvar('--c1'), cvar('--c2'), cvar('--c3'), cvar('--c4'), cvar('--c5')];
    segments.forEach((s, i) => {
      const len = (s.value / total) * c;
      const col = s.color || palette[i % palette.length];
      // start collapsed (0 length); rAF expands to real length for a sweep-in
      arcs += `<circle class="fx-ring" style="transition-delay:${i * 0.08}s" data-len="${len}" data-c="${c}" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${col}" stroke-width="${thickness}" stroke-dasharray="0 ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cx})" stroke-linecap="butt"/>`;
      off += len;
    });
    el.innerHTML = `<div class="ring-wrap" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}">${arcs}</svg>${center != null ? `<div class="ring-center"><div class="big">${escapeHtml(center)}</div>${sub ? `<div class="small">${escapeHtml(sub)}</div>` : ''}</div>` : ''}</div>`;
    requestAnimationFrame(() => el.querySelectorAll('.fx-ring').forEach(cir => {
      cir.setAttribute('stroke-dasharray', `${cir.dataset.len} ${cir.dataset.c}`);
    }));
  }

  // gauge (single value ring). pct 0..100
  function gauge(el, { value, center, sub, size = 130, thickness = 12 }) {
    const r = (size - thickness) / 2, c = 2 * Math.PI * r, cx = size / 2;
    const frac = Math.max(0, Math.min(1, value / 100));
    el.innerHTML = `<div class="ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${cvar('--ring-track')}" stroke-width="${thickness}"/>
        <circle class="fx-ring" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${cvar('--ink')}" stroke-width="${thickness}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${cx} ${cx})"/>
      </svg>
      <div class="ring-center"><div class="big">${escapeHtml(center != null ? center : Math.round(value) + '%')}</div>${sub ? `<div class="small">${escapeHtml(sub)}</div>` : ''}</div></div>`;
    // start empty, then sweep to target
    requestAnimationFrame(() => { const cir = el.querySelector('.fx-ring'); if (cir) cir.setAttribute('stroke-dashoffset', c * (1 - frac)); });
  }

  /* ---------- helpers to build markup ---------- */
  function kpiTile({ icon, value, label, delta, dark }) {
    const d = delta == null ? '' :
      `<span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? I.up : I.down}${pct(Math.abs(delta))}</span>`;
    return `<div class="card kpi${dark ? ' dark' : ''}">
      <div class="k-top"><div class="k-ico">${icon || I.grid}</div>${d}</div>
      <div class="k-val">${escapeHtml(value)}</div><div class="k-lbl">${escapeHtml(label)}</div></div>`;
  }

  /* ---------- CSV export ---------- */
  function exportCSV(filename, rows) {
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell == null ? '' : cell);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Exported ' + filename);
  }

  /* ---------- shell search (filters the current dashboard's tables) ---------- */
  let shellSearchEl = null;
  function collectRows() {
    const items = [];
    document.querySelectorAll('table.tbl').forEach(tbl => {
      const card = tbl.closest('.card');
      const group = (card && card.querySelector('.card-title') && card.querySelector('.card-title').textContent.trim()) || 'Results';
      tbl.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.querySelector('td[colspan]')) return;
        const cells = [...tr.querySelectorAll('td')].map(td => td.textContent.trim()).filter(Boolean);
        if (!cells.length) return;
        items.push({ group, title: cells[0], sub: cells.slice(1, 3).join(' · '), text: cells.join(' ').toLowerCase(), row: tr });
      });
    });
    return items;
  }
  function ensureShellSearch() {
    if (shellSearchEl) return shellSearchEl;
    const o = document.createElement('div');
    o.className = 'flux-search-overlay';
    o.innerHTML = `<div class="flux-search-panel">
      <div class="flux-search-top">${I.search}<input type="text" id="fluxSearchInput" placeholder="Search this dashboard…" autocomplete="off"><span class="flux-search-esc">ESC</span></div>
      <div class="flux-search-results" id="fluxSearchResults"></div></div>`;
    document.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
    o.querySelector('#fluxSearchInput').addEventListener('input', e => renderShellResults(e.target.value));
    shellSearchEl = o;
    return o;
  }
  function renderShellResults(q) {
    q = q.trim().toLowerCase();
    const res = shellSearchEl.querySelector('#fluxSearchResults');
    if (!q) { res.innerHTML = `<div class="flux-search-empty">Type to search across this dashboard…</div>`; return; }
    const items = collectRows().filter(it => it.text.includes(q)).slice(0, 40);
    if (!items.length) { res.innerHTML = `<div class="flux-search-empty">No matches.</div>`; return; }
    res.innerHTML = '';
    let last = '';
    items.forEach(it => {
      if (it.group !== last) { last = it.group; const g = document.createElement('div'); g.className = 'flux-search-group'; g.textContent = it.group; res.appendChild(g); }
      const b = document.createElement('button');
      b.className = 'flux-search-item';
      b.innerHTML = `<span class="fs-title"></span><span class="fs-sub"></span>`;
      b.querySelector('.fs-title').textContent = it.title;
      b.querySelector('.fs-sub').textContent = it.sub || '';
      b.addEventListener('click', () => {
        shellSearchEl.classList.remove('open');
        it.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        it.row.classList.add('row-flash');
        setTimeout(() => it.row.classList.remove('row-flash'), 1400);
      });
      res.appendChild(b);
    });
  }
  function openShellSearch() {
    const o = ensureShellSearch();
    o.classList.add('open');
    const inp = o.querySelector('#fluxSearchInput');
    inp.value = ''; renderShellResults('');
    setTimeout(() => inp.focus(), 30);
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openShellSearch(); }
    if (e.key === 'Escape' && shellSearchEl) shellSearchEl.classList.remove('open');
  });

  window.Flux = {
    I, mountShell, personalNav, toast, api, escapeHtml, toggleTheme,
    fmt, money, money2, pct, setCurrency: s => { CUR.symbol = s; try { localStorage.setItem('flux-currency', s); } catch {} },
    areaChart, barChart, donut, gauge, kpiTile, exportCSV,
    palette: () => [cvar('--c1'), cvar('--c2'), cvar('--c3'), cvar('--c4'), cvar('--c5')],
  };
})();
