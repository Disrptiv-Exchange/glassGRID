import { chromium } from 'playwright';
const CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:4200/columns', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
// Right-click Name → Pin left so the screenshot shows the green divider
const nameHeader = p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: 'Name' }).first();
await nameHeader.click({ button: 'right' });
await p.waitForTimeout(150);
await p.locator('.gg-context-menu button.gg-menu-item', { hasText: 'Pin left' }).first().click();
await p.waitForTimeout(200);
// pin a second column too — Email
await p.locator('[data-testid="columns-grid"] .gg-header-cell').filter({ hasText: 'Email' }).first().click({ button: 'right' });
await p.waitForTimeout(150);
await p.locator('.gg-context-menu button.gg-menu-item', { hasText: 'Pin left' }).first().click();
await p.waitForTimeout(300);
await p.screenshot({ path: 'docs/screenshots/columns-pin-divider.png', fullPage: false });
await b.close();
