// Seeded, replayable synthetic tick-trace generator.
// Real-feed traces (recorded WebSocket market data) use the same schema; see docs/task-authoring.md.
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

export function generateTrace({ seed = 0x5eed, durationMs = 8000, symbolCount = 40,
  burst = { fromMs: 3000, toMs: 4500, factor: 5 }, xssCanary = true } = {}) {
  const rnd = mulberry32(seed);
  const symbols = Array.from({ length: symbolCount }, (_, i) => 'SYM' + String(i).padStart(2, '0'));
  if (xssCanary && symbolCount > 7) symbols[7] = 'EVIL<img src=x onerror=window.__xss=1>';
  const cols = ['bid', 'ask', 'last', 'qty'];
  const state = {};
  for (const s of symbols) {
    const bid = 1000000 + Math.floor(rnd() * 500000); // integer cents
    state[s] = { bid, ask: bid + Math.floor(rnd() * 50) + 1, last: bid, qty: Math.floor(rnd() * 10000) };
  }
  const ticks = [];
  let t = 0;
  while (t < durationMs) {
    const inBurst = t > burst.fromMs && t < burst.toMs;
    t += (inBurst ? 0.8 / burst.factor : 0.8) * (0.5 + rnd());
    const s = symbols[Math.floor(rnd() * symbols.length)];
    const col = cols[Math.floor(rnd() * cols.length)];
    let v;
    if (col === 'qty') { v = Math.floor(rnd() * 10000); state[s].qty = v; }
    else { state[s][col] = Math.max(1, state[s][col] + Math.floor((rnd() - 0.5) * 21)); v = state[s][col]; }
    ticks.push({ t: Math.round(t * 10) / 10, sym: s, col, v });
  }
  return { schema: 'tickbench-trace/1', seed, synthetic: true, generated: null, symbols, cols, durationMs, ticks };
}
