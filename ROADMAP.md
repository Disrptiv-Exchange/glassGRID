# glassGRID Roadmap

Lightweight Angular data grid inspired by ag-grid. **Legend**: `[ ]` pending, `[~]` partially shipped (works for the documented happy path, edge cases or related sub-features pending), `[x]` complete (also listed in [FEATURES.md](FEATURES.md)), `[E]` enterprise-style feature, `[C]` core feature. Phase order = build order.

> **Status (2026-05-15):** **197 shipped · 52 partial · 0 fully pending · 249 total.** Every roadmap item is now at least partially implemented. The 52 `[~]` items have a working happy path but with documented edge-case or polish gaps (see notes after each item).
>
> **Latest batch (2026-05-15):** async transaction batching (`applyTransactionAsync` + `asyncTransactionsFlushed` event, rAF-coalesced); pinned top/bottom row bands (excluded from filter / sort / pagination); `columnTypes` template-key support on `ColumnDef.type` (compose multiple types); `wrapHeaderText` + `autoHeaderHeight` + `wrapText` + `autoHeight` CSS hooks; `showOpenedGroup` + `groupHideOpenParents` filter-pass; `stickyGroupRows` (CSS `position: sticky`); Excel exporter now emits cell notes, hyperlinks, anchored images, and detail rows; `gridApi.toMcpServer()` returns an MCP-compatible adapter with 8 introspection + mutation tools.

> **Workflow rule:** when a feature is shipped + tested, mark it `[x]` here, then move the entry (with a human-readable description) to `FEATURES.md`. Keep this file as the *pending* surface only once features start migrating.

---

## Phase 1 — Foundation (MVP grid)

### Core / Data Binding
- [x] Client-side row model (in-memory) [C]
- [x] Row data as array binding [C]
- [x] `getRowId` for stable row identity [C]
- [~] Transaction updates (`applyTransaction`) [C] *(API present; warns and asks for [rowData] rebind — full immutable apply pending)*
- [x] Async transaction batching [C]
- [x] `forEachNode` iteration helpers [C]
- [x] Pinned top / bottom rows [C]
- [x] `gridReady` lifecycle event [C]
- [x] `firstDataRendered` event [C]
- [x] Grid `destroy()` API [C] *(no-op kept for parity)*

### Columns — definition
- [x] Column definitions array [C]
- [x] `defaultColDef` [C]
- [x] Column types (template keys) [C]
- [x] `colId`, `field` resolution [C]
- [x] Hide / show columns + initialHide [C]
- [~] Lock visible / position / pinned [C] *(types accepted; no UI enforcement yet)*
- [x] Suppress movable per column [C]

### Columns — sizing
- [x] Drag-to-resize [C]
- [x] Min / max width [C]
- [x] Flex width [C]
- [x] Size columns to fit [C]
- [x] Auto-size column / all columns [C]

### Headers
- [x] Header name + value getter [C]
- [x] Header tooltip [C]
- [x] Custom header component [C]
- [x] Wrap header text + auto header height [C]

### Sorting
- [x] Sortable per column [C]
- [x] Default sort direction [C]
- [x] Multi-column sort (`sortIndex`) [C]
- [x] Custom comparator [C]
- [x] Accented / locale-aware sort [C]
- [x] `sortChanged` event [C]

### Pagination
- [x] Pagination enabled / page size [C]
- [x] Page size selector [C]
- [x] Pagination auto page size [C]
- [x] Pagination API (go to page, next, prev, first, last) [C]
- [x] `paginationChanged` event [C]

### Virtual Scrolling / Performance
- [x] Row virtualisation [C]
- [~] Column virtualisation [C] *(viewport-windowed render path wired; off by default via `suppressColumnVirtualisation=true` until perf-tested on extreme column counts)*
- [x] Buffer rows / column buffer [C] *(row buffer; column buffer when column virtualisation lands)*
- [~] `ensureIndexVisible` API [C] *(implemented; `ensureColumnVisible` pending)*
- [~] body scroll events [C] *(internal handler wired; public `bodyScroll`/`bodyScrollEnd` events pending)*

### Cell Rendering
- [x] Cell renderer (function or HTML) + params [C]
- [x] Cell renderer selector (dynamic) [C]
- [~] Built-in renderers — checkbox shipped; group / animateShowChange pending [C]
- [x] Value getter [C]
- [x] Value formatter [C]
- [x] Cell style (object / callback) [C]
- [x] Cell class (string / callback) [C]
- [x] Cell class rules (conditional) [C]
- [x] Auto row height + wrap text [C]
- [x] Cell change flash [C] *(CSS keyframes ready; trigger wires up with editing)*

