/* ============================================================
   SRS · pages/events.js
   Event Intelligence: external risk sensing across 14 tracked
   events — plant disruption heatmap, signal-flow sankey, and
   the filterable event register.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  const OPEN_STATUSES = ['Active', 'Tracked', 'Mitigation in Progress'];
  const OUTCOME_NODES = ['Mitigation launched', 'Monitoring', 'Escalated to exec', 'No action needed'];

  function outcomeColor(name, t) {
    return {
      'Mitigation launched': t.status.good,
      'Monitoring': t.series[2],
      'Escalated to exec': t.status.critical,
      'No action needed': t.axis
    }[name] || null;
  }

  /** Distinct finished-goods SKUs threatened by an event (via its materials). */
  function skuCount(e) {
    const set = new Set();
    (e.materials || []).forEach(mid =>
      SRS.data.productsUsing(mid).forEach(p => set.add(p.id)));
    return set.size;
  }

  /** Open events first (by exposure desc), then resolved/closed by recency. */
  function sortEvents(list) {
    const open = list.filter(e => OPEN_STATUSES.includes(e.status))
      .sort((a, b) => b.rev - a.rev);
    const done = list.filter(e => !OPEN_STATUSES.includes(e.status))
      .sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
    return open.concat(done);
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function render(host) {
    const D = SRS.data, ui = SRS.ui;
    const state = { status: 'All' };

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    grid.appendChild(ui.el('<div class="section-title col-12">Signal intelligence</div>'));

    /* ================= 1 · Disruption pressure heatmap ================= */
    const heatCard = ui.card({
      title: 'Disruption pressure — plant × month',
      sub: 'composite disruption index (0–10) from events matched to each plant',
      cols: 7, chartClass: 'chart-lg'
    });
    grid.appendChild(heatCard);

    const heatChart = SRS.charts.mount(heatCard._chartEl, () => {
      const t = SRS.theme.tokens();
      const months = D.monthly.months;
      const plants = D.monthly.plantHeat.plants;
      const data = [];
      D.monthly.plantHeat.values.forEach((row, yi) =>
        row.forEach((v, xi) => data.push([xi, yi, v])));

      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            const v = p.value;
            return `<strong>${ui.esc(plants[v[1]])}</strong> · ${months[v[0]]}<br/>` +
              `Disruption index <strong>${v[2]}</strong> / 10`;
          }
        }),
        grid: { left: 8, right: 14, top: 10, bottom: 48, containLabel: true },
        xAxis: SRS.theme.catAxis(months, {
          splitArea: { show: false },
          axisLabel: { color: t.ink3, fontSize: 11, interval: 0 }
        }),
        yAxis: Object.assign(SRS.theme.catAxis(plants), {
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: t.ink2, fontSize: 12 }
        }),
        visualMap: {
          type: 'continuous', min: 0, max: 10, calculable: false,
          orient: 'horizontal', left: 'center', bottom: 0,
          itemWidth: 12,
          inRange: { color: t.seq },
          text: ['high', 'low'],
          textStyle: { color: t.ink3, fontSize: 11 }
        },
        series: [{
          type: 'heatmap',
          data,
          itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 3 },
          label: {
            show: true,
            formatter: p => p.value[2] >= 6 ? p.value[2] : '',
            color: t.isDark ? '#1e1b4b' : '#fff',
            fontSize: 11, fontWeight: 600
          },
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.25)' } }
        }]
      });
    });
    heatChart.on('click', p => {
      if (!p.value) return;
      const plant = D.plants[p.value[1]];
      ui.toast(
        plant.name + ' · ' + D.monthly.months[p.value[0]],
        `Disruption index <strong>${p.value[2]}/10</strong> · focus: ${ui.esc(plant.focus)} (${plant.region})`
      );
    });

    /* ================= 2 · Signal flow sankey ================= */
    const sankeyCard = ui.card({
      title: 'Signal flow — source → triage → outcome',
      sub: 'FY26 YTD risk signals (qualified)',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(sankeyCard);

    const sankeyChart = SRS.charts.mount(sankeyCard._chartEl, () => {
      const t = SRS.theme.tokens();
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            if (p.dataType === 'edge') {
              return `${ui.esc(p.data.source)} → ${ui.esc(p.data.target)}<br/>` +
                `<strong>${SRS.fmt.num(p.data.value)}</strong> signals`;
            }
            return `<strong>${ui.esc(p.name)}</strong><br/>${SRS.fmt.num(p.value)} signals`;
          }
        }),
        series: [{
          type: 'sankey',
          nodeAlign: 'justify', nodeGap: 10, nodeWidth: 14,
          left: 4, right: 8, top: 8, bottom: 8,
          emphasis: { focus: 'adjacency' },
          data: D.sankey.nodes.map((name, i) => ({
            name,
            itemStyle: {
              color: outcomeColor(name, t) || t.series[i % 8],
              borderWidth: 0
            },
            // outcome column: pull labels inside the canvas
            label: OUTCOME_NODES.includes(name) ? { position: 'left' } : {}
          })),
          links: D.sankey.links.map(l => ({ source: l[0], target: l[1], value: l[2] })),
          lineStyle: { color: 'gradient', opacity: 0.25, curveness: 0.5 },
          label: { color: t.ink2, fontSize: 11 }
        }]
      });
    });
    sankeyChart.on('click', p => {
      if (p.dataType === 'edge') {
        ui.toast('Signal path', `<strong>${ui.esc(p.data.source)} → ${ui.esc(p.data.target)}</strong>: ${SRS.fmt.num(p.data.value)} qualified signals FY26 YTD.`);
      } else {
        ui.toast(p.name, `${SRS.fmt.num(p.value)} qualified signals FY26 YTD through this node.`);
      }
    });

    /* ================= 3 · Status filter chips ================= */
    grid.appendChild(ui.el('<div class="section-title col-12">Event register</div>'));

    const bar = ui.el('<div class="col-12 chip-row"></div>');
    const CHIPS = [
      { key: 'All', label: 'All' },
      { key: 'Active', label: 'Active' },
      { key: 'Tracked', label: 'Tracked' },
      { key: 'Mitigation in Progress', label: 'Mitigation in Progress' },
      { key: 'ResolvedClosed', label: 'Resolved & Closed' }
    ];
    CHIPS.forEach(c => {
      const chip = ui.el(`<button class="chip${c.key === 'All' ? ' active' : ''}">${ui.esc(c.label)}</button>`);
      chip.addEventListener('click', () => {
        state.status = c.key;
        bar.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === chip));
        renderTable();
      });
      bar.appendChild(chip);
    });
    grid.appendChild(bar);

    /* ================= 4 · Risk events table ================= */
    function filtered() {
      if (state.status === 'All') return D.events;
      if (state.status === 'ResolvedClosed')
        return D.events.filter(e => e.status === 'Resolved' || e.status === 'Closed');
      return D.events.filter(e => e.status === state.status);
    }

    function subText(n) {
      const scope = state.status === 'All' ? 'all statuses'
        : state.status === 'ResolvedClosed' ? 'resolved & closed' : state.status.toLowerCase();
      return `${n} of ${D.events.length} shown · ${scope} · open events first by exposure`;
    }

    const briefBtn = ui.el('<button class="btn btn-sm">Generate brief</button>');
    briefBtn.addEventListener('click', () => {
      const rows = filtered();
      const rev = rows.reduce((a, e) => a + e.rev, 0);
      ui.toast('Event brief queued', `Summarizing ${rows.length} events (${SRS.fmt.usdM(rev)} REV) — the digest will land in your inbox.`, 'good');
    });

    const tableCard = ui.card({
      title: 'Risk events', sub: subText(D.events.length),
      cols: 12, flush: true, actions: [briefBtn]
    });
    grid.appendChild(tableCard);
    const tblBody = tableCard.querySelector('.card-body');

    const cols = [
      { h: 'Event', cell: e => `<span class="cell-main">${ui.esc(e.title)}</span><span class="cell-sub">${e.id} · ${ui.esc(e.source)}</span>` },
      { h: 'Type', cell: e => ui.esc(e.type) },
      { h: 'Criticality', cell: e => ui.badge(e.criticality) },
      { h: 'Status', cell: e => ui.statusBadge(e.status) },
      { h: 'Location', cell: e => ui.esc(e.location) },
      { h: 'Detected', cell: e => fmtDate(e.start) },
      { h: 'REV', cls: 'num', cell: e => SRS.fmt.usdM(e.rev) },
      { h: 'Suppliers', cls: 'num', cell: e => e.suppliers.length },
      { h: 'SKUs at risk', cls: 'num', cell: e => skuCount(e) || '—' }
    ];

    function renderTable() {
      const rows = sortEvents(filtered());
      tblBody.innerHTML = '';
      if (rows.length) {
        tblBody.appendChild(ui.table(cols, rows, r => ui.openEvent(r.id)));
      } else {
        tblBody.appendChild(ui.el('<div class="empty">No events match the current filter.</div>'));
      }
      tableCard.querySelector('.card-sub').textContent = subText(rows.length);
    }

    renderTable();
  }

  SRS.registerPage('events', {
    title: 'Event Intelligence',
    crumb: '14 events tracked · external risk sensing',
    render
  });
})();
