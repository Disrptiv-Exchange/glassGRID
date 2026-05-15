import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4200/columns', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
// measure NAME header rect BEFORE clicking
const headerInfo = await p.evaluate(() => {
  const h = Array.from(document.querySelectorAll('[data-testid="columns-grid"] .gg-header-cell'))
    .find(e => e.textContent && e.textContent.includes('Name'));
  if (!h) return null;
  const r = h.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height, text: h.textContent.trim() };
});
console.log('Name header rect:', headerInfo);
const nameHeader = p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: 'Name' }).first();
await nameHeader.click({ button: 'right' });
await p.waitForTimeout(200);
const menuInfo = await p.evaluate(() => {
  const m = document.querySelector('.gg-context-menu');
  if (!m) return null;
  const r = m.getBoundingClientRect();
  const cs = getComputedStyle(m);
  return { top: r.top, left: r.left, w: r.width, h: r.height, cssTop: cs.top, cssLeft: cs.left, cssPos: cs.position };
});
console.log('Menu rect:', menuInfo);
await b.close();
