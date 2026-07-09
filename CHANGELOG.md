# Changelog

## [0.1.0] - 2026-07-09

First release.

### Harness
- Runtime oracle (Playwright / headless Chromium): frame-sampled display staleness,
  catch-up latency percentiles (p50/p95/p99), stale cell-frame rate, long-frame rate,
  worst frame, final-state value and locale-format correctness, dynamic XSS canary.
- Accessibility oracle: axe-core with WCAG 2.1 A/AA rulesets.
- Static security oracle: client-side injection sinks and monetary-precision hazards.
- Config-driven verdicts: acceptance thresholds live in each task's `oracle.config.json`;
  a submission passes only if it clears every gate.
- Oracle validation: `tickbench validate` proves the reference passes and every declared
  validation mutant is caught.

### Workloads
- Seeded, replayable synthetic tick traces with burst segments and XSS canary symbols.
- Trace schema supports recorded real feeds (`"synthetic": false` + provenance file).

### Developer experience
- Standalone mode: `npx tick-bench-cli bench --impl ./my-adapter.mjs` from any directory,
  compared side by side with the built-in human reference.
- Reports in three forms per run: console table, self-contained HTML report, JSON.
- Multi-file submissions: adapters load as real `file://` ES modules, so relative imports
  of your own component files work without a bundler.
- `tickbench new-submission <name>`: scaffolds a submission folder with a provenance
  template for evaluating model-generated code.
- Complete runnable walkthrough (`examples/walkthrough/`) with committed sample results,
  plus a single-file adapter starting point (`examples/my-table-adapter.mjs`).
- Typed API (`index.d.ts`), JSON Schemas for traces and task configs, formal metric
  definitions (`docs/metrics.md`).

### Bundled task
- `stream-grid` with three documented submissions: human `reference`, genuine single-shot
  AI-generated `claude-fable-5` (unedited, provenance recorded), and `naive-baseline`
  (deliberately broken oracle-validation mutant).

### Infrastructure
- CI on Node 18/20/22 (tests, oracle validation, smoke bench).
- Auto-publish to npm with provenance on GitHub Release.