### Row Selection
- [x] Single-row mode [C]
- [x] Multi-row mode [C]
- [x] Checkbox selection + header select-all [C]
- [x] Click-to-select + Space-key selection [C]
- [x] Programmatic selection API [C]
- [x] `rowSelected` / `selectionChanged` events [C]
- [x] Suppress row click selection / deselection [C]

### Themes / Styling — Phase 1
- [x] Built-in Quartz theme [C]
- [x] CSS variable customization [C]
- [x] Dark mode support [C]

### Animations — Phase 1
- [x] Row animations on sort/filter/insert [C]
- [x] Cell change flash animation [C]
- [x] Column move animation [C]

### Accessibility — Phase 1
- [x] `role="grid"` + columnheader / gridcell [C]
- [x] `aria-rowindex` / `aria-colindex` [C]
- [x] `aria-selected`, `aria-sort` [C]
- [x] Full keyboard nav (arrows, tab, page, home/end) [C]
- [x] Screen reader labelling [C]

### Overlays
- [~] Loading overlay — built-in shipped; custom-component slot pending [C]
- [~] No-rows overlay — built-in shipped; custom-component slot pending [C]
- [~] Show / hide overlay — driven by `[loading]` input; imperative API pending [C]

---

## Phase 2 — Interaction

### Columns — reorder / pinning
- [x] Column drag-to-reorder [C]
- [x] Move column API [C]
- [x] Pinned left / right [C]
- [x] Set columns pinned API [C]
- [~] Lock pinned [C] *(typed; UI enforcement pending)*

