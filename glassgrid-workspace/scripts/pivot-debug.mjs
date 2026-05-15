import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const p = await (await b.newContext()).newPage();
p.on('console', m => console.log('CONSOLE', m.type(), m.text()));
p.on('pageerror', e => console.log('ERROR', e.message));
await p.goto('http://localhost:4200/pivot', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
const info = await p.evaluate(() => {
  const grids = Array.from(document.querySelectorAll('glass-grid'));
  return grids.map(g => ({
    testid: g.getAttribute('data-testid'),
    headerCells: g.querySelectorAll('.gg-header-cell').length,
    rows: g.querySelectorAll('.gg-row').length,
    rowcount: g.getAttribute('aria-rowcount'),
  }));
});
console.log(JSON.stringify(info, null, 2));
await b.close();
