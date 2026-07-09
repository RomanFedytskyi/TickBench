#!/usr/bin/env node
// TickBench CLI: gen | bench | validate
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, basename, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateTrace } from './trace/generate.mjs';
import { runRuntimeOracle } from './oracles/runtime.mjs';
import { runA11yOracle } from './oracles/a11y.mjs';
import { scanSecurity } from './oracles/security.mjs';
import { computeVerdict } from './report/verdict.mjs';
import { summaryTable } from './report/aggregate.mjs';
import { renderHtmlReport } from './report/html.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i > -1 ? args[i + 1] : dflt; };
const flag = name => args.includes('--' + name);
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TASK = join(PKG_ROOT, 'tasks', 'stream-grid');

function loadTaskConfig(taskDir) {
  return JSON.parse(readFileSync(join(taskDir, 'oracle.config.json'), 'utf8'));
}

function discoverSubmissions(taskDir) {
  const subs = [{ name: 'reference', path: join(taskDir, 'reference', 'grid.mjs') }];
  const subDir = join(taskDir, 'submissions');
  if (existsSync(subDir)) for (const d of readdirSync(subDir))
    if (existsSync(join(subDir, d, 'grid.mjs'))) subs.push({ name: d, path: join(subDir, d, 'grid.mjs') });
  return subs;
}

function loadTrace(taskDir, cfg) {
  const requested = opt('trace', null);
  const candidates = requested
    ? [requested]
    : [cfg.trace, join(taskDir, cfg.trace), join(PKG_ROOT, cfg.trace)];
  for (const c of candidates) if (c && existsSync(c)) return { trace: JSON.parse(readFileSync(c, 'utf8')), source: c };
  const trace = generateTrace({ seed: 24301 });
  trace.generated = new Date().toISOString();
  return { trace, source: `(generated in-memory, seed 0x${(24301).toString(16)})` };
}

