// Accessibility oracle: renders the grid with initial data, runs axe-core WCAG 2.1 A/AA rules.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
const require = createRequire(import.meta.url);

export async function runA11yOracle({ implPath, trace, warmupTicks = 400 }) {
  const implUrl = pathToFileURL(resolve(implPath)).href;
  const axeSrc = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  const pageFile = join(mkdtempSync(join(tmpdir(), 'tickbench-')), 'page.html');
  writeFileSync(pageFile, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TickBench</title></head><body><div id="grid"></div></body></html>');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(pageFile).href);
    await page.evaluate(async ({ implUrl, trace, warmupTicks }) => {
      const mod = await import(implUrl);
      const grid = mod.createGrid(document.getElementById('grid'), trace.symbols, trace.cols);
      for (const tk of trace.ticks.slice(0, warmupTicks)) grid.applyTick(tk);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, { implUrl, trace, warmupTicks });
    await page.addScriptTag({ content: axeSrc });
    return await page.evaluate(async () => {
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    });
  } finally { await browser.close(); }
}
