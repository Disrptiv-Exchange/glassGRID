#!/usr/bin/env node
/**
 * Node Playwright e2e for glassGRID demo.
 * Uses Chrome for Testing (avoids the user's regular Chrome session).
 *
 * Usage: node scripts/e2e.mjs [route]    # default = all routes
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.GG_BASE ?? 'http://localhost:4200';
const SHOTS_DIR = path.resolve('docs/screenshots');
const REPORT_DIR = path.resolve('docs/test-reports');

const CHROME_FOR_TESTING = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const routes = [
  'basic', 'sorting', 'filtering', 'pagination', 'selection',
  'columns', 'rendering', 'themes', 'performance',
  'editing', 'advanced-filtering', 'grouping', 'tree',
  'master-detail', 'range', 'row-drag', 'sidebar-statusbar',
  'sparklines', 'export-state',
  // new in batch 2
  'api-extras', 'pinned-rows', 'column-groups', 'pivot',
  'server-side', 'set-filter', 'advanced-filter-builder',
  'wrap-text', 'lock', 'span',
  // new in batch 3
  'column-virt', 'charts', 'infinite', 'multi-filter',
  // batch 4: Angular component cells + auto-fit
  'cell-components',
  // batch 5: ag-grid drop-in binding pattern
  'ag-binding',
  // batch 6: floating filter as Angular component
  'floating-filter-component',
  // batch 7: fitCellContents auto-size strategy
  'fit-cell-contents',
  // batch 8: async-data auto-fit (v0.4.17 regression fixture)
  'auto-fit-async',
];

const filter = process.argv[2];
const wanted = filter ? routes.filter((r) => r.includes(filter)) : routes;

if (!existsSync(SHOTS_DIR)) await mkdir(SHOTS_DIR, { recursive: true });
if (!existsSync(REPORT_DIR)) await mkdir(REPORT_DIR, { recursive: true });

const results = [];

const browser = await chromium.launch({
  ...(existsSync(CHROME_FOR_TESTING) ? { executablePath: CHROME_FOR_TESTING } : {}),
  headless: true,
});

try {
  for (const route of wanted) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
    });

    const t0 = Date.now();
    let status = 'PASS';
    let notes = '';

    try {
      await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 20_000 });
      // wait for grid to render
      await page.waitForSelector('glass-grid .gg-row', { timeout: 10_000 });

      // route-specific assertions
      await runChecks(route, page).catch((e) => { notes = `check failed: ${e.message}`; status = 'FAIL'; });

      // screenshot
      await page.screenshot({ path: path.join(SHOTS_DIR, `${route}.png`), fullPage: false });

      if (consoleErrors.length) {
        // some routes are expected to be clean
        notes += (notes ? ' | ' : '') + `console: ${consoleErrors.length} error(s): ${consoleErrors.slice(0, 2).join('; ')}`;
        if (route !== 'master-detail') status = 'FAIL'; // master-detail uses innerHTML which can warn
      }
    } catch (err) {
      status = 'FAIL';
      notes = err.message;
    }
    const dt = Date.now() - t0;
    results.push({ route, status, ms: dt, notes });
    console.log(`[${status}] /${route} (${dt}ms) ${notes}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}

// summary
const passes = results.filter((r) => r.status === 'PASS').length;
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log(`\n=== ${passes} pass / ${fails} fail / ${results.length} total ===`);

if (fails > 0) process.exit(1);

// ============== checks ==============
async function runChecks(route, page) {
  switch (route) {
    case 'basic': {
      const cells = await page.locator('[data-testid="basic-grid"] .gg-row').count();
      if (cells < 10) throw new Error(`too few rows: ${cells}`);
      // autoSizeStrategy=fitGridWidth (default): the total rendered column width should
      // be ≥ (gg-body clientWidth - small slack) when natural widths are smaller than the viewport.
      const fit = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="basic-grid"]');
        const body = grid?.querySelector('.gg-body');
        const canvas = grid?.querySelector('.gg-body-canvas');
        if (!body || !canvas) return null;
        const bodyW = body.clientWidth;
        const canvasStyleW = parseInt(canvas.style.width || '0', 10);
        return { bodyW, canvasStyleW, ratio: canvasStyleW / Math.max(1, bodyW) };
      });
      if (!fit) throw new Error('couldn\'t measure body/canvas width');
      // canvasStyleW should be >= bodyW * 0.97 (allow tiny rounding)
      if (fit.canvasStyleW < fit.bodyW * 0.97) {
        throw new Error(`autoSizeStrategy did NOT fill viewport: canvas=${fit.canvasStyleW}px body=${fit.bodyW}px ratio=${fit.ratio.toFixed(3)}`);
      }
      break;
    }
    case 'sorting': {
      await page.getByTestId('sort-by-name').click();
      await page.waitForTimeout(100);
      const summary = await page.getByTestId('sort-summary').textContent();
      if (!summary?.includes('name:asc')) throw new Error(`sort summary wrong: ${summary}`);
      break;
    }
    case 'filtering': {
      const input = page.getByTestId('external-filter');
      await input.fill('London');
      await page.waitForTimeout(150);
      const allMatch = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-testid="filtering-grid"] .gg-row'));
        if (!rows.length) return 'no rows';
        return rows.every((r) => r.textContent?.toLowerCase().includes('london')) ? 'ok' : 'mismatch';
      });
      if (allMatch !== 'ok') throw new Error(`quick filter mismatch: ${allMatch}`);
      break;
    }
    case 'pagination': {
      await page.getByTestId('goto-last').click();
      await page.waitForTimeout(150);
      const info = await page.getByTestId('page-info').textContent();
      if (!info?.match(/40\s*\/\s*40/)) throw new Error(`pagination info wrong: ${info}`);
      break;
    }
    case 'selection': {
      await page.getByTestId('select-all').click();
      await page.waitForTimeout(150);
      const count = await page.getByTestId('selected-count').textContent();
      if (!count?.includes('300')) throw new Error(`selected count wrong: ${count}`);
      break;
    }
    case 'columns': {
      // 1) Right-click the Name column header → context menu opens with "Pin left" item.
      const grid = page.locator('[data-testid="columns-grid"]');
      const headers = grid.locator('.gg-header-cell');
      const nameHeader = headers.filter({ hasText: 'Name' }).first();
      await nameHeader.click({ button: 'right' });
      await page.waitForTimeout(150);
      const menu = page.locator('.gg-context-menu');
      if (!await menu.count()) throw new Error('header right-click did not open context menu');
      // 2) Click "Pin left"
      const pinLeftBtn = menu.locator('button.gg-menu-item', { hasText: 'Pin left' });
      if (!await pinLeftBtn.count()) throw new Error('"Pin left" item missing in header menu');
      await pinLeftBtn.first().click();
      await page.waitForTimeout(150);
      // 3) Name should now be the leftmost header
      const firstHeader = await grid.locator('.gg-header-cell .gg-header-label').first().textContent();
      if (!firstHeader?.includes('Name')) throw new Error(`right-click Pin left didn't move Name to first: got ${firstHeader}`);
      // 4) Green divider class should be on the Name header (it's the last left-pinned col)
      const hasDivider = await grid.locator('.gg-header-cell.gg-pinned-edge-left').count();
      if (hasDivider < 1) throw new Error('pinned-edge divider class not applied to last left-pinned column');

      // ---- drag-to-pin: unpin Name first via header menu, then drag Title header into the left pin zone ----
      await nameHeader.click({ button: 'right' });
      await page.waitForTimeout(100);
      await page.locator('.gg-context-menu button.gg-menu-item').filter({ hasText: 'Unpin' }).first().click();
      await page.waitForTimeout(150);
      const result = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="columns-grid"]');
        if (!grid) return { ok: false, why: 'no grid' };
        const headers = Array.from(grid.querySelectorAll('.gg-header-cell'));
        const titleHeader = headers.find((h) => h.textContent && h.textContent.includes('Title'));
        if (!titleHeader) return { ok: false, why: 'no title header' };
        const dt = new DataTransfer();
        const dragStart = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt });
        titleHeader.dispatchEvent(dragStart);
        return { ok: true, why: 'started' };
      });
      if (!result.ok) throw new Error(`drag setup failed: ${result.why}`);
      await page.waitForTimeout(100);
      const zoneCount = await page.locator('[data-testid="pin-zone-left"]').count();
      if (!zoneCount) throw new Error('pin-zone-left not rendered during drag');
      const dropResult = await page.evaluate(() => {
        const zone = document.querySelector('[data-testid="pin-zone-left"]');
        if (!zone) return { ok: false, why: 'no zone in dom' };
        const dt = new DataTransfer();
        zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
        zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
        const grid = document.querySelector('[data-testid="columns-grid"]');
        const headers = Array.from(grid?.querySelectorAll('.gg-header-cell') ?? []);
        const titleHeader = headers.find((h) => h.textContent && h.textContent.includes('Title'));
        if (titleHeader) titleHeader.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        return { ok: true };
      });
      if (!dropResult.ok) throw new Error(`drag drop failed: ${dropResult.why}`);
      await page.waitForTimeout(150);
      // Title should now be the leftmost (pinned-left) header
      const firstAfterDrop = await page.locator('[data-testid="columns-grid"] .gg-header-cell .gg-header-label').first().textContent();
      if (!firstAfterDrop?.includes('Title')) {
        throw new Error(`drag-to-pin failed: leftmost header is "${firstAfterDrop}", expected "Title"`);
      }
      const pinnedFirst = await page.locator('[data-testid="columns-grid"] .gg-header-cell.gg-pinned-left').first().textContent();
      if (!pinnedFirst?.includes('Title')) {
        throw new Error(`drag-to-pin: Title not marked gg-pinned-left (got "${pinnedFirst}")`);
      }
      break;
    }
    case 'rendering': {
      const salaryCell = await page.locator('[data-testid="rendering-grid"] .gg-row').first().locator('.gg-cell').nth(3).textContent();
      if (!salaryCell?.includes('$')) throw new Error(`salary not formatted: ${salaryCell}`);
      break;
    }
    case 'themes': {
      await page.getByTestId('dark-toggle').check();
      await page.waitForTimeout(100);
      const isDark = await page.evaluate(() => {
        const g = document.querySelector('glass-grid[data-testid="themes-grid"]');
        return g?.classList.contains('gg-dark');
      });
      if (!isDark) throw new Error('dark mode class not applied');
      // dense variant
      await page.getByTestId('theme-select').selectOption('dense');
      await page.waitForTimeout(150);
      const isDense = await page.evaluate(() => {
        const g = document.querySelector('glass-grid[data-testid="themes-grid"]');
        return g?.classList.contains('variant-dense');
      });
      if (!isDense) throw new Error('dense variant class not applied');
      // brand variant (CSS-var override)
      await page.getByTestId('theme-select').selectOption('brand');
      await page.waitForTimeout(150);
      const isBrand = await page.evaluate(() => {
        const g = document.querySelector('glass-grid[data-testid="themes-grid"]');
        return g?.classList.contains('variant-brand');
      });
      if (!isBrand) throw new Error('brand variant class not applied');
      // RTL
      await page.getByTestId('rtl-toggle').check();
      await page.waitForTimeout(100);
      const isRtl = await page.evaluate(() => {
        const g = document.querySelector('glass-grid[data-testid="themes-grid"]');
        return g?.classList.contains('gg-rtl');
      });
      if (!isRtl) throw new Error('rtl class not applied');
      break;
    }
    case 'performance': {
      await page.getByTestId('rowcount-select').selectOption('100000');
      await page.waitForTimeout(300);
      const stats = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="performance-grid"]');
        const rows = grid?.querySelectorAll('.gg-row').length ?? 0;
        const canvas = grid?.querySelector('.gg-body-canvas');
        return { rows, height: canvas?.getAttribute('style') ?? '' };
      });
      if (stats.rows > 60) throw new Error(`expected <60 DOM rows for virtualisation, got ${stats.rows}`);
      if (!stats.height.includes('3.2e+06') && !stats.height.includes('3200000')) throw new Error(`canvas height wrong: ${stats.height}`);
      break;
    }
    case 'editing': {
      // dblclick first name cell, type a new value, hit Enter
      const cell = page.locator('[data-testid="editing-grid"] .gg-row').first().locator('.gg-cell').nth(1);
      await cell.dblclick();
      await page.waitForTimeout(150);
      const editor = page.locator('[data-testid="editing-grid"] .gg-cell-editor').first();
      const editorCount = await editor.count();
      if (!editorCount) throw new Error('editor did not open');
      await editor.fill('TestEdited');
      await editor.press('Enter');
      await page.waitForTimeout(150);
      const newText = await cell.textContent();
      if (!newText?.includes('TestEdited')) throw new Error(`commit failed; cell now: ${newText}`);
      // last-edit indicator
      const lastEdit = await page.getByTestId('last-edit').textContent();
      if (!lastEdit?.includes('TestEdited')) throw new Error(`lastEdit didn't update: ${lastEdit}`);
      // undo
      await page.keyboard.press('Meta+z').catch(() => page.keyboard.press('Control+z'));
      await page.waitForTimeout(150);
      const undone = await cell.textContent();
      if (undone?.includes('TestEdited')) throw new Error(`undo did not revert; still: ${undone}`);
      break;
    }
    case 'advanced-filtering': {
      // open filter popup on first filterable col by clicking ⏷
      const buttons = page.locator('[data-testid="adv-filter-grid"] .gg-filter-btn');
      const btnCount = await buttons.count();
      if (!btnCount) throw new Error('no filter buttons rendered');
      await buttons.first().click();
      await page.waitForTimeout(150);
      const popup = page.locator('.gg-filter-popup');
      if (!await popup.count()) throw new Error('filter popup did not open');
      // close popup
      await page.keyboard.press('Escape');
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      await page.waitForTimeout(100);
      // floating filter
      const ff = page.locator('[data-testid="adv-filter-grid"] .gg-floating-filter-input').first();
      if (await ff.count()) {
        await ff.fill('Eng');
        await page.waitForTimeout(150);
      }
      break;
    }
    case 'grouping': {
      const rowsBefore = await page.locator('[data-testid="grouping-grid"] .gg-row').count();
      await page.getByTestId('group-dept').click();
      await page.waitForTimeout(200);
      // group rows in viewport: at least 1 visible due to virtualisation
      const groupRows = await page.locator('[data-testid="grouping-grid"] .gg-row-group').count();
      if (groupRows < 1) throw new Error(`expected group row, got ${groupRows}`);
      // verify the displayed-rows count grew (groups added to flat list)
      const totalAfterGrouping = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="grouping-grid"]');
        return grid?.getAttribute('aria-rowcount') ?? null;
      });
      const tot = parseInt(totalAfterGrouping ?? '0', 10);
      if (tot <= 500) throw new Error(`aria-rowcount expected > 500 (incl. groups), got ${tot}`);
      // collapse all then expand all
      await page.getByTestId('collapse-all').click();
      await page.waitForTimeout(150);
      await page.getByTestId('expand-all').click();
      await page.waitForTimeout(150);
      break;
    }
    case 'tree': {
      // click first tree toggle
      const toggle = page.locator('[data-testid="tree-grid"] .gg-tree-toggle, [data-testid="tree-grid"] .gg-group-toggle').first();
      const tCount = await toggle.count();
      if (!tCount) {
        // may not have a special class — just confirm any row rendered
        const rows = await page.locator('[data-testid="tree-grid"] .gg-row').count();
        if (!rows) throw new Error('tree rendered no rows');
      }
      break;
    }
    case 'master-detail': {
      // click first detail toggle
      const toggle = page.locator('[data-testid="master-detail-grid"] .gg-detail-toggle').first();
      const c = await toggle.count();
      if (!c) throw new Error('no detail toggles found');
      await toggle.click();
      await page.waitForTimeout(150);
      const detailRows = await page.locator('[data-testid="master-detail-grid"] .gg-row-detail').count();
      if (!detailRows) throw new Error('detail row did not appear');
      break;
    }
    case 'range': {
      const grid = page.locator('[data-testid="range-grid"]');
      const cells = grid.locator('.gg-row').first().locator('.gg-cell');
      const start = await cells.nth(1).boundingBox();
      const end = await cells.nth(3).boundingBox();
      if (!start || !end) throw new Error('cells not laid out');
      await page.mouse.move(start.x + 5, start.y + 5);
      await page.mouse.down();
      await page.mouse.move(end.x + 5, end.y + 5);
      await page.mouse.up();
      await page.waitForTimeout(150);
      const ranged = await grid.locator('.gg-cell-range').count();
      if (ranged < 2) throw new Error(`range selection did not register, ranged cells = ${ranged}`);
      break;
    }
    case 'row-drag': {
      const grid = page.locator('[data-testid="row-drag-grid"]');
      const rows = await grid.locator('.gg-row').count();
      if (rows < 3) throw new Error('row-drag grid rendered too few rows');
      // (drag-and-drop with HTML5 native events is unreliable headless; verify the handle exists)
      const handle = grid.locator('.gg-row-drag-handle').first();
      if (!await handle.count()) throw new Error('no row drag handle rendered');
      break;
    }
    case 'sidebar-statusbar': {
      // verify status bar present
      const status = page.locator('[data-testid="sidebar-statusbar-grid"] .gg-status-bar, .gg-status-bar').first();
      if (!await status.count()) throw new Error('status bar missing');
      // sidebar toggle button present
      const sbBtn = page.locator('.gg-sidebar-toggle').first();
      if (await sbBtn.count()) {
        await sbBtn.click();
        await page.waitForTimeout(100);
        const sb = page.locator('.gg-sidebar').first();
        if (!await sb.count()) throw new Error('sidebar did not open');
      }
      break;
    }
    case 'sparklines': {
      const svgs = await page.locator('[data-testid="sparklines-grid"] svg').count();
      if (svgs < 5) throw new Error(`expected sparklines svg, got ${svgs}`);
      break;
    }
    case 'api-extras': {
      const rowsBefore = await page.locator('[data-testid="api-extras-grid"] .gg-row').count();
      await page.getByTestId('add-row').click();
      await page.waitForTimeout(150);
      const countText = await page.getByTestId('row-count').textContent();
      if (!countText?.includes('31')) throw new Error(`add-row didn't bump count: ${countText}`);
      await page.getByTestId('get-schema').click();
      await page.waitForTimeout(100);
      const schema = await page.getByTestId('schema-out').textContent();
      if (!schema?.includes('"columns"')) throw new Error('schema missing columns key');
      await page.getByTestId('paste-sample').click();
      await page.waitForTimeout(100);
      break;
    }
    case 'pinned-rows': {
      const top = await page.locator('[data-testid="pinned-rows-grid"] .gg-pinned-top .gg-row-pinned').count();
      const bot = await page.locator('[data-testid="pinned-rows-grid"] .gg-pinned-bottom .gg-row-pinned').count();
      if (top < 1) throw new Error('no pinned top row rendered');
      if (bot < 1) throw new Error('no pinned bottom row rendered');
      break;
    }
    case 'column-groups': {
      // there should be at least one header-group level
      const levels = await page.locator('[data-testid="column-groups-grid"] .gg-header-groups').count();
      if (levels < 1) throw new Error('no group-header level rendered');
      // collapse a group
      const btn = page.locator('[data-testid="column-groups-grid"] .gg-group-collapse-btn').first();
      const c = await btn.count();
      if (!c) throw new Error('no collapse button');
      await btn.click();
      await page.waitForTimeout(150);
      break;
    }
    case 'pivot': {
      // verify the second grid (pivot result) renders
      const headers = await page.locator('[data-testid="pivot-result-grid"] .gg-header-cell').count();
      if (headers < 2) throw new Error(`pivot result grid expected headers, got ${headers}`);
      break;
    }
    case 'server-side': {
      // wait for the simulated load
      await page.waitForTimeout(400);
      const cnt = await page.getByTestId('server-rows').textContent();
      if (!cnt?.includes('100')) throw new Error(`server-side did not load: ${cnt}`);
      break;
    }
    case 'set-filter': {
      await page.getByTestId('dept-Engineering').check();
      await page.waitForTimeout(150);
      const txt = await page.getByTestId('filter-count').textContent();
      if (!txt?.includes('1')) throw new Error(`set-filter count wrong: ${txt}`);
      break;
    }
    case 'advanced-filter-builder': {
      await page.getByTestId('apply-rules').click();
      await page.waitForTimeout(150);
      // first row should be Engineering
      const firstDept = await page.locator('[data-testid="advanced-builder-grid"] .gg-row').first().textContent();
      if (firstDept && !firstDept.includes('Engineering')) throw new Error(`filter didn't apply: ${firstDept}`);
      break;
    }
    case 'wrap-text': {
      const has = await page.locator('[data-testid="wrap-text-grid"] .gg-cell.gg-wrap-text').count();
      if (has < 1) throw new Error('wrap-text class missing on cells');
      break;
    }
    case 'lock': {
      await page.getByTestId('hide-id').click();
      await page.waitForTimeout(150);
      const visText = await page.getByTestId('id-visible').textContent();
      if (!visText?.includes('true')) throw new Error(`lockVisible failed: ${visText}`);
      break;
    }
    case 'span': {
      const rows = await page.locator('[data-testid="span-grid"] .gg-row').count();
      if (rows < 5) throw new Error('span grid rendered too few rows');
      break;
    }
    case 'column-virt': {
      // 101 columns; with virt on, far fewer in DOM
      const stats = await page.evaluate(() => {
        const grid = document.querySelector('[data-testid="column-virt-grid"]');
        const headers = grid?.querySelectorAll('.gg-header-cell').length ?? 0;
        return { headers };
      });
      if (stats.headers === 0) throw new Error('no headers rendered');
      if (stats.headers >= 100) throw new Error(`expected column virt to limit headers, got ${stats.headers}`);
      break;
    }
    case 'charts': {
      // select all rows via header checkbox
      const cb = page.locator('[data-testid="charts-grid"] input[aria-label="Select all rows"]').first();
      if (!await cb.count()) throw new Error('no select-all checkbox');
      await cb.check();
      await page.waitForTimeout(150);
      const svg = await page.locator('[data-testid="chart-output"] svg').count();
      if (svg === 0) throw new Error('chart svg not rendered after selection');
      break;
    }
    case 'infinite': {
      const before = await page.getByTestId('loaded-rows').textContent();
      await page.waitForTimeout(300);
      const after = await page.getByTestId('loaded-rows').textContent();
      if (!after?.includes('200')) throw new Error(`infinite did not load initial batch: ${before} -> ${after}`);
      await page.getByTestId('load-more').click();
      await page.waitForTimeout(300);
      const after2 = await page.getByTestId('loaded-rows').textContent();
      if (!after2?.includes('400')) throw new Error(`load-more didn't accumulate: ${after2}`);
      break;
    }
    case 'multi-filter': {
      const buttons = page.locator('[data-testid="multi-filter-grid"] .gg-filter-btn');
      if (!await buttons.count()) throw new Error('no filter buttons on multi-filter');
      break;
    }
    case 'floating-filter-component': {
      // The Department column's floating filter should be a <select>, not a <input>.
      const grid = page.locator('[data-testid="floating-filter-grid"]');
      const sel = grid.locator('select.ff-dropdown').first();
      if (!await sel.count()) throw new Error('custom floating filter (select) did not render');
      // Pick "Engineering" and verify rows shrink to only Engineering rows.
      await sel.selectOption('Engineering');
      await page.waitForTimeout(200);
      const allEng = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('[data-testid="floating-filter-grid"] .gg-row'));
        if (!cells.length) return 'no rows';
        return cells.every((r) => r.textContent && r.textContent.includes('Engineering')) ? 'ok' : 'mismatch';
      });
      if (allEng !== 'ok') throw new Error(`dropdown filter did not apply: ${allEng}`);
      break;
    }
    case 'ag-binding': {
      // The grid uses the infinite row model + datasource pattern, so first rows
      // arrive after the simulated 200ms backend delay.
      await page.waitForTimeout(400);
      const loads = await page.getByTestId('ag-binding-loads').textContent();
      if (!loads?.match(/Datasource loads: [1-9]/)) throw new Error(`datasource never called: ${loads}`);
      const rowsTxt = await page.getByTestId('ag-binding-rows').textContent();
      if (!rowsTxt?.includes('2000')) throw new Error(`row count not loaded: ${rowsTxt}`);
      // Edit hyperlink renderer should produce real DOM buttons
      const editBtns = await page.locator('[data-testid="ag-binding-grid"] button.edit-button').count();
      if (editBtns < 1) throw new Error(`EditHyperLink renderer did not produce buttons (got ${editBtns})`);
      // Page size change should trigger refreshInfiniteCache → another datasource call
      const loadsBefore = parseInt((await page.getByTestId('ag-binding-loads').textContent())?.match(/\d+/)?.[0] ?? '0', 10);
      await page.getByTestId('ag-binding-page-size').selectOption('20');
      await page.waitForTimeout(400);
      const loadsAfter = parseInt((await page.getByTestId('ag-binding-loads').textContent())?.match(/\d+/)?.[0] ?? '0', 10);
      if (loadsAfter <= loadsBefore) {
        throw new Error(`page-size change did not refresh datasource: ${loadsBefore} → ${loadsAfter}`);
      }
      break;
    }
    case 'cell-components': {
      const grid = page.locator('[data-testid="cell-components-grid"]');
      // 0) Regression guard: header cells must align with body cells when auto-fit is on.
      const align = await page.evaluate(() => {
        const g = document.querySelector('[data-testid="cell-components-grid"]');
        if (!g) return null;
        const headers = Array.from(g.querySelectorAll('.gg-header-cell')).map(h => Math.round(h.getBoundingClientRect().width));
        const firstRow = g.querySelector('.gg-row:not(.gg-row-group):not(.gg-row-detail)');
        const cells = firstRow ? Array.from(firstRow.querySelectorAll('[role="gridcell"]')).map(c => Math.round(c.getBoundingClientRect().width)) : [];
        return { headers, cells };
      });
      if (!align) throw new Error('grid not found for alignment check');
      if (align.headers.length !== align.cells.length) {
        throw new Error(`column count mismatch: header=${align.headers.length} body=${align.cells.length}`);
      }
      for (let i = 0; i < align.headers.length; i++) {
        const dh = align.headers[i];
        const dc = align.cells[i];
        if (Math.abs(dh - dc) > 2) {
          throw new Error(`col ${i} misaligned: header=${dh}px body=${dc}px (must match within 2px)`);
        }
      }
      // 1) Dropdown component renders (a real <select>)
      const sel = grid.locator('select.dept-cell').first();
      if (!await sel.count()) throw new Error('dropdown cell component did not render');
      await sel.selectOption('Sales');
      // 2) Stepper component renders + responds to clicks
      const inc = grid.locator('[data-testid^="stepper-inc-"]').first();
      const valSpan = grid.locator('[data-testid^="stepper-val-"]').first();
      const before = await valSpan.textContent();
      await inc.click();
      await page.waitForTimeout(50);
      const after = await valSpan.textContent();
      if (before === after) throw new Error(`stepper didn't increment: ${before} → ${after}`);
      // 3) Action buttons with cellComponentInputs callback
      const view = grid.locator('[data-testid^="action-view-"]').first();
      await view.click();
      await page.waitForTimeout(50);
      const last = await page.getByTestId('last-action').textContent();
      if (!last?.startsWith('view:')) throw new Error(`action callback didn't fire: ${last}`);
      break;
    }
    case 'export-state': {
      // press the "Save state" button (or similar)
      const saveBtn = page.getByText(/save state/i).first();
      if (await saveBtn.count()) {
        await saveBtn.click();
        await page.waitForTimeout(100);
      }
      // verify CSV export button exists
      const csvBtn = page.getByText(/csv/i).first();
      if (!await csvBtn.count()) throw new Error('no CSV button found');
      break;
    }
    default: break;
  }
}
