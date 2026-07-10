/* ============================================================
   SRS · pages/materials.js
   Component & sourcing risk across the 26 tracked materials:
   exposure treemap (category → material) · spend mekko
   (region × category) · single-source table · days-of-cover bars.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  function render(host) {
    const D = SRS.data, ui = SRS.ui;

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ============================================================
       1 · Treemap — exposure by category & material
       ============================================================ */
    const treeCard = ui.card({
      title: 'Exposure by category & material',
      sub: 'REV contribution ($M), materials with open exposure',
      cols: 7, chartClass: 'chart-lg'
    });
    grid.appendChild(treeCard);

    const treeChart = SRS.charts.mount(treeCard._chartEl, () => {
      const t = SRS.theme.tokens();
      // Fixed color slots: category i in SRS.data.categories order → t.series[i]
      const data = D.categories.map((c, ci) => {
        const kids = D.materials
          .filter(m => m.rev > 0 && m.cat === c.key)
          .map(m => ({ name: m.name, value: m.rev, id: m.id }));
        if (!kids.length) return null;
        return { name: c.name, itemStyle: { color: t.series[ci] }, children: kids };
      }).filter(Boolean);

      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            const d = p.data || {};
            if (d.id) {
              const m = D.materialById(d.id);
              return `<strong>${ui.esc(m.name)}</strong><br/>` +
                `${ui.esc(m.catName)} · ${ui.esc(m.subcat)}<br/>` +
                `REV ${SRS.fmt.usdM(m.rev)}`;
            }
            return `<strong>${ui.esc(d.name || '')}</strong><br/>REV ${SRS.fmt.usdM(p.value)}`;
          }
        }),
        series: [{
          type: 'treemap',
          left: 0, right: 0, top: 4, bottom: 4,
          roam: false, nodeClick: false,
          breadcrumb: { show: false },
          upperLabel: { show: true, height: 22, color: '#fff', fontSize: 11.5, fontWeight: 600 },
          label: {
            show: true, fontSize: 11, color: '#fff', lineHeight: 15,
            formatter: p => `${p.name}\n${SRS.fmt.usdM(p.value)}`
          },
          itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 },
          levels: [
            { itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 4 } },
            {
              upperLabel: { show: true, height: 22, color: '#fff', fontSize: 11.5, fontWeight: 600 },
              itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 }
            },
            { colorAlpha: [0.75, 1], itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 } }
          ],
          data
        }]
      });
    });
    treeChart.on('click', p => {
      if (p.data && p.data.id) ui.openMaterial(p.data.id);
    });

    /* ============================================================
       2 · Mekko — sourcing spend mix (region × category)
       ============================================================ */
    const mekkoCard = ui.card({
      title: 'Sourcing spend mix — region × category',
      sub: 'column width = region share of spend',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(mekkoCard);
    SRS.charts.mekko(mekkoCard._chartEl, D.mekko);

    /* ============================================================
       3 · Section divider
       ============================================================ */
    grid.appendChild(ui.el('<div class="section-title col-12">Sourcing vulnerabilities</div>'));

    /* ============================================================
       4 · Single-source materials table
       ============================================================ */
    const singles = D.materials
      .filter(m => m.singleSource)
      .slice()
      .sort((a, b) => b.score - a.score);

    const planBtn = ui.el('<button class="btn btn-sm">Dual-source plan</button>');
    planBtn.addEventListener('click', () => {
      const worst = singles.filter(m => m.score >= 2.5).length;
      ui.toast('Dual-sourcing review queued',
        `Mitigation Recommendation Agent will draft second-source options for the ${worst} highest-risk single-source materials.`,
        'good');
    });

    const ssCard = ui.card({
      title: 'Single-source materials',
      sub: 'one qualified supplier — concentration risk',
      cols: 6, flush: true, actions: [planBtn]
    });
    grid.appendChild(ssCard);

    function coverClass(days) {
      if (days <= 12) return 'critical';
      if (days <= 18) return 'high';
      if (days <= 24) return 'medium';
      return 'low';
    }

    ssCard.querySelector('.card-body').appendChild(ui.table([
      {
        h: 'Material',
        cell: m => `<span class="cell-main">${ui.esc(m.name)}</span><span class="cell-sub">${ui.esc(m.subcat)}</span>`
      },
      {
        h: 'Supplier',
        cell: m => {
          const s = D.supplierById(m.suppliers[0]);
          return s ? ui.esc(s.name) : '—';
        }
      },
      {
        h: 'Cover', cls: 'num',
        cell: m => `<span class="risk-score ${coverClass(m.stockDays)}">${SRS.fmt.days(m.stockDays)}</span>`
      },
      { h: 'Lead', cls: 'num', cell: m => SRS.fmt.days(m.leadDays) },
      { h: 'REV', cls: 'num', cell: m => m.rev > 0 ? SRS.fmt.usdM(m.rev) : '—' },
      { h: 'Score', cell: m => ui.meter(m.score) }
    ], singles, m => ui.openMaterial(m.id)));

    /* ============================================================
       5 · Days of cover — tightest materials
       ============================================================ */
    const coverCard = ui.card({
      title: 'Days of cover — tightest materials',
      sub: 'projected days before production impact',
      cols: 6, chartClass: 'chart-lg'
    });
    grid.appendChild(coverCard);

    const tightest = D.materials
      .slice()
      .sort((a, b) => a.stockDays - b.stockDays)
      .slice(0, 10);

    const coverChart = SRS.charts.mount(coverCard._chartEl, () => {
      const t = SRS.theme.tokens();
      const colorFor = d =>
        d <= 12 ? t.status.critical :
        d <= 18 ? t.status.serious :
        d <= 24 ? t.status.warning : t.status.good;

      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            const m = D.materialById(p.data.id);
            if (!m) return '';
            const sups = m.suppliers
              .map(sid => (D.supplierById(sid) || {}).name)
              .filter(Boolean).join(', ');
            return `<strong>${ui.esc(m.name)}</strong><br/>` +
              `Cover ${SRS.fmt.days(m.stockDays)} · Lead ${SRS.fmt.days(m.leadDays)}<br/>` +
              `${m.singleSource ? 'Single source' : 'Dual+ sourced'} · ${ui.esc(sups)}`;
          }
        }),
        grid: { left: 8, right: 48, top: 10, bottom: 4, containLabel: true },
        xAxis: SRS.theme.valAxis({
          name: 'days of cover', nameLocation: 'middle', nameGap: 26,
          nameTextStyle: { color: t.ink3, fontSize: 11 }
        }),
        yAxis: SRS.theme.catAxis(tightest.map(m => m.name), {
          inverse: true,
          axisLabel: { color: t.ink2, fontSize: 12, width: 168, overflow: 'truncate' }
        }),
        series: [{
          type: 'bar',
          barMaxWidth: 18,
          data: tightest.map(m => ({
            value: m.stockDays, id: m.id,
            itemStyle: { color: colorFor(m.stockDays), borderRadius: [0, 4, 4, 0] }
          })),
          label: {
            show: true, position: 'right', fontSize: 11.5, color: t.ink2,
            formatter: p => SRS.fmt.days(p.value)
          },
          markLine: {
            silent: true, symbol: 'none',
            lineStyle: { color: t.ink3, type: 'dashed', width: 1.5 },
            label: { formatter: 'action threshold', color: t.ink3, fontSize: 11, position: 'insideEndTop' },
            data: [{ xAxis: 14 }]
          }
        }]
      });
    });
    coverChart.on('click', p => {
      if (p.data && p.data.id) ui.openMaterial(p.data.id);
    });
  }

  SRS.registerPage('materials', {
    title: 'Materials',
    crumb: '26 materials · component & sourcing risk',
    render
  });
})();
