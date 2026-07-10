/* ============================================================
   SRS · pages/suppliers.js
   Portfolio risk view across all 30 suppliers:
   filter bar (region / rating / category) → bubble chart
   (spend × risk × exposure, colored by region) → full table.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  // Fixed slot order — region i always maps to t.series[i], so a
  // filter never repaints the survivors.
  const REGIONS = ['APAC', 'EU', 'NA', 'LATAM'];
  const RATINGS = ['Critical', 'High', 'Medium', 'Low'];

  function render(host) {
    const D = SRS.data, ui = SRS.ui;
    const state = { region: 'All', rating: 'All', cat: 'all' };

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ---------------- Filter helpers ---------------- */
    function filtered() {
      return D.suppliers.filter(s =>
        (state.region === 'All' || s.region === state.region) &&
        (state.rating === 'All' || s.rating === state.rating) &&
        (state.cat === 'all' || s.cat === state.cat));
    }

    function subText(n) {
      const bits = [n + ' of ' + D.suppliers.length + ' shown'];
      if (state.region !== 'All') bits.push(state.region);
      if (state.rating !== 'All') bits.push(state.rating + ' risk');
      if (state.cat !== 'all') bits.push(D.catName(state.cat));
      if (bits.length === 1) bits.push('all regions, ratings & categories');
      return bits.join(' · ');
    }

    /* ---------------- Filter bar ---------------- */
    const bar = ui.el('<div class="col-12 chip-row"></div>');

    function chip(group, val, label, active) {
      const c = ui.el(`<button class="chip${active ? ' active' : ''}" data-group="${group}">${ui.esc(label)}</button>`);
      c.addEventListener('click', () => {
        state[group] = val;
        bar.querySelectorAll(`.chip[data-group="${group}"]`)
          .forEach(x => x.classList.toggle('active', x === c));
        refresh();
      });
      return c;
    }

    bar.appendChild(ui.el('<span class="muted" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Region</span>'));
    ['All'].concat(REGIONS).forEach(r => bar.appendChild(chip('region', r, r, r === 'All')));
    bar.appendChild(ui.el('<span style="width:1px;height:20px;background:var(--border-strong);margin:0 4px"></span>'));
    bar.appendChild(ui.el('<span class="muted" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Rating</span>'));
    bar.appendChild(chip('rating', 'All', 'All ratings', true));
    RATINGS.forEach(r => bar.appendChild(chip('rating', r, r, false)));

    const selWrap = ui.el(`<div class="sim-field" style="width:220px;margin-left:auto">
      <select aria-label="Material category">
        <option value="all">All categories</option>
        ${D.categories.map(c => `<option value="${c.key}">${ui.esc(c.name)}</option>`).join('')}
      </select></div>`);
    selWrap.querySelector('select').addEventListener('change', e => {
      state.cat = e.target.value;
      refresh();
    });
    bar.appendChild(selWrap);
    grid.appendChild(bar);

    /* ---------------- Bubble chart ---------------- */
    const bubbleCard = ui.card({
      title: 'Supplier portfolio — spend vs risk vs exposure',
      sub: 'x: annual spend · y: risk score · bubble: REV $M · color: region',
      cols: 12, chartClass: 'chart-xl'
    });
    grid.appendChild(bubbleCard);

    function bubbleOption() {
      const t = SRS.theme.tokens();
      const rows = filtered();
      const series = REGIONS.map((rg, i) => {
        const cfg = {
          name: rg, type: 'scatter',
          data: rows.filter(s => s.region === rg).map(s => ({
            value: [s.spend, s.score, s.rev, s.name, s.id],
            label: (s.score >= 3.5 || s.rev >= 8) ? {
              show: true, position: 'top', color: t.ink2, fontSize: 10,
              formatter: p => p.value[3].split(' ').slice(0, 2).join(' ')
            } : { show: false }
          })),
          symbolSize: d => Math.max(10, 10 + Math.sqrt(d[2]) * 11),
          itemStyle: { color: t.series[i], opacity: 0.85, borderColor: t.surface, borderWidth: 2 }
        };
        if (i === 0) {
          cfg.markLine = {
            silent: true, symbol: 'none',
            lineStyle: { color: t.status.serious, type: 'dashed', width: 1.5 },
            label: { formatter: 'High-risk threshold', color: t.status.serious, fontSize: 10, position: 'insideEndTop' },
            data: [{ yAxis: 3.0 }]
          };
        }
        return cfg;
      });

      return Object.assign(SRS.theme.baseOption(), {
        legend: Object.assign(SRS.theme.baseOption().legend, { top: 0, data: REGIONS }),
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            const s = p.value && D.supplierById(p.value[4]);
            if (!s) return '';
            return `<strong>${ui.esc(s.name)}</strong><br/>` +
              `${s.region} · ${ui.esc(s.catName)}<br/>` +
              `Spend ${SRS.fmt.usdM(s.spend)} · Risk ${SRS.fmt.score(s.score)}<br/>` +
              `REV ${SRS.fmt.usdM(s.rev)} · OTIF ${SRS.fmt.pct(s.otif)}`;
          }
        }),
        grid: { left: 8, right: 20, top: 34, bottom: 8, containLabel: true },
        xAxis: SRS.theme.valAxis({
          name: 'Annual spend ($M)', nameLocation: 'middle', nameGap: 28,
          nameTextStyle: { color: t.ink3, fontSize: 11 }
        }),
        yAxis: SRS.theme.valAxis({
          min: 0, max: 5, name: 'Risk score',
          nameTextStyle: { color: t.ink3, fontSize: 11 }
        }),
        series
      });
    }

    const bubbleChart = SRS.charts.mount(bubbleCard._chartEl, bubbleOption);
    bubbleChart.on('click', p => {
      if (p.value && p.value[4]) ui.openSupplier(p.value[4]);
    });

    /* ---------------- Supplier table ---------------- */
    const exportBtn = ui.el('<button class="btn btn-sm">Export CSV</button>');
    exportBtn.addEventListener('click', () => {
      ui.toast('Export queued', filtered().length + ' supplier rows will be delivered to your inbox as CSV.', 'good');
    });

    const tableCard = ui.card({
      title: 'All suppliers', sub: subText(D.suppliers.length),
      cols: 12, flush: true, actions: [exportBtn]
    });
    grid.appendChild(tableCard);
    const tblBody = tableCard.querySelector('.card-body');

    const cols = [
      { h: 'Supplier', cell: s => `<span class="cell-main">${ui.esc(s.name)}</span><span class="cell-sub">${ui.esc(s.city)}, ${ui.esc(s.country)}</span>` },
      { h: 'Category', cell: s => ui.esc(s.catName) },
      { h: 'Region', cell: s => s.region },
      { h: 'Tier', cell: s => 'Tier ' + s.tier },
      { h: 'Spend', cls: 'num', cell: s => SRS.fmt.usdM(s.spend) },
      { h: 'REV', cls: 'num', cell: s => s.rev > 0 ? SRS.fmt.usdM(s.rev) : '—' },
      { h: 'OTIF', cls: 'num', cell: s => SRS.fmt.pct(s.otif) },
      { h: 'Lead', cls: 'num', cell: s => SRS.fmt.days(s.lead) },
      { h: 'Defects', cls: 'num', cell: s => SRS.fmt.num(s.ppm) + ' ppm' },
      { h: 'Score', cell: s => ui.meter(s.score) },
      { h: 'Rating', cell: s => ui.badge(s.rating) }
    ];

    function renderTable() {
      const rows = filtered().slice().sort((a, b) => b.score - a.score);
      tblBody.innerHTML = '';
      if (rows.length) {
        tblBody.appendChild(ui.table(cols, rows, r => ui.openSupplier(r.id)));
      } else {
        tblBody.appendChild(ui.el('<div class="empty">No suppliers match the current filters.</div>'));
      }
      tableCard.querySelector('.card-sub').textContent = subText(rows.length);
    }

    /* ---------------- Refresh on filter change ---------------- */
    function refresh() {
      bubbleChart.setOption(bubbleOption(), true);
      renderTable();
    }

    renderTable();
  }

  SRS.registerPage('suppliers', {
    title: 'Suppliers',
    crumb: '30 suppliers · portfolio risk view',
    render
  });
})();
