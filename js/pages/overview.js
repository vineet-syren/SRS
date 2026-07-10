/* ============================================================
   SRS · pages/overview.js
   Command Center — executive risk overview for NovaForge.
   KPI headline row · exposure bridge · category donut ·
   monthly exposure flow · mitigation stack · top suppliers ·
   live agent digest + generated executive brief.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  'use strict';

  const OPEN_STATUSES = ['Active', 'Tracked', 'Mitigation in Progress'];

  /* ---------- derived series ---------- */
  function mitigatedCumTotal() {
    const mit = SRS.data.monthly.mitigatedCum;
    const keys = Object.keys(mit);
    return SRS.data.monthly.months.map((_, i) =>
      +keys.reduce((a, k) => a + mit[k][i], 0).toFixed(1));
  }
  function mitigatedPerMonth(cum) {
    return cum.map((v, i) => +(i ? v - cum[i - 1] : v).toFixed(1));
  }

  /* ---------- executive brief (composed from live data) ---------- */
  function openExecBrief() {
    const D = SRS.data, F = SRS.fmt, esc = SRS.ui.esc;
    const top3 = D.events
      .filter(e => OPEN_STATUSES.includes(e.status))
      .slice().sort((a, b) => b.rev - a.rev).slice(0, 3);
    const pending = D.recommendations.filter(r => r.status === 'pending');
    const topReco = pending.slice().sort((a, b) => b.exposure - a.exposure)[0];
    const dateStr = new Date(D.asOf + 'T00:00:00')
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const h4 = 'font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:15px 0 6px';
    const html = `
      <div style="font-size:13.5px;line-height:1.62;color:var(--ink-2)">
        <p style="margin:0 0 4px">As of ${dateStr}, NovaForge Manufacturing carries
          <strong style="color:var(--ink)">$${D.kpis.totalRev.toFixed(1)}M of revenue exposure at risk (REV)</strong>
          across ${D.kpis.activeEvents} open events (${D.kpis.criticalEvents} critical) —
          up $${D.kpis.revDelta.toFixed(1)}M versus last month. The agentic layer has mitigated
          <strong>${F.usdM(D.kpis.mitigatedYtd)}</strong> of exposure YTD, preventing
          ${D.kpis.stockoutsPrevented} stockouts with a mean detection lead of ${D.kpis.detectionLeadDays} days.</p>
        <h4 style="${h4}">Largest open exposures</h4>
        <ul style="margin:0;padding-left:18px">
          ${top3.map(e => `<li style="margin:3px 0"><strong style="color:var(--ink)">${esc(e.title)}</strong>
            — ${F.usdM(e.rev)} · ${esc(e.status)}</li>`).join('')}
        </ul>
        <h4 style="${h4}">Decisions pending</h4>
        <p style="margin:0"><strong style="color:var(--ink)">${pending.length} agent recommendations</strong>
          await approval. The largest — &ldquo;${esc(topReco.title)}&rdquo; — protects
          ${F.usdM(topReco.exposure)} of exposure (${esc(topReco.riskCut)}, ${esc(topReco.cost)}).</p>
        <h4 style="${h4}">Mitigation programs in flight</h4>
        <ul style="margin:0;padding-left:18px">
          ${D.gantt.map(g => `<li style="margin:3px 0">${esc(g.name)} —
            <strong style="color:var(--ink)">${g.progress}%</strong> complete</li>`).join('')}
        </ul>
        <h4 style="${h4}">Recommended focus</h4>
        <p style="margin:0">Approve the film volume shift (${esc(topReco ? 'R-101' : '')}) before Mekong stock cover
          — now 9 days — is exhausted; fund the MCU air-freight bridge while alternate qualification (G2)
          matures; and pre-position a resin allocation plan ahead of a possible Gulf Coast landfall
          (46% probability). Revisit the Busan cell buffer decision at the 15 Jul compliance deadline.</p>
      </div>`;
    SRS.ui.modal('Executive risk brief — ' + dateStr, html);
  }

  /* ---------- render ---------- */
  function render(host) {
    const D = SRS.data, F = SRS.fmt, U = SRS.ui;
    const months = D.monthly.months;
    const mitKeys = Object.keys(D.monthly.mitigatedCum);
    const cumTotal = mitigatedCumTotal();
    const perMonth = mitigatedPerMonth(cumTotal);

    /* ===== 1 · KPI row ===== */
    const kpiRow = U.el('<div class="kpi-row" style="margin-bottom:16px"></div>');
    kpiRow.appendChild(U.kpi({
      label: 'Total risk exposure (REV)',
      value: F.usdM(D.kpis.totalRev),
      delta: { text: '+$' + D.kpis.revDelta.toFixed(1) + 'M', dir: 'bad' },
      spark: D.monthly.revTrend,
      sparkColor: () => SRS.theme.tokens().status.critical,
      onClick: () => SRS.navigate('events')
    }));
    kpiRow.appendChild(U.kpi({
      label: 'High-risk suppliers',
      value: D.kpis.highRiskSuppliers,
      delta: { text: '+' + D.kpis.highRiskDelta, dir: 'bad' },
      onClick: () => SRS.navigate('suppliers')
    }));
    kpiRow.appendChild(U.kpi({
      label: 'Single-source materials at risk',
      value: D.kpis.singleSource,
      sub: 'of ' + D.kpis.singleSourceTotal + ' single-source',
      onClick: () => SRS.navigate('materials')
    }));
    kpiRow.appendChild(U.kpi({
      label: 'Open risk events',
      value: D.kpis.activeEvents,
      sub: D.kpis.criticalEvents + ' critical',
      onClick: () => SRS.navigate('events')
    }));
    kpiRow.appendChild(U.kpi({
      label: 'Exposure mitigated YTD',
      value: F.usdM(D.kpis.mitigatedYtd),
      delta: { text: '+$4.6M', dir: 'good' },
      spark: cumTotal,
      sparkColor: () => SRS.theme.tokens().status.good,
      onClick: () => SRS.navigate('agents')
    }));
    host.appendChild(kpiRow);

    const grid = U.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* ===== 2 · Exposure bridge (waterfall) ===== */
    const wfCard = U.card({
      title: 'Risk exposure bridge', sub: 'FY25 exit → today ($M)',
      cols: 7, chartClass: 'chart-md'
    });
    grid.appendChild(wfCard);
    SRS.charts.waterfall(wfCard._chartEl, D.revBridge.steps);

    /* ===== 2 · Exposure by material category (donut) ===== */
    const donutCard = U.card({
      title: 'Exposure by material category', sub: 'open REV attributed to affected materials',
      cols: 5, chartClass: 'chart-md'
    });
    grid.appendChild(donutCard);
    const donutChart = SRS.charts.mount(donutCard._chartEl, () => {
      const t = SRS.theme.tokens();
      const data = [];
      D.categories.forEach((c, i) => {
        const v = D.materials
          .filter(m => m.cat === c.key && m.rev > 0)
          .reduce((a, m) => a + m.rev, 0);
        if (v <= 0) return; // skip zero-value cats — slot color i stays reserved
        data.push({
          name: c.name, value: +v.toFixed(1),
          itemStyle: { color: t.series[i], borderColor: t.surface, borderWidth: 2 }
        });
      });
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => `<strong>${p.name}</strong><br/>${F.usdM(p.value)} · ${p.percent.toFixed(1)}% of attributed REV`
        }),
        legend: Object.assign(SRS.theme.baseOption().legend, { bottom: 0, left: 'center', itemGap: 12 }),
        title: {
          text: '$' + D.kpis.totalRev.toFixed(1) + 'M', subtext: 'total REV',
          left: 'center', top: '40%',
          textStyle: { color: t.ink, fontSize: 22, fontWeight: 700 },
          subtextStyle: { color: t.ink3, fontSize: 12 }
        },
        series: [{
          type: 'pie', radius: ['58%', '80%'], center: ['50%', '46%'],
          avoidLabelOverlap: true,
          label: { show: false }, labelLine: { show: false },
          data
        }]
      });
    });
    if (donutChart) donutChart.on('click', () => SRS.navigate('materials'));

    /* ===== 3 · Exposure flow by month (column + line, one axis) ===== */
    const flowCard = U.card({
      title: 'Exposure flow by month', sub: 'Mitigated per month vs open REV ($M — one axis)',
      cols: 7, chartClass: 'chart-md'
    });
    grid.appendChild(flowCard);
    SRS.charts.mount(flowCard._chartEl, () => {
      const t = SRS.theme.tokens();
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: ps => {
            let h = `<strong>${ps[0].axisValue}</strong>`;
            ps.forEach(p => { h += `<br/>${p.marker} ${p.seriesName}: <strong>${F.usdM(p.value)}</strong>`; });
            return h;
          }
        }),
        xAxis: SRS.theme.catAxis(months),
        yAxis: SRS.theme.valAxis({ axisLabel: { formatter: v => '$' + v + 'M' } }),
        series: [
          {
            name: 'Mitigated in month', type: 'bar', data: perMonth,
            barMaxWidth: 24,
            itemStyle: { color: t.series[2], borderRadius: [4, 4, 0, 0] }
          },
          {
            name: 'Open REV (month end)', type: 'line', data: D.monthly.revTrend,
            symbol: 'circle', symbolSize: 8,
            lineStyle: { width: 2, color: t.series[1] },
            itemStyle: { color: t.series[1], borderColor: t.surface, borderWidth: 2 }
          }
        ]
      });
    });

    /* ===== 3 · Cumulative mitigated (stacked area) ===== */
    const areaCard = U.card({
      title: 'Cumulative exposure mitigated', sub: 'FY26 by mitigation lever',
      cols: 5, chartClass: 'chart-md'
    });
    grid.appendChild(areaCard);
    SRS.charts.mount(areaCard._chartEl, () => {
      const t = SRS.theme.tokens();
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'axis',
          formatter: ps => {
            let tot = 0;
            let h = `<strong>${ps[0].axisValue}</strong>`;
            ps.forEach(p => {
              tot += p.value;
              h += `<br/>${p.marker} ${p.seriesName}: <strong>${F.usdM(p.value)}</strong>`;
            });
            return h + `<br/><span style="opacity:.65">Total mitigated ${F.usdM(+tot.toFixed(1))}</span>`;
          }
        }),
        legend: Object.assign(SRS.theme.baseOption().legend, { bottom: 0, left: 'center' }),
        grid: { left: 8, right: 14, top: 14, bottom: 30, containLabel: true },
        xAxis: SRS.theme.catAxis(months, { axisLabel: { color: SRS.theme.tokens().ink3, fontSize: 12, interval: 2 } }),
        yAxis: SRS.theme.valAxis({ axisLabel: { formatter: v => '$' + v + 'M' } }),
        series: mitKeys.map((k, i) => ({
          name: k, type: 'line', stack: 'mit', smooth: false, symbol: 'none',
          data: D.monthly.mitigatedCum[k],
          lineStyle: { width: 2, color: t.series[i] },
          itemStyle: { color: t.series[i] },
          areaStyle: { color: t.series[i], opacity: 0.30 }
        }))
      });
    });

    /* ===== 4 · Where the risk sits ===== */
    grid.appendChild(U.el('<div class="section-title col-12">Where the risk sits</div>'));

    /* Top risk suppliers (table) */
    const supCard = U.card({
      title: 'Top risk suppliers', sub: 'ranked by composite risk score · click a row for the 360°',
      cols: 7, flush: true
    });
    grid.appendChild(supCard);
    const top8 = D.suppliers.slice().sort((a, b) => b.score - a.score).slice(0, 8);
    supCard.querySelector('.card-body').appendChild(U.table([
      { h: 'Supplier', cell: s => `<span class="cell-main">${U.esc(s.name)}</span><span class="cell-sub">${U.esc(s.city)}, ${U.esc(s.country)}</span>` },
      { h: 'Category', cell: s => U.esc(s.catName) },
      { h: 'REV', cls: 'num', cell: s => F.usdM(s.rev) },
      { h: 'Score', cell: s => U.meter(s.score) },
      { h: 'Rating', cell: s => U.badge(s.rating) }
    ], top8, s => U.openSupplier(s.id)));

    /* Agent digest */
    const btnAgents = U.el('<button class="btn btn-sm">Open AI Agents</button>');
    btnAgents.addEventListener('click', () => SRS.navigate('agents'));
    const btnBrief = U.el('<button class="btn btn-sm btn-primary">Generate exec brief</button>');
    btnBrief.addEventListener('click', openExecBrief);

    const digestCard = U.card({
      title: 'Agentic layer — latest', sub: 'live feed from the 6 agents',
      cols: 5, actions: [btnAgents, btnBrief]
    });
    grid.appendChild(digestCard);
    const feedWrap = U.el('<div class="feed"></div>');
    D.feed.slice(0, 5).forEach(f => {
      const a = D.agents.find(x => x.key === f.agent) || { name: f.agent, color: 1 };
      const item = U.el(`<div class="feed-item">
        <span style="width:9px;height:9px;border-radius:50%;background:var(--series-${a.color});flex-shrink:0;margin-top:6px"></span>
        <div class="feed-body">
          <span class="f-agent" style="color:var(--series-${a.color})">${U.esc(a.name)}</span>
          <div class="f-text">${f.text}</div>
        </div>
        <span class="feed-time">${U.esc(f.time)} UTC</span>
      </div>`);
      feedWrap.appendChild(item);
    });
    digestCard.querySelector('.card-body').appendChild(feedWrap);
  }

  SRS.registerPage('overview', {
    title: 'Command Center',
    crumb: 'Executive risk overview · NovaForge Manufacturing',
    render
  });
})();
