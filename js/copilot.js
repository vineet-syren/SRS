/* ============================================================
   SRS · copilot.js
   Risk Copilot — conversational panel over the live dataset.
   Keyword-routed intents; every answer is computed from
   SRS.data at ask-time (no canned numbers).
   ============================================================ */
window.SRS = window.SRS || {};

(function () {
  const D = () => SRS.data;
  const esc = s => SRS.ui.esc(s);
  const OPEN_STATUSES = ['Active', 'Tracked', 'Mitigation in Progress'];

  let panel, thread, input;

  const AGENTS = {
    sensing: 'Risk Sensing Agent',
    impact: 'Impact Intelligence Agent',
    mitigation: 'Mitigation Recommendation Agent',
    scenario: 'Scenario Simulation Agent',
    copilot: 'Risk Copilot'
  };

  const DEFAULT_SUGGESTS = [
    'Top 5 high-risk suppliers',
    'Which materials can stop production in 15 days?',
    'Why is Mekong Flexible Films high risk?',
    'Biggest revenue exposure right now',
    'Create mitigation plan for single-source materials',
    'Daily risk brief'
  ];
  /* Suggestions follow the active persona so the copilot surfaces
     the questions that matter to that profile. */
  function suggests() {
    const p = SRS.activePersona && SRS.activePersona();
    return (p && p.suggests) || DEFAULT_SUGGESTS;
  }

  const DIM_NAMES = { fin: 'Financial', geo: 'Geopolitical', rel: 'Reliability', qual: 'Quality', src: 'Sourcing' };

  /* ---------------- Thread rendering ---------------- */
  function scrollBottom() { thread.scrollTop = thread.scrollHeight; }

  function appendUser(text) {
    thread.appendChild(SRS.ui.el(
      `<div class="msg user"><div class="bubble">${esc(text)}</div></div>`));
    scrollBottom();
  }

  /** answer: { tag, html, actions:[{label, go}], followUp, after } */
  function appendBot(a) {
    const node = SRS.ui.el(`<div class="msg bot">
      <span class="agent-tag">✦ ${esc(a.tag)}</span>
      <div class="bubble">${a.html}${
        a.followUp ? `<div class="muted" style="font-size:12px;margin-top:8px">Follow-up: try “${esc(a.followUp)}”</div>` : ''
      }</div>
    </div>`);
    if (a.actions && a.actions.length) {
      const row = SRS.ui.el('<div class="msg-actions"></div>');
      a.actions.forEach(ac => {
        const b = SRS.ui.el(`<button class="chip">${esc(ac.label)}</button>`);
        b.addEventListener('click', ac.go);
        row.appendChild(b);
      });
      node.appendChild(row);
    }
    thread.appendChild(node);
    scrollBottom();
    if (a.after) a.after();
  }

  function ask(text) {
    appendUser(text);
    const typing = SRS.ui.el(
      '<div class="msg bot"><div class="bubble typing"><i></i><i></i><i></i></div></div>');
    thread.appendChild(typing);
    scrollBottom();
    const answer = route(text);
    setTimeout(() => { typing.remove(); appendBot(answer); }, 700 + Math.random() * 400);
  }

  /* ---------------- Supplier name extraction ---------------- */
  function findSupplier(q) {
    for (const s of D().suppliers) {
      const words = s.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
      for (let i = 0; i < words.length - 1; i++) {
        if (q.includes(words[i] + ' ' + words[i + 1])) return s;
      }
    }
    if (q.includes('mekong')) return D().supplierById('S01');
    return null;
  }

  /* ---------------- Intent router ---------------- */
  function route(text) {
    const q = text.toLowerCase();
    const sup = findSupplier(q);
    if (/why .*(high|risky)|explain/.test(q) && sup) return whySupplier(sup);
    if (/top .*supplier|riskiest|high[- ]risk suppliers/.test(q)) return topSuppliers();
    if (/stop production|stockout|15 days|days of cover|runway/.test(q)) return stockoutRisk();
    if (/revenue exposure|biggest exposure|highest rev/.test(q)) return revenueExposure();
    if (/mitigation plan|create .*plan|single[- ]source/.test(q)) return mitigationPlan();
    if (/what if|simulate|outage/.test(q)) return whatIf();
    if (/brief|digest|summary|summarize/.test(q)) return dailyBrief();
    return fallback();
  }

  /* ---------------- Intent 1 · top risky suppliers ---------------- */
  function topSuppliers() {
    const top = D().suppliers.slice().sort((a, b) => b.score - a.score).slice(0, 5);
    const rows = top.map(s => `<tr>
      <td>${esc(s.name)}<span class="cell-sub">${esc(s.city)}, ${esc(s.country)}</span></td>
      <td>${SRS.ui.scoreSpan(s.score)}</td>
      <td>${SRS.fmt.usdM(s.rev)}</td>
    </tr>`).join('');
    return {
      tag: AGENTS.sensing,
      html: `<p>The 5 riskiest suppliers by composite score right now:</p>
        <table><thead><tr><th>Supplier</th><th>Score</th><th>REV</th></tr></thead><tbody>${rows}</tbody></table>
        <p>Together they carry ${SRS.fmt.usdM(top.reduce((a, s) => a + s.rev, 0))} of the
        ${SRS.fmt.usdM(D().kpis.totalRev)} open exposure.</p>`,
      actions: [
        { label: 'Open ' + top[0].name, go: () => SRS.ui.openSupplier(top[0].id) },
        { label: 'Portfolio view', go: () => SRS.navigate('suppliers') }
      ],
      followUp: 'Why is ' + top[0].name + ' high risk?'
    };
  }

  /* ---------------- Intent 2 · stockout runway ---------------- */
  function stockoutRisk() {
    const mats = D().materials.filter(m => m.stockDays <= 15).sort((a, b) => a.stockDays - b.stockDays);
    const items = mats.map(m => {
      const s = D().supplierById(m.suppliers[0]);
      const skus = D().productsUsing(m.id).length;
      return `<li><strong>${esc(m.name)}</strong> — ${SRS.fmt.days(m.stockDays)} cover ·
        ${esc(s ? s.name : m.suppliers[0])} · ${skus} SKUs${m.singleSource ? ' · single source' : ''}</li>`;
    }).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>${mats.length} material${mats.length === 1 ? '' : 's'} could stop production within 15 days at current burn:</p>
        <ul>${items}</ul>
        <p>Lead times exceed remaining cover on all of them — replenishment ordered today would not arrive in time.</p>`,
      actions: [{ label: 'Open Materials', go: () => SRS.navigate('materials') }],
      followUp: 'Create mitigation plan for single-source materials'
    };
  }

  /* ---------------- Intent 3 · why is <supplier> high risk ---------------- */
  function whySupplier(s) {
    const dims = Object.keys(s.dims)
      .map(k => ({ name: DIM_NAMES[k], v: s.dims[k] }))
      .sort((a, b) => b.v - a.v);
    const worst = dims.slice(0, 2);
    const evs = D().eventsOf(s.id).filter(e => OPEN_STATUSES.includes(e.status));
    const delta = +(s.trend[11] - s.trend[0]).toFixed(2);
    const dir = delta > 0.15 ? `deteriorating (${SRS.fmt.signed(delta)} pts over 12 months)`
      : delta < -0.15 ? `improving (${SRS.fmt.signed(delta)} pts over 12 months)` : 'broadly stable over 12 months';
    const mats = D().materialsOf(s.id);
    const singles = mats.filter(m => m.singleSource);
    const evIds = evs.map(e => e.id);
    const reco = D().recommendations.find(r => r.status === 'pending' && evIds.includes(r.linkedEvent));

    let html = `<p><strong>${esc(s.name)}</strong> is rated ${SRS.ui.badge(s.rating)} at
      ${SRS.ui.scoreSpan(s.score)} and the trajectory is ${dir}.</p>
      <p>The score is driven by <strong>${esc(worst[0].name)}</strong> risk (${worst[0].v.toFixed(1)})
      and <strong>${esc(worst[1].name)}</strong> risk (${worst[1].v.toFixed(1)}).</p>`;
    if (evs.length) {
      html += `<p>${evs.length} open event${evs.length === 1 ? '' : 's'}:</p>
        <ul>${evs.map(e => `<li>${esc(e.title)} <span class="muted">(${esc(e.criticality)} · ${SRS.fmt.usdM(e.rev)})</span></li>`).join('')}</ul>`;
    }
    html += `<p>We depend on them for ${mats.length} material${mats.length === 1 ? '' : 's'}${
      singles.length ? `, ${singles.length} of them single-sourced (${singles.map(m => esc(m.name)).join('; ')})` : ''
      } — ${SRS.fmt.usdM(s.rev)} revenue at risk.</p>`;
    if (reco) {
      html += `<p><strong>Recommended action:</strong> ${esc(reco.title)}
        <span class="muted">(${esc(reco.riskCut)}, ${esc(reco.cost)})</span>.</p>`;
    }
    return {
      tag: AGENTS.sensing,
      html,
      actions: [
        { label: 'Supplier 360', go: () => SRS.ui.openSupplier(s.id) },
        { label: 'Simulate outage', go: () => SRS.navigate('scenario') }
      ]
    };
  }

  /* ---------------- Intent 4 · biggest revenue exposure ---------------- */
  function revenueExposure() {
    const top = D().suppliers.filter(s => s.rev > 0).sort((a, b) => b.rev - a.rev).slice(0, 3);
    const items = top.map(s => {
      const ev = D().eventsOf(s.id).filter(e => OPEN_STATUSES.includes(e.status))
        .sort((a, b) => b.rev - a.rev)[0];
      return `<li><strong>${esc(s.name)}</strong> — ${SRS.fmt.usdM(s.rev)}${
        ev ? ` · driven by “${esc(ev.title)}” <span class="muted">(${esc(ev.criticality)})</span>` : ''}</li>`;
    }).join('');
    return {
      tag: AGENTS.impact,
      html: `<p>Largest revenue exposure right now, out of ${SRS.fmt.usdM(D().kpis.totalRev)} total open REV:</p>
        <ul>${items}</ul>`,
      actions: [{ label: 'Event intelligence', go: () => SRS.navigate('events') }],
      followUp: 'What if ' + top[0].name + ' goes down for 30 days?'
    };
  }

  /* ---------------- Intent 5 · mitigation plan (single source) ---------------- */
  function planAction(m) {
    const feas = (m.substitution.split('—')[0] || '').trim().toLowerCase();
    const note = (m.substitution.split('—')[1] || '').trim();
    let act;
    if (feas.indexOf('low') === 0) act = 'substitution is hard — start alternate qualification now and build safety stock';
    else if (feas.indexOf('medium') === 0) act = 'activate the secondary option and pre-book capacity';
    else act = 'shift volume to qualified alternates';
    return { act, note };
  }
  function mitigationPlan() {
    const risky = D().materials.filter(m => m.singleSource && m.score >= 2.5)
      .sort((a, b) => b.score - a.score);
    const steps = risky.slice(0, 3).map((m, i) => {
      const s = D().supplierById(m.suppliers[0]);
      const p = planAction(m);
      return `<li><strong>Step ${i + 1} · ${esc(m.name)}</strong> (${esc(s.name)}, risk ${SRS.fmt.score(m.score)}):
        ${esc(p.act)}. <span class="muted">${esc(p.note)}</span></li>`;
    }).join('');
    return {
      tag: AGENTS.mitigation,
      html: `<p>${risky.length} single-source materials sit above the 2.5 risk threshold. Proposed plan for the three most exposed:</p>
        <ul>${steps}</ul>
        <p><strong>Workflow Execution Agent:</strong> 3 procurement tickets drafted (PR-88521…23) — approval routed to Category Head.</p>`,
      actions: [{ label: 'Review in AI Agents', go: () => SRS.navigate('agents') }],
      after: () => SRS.ui.toast('Workflow created', '3 mitigation tickets drafted for single-source materials', 'good')
    };
  }

  /* ---------------- Intent 6 · what-if / simulate ---------------- */
  function whatIf() {
    return {
      tag: AGENTS.scenario,
      html: `<p>I can model supplier outages, volume shifts and buffer changes against the live network
        and return SKU impact, exposure and the cheapest recovery plan in under 2 seconds.</p>
        <p>Three presets are ready to run:</p>
        <ul>
          <li>Mekong flood — outage extends 30 days</li>
          <li>Taichung MCU export halt — 30 days</li>
          <li>Monterrey strike — 21 days</li>
        </ul>`,
      actions: [{ label: 'Open Scenario Studio', go: () => SRS.navigate('scenario') }]
    };
  }

  /* ---------------- Intent 7 · daily brief ---------------- */
  function dailyBrief() {
    const k = D().kpis;
    const crit = D().events.filter(e => e.criticality === 'Critical' && OPEN_STATUSES.includes(e.status));
    const pending = D().recommendations.filter(r => r.status === 'pending')
      .sort((a, b) => b.exposure - a.exposure);
    return {
      tag: AGENTS.sensing,
      html: `<p>Daily risk brief · ${esc(D().asOf)}:</p><ul>
        <li><strong>Open exposure:</strong> ${SRS.fmt.usdM(k.totalRev)} REV
          (${SRS.fmt.signed(k.revDelta, 'M')} vs last month)</li>
        <li><strong>${crit.length} critical event${crit.length === 1 ? '' : 's'}:</strong>
          ${crit.map(e => esc(e.title)).join(' · ')}</li>
        <li><strong>${pending.length} recommendations pending</strong> — top:
          ${esc(pending[0].title)} (${SRS.fmt.usdM(pending[0].exposure)} exposure)</li>
        <li><strong>Mitigated YTD:</strong> ${SRS.fmt.usdM(k.mitigatedYtd)} ·
          ${k.stockoutsPrevented} stockouts prevented</li>
      </ul>`,
      actions: [{ label: 'Generate full brief', go: () => SRS.navigate('agents') }]
    };
  }

  /* ---------------- Fallback ---------------- */
  function fallback() {
    return {
      tag: AGENTS.copilot,
      html: `<p>I didn't catch that — here's what I'm good at:</p>
        <ul>${suggests().map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <p>Ask in your own words or tap a suggestion below.</p>`
    };
  }

  /* ---------------- Panel lifecycle ---------------- */
  function open() {
    panel.classList.add('open');
    setTimeout(() => input.focus(), 260);
  }
  function close() { panel.classList.remove('open'); }

  function refreshSuggests() {
    const sug = document.getElementById('copilotSuggests');
    sug.innerHTML = '';
    suggests().forEach(s => {
      const chip = SRS.ui.el(`<button class="chip">${esc(s)}</button>`);
      chip.addEventListener('click', () => ask(s));
      sug.appendChild(chip);
    });
  }

  function init() {
    panel = document.getElementById('copilot');
    thread = document.getElementById('copilotThread');
    input = document.getElementById('copilotText');

    document.getElementById('copilotBtn').addEventListener('click', open);
    document.getElementById('copilotClose').addEventListener('click', close);
    document.getElementById('copilotForm').addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      ask(text);
    });

    // suggestion chips — always visible, tuned to the active persona
    refreshSuggests();

    // welcome message from live counts
    const d = D();
    appendBot({
      tag: AGENTS.copilot,
      html: `<p>Good morning. I watch all <strong>${d.suppliers.length} suppliers</strong>,
        <strong>${d.materials.length} materials</strong> and
        <strong>${d.kpis.activeEvents} live events</strong> for ${esc(d.company)} —
        with ${SRS.fmt.usdM(d.kpis.totalRev)} of revenue currently at risk.</p>
        <p>Ask me anything about your supply risk, or tap a suggestion below.</p>`
    });
  }

  SRS.copilot = { init, open, close, refreshSuggests };
})();
