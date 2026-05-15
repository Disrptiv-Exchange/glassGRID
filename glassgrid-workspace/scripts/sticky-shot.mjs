import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4200/columns', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);

// 1) Right-click Name → Pin left
const nameHeader = p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: 'Name' }).first();
await nameHeader.click({ button: 'right' });
await p.waitForTimeout(150);
// Screenshot 1: menu anchored under the header
await p.screenshot({ path: 'docs/screenshots/header-menu-anchored.png', fullPage: false });
await p.locator('.gg-context-menu button.gg-menu-item', { hasText: 'Pin left' }).first().click();
await p.waitForTimeout(200);

// 2) Pin Email too
const emailHeader = p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: 'Email' }).first();
await emailHeader.click({ button: 'right' });
await p.waitForTimeout(100);
await p.locator('.gg-context-menu button.gg-menu-item', { hasText: 'Pin left' }).first().click();
await p.waitForTimeout(200);

// 3) Scroll horizontally to prove pinned cols stay
await p.evaluate(() => {
  const body = document.querySelector('[data-testid="columns-grid"] .gg-body');
  if (body) body.scrollLeft = 900;
});
await p.waitForTimeout(300);
await p.screenshot({ path: 'docs/screenshots/sticky-pinned-scrolled.png', fullPage: false });
await b.close();
console.log('done');
