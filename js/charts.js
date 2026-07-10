/* ============================================================
   SRS · charts.js
   ECharts lifecycle (mount / resize / theme re-render) and
   builders for the non-trivial chart forms so every page
   renders them consistently: waterfall, mekko, gantt, sparkline.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  const registry = []; // { el, chart, factory }

  /** Mount a chart. `factory()` returns an ECharts option — it is
      re-invoked on theme change so colors always match tokens. */
  function mount(el, factory) {
    if (!el) return null;
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption(factory());
    const entry = { el, chart, factory };
    registry.push(entry);
    return chart;
  }

  function disposeAll() {
    registry.forEach(e => { try { e.chart.dispose(); } catch (_) {} });
    registry.length = 0;
  }

  function rerenderAll() {
    registry.forEach(e => {
      try { e.chart.setOption(e.factory(), true); } catch (_) {}
    });
  }

  function resizeAll() {
    registry.forEach(e => { try { e.chart.resize(); } catch (_) {} });
  }
  window.addEventListener('resize', () => resizeAll());

  /* ---------------- Sparkline (KPI tiles) ---------------- */
  function sparkline(el, values, color, opts) {
    return mount(el, () => {
      const t = SRS.theme.tokens();
      const c = typeof color === 'function' ? color() : (color || t.accent);
      return {
        animation: false,
        grid: { left: 2, right: 2, top: 4, bottom: 2 },
        xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
        yAxis: { type: 'value', show: false, min: (opts && opts.min), max: (opts && opts.max) },
        series: [{
          type: 'line', data: values, symbol: 'none', smooth: true,
          lineStyle: { width: 2, color: c },
          areaStyle: { color: c, opacity: 0.12 }
        }]
      };
    });
  }

  /* ---------------- Waterfall ----------------
     steps: [{label, value, type: 'total'|'up'|'down'}]
     Totals are absolute; up/down are deltas. */
  function waterfall(el, steps, opts) {
    opts = opts || {};
    return mount(el, () => {
      const t = SRS.theme.tokens();
      const fmtV = opts.format || SRS.fmt.usdM;
      const labels = steps.map(s => s.label);
      const base = [], rise = [], fall = [], totals = [];
      let running = 0;
      steps.forEach(s => {
        if (s.type === 'total') {
          base.push(0); rise.push('-'); fall.push('-'); totals.push(s.value);
          running = s.value;
        } else if (s.value >= 0) {
          base.push(running); rise.push(s.value); fall.push('-'); totals.push('-');
          running += s.value;
        } else {
          running += s.value;
          base.push(running); rise.push('-'); fall.push(-s.value); totals.push('-');
        }
      });
      const barMax = 26;
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (params) => {
            const p = params.find(x => x.value !== '-' && x.seriesName !== 'base');
            if (!p) return '';
            const s = steps[p.dataIndex];
            const v = s.type === 'total' ? s.value : s.value;
            const sign = s.type === 'total' ? '' : (v > 0 ? '+' : '−');
            return `<strong>${s.label}</strong><br/>${sign}${fmtV(Math.abs(v))}`;
          }
        }),
        legend: { show: false },
        grid: { left: 8, right: 14, top: 26, bottom: 4, containLabel: true },
        xAxis: SRS.theme.catAxis(labels, { axisLabel: { color: t.ink3, fontSize: 11.5, interval: 0, width: 92, overflow: 'break' } }),
        yAxis: SRS.theme.valAxis({ axisLabel: { formatter: v => fmtV(v) } }),
        series: [
          { name: 'base', type: 'bar', stack: 'wf', itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } }, tooltip: { show: false }, data: base, barMaxWidth: barMax },
          {
            name: 'increase', type: 'bar', stack: 'wf', data: rise, barMaxWidth: barMax,
            itemStyle: { color: t.status.serious, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top', fontSize: 11.5, color: t.ink2, formatter: p => p.value === '-' ? '' : '+' + fmtV(p.value) }
          },
          {
            name: 'decrease', type: 'bar', stack: 'wf', data: fall, barMaxWidth: barMax,
            itemStyle: { color: t.status.good, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top', fontSize: 11.5, color: t.ink2, formatter: p => p.value === '-' ? '' : '−' + fmtV(p.value) }
          },
          {
            name: 'total', type: 'bar', stack: 'wf', data: totals, barMaxWidth: barMax,
            itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top', fontSize: 12, fontWeight: 700, color: t.ink, formatter: p => p.value === '-' ? '' : fmtV(p.value) }
          }
        ]
      });
    });
  }

  /* ---------------- Mekko (marimekko) ----------------
     data: { regions: [names], values: { region: { category: $M } } }
     Column width ∝ region total; segment height ∝ category share. */
  function mekko(el, data, opts) {
    opts = opts || {};
    return mount(el, () => {
      const t = SRS.theme.tokens();
      const catNames = SRS.data.categories.map(c => c.name);
      const regionTotals = data.regions.map(r =>
        catNames.reduce((a, c) => a + (data.values[r][c] || 0), 0));
      const grand = regionTotals.reduce((a, b) => a + b, 0);

      // Build segment rows: [x0, x1, y0(%), y1(%), region, category, value]
      const rows = [];
      let x = 0;
      data.regions.forEach((r, ri) => {
        const w = regionTotals[ri];
        let y = 0;
        catNames.forEach((c, ci) => {
          const v = data.values[r][c] || 0;
          if (v <= 0) return;
          const h = (v / w) * 100;
          rows.push([x, x + w, y, y + h, r, c, v, ci, w]);
          y += h;
        });
        x += w;
      });

      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          formatter: p => {
            const d = p.data;
            return `<strong>${d[4]} · ${d[5]}</strong><br/>${SRS.fmt.usdM(d[6])} spend · ${((d[6] / d[8]) * 100).toFixed(0)}% of region<br/><span style="opacity:.65">Region total ${SRS.fmt.usdM(d[8])} (${((d[8] / grand) * 100).toFixed(0)}% of spend)</span>`;
          }
        }),
        legend: Object.assign(SRS.theme.baseOption().legend, {
          top: 0, data: catNames
        }),
        grid: { left: 8, right: 8, top: 56, bottom: 26, containLabel: false },
        xAxis: { type: 'value', min: 0, max: grand, show: false },
        yAxis: { type: 'value', min: 0, max: 100, show: false },
        series: catNames.map((c, ci) => ({
          name: c, type: 'custom',
          renderItem: (params, api) => {
            const d = rows[params.dataIndex];
            if (d[5] !== c) return null;
            const p0 = api.coord([d[0], d[3]]);
            const p1 = api.coord([d[1], d[2]]);
            const gap = 2;
            const rect = {
              type: 'rect',
              shape: { x: p0[0] + gap / 2, y: p0[1] + gap / 2, width: p1[0] - p0[0] - gap, height: p1[1] - p0[1] - gap },
              style: { fill: t.series[ci % t.series.length] }
            };
            const children = [rect];
            // region label under the bottom-most segment (y0 === 0)
            if (d[2] === 0) {
              // Narrow columns get the region name only, so adjacent labels never collide.
              const colW = p1[0] - p0[0];
              children.push({
                type: 'text',
                style: {
                  x: (p0[0] + p1[0]) / 2, y: api.coord([0, 0])[1] + 8,
                  text: colW < 96 ? d[4] : `${d[4]} · ${((d[8] / grand) * 100).toFixed(0)}%`,
                  fill: t.ink3, font: '11.5px Inter, sans-serif', textAlign: 'center'
                }
              });
            }
            // segment % label if tall & wide enough
            const hPx = p1[1] - p0[1], wPx = p1[0] - p0[0];
            if (hPx > 18 && wPx > 46) {
              children.push({
                type: 'text',
                style: {
                  x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2,
                  text: ((d[6] / d[8]) * 100).toFixed(0) + '%',
                  fill: '#fff', font: '600 11px Inter, sans-serif',
                  textAlign: 'center', textVerticalAlign: 'middle'
                }
              });
            }
            return { type: 'group', children };
          },
          data: rows,
          encode: { x: [0, 1], y: [2, 3] }
        }))
      });
    });
  }

  /* ---------------- Gantt (mitigation programs) ----------------
     programs: [{name, phases: [[phase, startISO, endISO, status]]}] */
  function gantt(el, programs, opts) {
    opts = opts || {};
    const DAY = 86400000;
    return mount(el, () => {
      const t = SRS.theme.tokens();
      const phaseColor = {
        done: t.status.good,
        active: t.series[0],
        planned: t.isDark ? '#334155' : '#cbd5e1'
      };
      const cats = programs.map(p => p.name);
      const rows = [];
      programs.forEach((p, pi) => {
        p.phases.forEach(ph => {
          rows.push({
            value: [pi, +new Date(ph[1]), +new Date(ph[2]), ph[0], ph[3], p.name],
            itemStyle: { color: phaseColor[ph[3]] }
          });
        });
      });
      const allDates = rows.flatMap(r => [r.value[1], r.value[2]]);
      const min = Math.min.apply(null, allDates) - 4 * DAY;
      const max = Math.max.apply(null, allDates) + 4 * DAY;
      const today = +new Date(SRS.data.asOf);

      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          formatter: p => {
            const v = p.data.value;
            const f = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const days = Math.round((v[2] - v[1]) / DAY);
            return `<strong>${v[5]}</strong><br/>${v[3]} · ${f(v[1])} → ${f(v[2])} (${days}d)<br/><span style="opacity:.65">Status: ${v[4]}</span>`;
          }
        }),
        grid: { left: 8, right: 16, top: 10, bottom: 6, containLabel: true },
        xAxis: {
          type: 'time', min, max,
          axisLine: { lineStyle: { color: t.axis } },
          axisLabel: { color: t.ink3, fontSize: 11.5, formatter: v => new Date(v).toLocaleDateString('en-GB', { month: 'short' }) },
          splitLine: { lineStyle: { color: t.grid } }
        },
        yAxis: {
          type: 'category', data: cats, inverse: true,
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: t.ink2, fontSize: 12.5, width: 200, overflow: 'truncate' }
        },
        series: [{
          type: 'custom',
          renderItem: (params, api) => {
            const catIdx = api.value(0);
            const start = api.coord([api.value(1), catIdx]);
            const end = api.coord([api.value(2), catIdx]);
            const h = Math.min(16, api.size([0, 1])[1] * 0.42);
            return {
              type: 'rect',
              shape: { x: start[0], y: start[1] - h / 2, width: Math.max(2, end[0] - start[0] - 2), height: h, r: 4 },
              style: api.style()
            };
          },
          encode: { x: [1, 2], y: 0 },
          data: rows,
          markLine: {
            symbol: 'none',
            lineStyle: { color: t.status.critical, width: 1.5, type: 'dashed' },
            label: { formatter: 'Today', color: t.status.critical, fontSize: 11, position: 'insideEndTop' },
            data: [{ xAxis: today }]
          }
        }]
      });
    });
  }

  SRS.charts = { mount, disposeAll, rerenderAll, resizeAll, sparkline, waterfall, mekko, gantt };
})();
