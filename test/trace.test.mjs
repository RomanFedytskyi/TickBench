import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTrace } from '../src/trace/generate.mjs';

test('trace generation is deterministic for a given seed', () => {
  const a = generateTrace({ seed: 42, durationMs: 1000 });
  const b = generateTrace({ seed: 42, durationMs: 1000 });
  assert.deepEqual(a.ticks, b.ticks);
  assert.equal(a.schema, 'tickbench-trace/1');
});

test('different seeds produce different traces', () => {
  const a = generateTrace({ seed: 1, durationMs: 1000 });
  const b = generateTrace({ seed: 2, durationMs: 1000 });
  assert.notDeepEqual(a.ticks, b.ticks);
});

test('burst segment increases tick density', () => {
  const tr = generateTrace({ seed: 7, durationMs: 8000 });
  const inBurst = tr.ticks.filter(t => t.t > 3000 && t.t < 4500).length / 1500;
  const outside = tr.ticks.filter(t => t.t < 3000).length / 3000;
  assert.ok(inBurst > outside * 2, `burst density ${inBurst} should exceed 2x baseline ${outside}`);
});

test('xss canary present and price values are positive integers (cents)', () => {
  const tr = generateTrace({ seed: 7, durationMs: 1000 });
  assert.ok(tr.symbols.some(s => s.includes('onerror')));
  for (const t of tr.ticks) { assert.ok(Number.isInteger(t.v) && t.v >= 0); }
});