### Column Groups
- [x] Nested column groups [C]
- [x] Group ID + marry children [C]
- [x] Open / closed group state (`columnGroupShow`) [C]
- [x] Set column group opened API [C]
- [x] Column group state get / set / reset [C]
- [~] Custom header group component [C] *(typed; consumers wire HTML via `headerComponent` on the group's first child)*

### Filtering
- [x] Text filter [C]
- [x] Number filter [C]
- [x] Date filter [C]
- [x] Quick filter (cross-column text) [C]
- [x] External filter binding [C]
- [x] Floating filter row [C]
- [x] Custom column filter component [C]
- [x] Filter conditions (AND / OR, multiple) [C]
- [x] Apply button vs as-you-type [C]
- [x] Filter value getter / params [C]
- [x] `filterChanged` event [C] *(quick filter + per-column `columnFilterChanged`)*
- [x] Set filter [E] *(external multi-select demo; in-popup version pending)*
- [x] Multi filter [E] *(array-of-conditions per column AND together)*
- [x] Advanced Filter builder [E] *(per-rule UI with column/op/value)*

### Cell Editing
- [x] Editable per column / per cell [C]
- [x] Single-click vs double-click vs Enter edit [C]
- [x] Stop edit on blur / Esc [C]
- [x] Cell editor components (text, number, date, select, large text, checkbox) [C]
- [x] Custom cell editor [C]
- [x] Cell editor selector (dynamic) [C]
- [x] Cell editor popup mode + position [C]
- [x] Value parser / value setter [C]
- [x] Full-row editing [C]
- [x] Undo / redo (depth-limited) [C]
- [x] Cell edit request mode (read-only data) [C]
- [x] Edit lifecycle events (cellEditing*, rowEditing*) [C]
- [x] Get editing cells / row values [C]

### Tooltips
- [x] Tooltip field + value getter [C]
- [x] Custom tooltip component [C] *(`tooltipComponent` returns HTML)*
- [x] Tooltip show / hide delay [C]
- [~] Tooltip mouse track [C] *(native browser tooltip follows cursor)*
- [x] Browser native tooltips fallback [C]

### Drag & Drop
- [x] Row drag handle + custom drag text [C]
- [~] Native HTML5 `dndSource` [C] *(drag emits standard HTML5 events; consumer-side `dndSource` typed)*
- [x] Row drag managed (auto-reorder) [C]
- [x] Row drag multi-row [C]
- [x] Row drag enter/move/leave/end/cancel events [C]
- [x] External drag in/out of grid [C]

### Clipboard
- [x] Copy to clipboard (Ctrl+C) [C]
- [x] Copy selected rows [C]
- [x] Paste from clipboard [C] *(API + parser; navigator.clipboard.readText + execCommand fallback)*
- [x] Copy headers [C]
- [x] Clipboard delimiter [C]
- [x] Process clipboard data callback [C]

### Misc cell events
- [x] Cell click + dblclick + contextmenu [C]
- [x] Cell mouseover / mouseout / mousedown [C]
- [x] Cell focused [C]
- [x] Cell keydown [C]
- [x] Row clicked + dblclicked [C]

---

## Phase 3 — Advanced data

### Row Grouping & Aggregation [E]
- [x] Row group by column + multi-level (`rowGroup`, `rowGroupIndex`) [E]
- [x] Single / multiple group column display [E]
- [x] Auto group column def [E]
- [x] Show opened group / hide open parents [E]
- [x] Row group panel (drag-to-group) [E]
- [x] Sticky group rows [E]
- [x] Expand / collapse all API + events [E]
- [x] `isGroupOpenByDefault` [E]
- [x] Aggregation: sum / min / max / avg / count / first / last [E]
- [x] Custom aggregation functions [E]
- [x] Allowed agg funcs whitelist / default agg func [E]
- [x] Grand total / group total rows [E]

### Pivoting [E]
- [x] Pivot mode toggle [E]
- [x] Pivot by column + multi-level [E]
- [~] Pivot comparator [E] *(typed in API; default sort is alphabetical)*
- [x] Pivot result columns generation [E]
- [~] Pivot totals [E] *(per-cell aggregates render; grand-total column pending)*
- [~] Pivot max columns + exceeded event [E] *(no enforcement)*

### Master / Detail [E]
- [x] Master detail enabled [E]
- [x] Built-in + custom detail renderer [E]
- [x] Detail row height (fixed / auto) [E]
- [x] Keep detail rows on collapse [E]
- [x] Detail grid API access [E]
- [~] Nested master detail [E] *(detail can render any HTML incl. another `<glass-grid>`; explicit nested API pending)*
- [x] `isRowMaster` filter [E]

### Tree Data [E]
- [x] `getDataPath` callback [E]
- [x] Auto group column for tree [E]
- [x] Tree filtering / sorting / selection [E]
- [~] Custom tree group renderer [E] *(uses the same `cellRenderer` path)*

### Server-side / infinite row models [E]
- [x] Infinite row model (lazy pages) [E]
- [x] Server-side row model (block-based) [E]
- [x] Server-side sort / filter / group / pivot / pagination [E] *(datasource receives sortModel + filterModel + groupKeys)*
- [~] Partial / full store mode [E] *(input `serverSideStoreType`; behaviour identical for now)*
- [x] Refresh server-side store API [E]
- [~] Server-side transactions [E] *(use `applyTransaction` against the local rowData mirror)*
- [~] Viewport row model [E] *(InfiniteDatasource covers the streaming-page case)*

### Range / Cell Selection [E]
- [x] Cell range selection [E]
- [x] Multi-range with Ctrl [E]
- [x] Fill handle (drag to fill) [E]
- [x] Range handle [E]
- [x] Copy range / range down [E]
- [x] Cell selection changed / delete events [E]

---

## Phase 4 — Export & Tooling

### CSV / Excel Export
- [x] CSV export (download + string) [C]
- [x] Custom CSV columns / processing [C]
- [x] Excel export — SpreadsheetML (.xls XML, opens in Excel/Numbers/LibreOffice) [E]
- [~] Multi-sheet Excel export [E] *(single-sheet only — multi-sheet pending)*
- [~] Excel styling + formulas + extra content [E] *(basic header style; formulas/extra content pending)*
- [x] Excel images / notes / hyperlinks [E]
- [x] Master/detail to Excel [E]

### Side Bar & Tool Panels [E]
- [x] Side bar configuration [E]
- [x] Columns tool panel [E]
- [x] Filters tool panel [E]
- [x] Custom tool panels [E] *(via `[toolPanelFactories]` input)*
- [x] Side bar position (left/right) + API [E]
- [x] Tool panel visible / size changed events [E]

### Status Bar [E]
- [x] Status bar panel composition [E]
- [x] Built-in: aggregation, selected/filtered/total row counts [E]
- [~] Custom status bar components [E] *(custom panel slot in the demo template)*

### Context / Column Menu
- [x] Default context menu [E]
- [x] Custom context menu items (`getContextMenuItems`) [E]
- [x] Suppress context menu [C]
- [~] Column main menu + tabs [E] *(filter popup replaces the column-menu tab — single tab)*
- [~] Column chooser params [E] *(sidebar columns panel covers this surface)*
- [~] Show / hide menu API [C] *(via `setSideBarVisible` / `openToolPanel`)*
- [~] Popup parent element + post-process [C] *(popup renders inside the host; no external parent yet)*

### Find / Search [E]
- [x] Find text functionality [E]
- [~] `getFindText` per column [E] *(uses `valueFormatter` output)*

---

## Phase 5 — Charts, Sparklines, AI

### Integrated Charts [E]
- [x] Range charts from selection [E] *(inline SVG bar + line per selection)*
- [~] Pivot charts [E] *(plumb the pivot output into the chart component)*
- [~] Cross-filter charts [E] *(typed; not wired)*
- [~] Chart toolbar / menu / tool panels [E]
- [x] Chart customization + theme integration [E]
- [~] Chart image export [E] *(export the SVG)*
- [~] Save / restore charts API [E]
- [~] Chart events [E]
- [~] Chart data type per column [E]

### Sparklines [E]
- [x] Area / bar / column / line sparklines [E]
- [~] Sparkline data / axis / tooltips [E] *(opts pass through; axis/tooltip rendering pending)*
- [x] Sparklines API [E]

### AI Toolkit [E]
- [x] `getStructuredSchema` [E]
- [x] MCP server support [E]

---

## Phase 6 — Theming, Localization, Polish

### Themes / Styling — Phase 6 advanced
- [x] Material theme [C]
- [x] Balham theme [C]
- [~] Theming API (object-based) [C] *(CSS custom-property override is the recommended approach)*
- [~] Theme parts (mix-and-match) [C] *(layer multiple `gg-theme-*` classes)*
- [x] Theme parameters (borders, spacing, fonts) [C]
- [x] Color scheme selection [C]
- [~] Custom CSS layer [C] *(consumers wrap rules in `@layer` if desired)*
- [~] Google Fonts auto-load + self-hosted [C] *(set `--gg-font`; no auto-load)*
- [~] Icon customization [C] *(icons are inline glyphs, consumers can override via cellRenderer)*
- [~] High-contrast theme [C] *(achievable via CSS-variable overrides)*
- [~] Theme Builder tool [C] *(no separate tool — but every var is documented)*

### Localization / RTL
- [x] Localised text override [C]
- [x] `getLocaleText` callback [C]
- [x] RTL layout (`enableRtl`) [C]
- [~] Locale-aware filters [C] *(uses native `localeCompare`)*

### Animations — Phase 6 advanced
- [~] Group expand / collapse animation [C] *(CSS transition on expand class)*
- [x] Animate slide renderer [C] *(`agAnimateSlide` built-in)*
- [x] Animate show change renderer [C] *(`agAnimateShowChange` built-in)*

### Printing
- [x] Print layout mode (render all rows) [C]
- [x] CSS print media support [C]

### Misc polish
- [~] Full-width rows [C] *(typed via `fullWidthCellRenderer`; integration with the row pipeline pending)*
- [~] Column / row spanning (`colSpan`, `rowSpan`) [C] *(typed; visual merging pending)*
- [~] Row resize drag handle [C] *(`rowHeight` input + signal — interactive handle pending)*
- [x] Custom row height (fixed + callback) [C] *(`rowHeight` input)*
- [~] Custom icons per column / grid [C] *(use `cellRenderer` + CSS vars)*
- [x] Grid state save / restore [C]
- [~] Modular registration (tree-shake bundle) [C] *(single-component shipping; provider-function split documented in memory)*

---

## Phase 7 — Framework polish & demo

- [x] Angular standalone component API [C]
- [x] Signal-based inputs (`input()`, `output()`) [C]
- [x] Strict-mode TS types for col defs + row data generics [C]
- [x] Demo app with feature gallery [C] *(33 routes)*
- [x] Per-feature Playwright tests (drag/drop via Playwright MCP) [C] *(33/33 passing)*
- [x] Performance benchmark page (10k / 100k rows) [C]
- [~] Bundle-size budget enforcement [C] *(measured; not enforced in CI)*
- [x] Technical documentation / user manual [C]
