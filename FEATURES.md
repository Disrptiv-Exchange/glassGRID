# glassGRID — Shipped Features

> **Status (2026-05-15):** 190 features shipped · 48 partial (typed/wired but with caveats) · 11 fully pending · 249 total. **36/36 Playwright e2e routes pass.**

Features migrate here from [ROADMAP.md](ROADMAP.md) after they're implemented. Each entry includes a human-readable description so consumers can scan capabilities without reading source.

> **Status (2026-05-15)** — Phase 1 + most of Phases 2 / 3 / 4 / 6 shipped. See [docs/test-reports/](docs/test-reports/) for Playwright verification.

---

## Phase 1 — Foundation

### Core / Data Binding
- **Client-side row model** — bind any array of objects via `[rowData]`; data lives in memory and the grid never fetches.
- **Row data as array binding** — `[rowData]` is a typed signal input; updating it re-renders automatically.
- **`getRowId` for stable row identity** — pass a function to derive a stable id per row; required for selection persistence across data refreshes.
- **`forEachNode` iteration helpers** — internal node graph exposed for iteration; surfaced via `gridApi.getSelectedNodes()` etc.
- **`gridReady` lifecycle event** — fires once after first render with the imperative `GridApi`.
- **Grid `destroy()` API** — no-op (Angular host removal cleans up); kept for ag-grid parity.

### Columns — definition & sizing
- **Column definitions array** — `[columnDefs]` accepts a strongly typed `ColumnDef<TRow>[]`.
- **`defaultColDef`** — defaults merged into every column.
- **`colId`, `field` resolution** — stable id derived from `colId`, `field`, or auto-generated.
- **Hide / show columns + `initialHide`** — visibility toggled per column.
- **Suppress movable per column** — disable drag-to-reorder for chosen columns.
- **Drag-to-resize** — drag the right edge of a header to resize.
- **`flex` width + `sizeColumnsToFit()`** — flex columns share remaining width.
- **Auto-size column / all columns** — estimates width from header + first 200 rows of content.

### Headers
- **Header name + value getter** — `headerName` overrides the prettified `field`.
- **Header tooltip** — `headerTooltip` becomes the native `title`.

### Sorting
- **Sortable per column** — `sortable: true` enables header click.
- **Default sort direction** — `sort` / `initialSort` seed the model.
- **Multi-column sort (`sortIndex`)** — multiple columns combine; subscript shows priority.
- **Custom comparator** — pass `comparator(a, b)` for non-string ordering.
- **Locale-aware default sort** — falls back to `localeCompare` with `numeric: true`.
- **`sortChanged` event** — emits the new sort model.

### Pagination
- **Pagination enabled / page size** — `[pagination]="true"` + `[paginationPageSize]`.
- **Page size selector** — dropdown in the footer.
- **Pagination auto page size** — fits page size to viewport height.
- **Full pagination API** — first/prev/next/last + `goToPage` + getCurrentPage/TotalPages/PageSize/SetPageSize.
- **`paginationChanged` event** — emits page, pageSize, totalPages, totalRows.

### Virtual Scrolling
- **Row virtualisation** — only the visible window + buffer is in the DOM. Verified at 100,000 rows.
- **`ensureIndexVisible` API** — top / middle / bottom positioning.
- **Body scroll handling** — signal-driven scrollTop.

### Cell rendering
- **Cell renderer (function or HTML string) + params** — return inline HTML or a DOM node.
- **Cell component (Angular component per cell)** — `cellComponent: MyComponent`, with `cellComponentInputs` for extra inputs. The component receives a `params` signal input.
- **Value getter** — compute the cell value from row context.
- **Value formatter** — convert value → display string. Quick filter searches the formatted value.
- **Locale + currency-aware number formatting** — set `locale: 'en-IN'` / `currency: 'INR'` (or `numberFormatOptions`) on a column to format via cached `Intl.NumberFormat`. ISO 4217 codes supported (`USD`, `EUR`, `INR`, `VND`, `JPY`, …). No manual `valueFormatter` required.
- **Cell style (object / callback)** — inline style overrides.
- **Cell class (string / callback)** — static or dynamic class names.
- **Cell class rules (conditional)** — `{ class: predicate }` map.
- **Cell change flash** — `gg-flash` keyframes auto-fired on edit when `[enableCellChangeFlash]`.
- **Body row font-weight 400** — data rows render at weight 400 so headers (700) read as the visual hierarchy.

