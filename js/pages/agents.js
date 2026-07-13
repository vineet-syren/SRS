/* ============================================================
   SRS · pages/agents.js
   Agentic command center — the recommendation approval queue,
   the mitigation decision funnel, program execution timelines
   and a live streaming agent activity feed. (Agent roster cards
   were intentionally dropped — only operable surfaces remain.)
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  /* ---------------- Inline SVG icon set (24×24 stroke) — feed dots ---------------- */
  const ICONS = {
    radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l5.6-5.6"/><path d="M12 12h.01"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="5" r="2.4"/><path d="M8.5 19h7a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7h7"/></svg>',
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="7" r="2.4"/><path d="M6 7.4v9.2"/><path d="M18 9.4a9.2 9.2 0 0 1-9.3 7.3"/></svg>'
  };

  /* ---------------- Streamed feed copy ---------------- */
  const STREAM_POOL = [
    ['sensing', 'Signal sweep: <strong>1,180 external datapoints</strong> screened — 2 qualified for triage, both below escalation threshold.'],
    ['impact', 'Exposure refresh on <strong>EV-2617</strong>: REV steady at $14.2M; fill-rate risk unchanged across 3 regions.'],
    ['mitigation', 'Decision memory updated — Nov 25 film-disruption outcome weighted into current <strong>R-101</strong> confidence.'],
    ['workflow', 'ERP sync: <strong>PR-88412</strong> (resin safety stock) moved to <em>in fulfilment</em>; planner notified.'],
    ['comms', 'Reminder queued for <strong>Chengdu Lithium Power</strong> — recovery-plan response now 2 days overdue.'],
    ['scenario', 'Background what-if: 21-day Monterrey strike re-simulated — best plan unchanged (Pune overtime + air freight).'],
    ['sensing', 'Port congestion index for <strong>Rotterdam</strong> ticked up 4% — below alert threshold, watching.'],
    ['impact', 'BOM cross-check: no new single-source dependencies introduced by last night\'s engineering changes.']
  ];

  /* Synthetic feed clock, starts just after the latest data item. */
  let clock = 6 * 60 + 44;
  function nextTime() {
    clock += 2 + Math.floor(Math.random() * 4);
    const h = Math.floor(clock / 60) % 24, m = clock % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
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

    /* Shared feed renderer — used for the initial list and streamed items. */
    function feedNode(f) {
      const a = D.agents.find(x => x.key === f.agent) || D.agents[0];
      const c = t.series[a.color - 1];
      return ui.el(`<div class="feed-item">
        <span class="feed-dot" style="background:${c}22;color:${c}">${ICONS[a.icon] || ICONS.radar}</span>
        <div class="feed-body">
          <span class="f-agent" style="color:${c}">${ui.esc(a.name)}</span>
          <div class="f-text">${f.text}</div>
        </div>
        <span class="feed-time">${ui.esc(f.time)} UTC</span>
      </div>`);
    }
    let feedWrap = null;
    function pushFeed(agentKey, text) {
      const item = { time: nextTime(), agent: agentKey, text };
      D.feed.unshift(item);
      if (D.feed.length > 40) D.feed.pop();
      if (feedWrap && feedWrap.isConnected) {
        const node = feedNode(item);
        node.style.background = 'var(--accent-soft)';
        feedWrap.prepend(node);
        setTimeout(() => { node.style.transition = 'background 1.2s'; node.style.background = 'transparent'; }, 900);
        while (feedWrap.children.length > 14) feedWrap.lastElementChild.remove();
      }
      return item;
    }

    const grid = ui.el('<div class="grid grid-12"></div>');
    host.appendChild(grid);

    /* Left column stacks the funnel + live feed so its height always
       matches the (taller) recommendation queue — no dead space. */
    const leftCol = ui.el('<div class="col-5" style="display:flex;flex-direction:column;gap:16px;min-height:0"></div>');
    grid.appendChild(leftCol);

    /* ================= 1 · Mitigation funnel ================= */
    const funnelCard = ui.card({
      title: 'Mitigation pipeline — FY26 YTD',
      sub: 'from raw signal to executed action',
      chartClass: 'chart-lg'
    });
    leftCol.appendChild(funnelCard);

    SRS.charts.mount(funnelCard._chartEl, () => {
      const tk = SRS.theme.tokens();
      const seqIdx = [6, 5, 4, 3, 2, 1]; // ordered single-hue ramp, darkest at top stage
      const data = D.funnel.map((s, i) => ({
        name: s.stage, value: s.value,
        itemStyle: { color: tk.seq[seqIdx[i]], borderColor: tk.surface, borderWidth: 2 }
      }));
      return Object.assign(SRS.theme.baseOption(), {
        legend: { show: false }, // stage names live inside the funnel
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

    /* ================= 2 · Recommendation queue ================= */
    const recoCard = ui.card({
      title: 'Recommendation queue',
      sub: 'proposed by the agent network — pending your approval',
      cols: 7
    });
    grid.appendChild(recoCard);
    const recoBody = recoCard.querySelector('.card-body');

    const APPROVED_TAG = '<span class="approved-tag">✓ Approved — execution started (tickets, POs, notifications)</span>';
    const DISMISSED_TAG = '<span class="dismissed-tag">Dismissed — kept in decision memory</span>';

    D.recommendations.forEach((r, i) => {
      const block = ui.el(`<div class="reco${r.status !== 'pending' ? ' done' : ''}">
        <div class="reco-head">
          <span class="reco-title">${ui.esc(r.title)}</span>
          ${r.linkedEvent ? `<span class="badge accent plain" style="cursor:pointer" title="Open event">${ui.esc(r.linkedEvent)}</span>` : ''}
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

      const evBadge = block.querySelector('.badge');
      if (evBadge) evBadge.addEventListener('click', () => ui.openEvent(r.linkedEvent));

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
          pushFeed('workflow', `Approval received for <strong>${r.id}</strong> — ticket PR-${88500 + i} created, supplier notified, ERP requisition triggered.`);
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

    /* ================= 3 · Gantt — mitigation programs ================= */
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

    /* ================= 4 · Live agent activity feed ================= */
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

    const digestBtn = ui.el('<button class="btn btn-sm btn-primary">Daily digest</button>');
    digestBtn.addEventListener('click', () => {
      const d = new Date(D.asOf + 'T00:00:00');
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      ui.modal('Daily risk digest — ' + dateStr, digestHtml());
    });

    /* Fills the space under the funnel; the list scrolls inside the card
       so the left column never outgrows the queue. */
    const feedCard = ui.card({
      title: 'Live agent activity',
      sub: 'streaming · most recent first',
      actions: [digestBtn]
    });
    feedCard.style.cssText = 'flex:1 1 0;min-height:340px';
    leftCol.appendChild(feedCard);

    feedWrap = ui.el('<div class="feed"></div>');
    D.feed.slice(0, 12).forEach(f => feedWrap.appendChild(feedNode(f)));
    const feedBody = feedCard.querySelector('.card-body');
    feedBody.style.overflowY = 'auto';
    feedBody.appendChild(feedWrap);

    /* Stream a new feed item every few seconds while the page is open;
       the interval dies with the page. */
    let streamIdx = 0;
    const iv = setInterval(() => {
      if (!host.isConnected) { clearInterval(iv); return; }
      const [key, text] = STREAM_POOL[streamIdx % STREAM_POOL.length];
      streamIdx++;
      pushFeed(key, text);
    }, 8000);
  }

  SRS.registerPage('agents', {
    title: 'AI Agents',
    crumb: 'Approvals, decision pipeline & live agent activity',
    render
  });
})();
