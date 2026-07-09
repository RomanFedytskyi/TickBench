// Self-contained HTML report: verdict cards + metric comparison table.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function renderHtmlReport(report) {
  const names = Object.keys(report.results);
  const rows = [
    ['Catch-up latency p50 (ms)', x => x.runtime.catchUpMs.p50?.toFixed(1)],
    ['Catch-up latency p95 (ms)', x => x.runtime.catchUpMs.p95?.toFixed(1)],
    ['Catch-up latency p99 (ms)', x => x.runtime.catchUpMs.p99?.toFixed(1)],
    ['Stale cell-frames (%)', x => x.runtime.staleCellFramePct],
    ['Long frames >33ms (%)', x => x.runtime.longFramePct],
    ['Worst frame (ms)', x => x.runtime.worstFrameMs],
    ['Final value errors', x => x.runtime.finalValueErrors],
    ['Final format errors', x => x.runtime.finalFormatErrors],
    ['XSS triggered (dynamic)', x => x.runtime.xssTriggered],
    ['Security findings (high)', x => x.security.filter(f => f.severity === 'high').length],
    ['WCAG violations (axe)', x => x.a11y.length]
  ];
  const gateLabels = {
    functional_final_state: 'Final state correct', staleness: 'Staleness within budget',
    frame_stability: 'Frame stability', security: 'Security', accessibility: 'Accessibility',
    no_runtime_error: 'No runtime errors'
  };
  const cards = names.map(n => {
    const v = report.results[n].verdict;
    const pass = v.regulated_grade_pass;
    const gates = Object.entries(gateLabels).map(([k, label]) =>
      `<li class="${v[k] ? 'ok' : 'bad'}">${v[k] ? '&#10003;' : '&#10007;'} ${esc(label)}</li>`).join('');
    return `<div class="card ${pass ? 'pass' : 'fail'}"><h2>${esc(n)}</h2>
      <div class="badge">${pass ? 'PASS' : 'FAIL'}</div><ul>${gates}</ul></div>`;
  }).join('');
  const table = `<table><thead><tr><th>Metric</th>${names.map(n => `<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>${
    rows.map(([label, f]) => `<tr><td>${esc(label)}</td>${names.map(n => `<td>${esc(f(report.results[n]) ?? '—')}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TickBench report — ${esc(report.task)}</title>
<style>
  body{background:#0b1220;color:#e2e8f0;font:15px/1.5 ui-sans-serif,system-ui,'Segoe UI',sans-serif;margin:0;padding:40px}
  h1{font-size:26px} .sub{color:#94a3b8;margin-bottom:28px}
  .cards{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px}
  .card{background:#0d1626;border:1px solid #24405c;border-radius:10px;padding:18px 22px;min-width:220px}
  .card h2{margin:0 0 8px;font-size:17px}
  .card.pass{border-color:#22d3a5}.card.fail{border-color:#f87171}
  .badge{display:inline-block;font-weight:700;font-size:13px;border-radius:6px;padding:2px 10px;margin-bottom:10px}
  .pass .badge{background:#0f2e26;color:#22d3a5}.fail .badge{background:#301722;color:#f87171}
  ul{list-style:none;margin:0;padding:0;font-size:13.5px} li{padding:1.5px 0} li.ok{color:#86efac} li.bad{color:#fca5a5}
  table{border-collapse:collapse;width:100%;max-width:900px;font-variant-numeric:tabular-nums}
  th,td{text-align:left;padding:8px 14px;border-bottom:1px solid #1e3a52} th{color:#94a3b8;font-weight:600}
  tr:hover td{background:#0d1626}
  .meta{color:#64748b;font-size:13px;margin-top:26px}
</style></head><body>
<h1>TickBench report — <code>${esc(report.task)}</code></h1>
<div class="sub">trace <code>${esc(report.trace)}</code> · seed ${esc(report.traceSeed)} · ${esc(report.generated)} · Node ${esc(report.node)}</div>
<div class="cards">${cards}</div>${table}
<div class="meta">Regulated-grade thresholds come from the task's <code>oracle.config.json</code>. Metric definitions: docs/metrics.md.</div>
</body></html>`;
}
