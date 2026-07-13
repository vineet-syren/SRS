/* ============================================================
   SRS · pages/scenario.js
   Scenario Studio — what-if simulator powered by the Scenario
   Simulation Agent. Every control recomputes the results live:
   impact facts, do-nothing vs plan comparison, ROI, inventory
   runway (with a no-mitigation baseline), and a one-click
   "create mitigation plan" that lands in the approval queue.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {

  /* Saved scenarios persist for the session (across page visits). */
  const savedScenarios = [];

  /* ---------------- Pure simulation model ---------------- */
  function shortName(name) {
    return String(name).replace(/\s*\(.*\)\s*$/, '');
  }

  function sim(st) {
    const D = SRS.data;
    const s = D.supplierById(st.supplierId);
    const mats = D.materialsOf(st.supplierId);
    const prods = D.productsOf(st.supplierId);
    const days = st.weeks * 7;
    const rampDays = st.expedite ? 7 : 14; // alternate source onboarding

    // top 4 materials by exposure (fallback: all)
    const simMats = mats.slice().sort((a, b) => b.rev - a.rev).slice(0, 4);

    function runway(m, shift) {
      const burn0 = 100 / m.stockDays; // % of cover consumed per day
      let cover = 100, stockout = null;
      const data = [[0, 100]];
      for (let d = 1; d <= days; d++) {
        const burn = d >= rampDays ? burn0 * (1 - shift / 100) : burn0;
        cover = Math.max(0, cover - burn);
        if (cover === 0 && stockout == null) stockout = d;
        data.push([d, +cover.toFixed(1)]);
      }
      return { stockout, data };
    }

    const series = simMats.map(m => {
      const r = runway(m, st.shift);
      return { id: m.id, name: shortName(m.name), single: m.singleSource, stockout: r.stockout, data: r.data, mat: m };
    });

    const outs = series.filter(x => x.stockout != null);
    const firstStockout = outs.length ? Math.min.apply(null, outs.map(x => x.stockout)) : null;
    const firstOutMat = outs.length ? outs.reduce((a, b) => a.stockout <= b.stockout ? a : b) : null;

    // baseline (do nothing) runway for the most exposed material
    const worst = firstOutMat || series[0];
    const baseline = worst ? { name: worst.name, run: runway(worst.mat, 0) } : null;

    const prodRevenue = prods.reduce((a, p) => a + p.revenue, 0);
    const rawRisk = prodRevenue * (days / 365) * 0.55; // severity factor
    const revenueAtRisk = rawRisk * (1 - (st.shift / 100) * 0.8); // shift mitigation
    const protectedRev = rawRisk - revenueAtRisk;
    const mitigationCost = s.spend * (st.weeks / 52) * (st.shift / 100) * 0.09 + (st.expedite ? 0.35 : 0);
    const roi = mitigationCost > 0.02 ? protectedRev / mitigationCost : null;
    const residual = Math.max(0.3, s.rev * (1 - (st.shift / 100) * 0.85));
    const cutPct = s.rev > 0 ? Math.max(0, Math.round((1 - residual / s.rev) * 100)) : 0;
    const riskCutPct = rawRisk > 0 ? Math.round((protectedRev / rawRisk) * 100) : 0;
    const singles = simMats.filter(m => m.singleSource).length;

    return {
      supplier: s, mats, prods, days, rampDays, series, baseline,
      firstStockout, firstOutMat, rawRisk, revenueAtRisk, protectedRev,
      mitigationCost, roi, residual, cutPct, riskCutPct, singles
    };
  }

  function narrative(r, st) {
    const esc = SRS.ui.esc, f = SRS.fmt;
    const outTxt = r.firstStockout != null
      ? `first stockout projected at <strong>day ${r.firstStockout}</strong> (${esc(r.firstOutMat.name)}${r.firstOutMat.single ? ' — single-sourced' : ''})`
      : `no stockout within the <strong>${r.days}-day</strong> horizon`;
    let html = `<strong>Agent read-out.</strong> A <strong>${st.weeks}-week</strong> outage at <strong>${esc(r.supplier.name)}</strong> touches ` +
      `<strong>${r.mats.length}</strong> material${r.mats.length === 1 ? '' : 's'} and <strong>${r.prods.length}</strong> SKUs — ` +
      `unmitigated exposure runs <strong>${f.usdM(r.rawRisk)}</strong>, ${outTxt}` +
      `${r.singles ? ` · ${r.singles} of the simulated materials ${r.singles === 1 ? 'is' : 'are'} single-sourced` : ''}. ` +
      `Shifting <strong>${st.shift}%</strong> of volume to alternates${st.expedite ? ' with air-freight expedite' : ''} ` +
      `(alternates online day ${r.rampDays}) protects <strong>${f.usdM(r.protectedRev)}</strong> of revenue for ` +
      `<strong>${f.usdM(r.mitigationCost)}</strong> of mitigation cost` +
      `${r.roi ? ` — <strong>${r.roi.toFixed(0)}× return</strong> on the mitigation dollar` : ''}.`;
    if (st.supplierId === 'S01') {
      html += ` <em>Decision memory — Nov 25 precedent: the same shift to Baltic Packaging cut stockout risk 60% at +8% freight.</em>`;
    }
    return html;
  }

  /* Add (or create) the AI Agents sidebar badge — a new plan awaits approval. */
  function bumpNavBadge() {
    const item = document.querySelector(".nav-item[data-key='agents']");
    if (!item) return; // agents page hidden for this persona
    let b = item.querySelector('.nav-badge');
    if (!b) { b = SRS.ui.el('<span class="nav-badge">0</span>'); item.appendChild(b); }
    b.textContent = (parseInt(b.textContent, 10) || 0) + 1;
  }

  /* ---------------- Page ---------------- */
  function render(host, opts) {
    const D = SRS.data, ui = SRS.ui;
    const state = { supplierId: 'S01', weeks: 4, shift: 40, expedite: false };
    if (opts && opts.supplierId && D.supplierById(opts.supplierId)) state.supplierId = opts.supplierId;
    let last = sim(state);
    let chartInst = null;

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ---------- Controls card (cols 4) ---------- */
    const presets = [
      { label: 'Mekong flood · 4 wks', sup: 'S01', weeks: 4, shift: 40, exp: false },
      { label: 'Taichung MCU · 30 days', sup: 'S09', weeks: 4, shift: 30, exp: true },
      { label: 'Monterrey strike · 3 wks', sup: 'S05', weeks: 3, shift: 50, exp: false }
    ];

    const sortedSups = D.suppliers.slice().sort((a, b) => b.score - a.score);
    const panel = ui.el(`<div class="sim-panel">
      <div class="sim-field">
        <label>Start from a playbook</label>
        <div class="chip-row" id="presetRow"></div>
      </div>
      <div class="sim-field" id="savedField" style="display:none">
        <label>Saved this session</label>
        <div class="chip-row" id="savedRow"></div>
      </div>
      <div class="sim-field">
        <label for="simSup">Supplier outage</label>
        <select id="simSup">${sortedSups.map(s =>
          `<option value="${s.id}">${ui.esc(s.name)} — ${s.rating}</option>`).join('')}</select>
        <div class="sim-context" id="supContext"></div>
      </div>
      <div class="sim-field">
        <label for="simWeeks">Outage duration</label>
        <div class="range-row">
          <input type="range" id="simWeeks" min="1" max="12" step="1" value="${state.weeks}">
          <span class="range-val" id="weeksVal">${state.weeks} wks</span>
        </div>
      </div>
      <div class="sim-field">
        <label for="simShift">Volume shifted to alternates</label>
        <div class="range-row">
          <input type="range" id="simShift" min="0" max="80" step="5" value="${state.shift}">
          <span class="range-val" id="shiftVal">${state.shift} %</span>
        </div>
      </div>
      <div class="sim-field">
        <label style="display:flex;align-items:center;gap:9px;cursor:pointer;margin-bottom:0">
          <input type="checkbox" id="simExp" style="accent-color:var(--accent);width:15px;height:15px">
          Expedite via air freight (alternates online in 7 days)
        </label>
      </div>
      <div class="flex gap8">
        <button class="btn btn-primary" id="planBtn">Create mitigation plan</button>
        <button class="btn" id="saveBtn">Save scenario</button>
      </div>
      <div class="muted" style="font-size:12px">Results update live as you adjust the parameters — no run button needed.</div>
    </div>`);

    const controlsCard = ui.card({
      title: 'Scenario parameters',
      sub: 'ask "what if" — the agent recomputes on every change',
      cols: 4
    });
    controlsCard.querySelector('.card-body').appendChild(panel);
    grid.appendChild(controlsCard);

    /* ---------- Results column (cols 8) ---------- */
    const col = ui.el('<div class="col-8" style="display:flex;flex-direction:column;gap:16px"></div>');
    grid.appendChild(col);

    const supBtn = ui.el('<button class="btn btn-ghost btn-sm">Supplier 360</button>');
    supBtn.addEventListener('click', () => ui.openSupplier(state.supplierId));

    const impactCard = ui.card({
      title: 'Simulated impact',
      sub: 'live — recomputed by the Scenario Simulation Agent on every change',
      actions: [supBtn]
    });
    const impactBody = impactCard.querySelector('.card-body');
    const factsEl = ui.el('<div class="facts" style="grid-template-columns:repeat(3,1fr)"></div>');
    const cmpEl = ui.el('<div class="cmp-block"></div>');
    const narrEl = ui.el('<div class="sim-out-note" style="margin-top:14px"></div>');
    impactBody.appendChild(factsEl);
    impactBody.appendChild(cmpEl);
    impactBody.appendChild(narrEl);
    col.appendChild(impactCard);

    const chartCard = ui.card({
      title: 'Inventory runway under disruption',
      sub: 'stock cover % by material — solid = with plan, dashed = do nothing',
      chartClass: 'chart-lg'
    });
    col.appendChild(chartCard);

    /* ---------- Facts ---------- */
    function fact(label, value, tone) {
      return `<div class="fact"><div class="f-label">${label}</div>
        <div class="f-value"${tone ? ` style="color:var(--status-${tone})"` : ''}>${value}</div></div>`;
    }
    function renderFacts() {
      const r = last, f = SRS.fmt;
      const stockoutVal = r.firstStockout != null
        ? `day ${r.firstStockout} <small>${SRS.ui.esc(r.firstOutMat.name)}</small>`
        : `&gt;${r.days} <small>days — horizon clear</small>`;
      factsEl.innerHTML =
        fact('Revenue at risk (with plan)', `${f.usdM(r.revenueAtRisk)} <small>of ${f.usdM(r.rawRisk)} unmitigated</small>`) +
        fact('First stockout', stockoutVal, r.firstStockout != null ? 'critical' : 'good') +
        fact('Revenue protected', `${f.usdM(r.protectedRev)} <small>−${r.riskCutPct}% risk</small>`, r.protectedRev > 0.05 ? 'good' : null) +
        fact('Mitigation cost', f.usdM(r.mitigationCost)) +
        fact('Return on mitigation', r.roi ? `${r.roi.toFixed(0)}× <small>protected per $ spent</small>` : '—') +
        fact('Residual exposure', `${f.usdM(r.residual)} <small>−${r.cutPct}% vs unmitigated</small>`);
    }

    function renderCompare() {
      const r = last, f = SRS.fmt;
      const pct = r.rawRisk > 0 ? Math.max(2, Math.round((r.revenueAtRisk / r.rawRisk) * 100)) : 2;
      cmpEl.innerHTML = `
        <div class="cmp-title">Do nothing vs this plan — revenue at risk over ${r.days} days</div>
        <div class="cmp-row">
          <span class="cmp-label">Do nothing</span>
          <span class="cmp-track"><span class="cmp-fill" style="width:100%;background:var(--status-critical)"></span></span>
          <span class="cmp-val">${f.usdM(r.rawRisk)}</span>
        </div>
        <div class="cmp-row">
          <span class="cmp-label">With this plan</span>
          <span class="cmp-track"><span class="cmp-fill" style="width:${pct}%;background:var(--accent)"></span></span>
          <span class="cmp-val">${f.usdM(r.revenueAtRisk)}</span>
        </div>
        <div class="cmp-note">−${r.riskCutPct}% revenue at risk, for ${f.usdM(r.mitigationCost)} of mitigation spend${r.roi ? ` · ${r.roi.toFixed(0)}× return` : ''}.</div>`;
    }

    /* ---------- Chart factory (reads latest `last`) ---------- */
    function chartOption() {
      const t = SRS.theme.tokens();
      const r = last;
      const base = SRS.theme.baseOption();
      const names = r.series.map(x => x.name);
      if (r.baseline && state.shift > 0) names.push('Do nothing — ' + r.baseline.name);
      return Object.assign(base, {
        legend: Object.assign(base.legend, { top: 0, data: names }),
        tooltip: Object.assign(base.tooltip, {
          trigger: 'axis',
          formatter: ps => {
            let h = `<strong>Day ${ps[0].value[0]}</strong>`;
            ps.forEach(p => {
              h += `<br/>${p.marker} ${SRS.ui.esc(p.seriesName)} · ${p.value[1].toFixed(0)}% cover`;
            });
            return h;
          }
        }),
        grid: { left: 8, right: 18, top: 46, bottom: 4, containLabel: true },
        xAxis: {
          type: 'value', min: 0, max: r.days,
          axisLine: { lineStyle: { color: t.axis } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: t.ink3, fontSize: 12, formatter: v => v + 'd' }
        },
        yAxis: SRS.theme.valAxis({
          min: 0, max: 100, name: 'stock cover %',
          nameTextStyle: { color: t.ink3, fontSize: 11.5 },
          axisLabel: { formatter: v => v + '%' }
        }),
        series: r.series.map((m, i) => Object.assign({
          name: m.name, type: 'line', data: m.data,
          symbol: 'none',
          lineStyle: { width: 2, color: t.series[i] },
          itemStyle: { color: t.series[i] },
          areaStyle: { color: t.series[i], opacity: 0.12 }
        }, i === 0 ? {
          markLine: {
            silent: true, symbol: 'none',
            data: [
              {
                yAxis: 20,
                lineStyle: { color: t.status.serious, width: 1.5, type: 'dashed' },
                label: { formatter: 'safety floor', color: t.status.serious, fontSize: 11, position: 'insideEndTop' }
              },
              {
                xAxis: r.rampDays,
                lineStyle: { color: t.accent, width: 1.5, type: 'dashed' },
                label: { formatter: 'alternates online', color: t.accent, fontSize: 11, position: 'insideEndTop' }
              }
            ]
          }
        } : {})).concat(r.baseline && state.shift > 0 ? [{
          name: 'Do nothing — ' + r.baseline.name,
          type: 'line', data: r.baseline.run.data,
          symbol: 'none',
          lineStyle: { width: 2, color: t.status.critical, type: 'dashed' },
          itemStyle: { color: t.status.critical }
        }] : [])
      });
    }

    /* ---------- Supplier context line ---------- */
    const supContext = panel.querySelector('#supContext');
    function renderContext() {
      const r = last, s = r.supplier;
      const minCover = r.mats.length ? Math.min.apply(null, r.mats.map(m => m.stockDays)) : null;
      supContext.innerHTML = `${ui.badge(s.rating)}
        <span>${r.mats.length} material${r.mats.length === 1 ? '' : 's'} · ${r.prods.length} SKU${r.prods.length === 1 ? '' : 's'}</span>
        ${minCover != null ? `<span>· thinnest cover <strong style="color:var(--ink-2)">${minCover}d</strong></span>` : ''}
        ${r.singles ? `<span class="badge critical plain">${r.singles} single-source</span>` : ''}`;
    }

    /* ---------- Live run ---------- */
    function run() {
      last = sim(state);
      renderFacts();
      renderCompare();
      renderContext();
      narrEl.innerHTML = narrative(last, state);
      if (chartInst) chartInst.setOption(chartOption(), true);
    }

    /* ---------- Wire controls ---------- */
    const supSel = panel.querySelector('#simSup');
    const weeksIn = panel.querySelector('#simWeeks');
    const shiftIn = panel.querySelector('#simShift');
    const expIn = panel.querySelector('#simExp');
    const weeksVal = panel.querySelector('#weeksVal');
    const shiftVal = panel.querySelector('#shiftVal');
    const presetRow = panel.querySelector('#presetRow');
    const savedRow = panel.querySelector('#savedRow');
    const savedField = panel.querySelector('#savedField');

    supSel.value = state.supplierId;

    function clearPresetActive() {
      panel.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    }
    function applyParams(p, chip) {
      state.supplierId = p.sup; state.weeks = p.weeks; state.shift = p.shift; state.expedite = p.exp;
      supSel.value = p.sup;
      weeksIn.value = p.weeks; weeksVal.textContent = p.weeks + ' wks';
      shiftIn.value = p.shift; shiftVal.textContent = p.shift + ' %';
      expIn.checked = p.exp;
      clearPresetActive();
      if (chip) chip.classList.add('active');
      run();
    }

    presets.forEach(p => {
      const c = ui.el(`<button class="chip">${ui.esc(p.label)}</button>`);
      c.addEventListener('click', () => applyParams(p, c));
      presetRow.appendChild(c);
    });

    function renderSaved() {
      savedField.style.display = savedScenarios.length ? '' : 'none';
      savedRow.innerHTML = '';
      savedScenarios.forEach(p => {
        const c = ui.el(`<button class="chip">${ui.esc(p.label)}</button>`);
        c.addEventListener('click', () => applyParams(p, c));
        savedRow.appendChild(c);
      });
    }
    renderSaved();

    supSel.addEventListener('change', () => { state.supplierId = supSel.value; clearPresetActive(); run(); });
    weeksIn.addEventListener('input', () => {
      state.weeks = +weeksIn.value;
      weeksVal.textContent = state.weeks + ' wks';
      clearPresetActive(); run();
    });
    shiftIn.addEventListener('input', () => {
      state.shift = +shiftIn.value;
      shiftVal.textContent = state.shift + ' %';
      clearPresetActive(); run();
    });
    expIn.addEventListener('change', () => { state.expedite = expIn.checked; clearPresetActive(); run(); });

    /* ---------- Create mitigation plan → approval queue ---------- */
    panel.querySelector('#planBtn').addEventListener('click', () => {
      const r = last, f = SRS.fmt;
      if (state.shift === 0) {
        ui.toast('Nothing to propose', 'Shift some volume to alternates first — a 0% shift has no mitigation effect', 'warn');
        return;
      }
      const openEv = D.eventsOf(state.supplierId)
        .find(e => ['Active', 'Tracked', 'Mitigation in Progress'].includes(e.status));
      const id = 'R-' + (100 + D.recommendations.length + 1);
      D.recommendations.unshift({
        id, linkedEvent: openEv ? openEv.id : null, status: 'pending', agent: 'mitigation',
        title: `Shift ${state.shift}% of ${shortName(r.supplier.name)} volume to alternates for ${state.weeks} wks` +
          (state.expedite ? ' + air-freight expedite' : ''),
        detail: `Drafted from Scenario Studio: a ${state.weeks}-week outage runs ${f.usdM(r.rawRisk)} unmitigated. ` +
          `This plan protects ${f.usdM(r.protectedRev)} of revenue (−${r.riskCutPct}% risk) for ${f.usdM(r.mitigationCost)}` +
          `${r.firstStockout ? `; first stockout otherwise at day ${r.firstStockout} (${r.firstOutMat.name})` : ''}.`,
        cost: `+${f.usdM(r.mitigationCost)} mitigation`,
        riskCut: `−${r.riskCutPct}% revenue at risk`,
        exposure: +r.revenueAtRisk.toFixed(1),
        approvers: 'Category Head · Planning Lead'
      });
      bumpNavBadge();
      ui.toast('Mitigation plan drafted', id + ' sent to the approval queue — review it under AI Agents', 'good');
    });

    /* ---------- Save scenario ---------- */
    panel.querySelector('#saveBtn').addEventListener('click', () => {
      const label = `${shortName(last.supplier.name)} · ${state.weeks}wk · ${state.shift}%${state.expedite ? ' · air' : ''}`;
      savedScenarios.push({ label, sup: state.supplierId, weeks: state.weeks, shift: state.shift, exp: state.expedite });
      renderSaved();
      ui.toast('Scenario saved', `"${label}" pinned above — available to all agents as decision memory`, 'good');
    });

    /* ---------- First paint ---------- */
    run();
    chartInst = SRS.charts.mount(chartCard._chartEl, chartOption);
  }

  SRS.registerPage('scenario', {
    title: 'Scenario Studio',
    crumb: 'What-if simulation · powered by the Scenario Simulation Agent',
    render
  });
})();
