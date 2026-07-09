// THE ADAPTER — the only file you write for TickBench. It imports your component
// (relative imports work), mounts it, tags cells for the oracle, and routes ticks in.
import { SimpleTable } from './my-table.mjs';

export function createGrid(container, symbols, cols) {
  // 1. Mount your component exactly the way your app does.
  const table = new SimpleTable({ rows: symbols, columns: cols, title: 'Live prices' });
  table.mount(container);

  // 2. Tag rendered cells so the oracle can observe them (your component stays untouched).
  for (const sym of symbols) for (const col of cols) {
    const td = table.getCell(sym, col);
    td.dataset.sym = sym;
    td.dataset.col = col;
  }

  // 3. Route ticks into your component's own update API.
  //    Prices arrive as integer cents; the task spec requires en-US, 2 decimals.
  const priceFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const qtyFmt = new Intl.NumberFormat('en-US');
  const pending = new Map();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    for (const [, t] of pending)
      table.setCell(t.sym, t.col, t.col === 'qty' ? qtyFmt.format(t.v) : priceFmt.format(t.v / 100));
    pending.clear();
  };
  return {
    applyTick(tick) {
      pending.set(tick.sym + ' ' + tick.col, tick);
      if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
    }
  };
}
