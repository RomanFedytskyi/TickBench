import test from 'node:test';
import assert from 'node:assert/strict';
import { scanSecuritySource, scanSecurity } from '../src/oracles/security.mjs';

test('flags innerHTML and toFixed hazards in naive-baseline', () => {
  const f = scanSecurity('tasks/stream-grid/submissions/naive-baseline/grid.mjs');
  assert.ok(f.some(x => x.id === 'js-inner-html' && x.severity === 'high'));
  assert.ok(f.some(x => x.id === 'float-tofixed'));
});

test('reference implementation is clean', () => {
  assert.deepEqual(scanSecurity('tasks/stream-grid/reference/grid.mjs'), []);
});

test('detects each rule class', () => {
  assert.ok(scanSecuritySource('el.innerHTML = x').length === 1);
  assert.ok(scanSecuritySource('eval(code)').some(f => f.id === 'js-eval'));
  assert.ok(scanSecuritySource('<div dangerouslySetInnerHTML={{__html:x}}/>').some(f => f.id === 'react-dsih'));
});
