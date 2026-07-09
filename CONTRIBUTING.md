# Contributing

Contributions are welcome, particularly:
- **New tasks** — see `docs/task-authoring.md`. Tasks must ship a spec, a reference
  implementation, an `oracle.config.json`, and pass `tickbench validate`.
- **Agent submissions** — generated solutions for existing tasks, with provenance
  (model, version, prompt, date) in a `PROVENANCE.md` next to the submission.
- **Oracle improvements** — new metrics must come with a definition in `docs/metrics.md`
  and a validation mutant that demonstrates the oracle detects what it claims to detect.

Run `npm test` and `npm run bench:smoke` before opening a PR.
