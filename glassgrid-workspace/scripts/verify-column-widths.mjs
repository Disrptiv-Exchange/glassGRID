#!/usr/bin/env node
// Focused verification for column-width behavior after the auto-fit refactor.
// Probes the running demo for:
//   S1: no header is ellipsis-truncated on /basic
//   S2: column widths fill the viewport (no trailing whitespace)
//   S3: shrink viewport → columns re-spread via ResizeObserver
//   S4: grow viewport → columns re-spread via ResizeObserver

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.GG_BASE ?? 'http://localhost:4250';
const MAC_CHROME = '/Users/nimishdesai/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const browser = await chromium.launch({
  ...(existsSync(MAC_CHROME) ? { executablePath: MAC_CHROME } : {}),
  headless: true,
});

const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

await page.goto(`${BASE}/basic`, { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForSelector('glass-grid .gg-header-cell', { timeout: 10_000 });
await page.waitForTimeout(400);

const probeHeaders = async () => page.evaluate(() => {
  const cells = Array.from(document.querySelectorAll('glass-grid .gg-header-cell'));
  return cells.map((c) => {
    const label = c.querySelector('.gg-header-label');
    return {
      text: (label?.textContent ?? '').trim(),
      width: Math.round(c.getBoundingClientRect().width),
      truncated: !!label && label.scrollWidth > label.clientWidth + 0.5,
    };
  });
});

const probeFill = async () => page.evaluate(() => {
  const vp = document.querySelector('glass-grid .gg-body');
  const cells = Array.from(document.querySelectorAll('glass-grid .gg-header-cells > .gg-header-cell'));
  const total = cells.reduce((a, c) => a + c.getBoundingClientRect().width, 0);
  return { vpWidth: vp ? vp.clientWidth : 0, total: Math.round(total) };
});

const results = [];
const assert = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// S1: no header truncated
let headers = await probeHeaders();
const truncated = headers.filter((h) => h.truncated).map((h) => h.text);
assert(
  'S1: no header is ellipsis-truncated on /basic',
  truncated.length === 0,
  truncated.length ? `truncated: ${truncated.join(', ')}` : `${headers.length} headers, all fit`,
);

// S2: viewport is filled (gap ≤ 4px tolerated for sub-pixel rounding)
let fill = await probeFill();
let gap = fill.vpWidth - fill.total;
assert(
  'S2: total column width fills viewport (no whitespace gap)',
  Math.abs(gap) <= 4,
  `viewport=${fill.vpWidth}px, columns=${fill.total}px, gap=${gap}px`,
);

// S3: shrink viewport below natural sum → horizontal scroll, no whitespace
// (fitGridWidth scales up only; on overflow the body scrolls horizontally.)
await page.setViewportSize({ width: 900, height: 900 });
await page.waitForTimeout(300);
fill = await probeFill();
gap = fill.vpWidth - fill.total;
assert(
  'S3: after viewport shrink → no whitespace gap (overflow → horizontal scroll is OK)',
  gap <= 4, // negative gap = overflow (correct); positive gap > 4 = whitespace (bug)
  `viewport=${fill.vpWidth}px, columns=${fill.total}px, gap=${gap}px`,
);

// S4: grow viewport back → columns re-spread to fill again
await page.setViewportSize({ width: 1600, height: 900 });
await page.waitForTimeout(300);
fill = await probeFill();
gap = fill.vpWidth - fill.total;
assert(
  'S4: after viewport grow → columns re-spread to fill (no whitespace gap)',
  Math.abs(gap) <= 4,
  `viewport=${fill.vpWidth}px, columns=${fill.total}px, gap=${gap}px`,
);

// --- Scenarios 5-7: autoSizeStrategy='fitCellContents' on /fit-cell-contents ---
await page.goto(`${BASE}/fit-cell-contents`, { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForSelector('glass-grid .gg-header-cell', { timeout: 10_000 });
await page.waitForTimeout(500);

const fcHeaders = await probeHeaders();
const byText = Object.fromEntries(fcHeaders.map((h) => [h.text, h]));

// S5: a column with short cell data ("500"/"5,000" etc.) under a long header
// ("Ordered Qty") must be narrow — i.e. the header DOES truncate.
const orderedQty = byText['Ordered Qty'];
assert(
  "S5: fitCellContents — 'Ordered Qty' column sizes to cell data, header truncates",
  !!orderedQty && orderedQty.truncated,
  orderedQty ? `width=${orderedQty.width}, truncated=${orderedQty.truncated}` : 'header not found',
);

// S6: another short-data column — "Branch Plant Code" has cells "PKG01" etc., header is long
const branch = byText['Branch Plant Code'];
assert(
  "S6: fitCellContents — 'Branch Plant Code' (short cells) sizes narrow, header truncates",
  !!branch && branch.truncated,
  branch ? `width=${branch.width}, truncated=${branch.truncated}` : 'header not found',
);

// S7: minWidth (60px set in defaultColDef) is still respected — no column is smaller than that
const tooNarrow = fcHeaders.find((h) => h.width < 60);
assert(
  'S7: fitCellContents — minWidth is still respected (no column < 60px)',
  !tooNarrow,
  tooNarrow ? `column "${tooNarrow.text}" is ${tooNarrow.width}px (< 60)` : `min width across all = ${Math.min(...fcHeaders.map((h) => h.width))}px`,
);

if (errors.length) {
  console.log(`\nCONSOLE ERRORS: ${errors.length}`);
  errors.slice(0, 3).forEach((e) => console.log(`  - ${e}`));
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length} pass / ${failed.length} fail / ${results.length} total ===`);
process.exit(failed.length === 0 && errors.length === 0 ? 0 : 1);
