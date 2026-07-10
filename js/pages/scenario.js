/* ============================================================
   SRS · pages/scenario.js
   Scenario Studio — what-if simulator powered by the Scenario
   Simulation Agent. Controls (supplier outage, duration, volume
   shift, expedite) → live-recomputed impact facts, narrative
   and inventory-runway area chart.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {

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

    const series = simMats.map(m => {
      const burn0 = 100 / m.stockDays; // % of cover consumed per day
      let cover = 100, stockout = null;
      const data = [[0, 100]];
      for (let d = 1; d <= days; d++) {
        const burn = d >= rampDays ? burn0 * (1 - st.shift / 100) : burn0;
        cover = Math.max(0, cover - burn);
        if (cover === 0 && stockout == null) stockout = d;
        data.push([d, +cover.toFixed(1)]);
      }
      return { id: m.id, name: shortName(m.name), single: m.singleSource, stockout, data };
    });

    const outs = series.filter(x => x.stockout != null);
    const firstStockout = outs.length ? Math.min.apply(null, outs.map(x => x.stockout)) : null;
    const firstOutMat = outs.length ? outs.reduce((a, b) => a.stockout <= b.stockout ? a : b) : null;

    const prodRevenue = prods.reduce((a, p) => a + p.revenue, 0);
    const rawRisk = prodRevenue * (days / 365) * 0.55; // severity factor
    const revenueAtRisk = rawRisk * (1 - (st.shift / 100) * 0.8); // shift mitigation
    const mitigationCost = s.spend * (st.weeks / 52) * (st.shift / 100) * 0.09 + (st.expedite ? 0.35 : 0);
    const residual = Math.max(0.3, s.rev * (1 - (st.shift / 100) * 0.85));
    const cutPct = s.rev > 0 ? Math.max(0, Math.round((1 - residual / s.rev) * 100)) : 0;
    const singles = simMats.filter(m => m.singleSource).length;

    return {
      supplier: s, mats, prods, days, rampDays, series,
      firstStockout, firstOutMat, rawRisk, revenueAtRisk,
      mitigationCost, residual, cutPct, singles
    };
  }

  function narrative(r, st) {
    const esc = SRS.ui.esc, f = SRS.fmt;
    const outTxt = r.firstStockout != null
      ? `first stockout projected at <strong>day ${r.firstStockout}</strong> (${esc(r.firstOutMat.name)}${r.firstOutMat.single ? ' — single-sourced' : ''})`
      : `no stockout within the <strong>${r.days}-day</strong> horizon`;
    let html = `A <strong>${st.weeks}-week</strong> outage at <strong>${esc(r.supplier.name)}</strong> touches ` +
      `<strong>${r.mats.length}</strong> material${r.mats.length === 1 ? '' : 's'} and <strong>${r.prods.length}</strong> SKUs — ` +
      `unmitigated exposure runs <strong>${f.usdM(r.rawRisk)}</strong>, ${outTxt}` +
      `${r.singles ? ` · ${r.singles} of the simulated materials ${r.singles === 1 ? 'is' : 'are'} single-sourced` : ''}. ` +
      `Shifting <strong>${st.shift}%</strong> of volume to alternates${st.expedite ? ' with air-freight expedite' : ''} ` +
      `(ramp ${r.rampDays} days) cuts revenue at risk to <strong>${f.usdM(r.revenueAtRisk)}</strong> for ` +
      `<strong>${f.usdM(r.mitigationCost)}</strong> of mitigation cost, leaving <strong>${f.usdM(r.residual)}</strong> ` +
      `residual exposure (−${r.cutPct}% vs unmitigated). ` +
      `<strong>Recommendation:</strong> shift ${st.shift}% to alternates and pre-position safety stock ahead of day ${r.rampDays} — ` +
      `approval required from Category Head.`;
    if (st.supplierId === 'S01') {
      html += ` <em>Decision memory — Nov 25 precedent: the same shift to Baltic Packaging cut stockout risk 60% at +8% freight.</em>`;
    }
    return html;
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
      <div class="chip-row" id="presetRow"></div>
      <div class="sim-field">
        <label for="simSup">Supplier outage</label>
        <select id="simSup">${sortedSups.map(s =>
          `<option value="${s.id}">${ui.esc(s.name)} — ${s.rating}</option>`).join('')}</select>
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
          Expedite via air freight (halves alternate ramp-up)
        </label>
      </div>
      <div class="flex gap8">
        <button class="btn btn-primary" id="runBtn">Run simulation</button>
        <button class="btn" id="saveBtn">Save scenario</button>
      </div>
      <div class="sim-out-note" id="simNarrative"></div>
    </div>`);

    const controlsCard = ui.card({
      title: 'Scenario parameters',
      sub: 'ask "what if" — the agent recomputes live',
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
      sub: 'recomputed by the Scenario Simulation Agent on every run',
      actions: [supBtn]
    });
    const factsEl = ui.el('<div class="facts" style="grid-template-columns:repeat(3,1fr)"></div>');
    impactCard.querySelector('.card-body').appendChild(factsEl);
    col.appendChild(impactCard);

    const chartCard = ui.card({
      title: 'Inventory runway under disruption',
      sub: 'projected stock cover % by material — mitigation ramp included',
      chartClass: 'chart-lg'
    });
    col.appendChild(chartCard);

    /* ---------- Facts ---------- */
    function fact(label, value) {
      return `<div class="fact"><div class="f-label">${label}</div><div class="f-value">${value}</div></div>`;
    }
    function renderFacts() {
      const r = last, f = SRS.fmt;
      const stockoutVal = r.firstStockout != null
        ? `in ${r.firstStockout} <small>days</small>`
        : `&gt;${r.days} <small>days</small>`;
      factsEl.innerHTML =
        fact('Materials affected', `${r.mats.length}${r.singles ? ` <small>${r.singles} single-source</small>` : ''}`) +
        fact('SKUs affected', `${r.prods.length}`) +
        fact('Revenue at risk', `${f.usdM(r.revenueAtRisk)} <small>over ${r.days}d</small>`) +
        fact('First stockout', stockoutVal) +
        fact('Mitigation cost', f.usdM(r.mitigationCost)) +
        fact('Residual exposure', `${f.usdM(r.residual)} <small>−${r.cutPct}% vs unmitigated</small>`);
    }

    /* ---------- Chart factory (reads latest `last`) ---------- */
    function chartOption() {
      const t = SRS.theme.tokens();
      const r = last;
      const base = SRS.theme.baseOption();
      return Object.assign(base, {
        legend: r.series.length >= 2
          ? Object.assign(base.legend, { top: 0, data: r.series.map(x => x.name) })
          : { show: false },
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
        grid: { left: 8, right: 18, top: 40, bottom: 4, containLabel: true },
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
            lineStyle: { color: t.status.serious, width: 1.5, type: 'dashed' },
            label: { formatter: 'safety floor', color: t.status.serious, fontSize: 11, position: 'insideEndTop' },
            data: [{ yAxis: 20 }]
          }
        } : {}))
      });
    }

    /* ---------- Run ---------- */
    const narrEl = panel.querySelector('#simNarrative');
    function run(notify) {
      last = sim(state);
      renderFacts();
      narrEl.innerHTML = narrative(last, state);
      if (chartInst) chartInst.setOption(chartOption(), true);
      if (notify) {
        ui.toast('Scenario complete',
          'Simulated in 1.8s across ' + last.mats.length + ' materials · ' + last.prods.length + ' SKUs', '');
      }
    }

    /* ---------- Wire controls ---------- */
    const supSel = panel.querySelector('#simSup');
    const weeksIn = panel.querySelector('#simWeeks');
    const shiftIn = panel.querySelector('#simShift');
    const expIn = panel.querySelector('#simExp');
    const weeksVal = panel.querySelector('#weeksVal');
    const shiftVal = panel.querySelector('#shiftVal');
    const presetRow = panel.querySelector('#presetRow');

    supSel.value = state.supplierId;

    function clearPresetActive() {
      presetRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    }
    presets.forEach(p => {
      const c = ui.el(`<button class="chip">${ui.esc(p.label)}</button>`);
      c.addEventListener('click', () => {
        state.supplierId = p.sup; state.weeks = p.weeks; state.shift = p.shift; state.expedite = p.exp;
        supSel.value = p.sup;
        weeksIn.value = p.weeks; weeksVal.textContent = p.weeks + ' wks';
        shiftIn.value = p.shift; shiftVal.textContent = p.shift + ' %';
        expIn.checked = p.exp;
        clearPresetActive();
        c.classList.add('active');
        run(true);
      });
      presetRow.appendChild(c);
    });

    supSel.addEventListener('change', () => { state.supplierId = supSel.value; clearPresetActive(); });
    weeksIn.addEventListener('input', () => {
      state.weeks = +weeksIn.value;
      weeksVal.textContent = state.weeks + ' wks';
      clearPresetActive();
    });
    shiftIn.addEventListener('input', () => {
      state.shift = +shiftIn.value;
      shiftVal.textContent = state.shift + ' %';
      clearPresetActive();
    });
    expIn.addEventListener('change', () => { state.expedite = expIn.checked; clearPresetActive(); });

    panel.querySelector('#runBtn').addEventListener('click', () => run(true));
    panel.querySelector('#saveBtn').addEventListener('click', () =>
      ui.toast('Scenario saved', 'Available to all agents as decision memory', 'good'));

    /* ---------- First paint ---------- */
    run(false);
    chartInst = SRS.charts.mount(chartCard._chartEl, chartOption);
  }

  SRS.registerPage('scenario', {
    title: 'Scenario Studio',
    crumb: 'What-if simulation · powered by the Scenario Simulation Agent',
    render
  });
})();
