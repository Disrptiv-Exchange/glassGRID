import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
p.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText ?? '')));

for (const path of ['/', '/basic', '/editing']) {
  await p.goto('http://localhost:4200' + path, { waitUntil: 'networkidle', timeout: 20000 });
  const dump = await p.evaluate(() => ({
    bodyTextLen: document.body.innerText.length,
    bodyHtmlSample: document.body.innerHTML.slice(0, 400),
    hasAppRoot: !!document.querySelector('app-root'),
    appRootChildren: document.querySelector('app-root')?.children.length ?? 0,
    headerText: document.querySelector('.shell-header')?.textContent?.slice(0, 200),
    glassGrids: document.querySelectorAll('glass-grid').length,
    rowsAcrossPage: document.querySelectorAll('.gg-row').length,
  }));
  await p.screenshot({ path: `docs/screenshots/diag-${path.replace(/\//g, '_') || 'home'}.png`, fullPage: false });
  console.log(`=== ${path} ===`);
  console.log(JSON.stringify(dump, null, 2));
}
console.log('\nERRORS:');
console.log(errors.length ? errors.join('\n') : '(none)');
await b.close();
