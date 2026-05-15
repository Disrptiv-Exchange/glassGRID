import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4200/columns', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
// Pin Name + Email via right-click menu
for (const name of ['Name', 'Email']) {
  const h = p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: name }).first();
  await h.click({ button: 'right' });
  await p.waitForTimeout(120);
  await p.locator('.gg-context-menu button.gg-menu-item', { hasText: 'Pin left' }).first().click();
  await p.waitForTimeout(150);
}
// Scroll the body right so we can verify pinned cols stay
await p.evaluate(() => {
  const body = document.querySelector('[data-testid="columns-grid"] .gg-body');
  if (body) body.scrollLeft = 800;
});
await p.waitForTimeout(300);
await p.screenshot({ path: 'docs/screenshots/columns-pin-scrolled.png', fullPage: false });
await b.close();
