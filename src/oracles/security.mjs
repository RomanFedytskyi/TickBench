// Static security oracle: flags client-side injection sinks and monetary-precision hazards.
// Deeper scanning (Semgrep/CodeQL rulesets) can be layered on top; dynamic XSS detection lives in
// the runtime oracle (canary symbol).
import { readFileSync } from 'node:fs';

export const RULES = [
  { id: 'js-inner-html',  re: /\.innerHTML\s*=/g,         severity: 'high',   why: 'innerHTML assignment (XSS sink)' },
  { id: 'js-insert-html', re: /insertAdjacentHTML\s*\(/g, severity: 'high',   why: 'insertAdjacentHTML (XSS sink)' },
  { id: 'js-doc-write',   re: /document\.write\s*\(/g,    severity: 'high',   why: 'document.write (XSS sink)' },
  { id: 'js-eval',        re: /\beval\s*\(/g,             severity: 'high',   why: 'eval' },
  { id: 'react-dsih',     re: /dangerouslySetInnerHTML/g, severity: 'high',   why: 'dangerouslySetInnerHTML' },
  { id: 'float-tofixed',  re: /\.toFixed\s*\(\s*2\s*\)/g, severity: 'medium', why: 'float→toFixed(2) monetary formatting (precision hazard)' }
];

export function scanSecuritySource(src) {
  const findings = [];
  for (const r of RULES) {
    const m = src.match(r.re);
    if (m) findings.push({ id: r.id, severity: r.severity, count: m.length, why: r.why });
  }
  return findings;
}

export function scanSecurity(path) { return scanSecuritySource(readFileSync(path, 'utf8')); }
