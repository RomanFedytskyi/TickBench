# Connect your own table

TickBench doesn't need your app. It benchmarks a **component in isolation**: you write one
small adapter file that mounts your table and routes updates into it, then point the CLI at
that file. Three steps, ~5 minutes.

## 1. Write an adapter

The whole contract:

```js
export function createGrid(container, symbols, cols) {
  // 1. mount your table into `container`, one row per symbol, one column per col
  // 2. every rendered cell must carry data-sym / data-col attributes
  return {
    applyTick(tick) {
      // 3. route { sym, col, v } into your table's update path
      //    price columns arrive as integer cents; format as en-US, 2 decimals
    }
  };
}
```

Relative imports work — your adapter can `import { MyTable } from './my-table.mjs'` like
normal code. See `examples/walkthrough/` for a complete runnable example with a real
component file, or copy `examples/my-table-adapter.mjs` as a single-file starting point — it is a complete working adapter
with the two "REPLACE" sections marked.

**Vanilla / any DOM component:** call your component's mount and update methods directly.

**React:** the harness runs your file in a bare browser page (no bundler), so import React
from a CDN with full URLs:

```js
import React from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';

export function createGrid(container, symbols, cols) {
  const root = createRoot(container);
  let setTicks;                       // captured from the component
  function App() {
    const [ticks, s] = React.useState({});
    setTicks = s;
    return React.createElement(MyPriceTable, { ticks, symbols, cols }); // your component
  }
  root.render(React.createElement(App));
  return { applyTick(t) { setTicks(prev => ({ ...prev, [t.sym + '|' + t.col]: t })); } };
}
```

Make sure `MyPriceTable` renders `data-sym` / `data-col` on its cells (add them via your
cell renderer if they aren't there yet).

**AG Grid:**

```js
import { createGrid as agCreateGrid } from 'https://esm.sh/ag-grid-community@31';

export function createGrid(container, symbols, cols) {
  const api = agCreateGrid(container, {
    rowData: symbols.map(sym => ({ sym })),
    getRowId: p => p.data.sym,
    columnDefs: [{ field: 'sym' }, ...cols.map(c => ({
      field: c,
      cellRenderer: p => { const el = document.createElement('span');
        el.dataset.sym = p.data.sym; el.dataset.col = c; el.textContent = p.value ?? ''; return el; }
    }))],
    domLayout: 'autoHeight'
  });
  const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return { applyTick(t) {
    api.applyTransactionAsync({ update: [{ sym: t.sym,
      [t.col]: t.col === 'qty' ? new Intl.NumberFormat('en-US').format(t.v) : fmt.format(t.v / 100) }] });
  } };
}
```

(CDN imports need network access when the benchmark runs; everything else is offline.)

## 2. Run

From your project directory:

```bash
npx tick-bench-cli bench --impl ./my-table-adapter.mjs --name my-table
```

TickBench uses its built-in task and workload (or pass `--trace` / `--task` for your own),
runs your adapter and the built-in human reference side by side in headless Chromium, and
scores both.

## 3. Read the results

Three places, printed at the end of every run:

1. **Console** — the metric comparison table, immediately.
2. **`./tickbench-results/report-stream-grid.html`** — open in a browser: pass/fail cards
   per submission with per-gate breakdown, plus the full metric table.
3. **`./tickbench-results/report-stream-grid.json`** — raw numbers for CI gates, charts,
   or tracking over time.

A submission earns **PASS** only if it clears every gate: correct final values and
formatting, staleness within budget, stable frames, no XSS (static + dynamic), and no WCAG
violations. Thresholds live in the task's `oracle.config.json`.
