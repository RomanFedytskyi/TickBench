// EXAMPLE ADAPTER — copy this file into your project and edit the marked lines.
//
// TickBench doesn't care what framework your table uses. It only needs this contract:
//   createGrid(container, symbols, cols) -> { applyTick(tick) }
// and rendered cells carrying data-sym / data-col attributes so the oracle can read them.
//
// Replace the internals below with calls into YOUR component:
//   - mount:   render your table into `container` (ReactDOM.createRoot, new AgGrid, etc.)
//   - update:  route `applyTick` into your component's data path (setState, applyTransaction…)
//
// Framework imports must be full URLs (the harness loads this file as a module in a bare
// browser page — no bundler), e.g.:  import { createRoot } from 'https://esm.sh/react-dom@18/client'

export function createGrid(container, symbols, cols) {
  // --- mount: REPLACE with your component's mount code -------------------
  const priceFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qtyFmt = new Intl.NumberFormat('en-US');
  const table = document.createElement('table');
  table.setAttribute('aria-label', 'My table under test');
  const caption = document.createElement('caption');
  caption.textContent = 'My table under test';
  table.appendChild(caption);
  const cells = new Map();
  const thead = document.createElement('thead'); const hr = document.createElement('tr');
  const h0 = document.createElement('th'); h0.scope = 'col'; h0.textContent = 'Symbol'; hr.appendChild(h0);
  for (const c of cols) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = c; hr.appendChild(th); }
  thead.appendChild(hr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const s of symbols) {
    const tr = document.createElement('tr');
    const th = document.createElement('th'); th.scope = 'row'; th.textContent = s; tr.appendChild(th);
    for (const c of cols) {
      const td = document.createElement('td');
      td.dataset.sym = s; td.dataset.col = c;      // <-- REQUIRED: observable surface
      tr.appendChild(td); cells.set(s + '|' + c, td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody); container.appendChild(table);

  // --- update: REPLACE with your component's update path ------------------
  const pending = new Map(); let scheduled = false;
  const flush = () => {
    scheduled = false;
    for (const [k, t] of pending) {
      const td = cells.get(k);
      if (td) td.textContent = t.col === 'qty' ? qtyFmt.format(t.v) : priceFmt.format(t.v / 100);
    }
    pending.clear();
  };
  return {
    applyTick(tick) {           // tick = { t, sym, col, v }  (prices are integer cents)
      pending.set(tick.sym + '|' + tick.col, tick);
      if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
    }
  };
}
