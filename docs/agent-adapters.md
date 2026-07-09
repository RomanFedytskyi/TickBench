# Evaluating Coding Agents with TickBench

TickBench evaluates *artifacts* (submissions), so any agent can be tested by writing its
output into `tasks/<task>/submissions/<agent-id>/grid.mjs`:

1. Give the agent `tasks/<task>/spec.md` (and nothing else) as the task prompt.
2. Save each sample as `submissions/<agent-id>-s<k>/grid.mjs` for pass@k evaluation.
3. Record model, version, temperature, prompt, and date in `PROVENANCE.md`.
4. Run `tickbench bench --task tasks/<task>` — every submission is scored per dimension and
   against the regulated-grade gate.

Planned: an adapter CLI that drives agent APIs
directly, multi-turn repair loops with oracle feedback, and regulated-grade-pass@k reporting.

## Seeding submissions across models

For a model comparison, repeat per model:

```bash
npx tick-bench-cli new-submission claude-sonnet-5     # scaffolds grid.mjs + PROVENANCE.md
# paste tasks/stream-grid/spec.md into the model (claude.ai, API, IDE agent...)
# paste its UNEDITED output into submissions/claude-sonnet-5/grid.mjs
# fill PROVENANCE.md (model, date, mode, prompt, "post-editing: none")
npx tick-bench-cli bench --task tasks/stream-grid     # scores all submissions side by side
```

Provenance rules that keep the comparison honest: output is pasted unedited; the prompt is
exactly the task spec (plus any system prompt, recorded verbatim); one directory per model
and per sample (`claude-sonnet-5-s2` for the second sample when computing pass@k); if the
generating model may have seen similar public code in training, note it — the shipped
`claude-fable-5` submission carries the same caveat.
