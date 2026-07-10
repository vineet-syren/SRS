/* ============================================================
   SRS · pages/agents.js
   Agentic command center: the six live agents, the mitigation
   funnel, the recommendation approval queue, program timelines
   and the live activity feed.
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  /* ---------------- Inline SVG icon set (24×24 stroke) ---------------- */
  const ICONS = {
    radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l5.6-5.6"/><path d="M12 12h.01"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8.5 19h7a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7h7"/></svg>',
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="7" r="2.4"/><path d="M6 7.4v9.2"/><path d="M18 9.4a9.2 9.2 0 0 1-9.3 7.3"/></svg>'
  };

  /* Format one agent stat from its key + label text. */
  function statVal(key, val, label) {
    if (key === 'revComputed' || /\$M/.test(label)) return SRS.fmt.usdM(val);
    if (/%/.test(label)) return val + '%';
    return SRS.fmt.num(val);
  }

  /* Decrement (or remove) the AI Agents sidebar badge. */
  function decNavBadge() {
    const b = document.querySelector(".nav-item[data-key='agents'] .nav-badge");
    if (!b) return;
    const n = (parseInt(b.textContent, 10) || 0) - 1;
    if (n <= 0) b.remove(); else b.textContent = n;
  }

  function render(host) {
    const D = SRS.data, ui = SRS.ui;
    const t = SRS.theme.tokens(); // for DOM tints at render time

    /* ================= 1 · Agent grid ================= */
    const agrid = ui.el('<div class="agent-grid"></div>');
    D.agents.forEach((a, ai) => {
      const c = t.series[a.color - 1];
      const node = ui.el(`<div class="agent-card">
        <div class="agent-top">
          <span class="agent-icon" style="background:${c}22;color:${c}">${ICONS[a.icon] || ICONS.radar}</span>
          <div>
            <div class="agent-name">${ui.esc(a.name)}</div>
            <div class="agent-role">Agent ${String(ai + 1).padStart(2, '0')} · autonomous · ${ui.esc(a.key)}</div>
          </div>
          <span class="agent-status"><span class="pulse"></span>LIVE</span>
        </div>
        <div class="agent-desc">${ui.esc(a.role)}</div>
        <div class="agent-stats">${
          Object.keys(a.stats).map((k, i) => `<div class="agent-stat">
            <div class="as-val">${statVal(k, a.stats[k], a.statLabels[i])}</div>
            <div class="as-label">${ui.esc(a.statLabels[i])}</div>
          </div>`).join('')
        }</div>
      </div>`);
      agrid.appendChild(node);
    });
    host.appendChild(agrid);

    const grid = ui.el('<div class="grid grid-12 mt-16"></div>');
    host.appendChild(grid);

    /* ================= 2 · Mitigation funnel ================= */
    grid.appendChild(ui.el('<div class="section-title col-12">Decision pipeline</div>'));

    const funnelCard = ui.card({
      title: 'Mitigation pipeline — FY26 YTD',
      sub: 'from raw signal to executed action',
      cols: 5, chartClass: 'chart-lg'
    });
    grid.appendChild(funnelCard);

    SRS.charts.mount(funnelCard._chartEl, () => {
      const tk = SRS.theme.tokens();
      const seqIdx = [6, 5, 4, 3, 2, 1]; // ordered single-hue ramp, darkest at top stage
      const data = D.funnel.map((s, i) => ({
        name: s.stage, value: s.value,
        itemStyle: { color: tk.seq[seqIdx[i]], borderColor: tk.surface, borderWidth: 2 }
      }));
      return Object.assign(SRS.theme.baseOption(), {
        tooltip: Object.assign(SRS.theme.baseOption().tooltip, {
          trigger: 'item',
          formatter: p => {
            const i = p.dataIndex;
            const prev = i > 0 ? D.funnel[i - 1].value : null;
            const conv = prev
              ? ((p.value / prev) * 100).toFixed(0) + '% conversion vs previous stage'
              : 'top of funnel';
            return `<strong>${p.name}</strong><br/>${SRS.fmt.num(p.value)} items<br/><span style="opacity:.65">${conv}</span>`;
          }
        }),
        series: [{
          type: 'funnel', sort: 'descending', gap: 3, minSize: '12%',
          left: 8, right: 8, top: 8, bottom: 8,
          label: {
            show: true, position: 'inside', formatter: '{b}\n{c}',
            color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 15
          },
          labelLine: { show: false },
          itemStyle: { borderColor: tk.surface, borderWidth: 2 },
          emphasis: { label: { fontSize: 12 } },
          data
        }]
      });
    });

    /* ================= 3 · Recommendation queue ================= */
    const recoCard = ui.card({
      title: 'Recommendation queue',
      sub: 'proposed by Mitigation Recommendation Agent — pending your approval',
      cols: 7
    });
    grid.appendChild(recoCard);
    const recoBody = recoCard.querySelector('.card-body');

    const APPROVED_TAG = '<span class="approved-tag">✓ Approved — Workflow Execution Agent is executing</span>';
    const DISMISSED_TAG = '<span class="dismissed-tag">Dismissed — kept in decision memory</span>';

    D.recommendations.forEach((r, i) => {
      const block = ui.el(`<div class="reco${r.status !== 'pending' ? ' done' : ''}">
        <div class="reco-head">
          <span class="reco-title">${ui.esc(r.title)}</span>
          <span class="badge accent plain" style="cursor:pointer" title="Open event">${ui.esc(r.linkedEvent)}</span>
        </div>
        <p class="muted" style="font-size:12px;line-height:1.55;margin-top:5px">${ui.esc(r.detail)}</p>
        <div class="reco-meta">
          <span class="rm">Cost impact<strong>${ui.esc(r.cost)}</strong></span>
          <span class="rm">Risk reduction<strong class="good">${ui.esc(r.riskCut)}</strong></span>
          <span class="rm">Exposure<strong>${SRS.fmt.usdM(r.exposure)}</strong></span>
          <span class="rm">Approvers<strong>${ui.esc(r.approvers)}</strong></span>
        </div>
        <div class="reco-actions"></div>
      </div>`);

      block.querySelector('.badge').addEventListener('click', () => ui.openEvent(r.linkedEvent));

      const actions = block.querySelector('.reco-actions');
      if (r.status === 'approved') {
        actions.innerHTML = APPROVED_TAG;
      } else if (r.status === 'dismissed') {
        actions.innerHTML = DISMISSED_TAG;
      } else {
        const approve = ui.el('<button class="btn btn-sm btn-good">Approve</button>');
        approve.addEventListener('click', () => {
          r.status = 'approved';
          actions.innerHTML = APPROVED_TAG;
          block.classList.add('done');
          ui.toast('Recommendation approved',
            'Ticket PR-' + (88500 + i) + ' created · supplier notified · ERP requisition triggered', 'good');
          decNavBadge();
        });

        const dismiss = ui.el('<button class="btn btn-sm btn-ghost">Dismiss</button>');
        dismiss.addEventListener('click', () => {
          r.status = 'dismissed';
          actions.innerHTML = DISMISSED_TAG;
          block.classList.add('done');
          ui.toast('Recommendation dismissed',
            r.id + ' archived to decision memory — the agent will weigh this outcome in future proposals');
          decNavBadge();
        });

        const simulate = ui.el('<button class="btn btn-sm">Simulate</button>');
        simulate.addEventListener('click', () => SRS.navigate('scenario'));

        actions.appendChild(approve);
        actions.appendChild(dismiss);
        actions.appendChild(simulate);
      }
      recoBody.appendChild(block);
    });

    /* ================= 4 · Gantt — mitigation programs ================= */
    grid.appendChild(ui.el('<div class="section-title col-12">Execution &amp; activity</div>'));

    const legendDot = (color, label) => ui.el(
      `<span class="flex aic" style="gap:5px;font-size:12px;color:var(--ink-3)">
        <i style="width:9px;height:9px;border-radius:3px;background:${color};display:inline-block"></i>${label}
      </span>`);

    const ganttCard = ui.card({
      title: 'Mitigation programs — execution timeline',
      sub: 'assessment → design → build → testing → rollout',
      cols: 12, chartClass: 'chart-lg',
      actions: [
        legendDot(t.status.good, 'Done'),
        legendDot(t.series[0], 'Active'),
        legendDot(t.axis, 'Planned')
      ]
    });
    grid.appendChild(ganttCard);
    SRS.charts.gantt(ganttCard._chartEl, D.gantt);

    /* ================= 5 · Live agent activity feed ================= */
    function digestHtml() {
      const active = D.events.filter(e => ['Active', 'Tracked', 'Mitigation in Progress'].includes(e.status));
      const top2 = active.slice().sort((a, b) => b.rev - a.rev).slice(0, 2);
      const pending = D.recommendations.filter(r => r.status === 'pending');
      const first = D.funnel[0], last = D.funnel[D.funnel.length - 1];
      const focus = pending.length
        ? `Approve <strong>${pending[0].id}</strong> (${ui.esc(pending[0].title.toLowerCase())}) — ` +
          `${SRS.fmt.usdM(pending[0].exposure)} of exposure rides on it and the action window is closing.`
        : 'The approval queue is clear — monitor the two critical events and the G2 qualification gate.';
      return `
        <p><strong>Portfolio position.</strong> Open risk exposure stands at <strong>${SRS.fmt.usdM(D.kpis.totalRev)}</strong>
        across <strong>${active.length} active events</strong> (${D.kpis.criticalEvents} critical), with
        ${SRS.fmt.usdM(D.kpis.mitigatedYtd)} already mitigated FY26 YTD.</p>
        <h3>Top exposures</h3>
        <ul>${top2.map(e =>
          `<li><strong>${e.id}</strong> — ${ui.esc(e.title)} · ${SRS.fmt.usdM(e.rev)} at risk</li>`).join('')}
        </ul>
        <h3>Agent pipeline</h3>
        <p>FY26 YTD the network has processed <strong>${SRS.fmt.num(first.value)}</strong> raw signals down to
        <strong>${SRS.fmt.num(last.value)}</strong> executed &amp; closed actions.
        <strong>${pending.length}</strong> recommendation${pending.length === 1 ? '' : 's'} await your approval.</p>
        <h3>Mitigation programs</h3>
        <ul>${D.gantt.map(g =>
          `<li>${ui.esc(g.name)} (${g.linkedEvent}) — <strong>${g.progress}%</strong> complete</li>`).join('')}
        </ul>
        <p><strong>Focus for today:</strong> ${focus}</p>`;
    }

    const digestBtn = ui.el('<button class="btn btn-sm btn-primary">Generate daily risk digest</button>');
    digestBtn.addEventListener('click', () => {
      const d = new Date(D.asOf + 'T00:00:00');
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      ui.modal('Daily risk digest — ' + dateStr, digestHtml());
    });

    const feedCard = ui.card({
      title: 'Live agent activity',
      sub: 'most recent first',
      cols: 12,
      actions: [digestBtn]
    });
    grid.appendChild(feedCard);

    const feedWrap = ui.el('<div class="feed"></div>');
    D.feed.forEach(f => {
      const a = D.agents.find(x => x.key === f.agent) || D.agents[0];
      const c = t.series[a.color - 1];
      const row = ui.el(`<div class="feed-item">
        <span class="feed-dot" style="background:${c}22;color:${c}">${ICONS[a.icon] || ICONS.radar}</span>
        <div class="feed-body">
          <span class="f-agent" style="color:${c}">${ui.esc(a.name)}</span>
          <div class="f-text">${f.text}</div>
        </div>
        <span class="feed-time">${ui.esc(f.time)} UTC</span>
      </div>`);
      feedWrap.appendChild(row);
    });
    feedCard.querySelector('.card-body').appendChild(feedWrap);
  }

  SRS.registerPage('agents', {
    title: 'AI Agents',
    crumb: 'Agentic command center · 6 agents live',
    render
  });
})();
