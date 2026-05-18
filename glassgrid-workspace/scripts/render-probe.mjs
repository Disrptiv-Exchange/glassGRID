/**
 * Render-probe: attach to running ng serve (localhost:4200), mutate a cell,
 * count DOM mutations on the grid body across phases.
 * Run: node scripts/render-probe.mjs [route]
 */
import { chromium } from 'playwright';
import { setTimeout as wait } from 'node:timers/promises';

const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = process.env.GG_BASE ?? 'http://localhost:4200';
const route = process.argv[2] ?? 'basic';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' });
await wait(500);

const result = await page.evaluate(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const body = document.querySelector('.gg-body');
  if (!body) return { error: 'no .gg-body' };
  const cell = body.querySelector('.gg-cell');
  if (!cell) return { error: 'no .gg-cell' };

  // mutation counter
  let count = 0;
  const obs = new MutationObserver(muts => { count += muts.length; });
  const phase = async (label, ms, action) => {
    count = 0;
    obs.observe(body, { childList: true, subtree: true, characterData: true, attributes: true });
    const start = performance.now();
    if (action) await action();
    await sleep(ms);
    obs.disconnect();
    return { phase: label, durationMs: Math.round(performance.now() - start), mutations: count };
  };

  const idle = await phase('idle 3s — no interaction', 3000);

  // mutate cell DOM and watch
  const original = cell.textContent;
  cell.textContent = '[[manual-edit]]';
  const t0 = performance.now();
  let revertedAt = null;
  for (let i = 0; i < 50; i++) {
    await sleep(100);
    if (cell.textContent !== '[[manual-edit]]') { revertedAt = performance.now() - t0; break; }
  }

  // scroll
  const vp = document.querySelector('.gg-viewport') || body;
  const scroll = await phase('scroll 2s', 2000, async () => {
    for (let i = 0; i < 20; i++) { vp.scrollTop += 40; await sleep(80); }
  });

  return {
    idle,
    revertAfterManualEdit: {
      revertedAtMs: revertedAt == null ? 'never within 5s' : Math.round(revertedAt),
      finalText: cell.textContent,
      wasReverted: cell.textContent === original,
    },
    scroll,
  };
});

console.log(JSON.stringify(result, null, 2));

// real-mouse hover
const cellHandle = await page.$('.gg-cell');
if (cellHandle) {
  const box = await cellHandle.boundingBox();
  await page.evaluate(() => {
    window.__mut = 0;
    const body = document.querySelector('.gg-body');
    window.__obs = new MutationObserver(m => { window.__mut += m.length; });
    window.__obs.observe(body, { childList: true, subtree: true, characterData: true, attributes: true });
  });
  if (box) {
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(box.x + 10 + i * 18, box.y + 10 + (i % 5) * 24);
      await wait(100);
    }
  }
  const hoverMuts = await page.evaluate(() => { window.__obs.disconnect(); return window.__mut; });
  console.log(JSON.stringify({ realMouseHover_2s: { mutations: hoverMuts } }, null, 2));
}

await browser.close();
