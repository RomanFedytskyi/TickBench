import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('task config matches expected shape and mutants exist', () => {
  const cfg = JSON.parse(readFileSync('tasks/stream-grid/oracle.config.json', 'utf8'));
  assert.equal(cfg.schema, 'tickbench-task/1');
  for (const k of ['catchUpP95Ms', 'staleCellFramePctMax', 'longFramePctMax']) assert.ok(typeof cfg.thresholds[k] === 'number');
  for (const m of cfg.validationMutants) {
    assert.doesNotThrow(() => readFileSync(`tasks/stream-grid/submissions/${m}/grid.mjs`));
  }
});
