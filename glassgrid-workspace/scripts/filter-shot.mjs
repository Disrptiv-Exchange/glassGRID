import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4200/advanced-filtering', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
const headers = p.locator('[data-testid="adv-filter-grid"] .gg-header-cell');
const count = await headers.count();
console.log('header count:', count);
// Click the filter button on the "name" column (2nd header)
await p.locator('[data-testid="adv-filter-grid"] .gg-header-cell').nth(1).locator('.gg-filter-btn').click();
await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const popup = document.querySelector('.gg-filter-popup');
  if (!popup) return { ok: false };
  const r = popup.getBoundingClientRect();
  const host = document.querySelector('glass-grid')?.getBoundingClientRect();
  return {
    ok: true,
    popup: { top: r.top, right: r.right, left: r.left, bottom: r.bottom, w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 },
    host: host ? { top: host.top, right: host.right, left: host.left, w: host.width, h: host.height } : null,
    css: {
      position: getComputedStyle(popup).position,
      top: getComputedStyle(popup).top,
      right: getComputedStyle(popup).right,
      display: getComputedStyle(popup).display,
      zIndex: getComputedStyle(popup).zIndex,
    },
  };
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({ path: 'docs/screenshots/filter-popup.png', fullPage: false });
await b.close();
