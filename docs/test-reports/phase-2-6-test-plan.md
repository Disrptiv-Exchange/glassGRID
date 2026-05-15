# Phase 2-6 — Manual test plan

This document is the checklist the user (or grid-tester agent) should walk through to verify the Phase 2-6 additions. The dev server is live at **http://localhost:4200**.

> Build verified clean as of 2026-05-14T17:07:31Z. All 19 routes return HTTP 200.

## Routes added beyond Phase 1

| Path | What to verify |
|---|---|
| `/editing` | Double-click a cell to edit. Built-in editors: text (name), select (department), number (level, salary), date (hireDate), checkbox (active), largeText (notes). Enter commits, Esc cancels, Tab commits + moves right. Hit Ctrl/Cmd+Z to undo, Shift+Ctrl/Cmd+Z to redo. Watch the `lastEdit` line update. Flash animation should fire on commit. |
| `/advanced-filtering` | Click the ⏷ in each header — popup shows op selector + value field. For "inRange" a second input appears. Type into the floating filter row beneath the header — it filters as-you-type. Multiple column filters AND together. |
| `/grouping` | Click "Group by department" — rows roll up into department groups with row count + agg cells (sum salary, avg rating). Click a group row to expand/collapse. "Group by dept + level" creates two-level nesting. "Expand all" / "Collapse all" buttons work. |
| `/tree` | Hierarchical org chart via `getDataPath`. Click the toggle ▸/▾ to expand a node. |
| `/master-detail` | Click the ▸ in the auto-group cell on a row to expand a detail row that renders the row's JSON in a code block. |
| `/range` | Click a cell, drag to another — selected range highlights with the accent border. Ctrl/Cmd+C copies the range to clipboard as TSV (paste into a spreadsheet). Shift-click extends from the anchor. |
| `/row-drag` | Drag a row by the ⋮⋮ handle to reorder. Order persists in the internal `rowOrder` until you rebind `[rowData]`. |
| `/sidebar-statusbar` | Right edge has a Columns panel (toggle column visibility) and Filters panel (per-column filter shortcut). Footer status bar shows live selected/filtered/total/sum/avg. |
| `/sparklines` | Three columns each rendering inline SVG sparklines (line, bar, area) — no runtime chart library. |
| `/export-state` | "Download CSV" triggers browser download. "Save state" prints JSON of full grid state (columns + sort + filter + pagination). "Restore" replays it back. |
| `/themes` | Theme dropdown switches between Quartz / Quartz dense / Material / Balham / Custom brand. Dark mode + RTL toggle independently. |

## Cross-cutting checks

- **Console health** — no errors should appear in DevTools as you click through every route.
- **Performance** — the `/performance` route should still scroll 100k rows smoothly. The new features have not introduced regressions to the virtualised render path.
- **Keyboard nav** — arrow keys, Tab (commits edit if active), Enter, F2, Space, PageUp/Down, Home/End, Ctrl+A (select all), Ctrl+C (copy), Ctrl+Z / Shift+Ctrl+Z (undo / redo).
- **A11y** — `role="grid"` on host, `role="row"` / `role="columnheader"` / `role="gridcell"`, plus `aria-expanded` on group rows, `aria-sort` on sortable headers.
- **Themes wired** — `/themes` route accepts Material + Balham options via `gg-theme-material` / `gg-theme-balham` host classes.
- **RTL** — toggle on the `/themes` page should mirror the layout (host gains `dir="rtl"` and `gg-rtl` class).

## Known not-yet-shipped (deferred to a later session)

These are typed in the API surface or appear in ag-grid but are not implemented in this drop:

- **Column groups** (nested header rows / `columnGroupShow`)
- **Pivoting** (rotate rows into columns)
- **Server-side row model / infinite row model**
- **Integrated charts** (full charting — sparklines ship as a substitute)
- **Excel (.xlsx) export** (only CSV ships)
- **AI Toolkit / MCP**
- **Cell range fill handle in production-ready form** (anchor + selection ships; the drag-to-fill copy/series mode is partial)
- **Range copy with paste** (paste from clipboard is not wired; copy works)
- **Print full-page layout option** (CSS print rules ship but `domLayout='print'` doesn't yet force render-all)
- **Pinned top / bottom rows**
- **Custom header / header-group components**
- **Auto row height + wrap text**
- **`isRowMaster` filter for master-detail** (typed; all rows are master in current build)

## How to run

```bash
cd "/Users/nimishdesai/Documents/Code Workspace/glassGRID/glassgrid-workspace"
npm run start
# open http://localhost:4200
```

If the server isn't running, the existing background process serves at port 4200. To stop and restart, kill the dev server and rerun `npm run start`.
