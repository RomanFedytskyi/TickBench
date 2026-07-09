import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHtmlReport } from '../src/report/html.mjs';

const report = {
  task: 'stream-grid', trace: 't.json', traceSeed: 1, generated: 'now', node: 'v22',
  results: {
    good: { runtime: { catchUpMs: { p50: 1, p95: 2, p99: 3 }, staleCellFramePct: 0, longFramePct: 0, worstFrameMs: 10, finalValueErrors: 0, finalFormatErrors: 0, xssTriggered: false }, a11y: [], security: [], verdict: { functional_final_state: true, staleness: true, frame_stability: true, security: true, accessibility: true, no_runtime_error: true, regulated_grade_pass: true } },
    bad: { runtime: { catchUpMs: { p50: 1, p95: 2, p99: 3 }, staleCellFramePct: 5, longFramePct: 9, worstFrameMs: 900, finalValueErrors: 1, finalFormatErrors: 7, xssTriggered: true }, a11y: [{ id: 'x' }], security: [{ severity: 'high' }], verdict: { functional_final_state: false, staleness: true, frame_stability: false, security: false, accessibility: false, no_runtime_error: true, regulated_grade_pass: false } }
  }
};

test('html report renders verdict cards and metrics', () => {
  const html = renderHtmlReport(report);
  assert.ok(html.includes('PASS') && html.includes('FAIL'));
  assert.ok(html.includes('good') && html.includes('bad'));
  assert.ok(html.includes('Catch-up latency p95'));
  assert.ok(html.startsWith('<!doctype html>'));
});

test('html report escapes html in names', () => {
  const r = structuredClone(report);
  r.results['<img>'] = r.results.good;
  const html = renderHtmlReport(r);
  assert.ok(!html.includes('<img>'));
});
