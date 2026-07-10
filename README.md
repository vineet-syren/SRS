# SRS — Supplier Risk Sensing · Agentic Supply Risk Command Center

A frontend-only demo of the **new-age SRS** described in the product blueprint: not a
filter-and-table BI dashboard, but a **risk sensing + impact simulation + decision
automation** product for manufacturing, reimagined with modern visual analytics and an
agentic AI layer.

Demo company: **NovaForge Manufacturing** — a global maker of kitchen appliances, power
tools, outdoor equipment and climate systems (7 plants, 30 suppliers, 26 materials,
20 SKUs, 14 live risk events). All data is synthetic but internally consistent — every
number on every page reconciles to the same anchors (e.g. total REV **$113.8M**,
mitigated YTD **$46.2M**).

## Run it

No build step, no dependencies to install (ECharts is vendored):

```bash
cd SRS
node serve.js 4188          # or: python3 -m http.server 4188
# open http://127.0.0.1:4188
```

Opening `index.html` directly from the filesystem also works (no ES modules are used).

## What's inside

| Page | Purpose | Charts |
|---|---|---|
| **Command Center** | Executive overview: exposure, trends, agent digest, exec brief generator | Waterfall (REV bridge), Donut (exposure mix), Column + Line (exposure flow), Area (cumulative mitigation) |
| **Event Intelligence** | External risk sensing: live events, plant pressure, signal triage flow | Heat map (plant × month), Sankey (signal source → triage → outcome) |
| **AI Agents** | The agentic layer: 6 live agents, recommendation approvals, execution timeline | Funnel (mitigation pipeline), Gantt (mitigation programs) |
| **Suppliers** | Supplier Risk 360 portfolio | Bubble (spend × risk × exposure) |
| **Materials** | Component & sourcing risk, single-source vulnerabilities | Tree map (REV by category), Mekko (spend region × category), threshold bars |
| **Products / SKUs** | Finished-goods impact view | Column + Line (revenue vs margin), Waterfall (revenue bridge), Donut (line mix) |
| **Scenario Studio** | What-if simulator with live recompute | Area (inventory runway) |

Cross-cutting:

- **Risk Copilot** (top-right) — natural-language Q&A over the live dataset with
  agent-attributed answers, action chips and drill-through.
- **360° drawers** — click any supplier / material / SKU / event anywhere to open a
  detail drawer with risk dimensions, 12-month trend, BOM links and agent timelines.
- **Global search**, **alert center**, **dark mode** (fully re-themed charts), toasts,
  approval workflow on agent recommendations, executive brief / daily digest generators.

## The 6 agents (from the blueprint)

Risk Sensing · Impact Intelligence · Mitigation Recommendation · Workflow Execution ·
Supplier Communication · Scenario Simulation — surfaced in the live feed, the
recommendation queue, event timelines and the copilot's attributed answers.

## Structure

```
index.html            shell (sidebar, topbar, drawers, copilot, modal)
css/styles.css        design system (light/dark via CSS custom properties)
js/theme.js           design tokens → ECharts bridge, formatters, risk helpers
js/data.js            the synthetic dataset + lookup helpers (single source of truth)
js/charts.js          chart lifecycle + waterfall/mekko/gantt/sparkline builders
js/components.js      shared UI + the 360° detail drawers
js/copilot.js         Risk Copilot
js/pages/*.js         one module per page (self-registering)
js/app.js             router, nav, theme toggle, search, notifications
vendor/echarts.min.js Apache ECharts 5.5 (vendored — fully offline)
```

## Design language

The UI follows the **Terova/Tradewind** design language: Inter on white cards over a
soft gray canvas, a light sidebar with indigo-soft active states, indigo `#4f46e5` as
the single decisioning accent, emerald/amber/rose semantic severity colours, the
Terova ordered chart palette (indigo → blue → emerald → amber → rose → violet → teal →
orange), and a slate dark mode — with a generous type scale throughout.

Charts additionally follow a disciplined dataviz system: fixed categorical color order,
status colors reserved for severity, sequential single-hue (indigo) ramps for
magnitude, one-axis rule (the revenue + margin combo is the single sanctioned
exception), thin marks with surface gaps, tooltips everywhere, and full dark-mode
re-theming.
