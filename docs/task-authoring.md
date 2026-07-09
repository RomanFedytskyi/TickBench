# Authoring a TickBench Task

A task directory contains:

```
tasks/<name>/
  spec.md                      natural-language spec = what an agent (or human) receives
  oracle.config.json           trace + regulated-grade thresholds (tickbench-task/1 schema)
  reference/grid.mjs           human reference implementation (must pass regulated-grade)
  submissions/<id>/grid.mjs    submissions under evaluation (agent output or mutants)
  submissions/<id>/PROVENANCE.md   model, version, prompt, date — or mutant rationale
```

Contract: `createGrid(container, symbols, cols) -> { applyTick(tick) }`; rendered cells must
carry `data-sym` and `data-col` attributes (the observable surface the oracle samples).

Rules:
1. The reference must achieve `regulated_grade_pass` (`tickbench validate`).
2. Every oracle you rely on needs at least one **validation mutant** listed in
   `validationMutants` that the oracle demonstrably fails.
3. Traces: synthetic traces are generated (`tickbench gen`, seeded). Real-feed traces
   (recorded WebSocket market data, e.g. public crypto feeds) must set `"synthetic": false`
   and ship a `*.provenance.md` (source, window, sample size) next to the trace file.
4. Do not leak the oracle into the spec verbatim; specs state requirements, oracles verify them.

## Trace data license

Trace files under `traces/` (synthetic or recorded) are licensed **CC BY 4.0**; the harness code is MIT. Recorded traces must be anonymized: no session tokens, no PII, provenance limited to source tool, window, and sample size.
