/* ============================================================
   SRS · pages/products.js
   Products / SKUs — where supply risk meets the P&L:
   revenue vs margin combo (the one sanctioned dual-axis chart),
   FY25 → FY26 revenue bridge, product-line mix donut, and the
   full 20-SKU risk & exposure table.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  // Fixed slot order — line i always maps to t.series[i].
  const LINES = ['Kitchen Appliances', 'Power Tools', 'Outdoor & Garden', 'Climate Systems'];

  function render(host) {
    const D = SRS.data, ui = SRS.ui;

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ---------------- 1 · Revenue vs margin combo (dual-axis exception) ---------------- */
    const top12 = D.products.slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    const comboCard = ui.card({
      title: 'Revenue vs margin — top SKUs',
      sub: 'FY26 revenue ($M columns, left) · gross margin (% line, right)',
      cols: 12, chartClass: 'chart-lg'
    });
    grid.appendChild(comboCard);

    const comboChart = SRS.charts.mount(comboCard._chartEl, () => {
      const t = SRS.theme.tokens();
      return Object.assign(SRS.theme.baseOption(), {
        legend: Object.assign(SRS.theme.baseOption().legend, {
          top: 0, data: ['Revenue', 'Margin %']
        }),
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: params => {
            const p = top12[params[0].dataIndex];
            if (!p) return '';
            const bar = params.find(x => x.seriesName === 'Revenue');
            const line = params.find(x => x.seriesName === 'Margin %');
            return `<strong>${ui.esc(p.name)}</strong><br/>` +
              `<span style="opacity:.65">${ui.esc(p.line)} · ${p.id}</span><br/>` +
              (bar ? `${bar.marker} Revenue <strong>${SRS.fmt.usdM(bar.value)}</strong><br/>` : '') +
              (line ? `${line.marker} Margin <strong>${SRS.fmt.pct(line.value)}</strong>` : '');
          }
        }),
        grid: { left: 8, right: 14, top: 34, bottom: 4, containLabel: true },
        xAxis: SRS.theme.catAxis(top12.map(p => p.name), {
          axisLabel: { color: t.ink3, fontSize: 11, rotate: 28, interval: 0, hideOverlap: true, width: 130, overflow: 'truncate' }
        }),
        yAxis: [
          SRS.theme.valAxis({
            name: 'Revenue $M',
            nameTextStyle: { color: t.ink3, fontSize: 11, align: 'left' }
          }),
          SRS.theme.valAxis({
            name: 'Margin %', min: 0, max: 45,
            nameTextStyle: { color: t.ink3, fontSize: 11, align: 'right' },
            splitLine: { show: false },
            axisLabel: { color: t.ink3, fontSize: 12, formatter: v => v + '%' }
          })
        ],
        series: [
          {
            name: 'Revenue', type: 'bar', yAxisIndex: 0,
            data: top12.map(p => p.revenue),
            barMaxWidth: 24,
            itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] }
          },
          {
            name: 'Margin %', type: 'line', yAxisIndex: 1, z: 4,
            data: top12.map(p => p.margin),
            symbol: 'circle', symbolSize: 8,
            lineStyle: { width: 2, color: t.series[7] },
            itemStyle: { color: t.series[7], borderColor: t.surface, borderWidth: 2 }
          }
        ]
      });
    });
    comboChart.on('click', p => {
      const prod = top12[p.dataIndex];
      if (prod) ui.openProduct(prod.id);
    });

    /* ---------------- 2 · Revenue bridge waterfall ---------------- */
    const bridgeCard = ui.card({
      title: 'Revenue bridge',
      sub: 'FY25 → FY26 plan ($M)',
      cols: 7, chartClass: 'chart-md'
    });
    grid.appendChild(bridgeCard);
    SRS.charts.waterfall(bridgeCard._chartEl, D.revenueBridge.steps);

    /* ---------------- 3 · Revenue mix by product line (donut) ---------------- */
    const mixByLine = LINES.map(ln =>
      D.products.filter(p => p.line === ln).reduce((a, p) => a + p.revenue, 0));
    const mixTotal = mixByLine.reduce((a, b) => a + b, 0);

    const mixCard = ui.card({
      title: 'Revenue mix by product line',
      sub: 'FY26 plan',
      cols: 5, chartClass: 'chart-md'
    });
    grid.appendChild(mixCard);

    SRS.charts.mount(mixCard._chartEl, () => {
      const t = SRS.theme.tokens();
      return Object.assign(SRS.theme.baseOption(), {
        title: {
          text: '$2.43B', subtext: 'FY26 plan',
          left: 'center', top: '36%',
          textStyle: { fontSize: 25, fontWeight: 700, color: t.ink },
          subtextStyle: { fontSize: 12, color: t.ink3 }
        },
        legend: Object.assign(SRS.theme.baseOption().legend, {
          bottom: 0, left: 'center', data: LINES
        }),
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => `<strong>${p.name}</strong><br/>` +
            `${SRS.fmt.usdM(p.value)} · ${SRS.fmt.pct((p.value / mixTotal) * 100)} of plan`
        }),
        series: [{
          type: 'pie',
          radius: ['58%', '80%'], center: ['50%', '46%'],
          label: { show: false }, labelLine: { show: false },
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          emphasis: { scaleSize: 4 },
          data: LINES.map((ln, i) => ({
            name: ln, value: mixByLine[i],
            itemStyle: { color: t.series[i] }
          }))
        }]
      });
    });

    /* ---------------- 4 · Section divider ---------------- */
    grid.appendChild(ui.el('<div class="section-title col-12">SKU exposure detail</div>'));

    /* ---------------- 5 · SKU risk & exposure table ---------------- */
    const rows = D.products.slice().sort((a, b) =>
      (b.revenue - a.revenue) || (b.score - a.score));

    const atRiskCount = p =>
      p.materials.map(id => D.materialById(id)).filter(m => m && m.score >= 3).length;

    const exportBtn = ui.el('<button class="btn btn-sm">Export CSV</button>');
    exportBtn.addEventListener('click', () => {
      ui.toast('Export queued', rows.length + ' SKU rows with revenue, margin and exposure will be delivered to your inbox as CSV.', 'good');
    });

    const tableCard = ui.card({
      title: 'SKU risk & exposure',
      sub: rows.length + ' SKUs · sorted by FY26 revenue',
      cols: 12, flush: true, actions: [exportBtn]
    });
    grid.appendChild(tableCard);

    tableCard.querySelector('.card-body').appendChild(ui.table([
      { h: 'SKU', cell: p => `<span class="cell-main">${ui.esc(p.name)}</span><span class="cell-sub">${p.id}</span>` },
      { h: 'Line', cell: p => ui.esc(p.line) },
      { h: 'Plants', cls: 'num', cell: p => p.plants.length },
      { h: 'Revenue', cls: 'num', cell: p => SRS.fmt.usdM(p.revenue) },
      { h: 'Margin', cls: 'num', cell: p => SRS.fmt.pct(p.margin) },
      {
        h: 'Growth', cls: 'num',
        cell: p => `<span class="risk-score ${p.growth >= 0 ? 'low' : 'critical'}">${SRS.fmt.signed(p.growth, '%')}</span>`
      },
      { h: 'Materials at risk', cls: 'num', cell: p => atRiskCount(p) },
      { h: 'REV exposure', cls: 'num', cell: p => p.rev > 0 ? SRS.fmt.usdM(p.rev) : '—' },
      { h: 'Rating', cell: p => ui.badge(p.rating) }
    ], rows, r => ui.openProduct(r.id)));
  }

  SRS.registerPage('products', {
    title: 'Products / SKUs',
    crumb: '20 SKUs · 4 product lines · FY26 plan $2.43B',
    render
  });
})();
