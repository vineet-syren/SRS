/* ============================================================
   SRS · components.js
   Shared UI: badges, KPI tiles, tables, toasts, modal, and the
   360° detail drawers (supplier / material / product / event)
   that every page opens for cross-navigation.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  const D = () => SRS.data;

  /* ---------------- Tiny DOM helpers ---------------- */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ---------------- Badges & meters ---------------- */
  const badge = rating => `<span class="badge ${SRS.risk.ratingClass(rating)}">${rating}</span>`;
  const statusBadge = status => {
    const map = {
      'Active': 'high', 'New': 'critical', 'Tracked': 'medium',
      'Mitigation in Progress': 'accent', 'Resolved': 'low', 'Closed': 'neutral'
    };
    const cls = map[status] || 'neutral';
    return `<span class="badge plain ${cls}">${status}</span>`;
  };
  const scoreSpan = score =>
    `<span class="risk-score ${SRS.risk.ratingClass(SRS.risk.ratingOf(score))}">${SRS.fmt.score(score)}</span>`;
  const meter = (score, max) => {
    max = max || 5;
    const pct = Math.min(100, (score / max) * 100);
    const color = SRS.risk.scoreColor(score);
    return `<span class="meter"><span class="meter-track"><span class="meter-fill" style="width:${pct}%;background:${color}"></span></span><span class="meter-val" style="color:${color}">${SRS.fmt.score(score)}</span></span>`;
  };

  /* ---------------- KPI tile ---------------- */
  /** cfg: {label, value, sub, delta:{text, dir:'good'|'bad'}, spark:[..], sparkColor, accent, onClick} */
  function kpi(cfg) {
    const node = el(`<div class="kpi ${cfg.onClick ? 'clickable' : ''}">
      ${cfg.accent ? `<span class="kpi-accent" style="background:${cfg.accent}"></span>` : ''}
      <span class="kpi-label">${esc(cfg.label)}</span>
      <span class="kpi-value">${cfg.value}${cfg.sub ? ` <small>${esc(cfg.sub)}</small>` : ''}</span>
      ${cfg.delta ? `<span class="kpi-delta ${cfg.delta.dir}">${cfg.delta.text} <span class="vs">${esc(cfg.delta.vs || 'vs last month')}</span></span>` : ''}
      ${cfg.spark ? '<span class="kpi-spark"></span>' : ''}
    </div>`);
    if (cfg.onClick) node.addEventListener('click', cfg.onClick);
    if (cfg.spark) {
      requestAnimationFrame(() =>
        SRS.charts.sparkline(node.querySelector('.kpi-spark'), cfg.spark, cfg.sparkColor));
    }
    return node;
  }

  /* ---------------- Table ---------------- */
  /** cols: [{h, cell(row), cls}], rows: data[], onRow(row) optional */
  function table(cols, rows, onRow) {
    const wrap = el('<div class="tbl-wrap"></div>');
    const t = el(`<table class="tbl"><thead><tr>${
      cols.map(c => `<th class="${c.cls || ''}">${esc(c.h)}</th>`).join('')
    }</tr></thead><tbody></tbody></table>`);
    const tb = t.querySelector('tbody');
    rows.forEach(r => {
      const tr = el(`<tr class="${onRow ? 'row-link' : ''}">${
        cols.map(c => `<td class="${c.cls || ''}">${c.cell(r)}</td>`).join('')
      }</tr>`);
      if (onRow) tr.addEventListener('click', () => onRow(r));
      tb.appendChild(tr);
    });
    wrap.appendChild(t);
    return wrap;
  }

  /* ---------------- Card scaffold ---------------- */
  /** cfg: {title, sub, cols (grid span), chartClass, actions: HTMLElement[]} */
  function card(cfg) {
    const node = el(`<div class="card ${cfg.cols ? 'col-' + cfg.cols : ''}">
      <div class="card-head">
        <div><div class="card-title">${esc(cfg.title)}</div>
        ${cfg.sub ? `<div class="card-sub">${esc(cfg.sub)}</div>` : ''}</div>
        <div class="card-actions"></div>
      </div>
      <div class="card-body ${cfg.flush ? 'flush' : ''}"></div>
    </div>`);
    (cfg.actions || []).forEach(a => node.querySelector('.card-actions').appendChild(a));
    if (cfg.chartClass) {
      const c = el(`<div class="chart ${cfg.chartClass}"></div>`);
      node.querySelector('.card-body').appendChild(c);
      node._chartEl = c;
    }
    return node;
  }

  /* ---------------- Toast ---------------- */
  function toast(title, body, type) {
    const host = document.getElementById('toasts');
    const node = el(`<div class="toast ${type || ''}">
      <div><strong>${esc(title)}</strong><span class="t-body">${body}</span></div>
    </div>`);
    host.appendChild(node);
    setTimeout(() => { node.classList.add('out'); setTimeout(() => node.remove(), 320); }, 4600);
  }

  /* ---------------- Modal ---------------- */
  function modal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalScrim').classList.add('open');
  }
  function closeModal() { document.getElementById('modalScrim').classList.remove('open'); }

  /* ---------------- Drawer core ---------------- */
  function openDrawer(kicker, title, build) {
    document.getElementById('drawerKicker').textContent = kicker;
    document.getElementById('drawerTitle').textContent = title;
    const body = document.getElementById('drawerBody');
    body.innerHTML = '';
    build(body);
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerScrim').classList.add('open');
  }
  function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerScrim').classList.remove('open');
  }

  const dimNames = { fin: 'Financial', geo: 'Geopolitical', rel: 'Reliability', qual: 'Quality', src: 'Sourcing' };
  function dimBars(dims) {
    return Object.keys(dims).map(k => {
      const v = dims[k];
      const color = SRS.risk.scoreColor(v);
      return `<div class="dim-row">
        <span class="dim-label">${dimNames[k]}</span>
        <span class="dim-track"><span class="dim-fill" style="width:${(v / 5) * 100}%;background:${color}"></span></span>
        <span class="dim-val" style="color:${color}">${v.toFixed(1)}</span>
      </div>`;
    }).join('');
  }

  /* ---------------- Supplier 360 drawer ---------------- */
  function openSupplier(id) {
    const s = D().supplierById(id);
    if (!s) return;
    const mats = D().materialsOf(id);
    const prods = D().productsOf(id);
    const evs = D().eventsOf(id).filter(e => !['Closed'].includes(e.status));
    openDrawer('Supplier 360', s.name, body => {
      body.innerHTML = `
        <div class="drawer-section">
          <div class="flex aic gap8" style="margin-bottom:12px">
            ${badge(s.rating)}
            <span class="badge neutral plain">${esc(s.catName)}</span>
            <span class="badge neutral plain">Tier ${s.tier}</span>
            <span class="muted" style="font-size:12px">${esc(s.city)}, ${esc(s.country)} · ${esc(s.region)}</span>
          </div>
          <div class="facts">
            <div class="fact"><div class="f-label">Risk score</div><div class="f-value">${scoreSpan(s.score)}</div></div>
            <div class="fact"><div class="f-label">Exposure (REV)</div><div class="f-value">${SRS.fmt.usdM(s.rev)}</div></div>
            <div class="fact"><div class="f-label">Annual spend</div><div class="f-value">${SRS.fmt.usdM(s.spend)}</div></div>
            <div class="fact"><div class="f-label">OTIF</div><div class="f-value">${SRS.fmt.pct(s.otif)}</div></div>
            <div class="fact"><div class="f-label">Defect rate</div><div class="f-value">${s.ppm} <small>ppm</small></div></div>
            <div class="fact"><div class="f-label">Lead time</div><div class="f-value">${s.lead} <small>days</small></div></div>
          </div>
        </div>
        <div class="drawer-section">
          <h3>Risk score · last 12 months</h3>
          <div class="chart" style="height:130px" id="drawerTrend"></div>
        </div>
        <div class="drawer-section">
          <h3>Risk dimensions</h3>
          ${dimBars(s.dims)}
        </div>
        ${evs.length ? `<div class="drawer-section"><h3>Open risk events</h3>${
          evs.map(e => `<div class="reco" style="cursor:pointer" data-ev="${e.id}">
            <div class="reco-head"><span class="reco-title">${esc(e.title)}</span>${statusBadge(e.status)}</div>
            <div class="reco-meta"><span class="rm">Criticality<strong class="${e.criticality === 'Critical' ? 'bad' : ''}">${e.criticality}</strong></span>
            <span class="rm">Exposure<strong>${SRS.fmt.usdM(e.rev)}</strong></span>
            <span class="rm">Since<strong>${e.start.slice(5)}</strong></span></div>
          </div>`).join('')}</div>` : ''}
        <div class="drawer-section">
          <h3>Materials supplied (${mats.length})</h3>
          <div id="drawerMats"></div>
        </div>
        <div class="drawer-section">
          <h3>Finished goods dependency (${prods.length} SKUs)</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${
            prods.map(p => `<span class="badge neutral plain" style="cursor:pointer" data-prod="${p.id}">${esc(p.name)}</span>`).join('') || '<span class="muted">None</span>'}
          </div>
        </div>`;

      body.querySelector('#drawerMats').appendChild(table([
        { h: 'Material', cell: m => `<span class="cell-main">${esc(m.name)}</span><span class="cell-sub">${esc(m.subcat)}</span>` },
        { h: 'Sourcing', cell: m => m.singleSource ? '<span class="badge critical plain">Single</span>' : '<span class="badge low plain">Dual+</span>' },
        { h: 'Cover', cls: 'num', cell: m => SRS.fmt.days(m.stockDays) },
        { h: 'Risk', cls: 'num', cell: m => scoreSpan(m.score) }
      ], mats, m => openMaterial(m.id)));

      body.querySelectorAll('[data-ev]').forEach(n =>
        n.addEventListener('click', () => openEvent(n.dataset.ev)));
      body.querySelectorAll('[data-prod]').forEach(n =>
        n.addEventListener('click', () => openProduct(n.dataset.prod)));

      SRS.charts.mount(body.querySelector('#drawerTrend'), () => {
        const t = SRS.theme.tokens();
        return Object.assign(SRS.theme.baseOption(), {
          grid: { left: 6, right: 10, top: 8, bottom: 2, containLabel: true },
          tooltip: Object.assign(SRS.theme.baseOption().tooltip, { trigger: 'axis' }),
          xAxis: SRS.theme.catAxis(D().monthly.months, { axisLabel: { fontSize: 10.5, color: t.ink3, interval: 2 } }),
          yAxis: SRS.theme.valAxis({ min: 0, max: 5, splitNumber: 3 }),
          series: [{
            type: 'line', data: s.trend, symbol: 'circle', symbolSize: 5,
            lineStyle: { width: 2, color: SRS.risk.scoreColor(s.score) },
            itemStyle: { color: SRS.risk.scoreColor(s.score), borderColor: t.surface, borderWidth: 2 },
            areaStyle: { color: SRS.risk.scoreColor(s.score), opacity: 0.08 }
          }]
        });
      });
    });
  }

  /* ---------------- Material drawer ---------------- */
  function openMaterial(id) {
    const m = D().materialById(id);
    if (!m) return;
    const sups = m.suppliers.map(sid => D().supplierById(sid));
    const prods = D().productsUsing(id);
    const plantNames = m.plants.map(p => (D().plants.find(x => x.id === p) || {}).name).filter(Boolean);
    openDrawer('Material risk', m.name, body => {
      body.innerHTML = `
        <div class="drawer-section">
          <div class="flex aic gap8" style="margin-bottom:12px">
            ${badge(m.rating)}
            <span class="badge neutral plain">${esc(m.catName)} · ${esc(m.subcat)}</span>
            ${m.singleSource ? '<span class="badge critical">Single source</span>' : ''}
          </div>
          <div class="facts">
            <div class="fact"><div class="f-label">Risk score</div><div class="f-value">${scoreSpan(m.score)}</div></div>
            <div class="fact"><div class="f-label">Exposure (REV)</div><div class="f-value">${SRS.fmt.usdM(m.rev)}</div></div>
            <div class="fact"><div class="f-label">Stock cover</div><div class="f-value">${m.stockDays} <small>days</small></div></div>
            <div class="fact"><div class="f-label">Lead time</div><div class="f-value">${m.leadDays} <small>days</small></div></div>
            <div class="fact"><div class="f-label">Plants</div><div class="f-value">${m.plants.length}</div></div>
            <div class="fact"><div class="f-label">SKUs affected</div><div class="f-value">${prods.length}</div></div>
          </div>
        </div>
        <div class="drawer-section">
          <h3>Substitution feasibility</h3>
          <div class="sim-out-note">${esc(m.substitution)}</div>
        </div>
        <div class="drawer-section"><h3>Suppliers</h3><div id="dmSup"></div></div>
        <div class="drawer-section">
          <h3>Consuming plants</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${plantNames.map(p => `<span class="badge neutral plain">${esc(p)}</span>`).join('')}</div>
        </div>
        <div class="drawer-section">
          <h3>Finished goods using this material</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${
            prods.map(p => `<span class="badge neutral plain" style="cursor:pointer" data-prod="${p.id}">${esc(p.name)}</span>`).join('')}
          </div>
        </div>`;
      body.querySelector('#dmSup').appendChild(table([
        { h: 'Supplier', cell: s => `<span class="cell-main">${esc(s.name)}</span><span class="cell-sub">${esc(s.city)}, ${esc(s.country)}</span>` },
        { h: 'Rating', cell: s => badge(s.rating) },
        { h: 'OTIF', cls: 'num', cell: s => SRS.fmt.pct(s.otif) },
        { h: 'Risk', cls: 'num', cell: s => scoreSpan(s.score) }
      ], sups, s => openSupplier(s.id)));
      body.querySelectorAll('[data-prod]').forEach(n =>
        n.addEventListener('click', () => openProduct(n.dataset.prod)));
    });
  }

  /* ---------------- Product drawer ---------------- */
  function openProduct(id) {
    const p = D().productById(id);
    if (!p) return;
    const mats = p.materials.map(mid => D().materialById(mid)).filter(Boolean);
    const atRisk = mats.filter(m => m.score >= 3);
    openDrawer('Product / SKU impact', p.name, body => {
      body.innerHTML = `
        <div class="drawer-section">
          <div class="flex aic gap8" style="margin-bottom:12px">
            ${badge(p.rating)}
            <span class="badge neutral plain">${esc(p.line)}</span>
            ${p.growth >= 10 ? '<span class="badge accent plain">High growth</span>' : ''}
          </div>
          <div class="facts">
            <div class="fact"><div class="f-label">FY26 revenue</div><div class="f-value">${SRS.fmt.usdM(p.revenue)}</div></div>
            <div class="fact"><div class="f-label">Margin</div><div class="f-value">${SRS.fmt.pct(p.margin)}</div></div>
            <div class="fact"><div class="f-label">Growth YoY</div><div class="f-value">${SRS.fmt.signed(p.growth, '%')}</div></div>
            <div class="fact"><div class="f-label">Risk score</div><div class="f-value">${scoreSpan(p.score)}</div></div>
            <div class="fact"><div class="f-label">Exposure (REV)</div><div class="f-value">${SRS.fmt.usdM(p.rev)}</div></div>
            <div class="fact"><div class="f-label">Materials at risk</div><div class="f-value">${atRisk.length} <small>of ${mats.length}</small></div></div>
          </div>
        </div>
        <div class="drawer-section"><h3>Bill of materials — risk view</h3><div id="dpMats"></div></div>`;
      body.querySelector('#dpMats').appendChild(table([
        { h: 'Material', cell: m => `<span class="cell-main">${esc(m.name)}</span><span class="cell-sub">${esc(m.subcat)}</span>` },
        { h: 'Sourcing', cell: m => m.singleSource ? '<span class="badge critical plain">Single</span>' : '<span class="badge low plain">Dual+</span>' },
        { h: 'Cover', cls: 'num', cell: m => SRS.fmt.days(m.stockDays) },
        { h: 'Risk', cls: 'num', cell: m => scoreSpan(m.score) }
      ], mats.sort((a, b) => b.score - a.score), m => openMaterial(m.id)));
    });
  }

  /* ---------------- Event drawer ---------------- */
  function openEvent(id) {
    const e = D().eventById(id);
    if (!e) return;
    const sups = e.suppliers.map(sid => D().supplierById(sid)).filter(Boolean);
    const mats = (e.materials || []).map(mid => D().materialById(mid)).filter(Boolean);
    const skus = new Set();
    mats.forEach(m => D().productsUsing(m.id).forEach(p => skus.add(p.id)));
    openDrawer(`Event ${e.id} · ${e.type}`, e.title, body => {
      body.innerHTML = `
        <div class="drawer-section">
          <div class="flex aic gap8" style="margin-bottom:12px">
            ${badge(e.criticality)} ${statusBadge(e.status)}
            <span class="muted" style="font-size:12px">${esc(e.location)}</span>
          </div>
          <div class="facts">
            <div class="fact"><div class="f-label">Exposure (REV)</div><div class="f-value">${SRS.fmt.usdM(e.rev)}</div></div>
            <div class="fact"><div class="f-label">Suppliers</div><div class="f-value">${sups.length}</div></div>
            <div class="fact"><div class="f-label">Materials</div><div class="f-value">${mats.length}</div></div>
            <div class="fact"><div class="f-label">SKUs at risk</div><div class="f-value">${skus.size}</div></div>
            <div class="fact"><div class="f-label">Detected</div><div class="f-value" style="font-size:13px">${e.start}</div></div>
            <div class="fact"><div class="f-label">Source</div><div class="f-value" style="font-size:13px">${esc(e.source)}</div></div>
          </div>
        </div>
        <div class="drawer-section"><h3>What happened</h3>
          <p style="font-size:13px;color:var(--ink-2);line-height:1.55">${esc(e.description)}</p>
        </div>
        <div class="drawer-section"><h3>Agent timeline</h3>
          ${e.timeline.map(t => `<div class="feed-item">
            <span class="feed-time" style="width:74px">${t[0].slice(5)}</span>
            <div class="feed-body"><span class="f-text">${esc(t[1])}</span></div>
          </div>`).join('')}
        </div>
        <div class="drawer-section"><h3>Impacted suppliers</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${
            sups.map(s => `<span class="badge high plain" style="cursor:pointer" data-sup="${s.id}">${esc(s.name)}</span>`).join('')}</div>
        </div>
        ${mats.length ? `<div class="drawer-section"><h3>Impacted materials</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${
            mats.map(m => `<span class="badge medium plain" style="cursor:pointer" data-mat="${m.id}">${esc(m.name)}</span>`).join('')}</div>
        </div>` : ''}`;
      body.querySelectorAll('[data-sup]').forEach(n =>
        n.addEventListener('click', () => openSupplier(n.dataset.sup)));
      body.querySelectorAll('[data-mat]').forEach(n =>
        n.addEventListener('click', () => openMaterial(n.dataset.mat)));
    });
  }

  SRS.ui = {
    el, esc, badge, statusBadge, scoreSpan, meter, kpi, table, card,
    toast, modal, closeModal,
    openDrawer, closeDrawer,
    openSupplier, openMaterial, openProduct, openEvent
  };
})();