### Row Selection
- **Single + multi-row modes**, **checkbox column + header select-all**, **click-to-select**, **Space-key selection**, programmatic API, `selectionChanged` event, suppress click / deselection.

### Quick Filter
- **Quick filter (cross-column text)** — case-insensitive substring across visible columns' formatted values.
- **External filter binding (`[quickFilterText]`)** — drive from outside the grid.
- **`filterChanged` event** + **`setQuickFilter()` API**.

### Drag & Drop
- **Column drag-to-reorder** — HTML5 drag-and-drop on headers; verified through Playwright MCP.

### Column Pinning
- **Pinned left / right** + **`setColumnPinned()` API** — partitioning automatic; pinned columns render before/after centre columns.
- **Sticky pinned columns** — pinned cells stay locked horizontally while non-pinned columns scroll under them. Header and body track the same scroll offset via a single `translateX` so alignment never drifts. A 2px accent-coloured divider marks the pinned boundary.
- **Header context menu** — right-click any column header for sort asc / sort desc / clear sort / Pin left / Unpin / auto-size / hide. The menu anchors directly under the clicked cell and clamps to the viewport.

### Themes / Styling
- **Built-in Quartz theme** — light + dark variants.
- **CSS variable customisation** — every visual value is a `--gg-*` custom property.
- **Dark mode support** — `[darkMode]` or `gg-dark` class.

### Animations
- **Row hover / column move / cell flash transitions** — all on `--gg-anim-duration` / `--gg-anim-easing`.
- **Reduced-motion support** — `@media (prefers-reduced-motion: reduce)` zeroes duration.

### Accessibility
- **`role="grid"`, columnheader, gridcell, rowgroup**.
- **`aria-rowindex`, `aria-colindex`, `aria-selected`, `aria-sort`, `aria-multiselectable`, `aria-rowcount`, `aria-colcount`** — all reflect state live.
- **Full keyboard nav** — arrows, Tab, PageUp/Down, Home/End, Space, Enter, F2 (edit).
- **Screen reader labelling** — checkboxes get `aria-label`, overlays use `role="status"`.

### Overlays
- **Loading + no-rows overlays** with custom message inputs.

---

## Phase 2 — Interaction

### Cell Editing
- **Editable per column / per cell (callback)** — `editable: boolean | (params) => boolean`.
- **Built-in editors**: `text`, `number`, `date`, `select`, `checkbox`, `largeText`.
- **Custom cell editor** — `CellEditorFactory` returns an `HTMLElement` to mount.
- **Cell editor params** — pass `cellEditorParams.values` to `select` editor.
- **Single-click vs double-click vs Enter / F2 to start** — controlled by `[singleClickEdit]`.
- **Stop edit on blur / Esc / Enter / Tab** — Tab advances + commits, configurable.
- **Value parser** — `valueParser({ newValue, oldValue, data, colDef })`.
- **Edit lifecycle events** — `cellEditingStarted`, `cellEditingStopped`, `cellValueChanged`.
- **Undo / redo** — `Ctrl/Cmd+Z` undo, `Shift+Ctrl/Cmd+Z` redo, also `api.undoCellEditing()` / `redoCellEditing()`.
- **Read-only edit mode** — `[readOnlyEdit]` flag; consumer reacts to `cellValueChanged` without grid mutating data.
- **Cell change flash on commit** — `[enableCellChangeFlash]`.

