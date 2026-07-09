import test from 'node:test';
import assert from 'node:assert/strict';
import { computeVerdict } from '../src/report/verdict.mjs';

const thresholds = { catchUpP95Ms: 250, staleCellFramePctMax: 20, longFramePctMax: 5, finalErrorsMax: 0, axeViolationsMax: 0, highSecurityFindingsMax: 0 };
const goodRuntime = { catchUpMs: { p95: 30 }, staleCellFramePct: 10, longFramePct: 0.5, finalValueErrors: 0, finalFormatErrors: 0, xssTriggered: false, implError: null };

test('clean submission passes regulated grade', () => {
  const v = computeVerdict({ runtime: goodRuntime, a11y: [], security: [] }, thresholds);
  assert.equal(v.regulated_grade_pass, true);
});

test('each gate fails independently', () => {
  const cases = [
    [{ runtime: { ...goodRuntime, finalFormatErrors: 3 }, a11y: [], security: [] }, 'functional_final_state'],
    [{ runtime: { ...goodRuntime, catchUpMs: { p95: 900 } }, a11y: [], security: [] }, 'staleness'],
    [{ runtime: { ...goodRuntime, longFramePct: 9 }, a11y: [], security: [] }, 'frame_stability'],
    [{ runtime: { ...goodRuntime, xssTriggered: true }, a11y: [], security: [] }, 'security'],
    [{ runtime: goodRuntime, a11y: [{ id: 'x' }], security: [] }, 'accessibility'],
    [{ runtime: { ...goodRuntime, implError: 'boom' }, a11y: [], security: [] }, 'no_runtime_error']
  ];
  for (const [input, gate] of cases) {
    const v = computeVerdict(input, thresholds);
    assert.equal(v[gate], false, gate + ' should fail');
    assert.equal(v.regulated_grade_pass, false);
  }
});

test('high-severity static finding fails security gate', () => {
  const v = computeVerdict({ runtime: goodRuntime, a11y: [], security: [{ severity: 'high' }] }, thresholds);
  assert.equal(v.security, false);
});
