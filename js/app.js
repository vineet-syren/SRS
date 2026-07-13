/* ============================================================
   SRS · app.js
   Router, sidebar nav, personas, theme toggle, notifications,
   global search.
   Pages self-register on SRS.pages before this file runs.
   ============================================================ */
window.SRS = window.SRS || {};
SRS.pages = SRS.pages || {};
SRS.registerPage = function (key, page) { SRS.pages[key] = page; };

(function () {
  const icons = {
    overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    suppliers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l7-5 7 5v13"/><path d="M10 21v-6h4v6"/><path d="M21 21V11l-4-3"/><path d="M3 21h18"/></svg>',
    materials: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M12 13 3 8"/><path d="m12 13 9-5"/><path d="M12 13v8"/></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1.5"/><circle cx="18" cy="21" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 20h20Z"/><path d="M12 9v5"/><path d="M12 17.5v.5"/></svg>',
    agents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.2"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><path d="M9 17.5h6"/></svg>',
    scenario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'
  };

  const navModel = [
    { section: 'Sense & decide' },
    { key: 'overview', label: 'Command Center' },
    { key: 'events', label: 'Event Intelligence', badge: () => SRS.data.kpis.criticalEvents },
    { key: 'agents', label: 'AI Agents', badge: () => SRS.data.recommendations.filter(r => r.status === 'pending').length },
    { section: 'Risk objects' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'materials', label: 'Materials' },
    { key: 'products', label: 'Products / SKUs' },
    { section: 'Simulate' },
    { key: 'scenario', label: 'Scenario Studio' }
  ];

  /* ---------------- Personas ----------------
     Role-based profiles; switching one re-tunes the workspace:
     visible nav features, landing page and copilot suggestions. */
  const personaIcons = {
    cpo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>',
    category: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.2 2.6H5a2 2 0 0 0-2 2v8.2a2 2 0 0 0 .6 1.4l7.8 7.8a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8l-7.6-7.6a2 2 0 0 0-1.4-.6Z"/><circle cx="8" cy="8" r="1.3"/></svg>',
    planner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    analyst: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>'
  };
  const personas = [
    {
      id: 'cpo', role: 'Chief Procurement Officer',
      view: 'Executive exposure view', home: 'overview',
      pages: ['overview', 'events', 'scenario'],
      suggests: [
        'Daily risk brief',
        'Biggest revenue exposure right now',
        'Top 5 high-risk suppliers',
        'Simulate a supplier outage'
      ]
    },
    {
      id: 'category', role: 'Category Manager',
      view: 'Sourcing & supplier actions', home: 'overview',
      pages: ['overview', 'events', 'agents', 'suppliers', 'materials', 'scenario'],
      suggests: [
        'Top 5 high-risk suppliers',
        'Why is Mekong Flexible Films high risk?',
        'Create mitigation plan for single-source materials',
        'Daily risk brief'
      ]
    },
    {
      id: 'planner', role: 'Supply Planner',
      view: 'Inventory & continuity view', home: 'materials',
      pages: ['overview', 'events', 'materials', 'products', 'scenario'],
      suggests: [
        'Which materials can stop production in 15 days?',
        'Create mitigation plan for single-source materials',
        'Simulate a supplier outage',
        'Daily risk brief'
      ]
    },
    {
      id: 'analyst', role: 'Risk Analyst',
      view: 'Full analytics workbench', home: 'events',
      pages: ['overview', 'events', 'agents', 'suppliers', 'materials', 'products', 'scenario'],
      suggests: [
        'Top 5 high-risk suppliers',
        'Which materials can stop production in 15 days?',
        'Biggest revenue exposure right now',
        'Why is Mekong Flexible Films high risk?'
      ]
    }
  ];

  let personaId = localStorage.getItem('srs-persona');
  if (!personas.some(p => p.id === personaId)) personaId = 'category';
  function activePersona() { return personas.find(p => p.id === personaId); }
  SRS.activePersona = activePersona;

  let current = null;

  function navigate(key, opts) {
    const page = SRS.pages[key];
    if (!page) return;
    current = key;
    // nav highlight
    document.querySelectorAll('.nav-item').forEach(n =>
      n.classList.toggle('active', n.dataset.key === key));
    // header
    document.getElementById('pageTitle').textContent = page.title;
    document.getElementById('pageCrumb').textContent = page.crumb || 'NovaForge Manufacturing · Global';
    // render
    SRS.charts.disposeAll();
    const host = document.getElementById('page');
    host.innerHTML = '';
    host.scrollTop = 0;
    page.render(host, opts || {});
    requestAnimationFrame(() => SRS.charts.resizeAll());
  }
  SRS.navigate = navigate;

  function buildNav() {
    const nav = document.getElementById('nav');
    const allowed = activePersona().pages;
    nav.innerHTML = '';
    let pendingSection = null; // only emit a section header if it has visible items
    navModel.forEach(item => {
      if (item.section) { pendingSection = item.section; return; }
      if (!allowed.includes(item.key)) return;
      if (pendingSection) {
        nav.appendChild(SRS.ui.el(`<div class="nav-section">${pendingSection}</div>`));
        pendingSection = null;
      }
      const badge = item.badge ? item.badge() : 0;
      const btn = SRS.ui.el(`<button class="nav-item" data-key="${item.key}">
        ${icons[item.key] || ''}<span>${item.label}</span>
        ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
      </button>`);
      btn.addEventListener('click', () => navigate(item.key));
      nav.appendChild(btn);
    });
    if (current) {
      nav.querySelectorAll('.nav-item').forEach(n =>
        n.classList.toggle('active', n.dataset.key === current));
    }
  }

  /* ---------------- Persona switcher ---------------- */
  function syncPersonaUI() {
    const p = activePersona();
    document.getElementById('personaAvatar').innerHTML = personaIcons[p.id];
    document.getElementById('personaName').textContent = p.role;
    document.getElementById('personaView').textContent = p.view;
    document.querySelectorAll('.persona-opt').forEach(o =>
      o.classList.toggle('active', o.dataset.id === personaId));
  }

  function setPersona(id) {
    if (id === personaId) return;
    personaId = id;
    localStorage.setItem('srs-persona', id);
    const p = activePersona();
    syncPersonaUI();
    buildNav();
    if (SRS.copilot && SRS.copilot.refreshSuggests) SRS.copilot.refreshSuggests();
    navigate(p.home);
    SRS.ui.toast('Persona switched', `Workspace tuned for ${p.role} — ${p.view.toLowerCase()}.`, 'good');
  }

  function initPersona() {
    const wrap = document.getElementById('personaSwitch');
    const menu = document.getElementById('personaMenu');
    menu.innerHTML = '<div class="persona-menu-head">View as</div>';
    personas.forEach(p => {
      const opt = SRS.ui.el(`<button class="persona-opt" data-id="${p.id}">
        <div class="avatar">${personaIcons[p.id]}</div>
        <div><span class="po-name">${p.role}</span><span class="po-view">${p.view}</span></div>
        <svg class="po-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </button>`);
      opt.addEventListener('click', () => {
        wrap.classList.remove('open');
        setPersona(p.id);
      });
      menu.appendChild(opt);
    });
    document.getElementById('personaBtn').addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });
    syncPersonaUI();
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const saved = localStorage.getItem('srs-theme');
    if (saved) document.body.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    const label = btn.querySelector('.theme-label');
    const sync = () => {
      label.textContent = document.body.getAttribute('data-theme') === 'dark' ? 'Light mode' : 'Dark mode';
    };
    sync();
    btn.addEventListener('click', () => {
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('srs-theme', next);
      sync();
      SRS.charts.rerenderAll();
    });
  }

  /* ---------------- Notifications ---------------- */
  function initNotifications() {
    const panel = document.getElementById('notifPanel');
    const sevColor = { critical: 'var(--status-critical)', high: 'var(--status-serious)', medium: 'var(--status-warning)' };
    panel.innerHTML = `
      <div class="notif-head">Alerts <span>ranked by impact × urgency</span></div>
      <div class="notif-list">${SRS.data.notifications.map(n => `
        <div class="notif-item">
          <span class="n-dot" style="background:${sevColor[n.sev] || 'var(--ink-3)'}"></span>
          <div class="n-body">${n.text}<span class="n-time">${n.time} UTC</span></div>
        </div>`).join('')}
      </div>`;
    const btn = document.getElementById('notifBtn');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('open');
      document.getElementById('notifDot').style.display = 'none';
    });
    document.addEventListener('click', e => {
      if (!panel.contains(e.target)) panel.classList.remove('open');
    });
  }

  /* ---------------- Global search ---------------- */
  function initSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    function run(q) {
      q = q.trim().toLowerCase();
      if (q.length < 2) { results.classList.remove('open'); return; }
      const hits = [];
      SRS.data.suppliers.forEach(s => {
        if ((s.name + s.city + s.country).toLowerCase().includes(q))
          hits.push({ type: 'Supplier', label: s.name, sub: `${s.city}, ${s.country}`, go: () => SRS.ui.openSupplier(s.id) });
      });
      SRS.data.materials.forEach(m => {
        if ((m.name + m.subcat).toLowerCase().includes(q))
          hits.push({ type: 'Material', label: m.name, sub: m.subcat, go: () => SRS.ui.openMaterial(m.id) });
      });
      SRS.data.products.forEach(p => {
        if ((p.name + p.line).toLowerCase().includes(q))
          hits.push({ type: 'SKU', label: p.name, sub: p.line, go: () => SRS.ui.openProduct(p.id) });
      });
      SRS.data.events.forEach(ev => {
        if ((ev.title + ev.type + ev.location).toLowerCase().includes(q))
          hits.push({ type: 'Event', label: ev.title, sub: ev.location, go: () => SRS.ui.openEvent(ev.id) });
      });
      results.innerHTML = hits.slice(0, 9).map((h, i) =>
        `<button class="search-hit" data-i="${i}"><span class="hit-type">${h.type}</span><span>${SRS.ui.esc(h.label)}<span class="cell-sub">${SRS.ui.esc(h.sub)}</span></span></button>`
      ).join('') || '<div class="empty">No matches</div>';
      results.querySelectorAll('.search-hit').forEach((b, i) => {
        b.addEventListener('click', () => {
          hits[i].go();
          results.classList.remove('open');
          input.value = '';
        });
      });
      results.classList.add('open');
    }
    input.addEventListener('input', () => run(input.value));
    input.addEventListener('focus', () => run(input.value));
    document.addEventListener('click', e => {
      if (!e.target.closest('.global-search')) results.classList.remove('open');
    });
  }

  /* ---------------- Drawer / modal wiring ---------------- */
  function initOverlays() {
    document.getElementById('drawerClose').addEventListener('click', SRS.ui.closeDrawer);
    document.getElementById('drawerScrim').addEventListener('click', SRS.ui.closeDrawer);
    document.getElementById('modalClose').addEventListener('click', SRS.ui.closeModal);
    document.getElementById('modalScrim').addEventListener('click', e => {
      if (e.target === document.getElementById('modalScrim')) SRS.ui.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { SRS.ui.closeDrawer(); SRS.ui.closeModal(); SRS.copilot && SRS.copilot.close(); }
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initPersona();
    buildNav();
    initNotifications();
    initSearch();
    initOverlays();
    if (SRS.copilot && SRS.copilot.init) SRS.copilot.init();
    navigate(activePersona().home);
  });
})();