if (cmd === 'gen') {
  const seed = Number(opt('seed', '24301'));
  const trace = generateTrace({ seed, durationMs: Number(opt('duration', '8000')), symbolCount: Number(opt('symbols', '40')) });
  trace.generated = new Date().toISOString();
  const out = opt('out', 'traces/demo.json');
  mkdirSync(dirname(out) || '.', { recursive: true });
  writeFileSync(out, JSON.stringify(trace));
  console.log(`trace: ${trace.ticks.length} ticks over ${trace.durationMs}ms, seed 0x${seed.toString(16)} -> ${out}`);
} else if (cmd === 'bench') {
  const implOpt = opt('impl', null);
  const taskDir = opt('task', null) ? resolve(opt('task', null)) : implOpt ? DEFAULT_TASK : resolve('tasks/stream-grid');
  const cfg = loadTaskConfig(taskDir);
  let subs;
  if (implOpt) {
    // Standalone mode: benchmark YOUR component from any directory.
    subs = [];
    if (!flag('no-reference')) subs.push({ name: 'reference', path: join(taskDir, 'reference', 'grid.mjs') });
    subs.push({ name: opt('name', basename(implOpt, '.mjs').replace(/\.js$/, '') || 'my-grid'), path: resolve(implOpt) });
  } else {
    subs = discoverSubmissions(taskDir);
    const only = opt('submission', null);
    if (only) subs = subs.filter(s => s.name === only);
  }
  const { trace, source } = loadTrace(taskDir, cfg);
  const outDir = resolve(opt('out', 'tickbench-results'));
  const report = { schema: 'tickbench-report/1', generated: new Date().toISOString(), task: basename(taskDir), trace: source, traceSeed: trace.seed, node: process.version, results: {} };
  for (const sub of subs) {
    console.error('== benchmarking: ' + sub.name);
    const runtime = await runRuntimeOracle({ implPath: sub.path, trace });
    const a11y = await runA11yOracle({ implPath: sub.path, trace });
    const security = scanSecurity(sub.path);
    const verdict = computeVerdict({ runtime, a11y, security }, cfg.thresholds);
    report.results[sub.name] = { impl: sub.path, runtime, a11y, security, verdict };
  }
  mkdirSync(outDir, { recursive: true });
  const jsonFile = join(outDir, `report-${basename(taskDir)}.json`);
  const htmlFile = join(outDir, `report-${basename(taskDir)}.html`);
  writeFileSync(jsonFile, JSON.stringify(report, null, 2));
  writeFileSync(htmlFile, renderHtmlReport(report));
  console.log('\n' + summaryTable(report.results));
  console.log('\nResults:');
  console.log('  console : table above');
  console.log('  html    : ' + htmlFile + '   <- open this in a browser');
  console.log('  json    : ' + jsonFile);
} else if (cmd === 'new-submission') {
  const name = args[1] && !args[1].startsWith('--') ? args[1] : opt('name', null);
  if (!name) { console.error('usage: tickbench new-submission <name> [--task DIR]'); process.exit(1); }
  const taskDir = opt('task', null) ? resolve(opt('task', null)) : (existsSync('tasks/stream-grid') ? resolve('tasks/stream-grid') : DEFAULT_TASK);
  const dir = join(taskDir, 'submissions', name);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, 'grid.mjs')))
    writeFileSync(join(dir, 'grid.mjs'), '// Paste the model\u2019s unedited output for tasks/<task>/spec.md here.\n// Contract: export function createGrid(container, symbols, cols) -> { applyTick(tick) }\n');
  writeFileSync(join(dir, 'PROVENANCE.md'), `# Provenance: ${name}\n\n- **Model:** <model name and version>\n- **Date:** ${new Date().toISOString().slice(0, 10)}\n- **Mode:** single-shot | agentic (tools/iterations: <n>)\n- **Prompt:** verbatim contents of tasks/<task>/spec.md (attach any extra system prompt)\n- **Post-editing:** none (required for benchmark validity)\n`);
  console.log('created ' + dir + '\n  1. run the task spec through the model\n  2. paste its unedited output into grid.mjs\n  3. fill PROVENANCE.md\n  4. npx tick-bench-cli bench --task ' + taskDir);
} else if (cmd === 'validate') {
  const taskDir = resolve(opt('task', 'tasks/stream-grid'));
  const cfg = loadTaskConfig(taskDir);
  const subs = discoverSubmissions(taskDir);
  const trace = generateTrace({ seed: 7, durationMs: 2000 });
  let ok = true;
  for (const sub of subs) {
    const runtime = await runRuntimeOracle({ implPath: sub.path, trace });
    const a11y = await runA11yOracle({ implPath: sub.path, trace });
    const security = scanSecurity(sub.path);
    const v = computeVerdict({ runtime, a11y, security }, cfg.thresholds);
    const isMutant = (cfg.validationMutants || []).includes(sub.name);
    const expected = sub.name === 'reference' ? true : isMutant ? false : null;
    if (expected !== null && v.regulated_grade_pass !== expected) {
      ok = false;
      console.error(`FAIL: ${sub.name} expected regulated_grade_pass=${expected}, got ${v.regulated_grade_pass}`);
    } else console.error(`ok: ${sub.name} (${v.regulated_grade_pass ? 'pass' : 'fail'} as ${expected === null ? 'unspecified' : 'expected'})`);
  }
  if (!ok) process.exit(1);
  console.log('task valid: reference passes, all validation mutants are detected');
} else {
  console.log(`usage:
  tickbench bench --impl ./my-adapter.mjs      benchmark YOUR component (from any directory)
  tickbench bench [--task DIR]                 benchmark a task's reference + all submissions
  tickbench gen [--seed N] [--duration MS] [--symbols N] [--out FILE]
  tickbench validate [--task DIR]\n  tickbench new-submission <name> [--task DIR]   scaffold a submission for model output

bench options: --name LABEL  --trace FILE  --out DIR  --submission NAME  --no-reference

Results go to ./tickbench-results/: report-<task>.html (open in browser) + .json.`);
  process.exit(cmd ? 1 : 0);
}
