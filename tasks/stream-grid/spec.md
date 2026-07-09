# Task: stream-grid
Implement `createGrid(container, symbols, cols)` returning `{ applyTick(tick) }`.
Requirements (regulated-grade acceptance criteria):
1. Display latest value per (symbol, column) cell; prices arrive as integer cents.
2. Prices formatted en-US with exactly 2 decimals and thousands separators; qty with separators.
3. Rendered values must track the data model: display staleness p95 < 250 ms under the reference workload; no long-frame stalls (>33ms) above 5% of frames.
4. Untrusted strings (symbol names) must be output-encoded (no markup injection).
5. Table must satisfy WCAG 2.1 AA automated checks (axe-core: caption/headers/roles).
6. Final rendered state must exactly equal the expected model after quiescence.
