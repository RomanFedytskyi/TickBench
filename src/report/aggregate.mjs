export function summaryTable(results) {
  const names = Object.keys(results);
  const row = (label, f) => label.padEnd(34) + names.map(n => String(f(results[n])).padStart(16)).join('');
  const lines = [' '.repeat(34) + names.map(n => n.padStart(16)).join('')];
  lines.push(row('catch-up latency p50 (ms)', x => x.runtime.catchUpMs.p50?.toFixed(1)));
  lines.push(row('catch-up latency p95 (ms)', x => x.runtime.catchUpMs.p95?.toFixed(1)));
  lines.push(row('stale cell-frames (%)', x => x.runtime.staleCellFramePct));
  lines.push(row('long frames >33ms (%)', x => x.runtime.longFramePct));
  lines.push(row('worst frame (ms)', x => x.runtime.worstFrameMs));
  lines.push(row('final value errors', x => x.runtime.finalValueErrors));
  lines.push(row('final format errors', x => x.runtime.finalFormatErrors));
  lines.push(row('XSS triggered (dynamic)', x => x.runtime.xssTriggered));
  lines.push(row('security findings (high)', x => x.security.filter(f => f.severity === 'high').length));
  lines.push(row('axe violations', x => x.a11y.length));
  lines.push(row('REGULATED-GRADE PASS', x => x.verdict.regulated_grade_pass));
  return lines.join('\n');
}
