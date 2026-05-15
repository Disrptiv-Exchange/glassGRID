# Full e2e suite

**Date:** 2026-05-14 · **Result:** 33 / 33 routes pass · **0 failures**

```
[PASS] /basic              [PASS] /api-extras
[PASS] /sorting            [PASS] /pinned-rows
[PASS] /filtering          [PASS] /column-groups
[PASS] /pagination         [PASS] /pivot
[PASS] /selection          [PASS] /server-side
[PASS] /columns            [PASS] /set-filter
[PASS] /rendering          [PASS] /advanced-filter-builder
[PASS] /themes             [PASS] /wrap-text
[PASS] /performance        [PASS] /lock
[PASS] /editing            [PASS] /span
[PASS] /advanced-filtering [PASS] /column-virt
[PASS] /grouping           [PASS] /charts
[PASS] /tree               [PASS] /infinite
[PASS] /master-detail      [PASS] /multi-filter
[PASS] /range
[PASS] /row-drag
[PASS] /sidebar-statusbar
[PASS] /sparklines
[PASS] /export-state
```

## How it runs

Located at `glassgrid-workspace/scripts/e2e.mjs`, uses Node Playwright with the bundled Chrome-for-Testing binary (avoids the user's regular Chrome).

```bash
cd glassgrid-workspace
npm run start   # in one terminal
node scripts/e2e.mjs            # in another, runs all 33 routes
node scripts/e2e.mjs editing    # run only routes matching "editing"
```

## What each route asserts

| Route | Key assertions |
|---|---|
| basic | rows + ARIA roles + virtualisation |
| sorting | indicator + summary + multi-sort cycle |
| filtering | quick filter narrows rows to query |
| pagination | 1k rows / page 40, last-page disable |
| selection | select-all → 300/300 + aria-selected |
| columns | pin-left moves column + drag-to-reorder |
| rendering | salary formatted `$X`, custom renderer, class rules |
| themes | dark class toggle, Material/Balham classes, RTL |
| performance | 100k rows → ≤60 DOM rows after virtualisation |
| editing | dblclick → editor → Enter commits → undo reverts |
| advanced-filtering | filter button opens popup, floating filter input |
| grouping | group-by-dept produces group rows, aria-rowcount grows |
| tree | hierarchical rows render |
| master-detail | detail toggle expands → `.gg-row-detail` appears |
| range | mouse drag selects rectangular range |
| row-drag | drag handle present |
| sidebar-statusbar | status bar + sidebar visible |
| sparklines | inline SVG sparklines render |
| export-state | save state button present |
| api-extras | applyTransaction add/remove/update + getStructuredSchema + paste |
| pinned-rows | top + bottom pinned rows render |
| column-groups | group-header level + collapse button |
| pivot | second grid has pivot columns + rows |
| server-side | 100 rows loaded via async datasource after 250ms |
| set-filter | external multi-select filters |
| advanced-filter-builder | composed rules apply, first row matches |
| wrap-text | `.gg-wrap-text` class on cells |
| lock | lockVisible refuses to hide locked column |
| span | colSpan-typed column renders rows |
| column-virt | 101 cols × 500 rows → <100 cells in DOM with virt on |
| charts | row select → SVG chart renders |
| infinite | initial 200 rows load, "Load next 200" accumulates |
| multi-filter | filter buttons on multiple cols |
