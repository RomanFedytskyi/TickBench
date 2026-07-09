// Runtime oracle: replays a tick trace against a submission inside headless Chromium,
// sampling rendered cells every animation frame. Metric definitions: docs/metrics.md.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

// Submissions are imported as real file:// ES modules, so multi-file components with
// relative imports work exactly like in a bundler-free browser project.
export async function runRuntimeOracle({ implPath, trace, quiescenceMs = 600 }) {
  const implUrl = pathToFileURL(resolve(implPath)).href;
  const pageFile = join(mkdtempSync(join(tmpdir(), 'tickbench-')), 'page.html');
  writeFileSync(pageFile, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TickBench</title></head><body><div id="grid"></div></body></html>');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] });
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 2400 } })).newPage();
    await page.goto(pathToFileURL(pageFile).href);
    return await page.evaluate(async ({ implUrl, trace, quiescenceMs }) => {
      const mod = await import(implUrl);
      const grid = mod.createGrid(document.getElementById('grid'), trace.symbols, trace.cols);

      // Independent expected model, derived from the task spec (never from a submission).
      const fmtP = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtQ = new Intl.NumberFormat('en-US');
      const expected = new Map();
      const catchUp = [];
      const frames = [];
      let staleCellFrames = 0, cellFrames = 0;
      const key = t => t.sym + '|' + t.col;
      const numOf = txt => { const n = Number(String(txt).replace(/,/g, '')); return Number.isFinite(n) ? n : NaN; };
      const expNum = e => e.col === 'qty' ? e.v : e.v / 100;

      const t0 = performance.now();
      let i = 0;
      await new Promise(resolve => {
        function pump() {
          const now = performance.now() - t0;
          while (i < trace.ticks.length && trace.ticks[i].t <= now) {
            const tk = trace.ticks[i];
            const k = key(tk);
            const e = expected.get(k) || { ver: 0, matchedVer: 0, col: tk.col };
            e.v = tk.v; e.ver++; e.arrival = performance.now(); e.col = tk.col;
            expected.set(k, e);
            try { grid.applyTick(tk); } catch (err) { window.__implError = String(err); }
            i++;
          }
          if (i < trace.ticks.length) setTimeout(pump, 0);
          else setTimeout(resolve, quiescenceMs);
        }
        pump();
        let last = performance.now();
        function sample(ts) {
          frames.push(ts - last); last = ts;
          for (const td of document.querySelectorAll('td[data-sym]')) {
            const k = td.dataset.sym + '|' + td.dataset.col;
            const e = expected.get(k);
            if (!e) continue;
            cellFrames++;
            const match = Math.abs(numOf(td.textContent) - expNum(e)) < 0.005;
            if (match) {
              if (e.matchedVer < e.ver) { catchUp.push(performance.now() - e.arrival); e.matchedVer = e.ver; }
            } else staleCellFrames++;
          }
          if (i < trace.ticks.length || performance.now() - t0 < trace.durationMs + quiescenceMs - 100) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });

      let valueErrors = 0, formatErrors = 0, checked = 0;
      for (const td of document.querySelectorAll('td[data-sym]')) {
        const k = td.dataset.sym + '|' + td.dataset.col;
        const e = expected.get(k);
        if (!e) continue;
        checked++;
        const want = e.col === 'qty' ? fmtQ.format(e.v) : fmtP.format(e.v / 100);
        if (Math.abs(numOf(td.textContent) - expNum(e)) >= 0.005) valueErrors++;
        else if (td.textContent !== want) formatErrors++;
      }
      const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
      const longFrames = frames.filter(d => d > 33.4).length;
      return {
        ticksDispatched: i, cellsChecked: checked,
        catchUpMs: { p50: pct(catchUp, .5), p95: pct(catchUp, .95), p99: pct(catchUp, .99), n: catchUp.length },
        staleCellFramePct: cellFrames ? +(100 * staleCellFrames / cellFrames).toFixed(2) : null,
        frames: frames.length, longFramePct: frames.length ? +(100 * longFrames / frames.length).toFixed(2) : null,
        worstFrameMs: frames.length ? +Math.max(...frames).toFixed(1) : null,
        finalValueErrors: valueErrors, finalFormatErrors: formatErrors,
        xssTriggered: window.__xss === 1, implError: window.__implError || null
      };
    }, { implUrl, trace, quiescenceMs });
  } finally { await browser.close(); }
}