### Column Filters
- **Text filter** — contains, notContains, equals, notEqual, startsWith, endsWith, blank, notBlank.
- **Number filter** — equals/notEqual, lt/lte/gt/gte, inRange, blank/notBlank.
- **Date filter** — equals/notEqual, before/after, inRange, blank/notBlank.
- **Floating filter row** — compact always-visible input under the header.
- **Custom floating filter component** — set `floatingFilterComponent: MyDropdown` on a column to mount any Angular component in the floating-filter slot via `*ngComponentOutlet`. Receives a `FloatingFilterParams` input (`value`, `colDef`, `onValueChange`).
- **Per-column filter popup** — appears when clicking the ⏷ filter button; choose op + value + range. Anchored to the clicked column header.
- **`filterParams.caseSensitive`** — opt into case-sensitive text matching.
- **`columnFilterChanged` event** — emits the full `FilterModel`.
- **`setFilterModel` / `getFilterModel` / `destroyFilter` API**.

### Tooltips
- **`tooltipField` / `tooltipValueGetter`** — title attribute on the cell (native browser tooltip).

### Drag & Drop
- **Row drag (managed mode)** — `[rowDragManaged]` reorders rows internally on drop.
- **Row drag events** — `rowDragEnd` with source node + over-index.
- **Row drag handle (auto-rendered first cell)** — visible only when managed.

### Clipboard
- **Copy to clipboard (Ctrl+C)** — copies the active range as TSV, or selected rows if no range.
- **Copy with headers** — context menu item.
- **Process via Clipboard API + execCommand fallback** for non-secure contexts.

### Range Selection
- **Click + drag** to select a rectangular range.
- **Shift-click extend** — extend the range from the anchor.
- **Range copy** — Ctrl/Cmd+C copies the cells in the range as TSV.
- **`rangeSelectionChanged` event** + **`getCellRanges` / `clearRangeSelection` API**.

### Misc cell events
- **`cellClicked`, `cellDoubleClicked`, `cellContextMenu`, `cellMouseEnter`, `cellMouseLeave`, `cellFocused`, `cellKeyDown`** — all typed against `<TRow>`.
- **`rowDoubleClicked`** — additional row event.

---

## Phase 3 — Advanced data

### Row Grouping
- **Row group by column** (`rowGroup: true`) and **multi-level grouping** via `rowGroupIndex`.
- **`setRowGroupColumns([colIds])` API** — change grouping at runtime.
- **Auto group column** — synthesised on the left with expand/collapse toggle; customise via `[autoGroupColumnDef]`.
- **Group default expanded** — `[groupDefaultExpanded]`.
- **Expand / collapse all API** — `api.expandAll()` / `api.collapseAll()`.
- **`rowGroupOpened` event** — fires on each toggle.

### Aggregation
- **Built-in agg functions**: `sum`, `min`, `max`, `avg`, `count`, `first`, `last`.
- **Custom agg function** — `aggFunc: (values) => result`.
- **Aggregates rendered on group rows** in the corresponding column.

### Tree Data
- **`getDataPath` callback** — array of path segments per row.
- **Hierarchical render** — folder rows expand/collapse children.
- **Auto group column** — same mechanic as row grouping (configure via `[autoGroupColumnDef]`).
- **`[groupDefaultExpanded]` honoured** for tree mode too.

### Master / Detail
- **Master detail enabled** — `[masterDetail]="true"`.
- **Custom detail renderer** — `[detailCellRenderer]` function returns HTML.
- **Detail row height** — `[detailRowHeight]`.
- **Auto-render fallback** — pretty-printed JSON if no renderer.
- **Per-row expand toggle** — built into the auto-group column.

### Range / Cell Selection
- See Phase 2.

---

## Phase 4 — Export & Tooling

### CSV Export
- **`exportDataAsCsv(opts)`** — downloads `.csv` (browser-native).
- **`getDataAsCsv(opts)`** — returns CSV as string.
- **Options**: `fileName`, `delimiter`, `onlySelected`, `columnKeys`, `skipHeader`, `processCellCallback`.
- **Quoting + BOM** — proper escape of commas/quotes/newlines, UTF-8 BOM for Excel.

### Side Bar & Tool Panels
- **`[sideBar]` config** with `toolPanels` array.
- **Built-in panels**: `columns` (toggle visibility), `filters` (per-column filter inputs).
- **Side bar position** — right side (left support planned).
- **Show / hide via toggle button** in the toolbar.
- **`setSideBarVisible` / `isSideBarVisible` / `openToolPanel` / `closeToolPanel` API**.

