# TickBench Metric Definitions

All metrics are computed by the runtime oracle from frame-sampled observations of rendered
cells against an **independent expected model** derived from the task specification (never
from any submission).

Let tick *k* for cell *c* arrive at time `a(c,k)` (when `applyTick` is dispatched), carrying
expected display value `E(c,k)`. Let `D(c,t)` be the numeric value parsed from the rendered
cell at frame time *t*.

| Metric | Definition |
|---|---|
| **Catch-up latency** | For each version *k* first observed rendered at frame time *t*: `t − a(c,k)`. Reported as p50/p95/p99 across all (c,k). Sampling is frame-quantized: values are upper bounds accurate to one frame. |
| **Stale cell-frame rate** | Fraction of (cell × frame) observations where `D(c,t) ≠ E(c, latest)` (tolerance 0.005 dollars). Measures how often users see a non-current value. |
| **Lost update (final)** | After quiescence, cells whose rendered numeric value differs from the final expected value — the latest version was silently never displayed. |
| **Format error (final)** | Rendered numeric value is correct but the string violates the task's locale formatting spec (e.g., missing thousands separators, wrong decimals). Monetary display correctness. |
| **Long-frame rate** | Fraction of animation-frame deltas > 33.4 ms (two missed vsync at 60 Hz). Worst frame reported separately. |
| **Dynamic XSS** | Trace symbol names include an injection canary; the oracle checks whether it executed (`window.__xss`). Complements static sink scanning. |
| **Regulated-grade pass** | Conjunction of per-dimension gates with thresholds from the task's `oracle.config.json`. |

Design notes:
- **Value vs. format separation** keeps staleness (recency) orthogonal to monetary formatting
  correctness: a value can be current but mis-formatted, or correctly formatted but stale.
- **Coalescing is legitimate**: skipping intermediate versions is not penalized; failing to
  ever display the *latest* version is.
- **Batching trade-off is visible, not punished**: rAF-batched implementations show ~1 frame
  of added staleness but better frame stability; thresholds are set so both correct designs
  and correct trade-offs pass while unstable or incorrect ones fail.
