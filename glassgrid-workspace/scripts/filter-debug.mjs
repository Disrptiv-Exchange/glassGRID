import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
p.on('console', m => console.log('CONSOLE', m.type(), m.text()));
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:4200/advanced-filtering', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const before = await p.evaluate(() => ({
  filterBtns: document.querySelectorAll('[data-testid="adv-filter-grid"] .gg-filter-btn').length,
  floatingFilters: document.querySelectorAll('[data-testid="adv-filter-grid"] .gg-floating-filter-input').length,
}));
console.log('before click:', before);
// click the first filter button
await p.locator('[data-testid="adv-filter-grid"] .gg-filter-btn').first().click();
await p.waitForTimeout(200);
const after = await p.evaluate(() => {
  const popup = document.querySelector('.gg-filter-popup');
  return {
    popupExists: !!popup,
    popupHtml: popup ? popup.innerHTML.slice(0, 600) : null,
    selects: popup ? popup.querySelectorAll('select').length : 0,
    inputs: popup ? popup.querySelectorAll('input').length : 0,
    buttons: popup ? popup.querySelectorAll('button').length : 0,
  };
});
console.log('after click:', after);
await b.close();