### Status Bar
- **`[statusBar]` config** — array of built-in panels.
- **Built-ins**: `selected`, `filtered`, `total`, `sum`, `avg`, `min`, `max` (last four use `aggField`).
- **Live aggregation** — recomputes over selection or filtered set.

### Context Menu
- **Default context menu** — Copy / Copy with headers / CSV export / Expand all / Collapse all.
- **Custom items** — `[getContextMenuItems]` returns `ContextMenuItem<TRow>[]`.
- **Separator + shortcut hints** supported.
- **`[suppressContextMenu]`** — opt out entirely.

### Find / Search
- **Find input** in the toolbar — case-insensitive across all visible columns' formatted values.
- **Match counter** — "3 / 27" indicator.
- **`findNext` / `findPrev` API** with current-match highlight.
- **`clearFind` API**.

### State Save / Restore
- **`getColumnState` / `applyColumnState`** — widths, visibility, pinning, sort, sortIndex, rowGroup, rowGroupIndex.
- **`getGridState` / `applyGridState`** — full snapshot including columns, sort model, filter model, quick filter, pagination state. JSON-serializable.

---

## Phase 5 — Charts / Sparklines / AI

### Sparklines (lightweight)
- **`lineSparkline(values, opts)`**, **`barSparkline`**, **`areaSparkline`** — pure-SVG, zero dependencies.
- **Options**: width, height, stroke, fill, strokeWidth.
- **Use as `cellRenderer`** — return the SVG string.

> Integrated charts / pivot charts / AI toolkit / MCP server are deferred — see `ROADMAP.md`.

---

## Phase 6 — Theming, Localization, Polish

### Themes
- **Quartz** (light + dark) — default modern theme.
- **Material** (light + dark) — Material-style typography and spacing.
- **Balham** (light + dark) — dense, spreadsheet-style.
- **CSS variable customisation** — fork any theme by overriding `--gg-*` variables.

### Localization
- **`[getLocaleText]` callback** — `(key, defaultValue) => translation`.
- **Built-in keys** for toolbar, pagination, filter popup, context menu, side bar, status bar (`DEFAULT_LOCALE` exported).

### RTL
- **`[enableRtl]`** — adds `gg-rtl` class + `dir="rtl"` to the host; layout flips automatically.

### Print
- **`@media print`** — toolbar / pagination / status bar / side bar / popups hidden; rows render in full (no virtualisation) on a single flow.

---

## Cross-cutting

### API surface (new in this batch)
- `setFilterModel` / `getFilterModel` / `destroyFilter`
- `startEditingCell` / `stopEditing` / `getEditingCell` / `undoCellEditing` / `redoCellEditing`
- `exportDataAsCsv` / `getDataAsCsv`
- `setRowGroupColumns` / `expandAll` / `collapseAll`
- `getCellRanges` / `clearRangeSelection`
- `findNext` / `findPrev` / `clearFind`
- `getColumnState` / `applyColumnState` / `getGridState` / `applyGridState`
- `setSideBarVisible` / `isSideBarVisible` / `openToolPanel` / `closeToolPanel`

### Events (new in this batch)
- `cellDoubleClicked` · `cellContextMenu` · `cellMouseEnter` · `cellMouseLeave` · `cellFocused` · `cellKeyDown`
- `rowDoubleClicked`
- `cellEditingStarted` · `cellEditingStopped` · `cellValueChanged`
- `columnFilterChanged`
- `rowGroupOpened`
- `rowDragEnd`
- `rangeSelectionChanged`

### Inputs (new in this batch)
- editing: `singleClickEdit`, `suppressClickEdit`, `stopEditingWhenCellsLoseFocus`, `readOnlyEdit`
- grouping: `groupDefaultExpanded`, `autoGroupColumnDef`, `suppressAggFuncInHeader`
- tree: `treeData`, `getDataPath`
- master-detail: `masterDetail`, `detailRowHeight`, `detailCellRenderer`, `isRowMaster`
- row drag: `rowDragManaged`, `suppressRowDrag`
- range: `enableRangeSelection`, `suppressMultiRangeSelection`
- side/status/context: `sideBar`, `statusBar`, `getContextMenuItems`, `suppressContextMenu`
- locale/RTL: `enableRtl`, `getLocaleText`
- misc: `fullWidthCellRenderer`, `isFullWidthRow`, `suppressRowVirtualisation`, `suppressColumnVirtualisation`, `print`

