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

// --- Scenarios 5-7: 'fitCellContents' deprecated alias on /fit-cell-contents ---
// As of v0.4.16, 'fitCellContents' behaves identically to 'fitGridWidth':
// columns size to max(header, cell). The old cell-only behavior is reverted.
await page.goto(`${BASE}/fit-cell-contents`, { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForSelector('glass-grid .gg-header-cell', { timeout: 10_000 });
await page.waitForTimeout(500);

const fcHeaders = await probeHeaders();
const byText = Object.fromEntries(fcHeaders.map((h) => [h.text, h]));

// S5: long header over short cells — header MUST fit (no truncation) now that
// the alias is in effect. Column widens to the header.
const orderedQty = byText['Ordered Qty'];
assert(
  "S5: 'fitCellContents' (alias) — 'Ordered Qty' header fits, column widens for header",
  !!orderedQty && !orderedQty.truncated,
  orderedQty ? `width=${orderedQty.width}, truncated=${orderedQty.truncated}` : 'header not found',
);

// S6: "Branch Plant Code" header over short "PKG01" cells — header must fit.
const branch = byText['Branch Plant Code'];
assert(
  "S6: 'fitCellContents' (alias) — 'Branch Plant Code' header fits, column widens",
  !!branch && !branch.truncated,
  branch ? `width=${branch.width}, truncated=${branch.truncated}` : 'header not found',
);

// S7: total natural width is small for 6 columns, so the fill-viewport upscaling
// should kick in — total columns ≈ viewport width, leaving no whitespace gap.
const viewport = await page.evaluate(() => {
  const vp = document.querySelector('glass-grid .gg-body');
  const cells = Array.from(document.querySelectorAll('glass-grid .gg-header-cells > .gg-header-cell'));
  return {
    vpWidth: vp ? vp.clientWidth : 0,
    total: Math.round(cells.reduce((a, c) => a + c.getBoundingClientRect().width, 0)),
  };
});
const fcGap = viewport.vpWidth - viewport.total;
assert(
  "S7: 'fitCellContents' (alias) — fill-viewport applies; no whitespace gap",
  Math.abs(fcGap) <= 4,
  `viewport=${viewport.vpWidth}px, columns=${viewport.total}px, gap=${fcGap}px`,
);

// --- Scenarios 8-10: async data arrival (v0.4.17 regression fixture) -----
// The /auto-fit-async route mounts with empty rowData and pushes data 250ms
// later. Auto-fit must NOT finalise on the empty-cell rAF probe; it must
// re-measure once cells render. Before v0.4.17 the "Status" column would
// stay locked at ~60px ("STATUS" header) and truncate "Order Approved",
// and the "Company" column would stay at ~80px and truncate "P.T. Multi
// Bintang Indonesia Tbk".
await page.goto(`${BASE}/auto-fit-async`, { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForSelector('glass-grid .gg-header-cell', { timeout: 10_000 });
// Wait for the row data to arrive (250ms) + auto-fit re-measure (one frame).
await page.waitForSelector('glass-grid .gg-body .gg-cell', { timeout: 10_000 });
await page.waitForTimeout(600);

const asyncHeaders = await probeHeaders();
const asyncByText = Object.fromEntries(asyncHeaders.map((h) => [h.text, h]));

// S8: short header / long cell — "Status" header is 6 chars, cells include
// "Order Approved" (14 chars). Column must widen to fit the cells.
const statusCol = asyncByText['Status'];
assert(
  'S8: async — short-header / long-cell column widens to fit cells',
  !!statusCol && statusCol.width >= 110,
  statusCol ? `Status width=${statusCol.width}px (expect ≥ 110px to fit "Order Approved")` : 'header not found',
);

// S9: short header / very long cell — "Company" header is 7 chars, cell is
// "P.T. Multi Bintang Indonesia Tbk" (32 chars). Column must widen.
const companyCol = asyncByText['Company'];
assert(
  'S9: async — extremely long cell still widens column past header',
  !!companyCol && companyCol.width >= 200,
  companyCol ? `Company width=${companyCol.width}px (expect ≥ 200px)` : 'header not found',
);

// S10: long header / short cell — "Ordered Quantity" (16 chars) vs "500".
// Column must widen to fit the header even before cells arrive.
const qtyCol = asyncByText['Ordered Quantity'];
assert(
  "S10: async — long-header / short-cell column widens to fit header",
  !!qtyCol && qtyCol.width >= 140,
  qtyCol ? `Ordered Quantity width=${qtyCol.width}px (expect ≥ 140px)` : 'header not found',
);

if (errors.length) {
  console.log(`\nCONSOLE ERRORS: ${errors.length}`);
  errors.slice(0, 3).forEach((e) => console.log(`  - ${e}`));
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length} pass / ${failed.length} fail / ${results.length} total ===`);
process.exit(failed.length === 0 && errors.length === 0 ? 0 : 1);