---

## Deferred

Items still on `ROADMAP.md`:

- **Phase 2**: column groups (nested header rows), custom tooltip components, native HTML5 `dndSource`, multi-row drag, advanced filter builder, set/multi filter, custom column filter component, more cell mouse events (mouseover/out/down individually).
- **Phase 3**: pivoting, server-side row model, infinite row model, viewport row model, fill handle (drag-fill series), full nested master/detail, lazy tree-data children.
- **Phase 4**: Excel (`.xlsx`) export, advanced toolbar, column chooser modal.
- **Phase 5**: integrated charts, cross-filter charts, AI toolkit / MCP server.
- **Phase 6**: full-width rows, colSpan/rowSpan, row resize handle, theme builder, Google Fonts auto-load, high-contrast theme.

These remain implementable on top of the current architecture (signals + flat displayedRows pipeline + provider-style feature modules) without breaking the public API.

---

## Latest batch (2026-05-15) — closing out the remaining fully-pending items

### Core data
- **`applyTransactionAsync(tx, callback?)` + `asyncTransactionsFlushed` event** — buffer multiple transactions in one tick; `requestAnimationFrame` flushes them as a single grid update. Callback fires per-tx with `{ add, remove, update }` counts; `flushAsyncTransactions()` forces a sync flush.
- **Pinned top / bottom rows** — `[pinnedTopRowData]` / `[pinnedBottomRowData]` materialise as bands that prepend / append the displayed-rows array. Pagination only paginates the *middle* band; filtering and sorting skip the pinned bands. CSS classes `.gg-row-pinned-top` / `.gg-row-pinned-bottom`.
- **`firstDataRendered` event** — fires once after the first non-empty render.

### Columns
- **Column types template (`[columnTypes]` + `ColumnDef.type`)** — define reusable defaults under named keys; refer to them from a column via a string or array (`type: ['numeric', 'currency']`). Composition order: `defaultColDef` → each type → per-column props.
- **Cell renderer selector** — `cellRendererSelector(params)` returns a `{ component, params }` shape per row for dynamic renderer choice.
- **Custom header component (`headerComponent`)** — function returning inline HTML, injected into the column header label.

### Header
- **`[wrapHeaderText]`** — wraps long header text across lines via CSS hook `data-wrap-header="true"`.
- **`[autoHeaderHeight]`** — header row grows to fit the tallest wrapped header.

### Rows
- **`[wrapText]` / `[autoHeight]` per ColumnDef** — CSS class hooks `gg-wrap-text` / `gg-auto-height` allow rows to grow vertically and content to wrap.
- **`[stickyGroupRows]`** — the open group's header row sticks to the top of the viewport while you scroll its children.
- **`showOpenedGroup` / `groupHideOpenParents`** — display modes that hide the parent group row when it's expanded so children visually "replace" it.

### Excel export — round-trip
- **Cell notes** (`opts.noteFor`) — comments serialized into the `<Comment>` cell element.
- **Hyperlinks** (`opts.hyperlinkFor`) — `ss:HRef` attribute per cell.
- **Anchored images** (`opts.imageFor`) — Base64 data URLs anchored at the cell position with width/height.
- **Detail rows** (`opts.detailRowProvider`) — emit extra rows immediately after each leaf row for master/detail export.

### AI / MCP
- **`gridApi.toMcpServer({ gridId?, description? })`** — returns a `McpServerAdapter` exposing `gridId`, `description`, `schema()`, `tools()`, and an async `invoke(toolName, args)`. Eight built-in tools:
  - `get_schema` — columns + sort + filter + group state + row count.
  - `get_rows` — paginated read of the sorted-filtered band.
  - `set_quick_filter`, `set_filter_model`, `set_sort_model`, `set_row_group`.
  - `export_csv` — return CSV string (optionally only-selected).
  - `select_rows` — by stable row id.
  Hand this object to your MCP server framework of choice to expose the grid to an agent.
