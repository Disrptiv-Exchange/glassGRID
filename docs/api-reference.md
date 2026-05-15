# API reference

## `<glass-grid>` inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| `columnDefs` | `ColumnDef<TRow>[]` | `[]` | See [column-definitions.md](column-definitions.md). |
| `rowData` | `TRow[]` | `[]` | Array of any object type. |
| `defaultColDef` | `Partial<ColumnDef<TRow>>` | `{}` | Defaults merged into every column. |
| `getRowId` | `(row) => string` | `null` | Stable row id; required for selection persistence across data refreshes. |
| `rowSelection` | `'single' \| 'multiple' \| null` | `null` | Selection mode. |
| `suppressRowClickSelection` | `boolean` | `false` | Disable click-to-select (still allows checkbox-driven selection). |
| `suppressRowDeselection` | `boolean` | `false` | Ignore second click on a selected row. |
| `pagination` | `boolean` | `false` | Enable pagination footer. |
| `paginationPageSize` | `number` | `20` | Initial page size. |
| `paginationPageSizeSelector` | `number[] \| false` | `[10,20,50,100]` | Page-size selector options; `false` to hide. |
| `paginationAutoPageSize` | `boolean` | `false` | Fit page size to viewport height. |
| `rowHeight` | `number` | `36` | Pixel height per row (also drives `--gg-row-height`). |
| `headerHeight` | `number` | `40` | Pixel height of the header. |
| `quickFilterText` | `string` | `''` | External quick filter binding. Overrides the toolbar field. |
| `darkMode` | `boolean` | `false` | Adds `gg-dark` class to host. |
| `animateRows` | `boolean` | `true` | Enable transitions on row state. |
| `enableCellChangeFlash` | `boolean` | `false` | Flash cells on value change (reserved for the editing feature). |
| `multiSortKey` | `'ctrl' \| 'always'` | `'always'` | When `'ctrl'`, multi-sort requires Shift/Ctrl/Cmd. |
| `loading` | `boolean` | `false` | Show the loading overlay. |
| `noRowsMessage` | `string` | `'No rows to show'` | Empty-state text. |
| `loadingMessage` | `string` | `'Loading…'` | Loading overlay text. |

## `<glass-grid>` outputs

| Output | Event shape | Fires when |
|---|---|---|
| `gridReady` | `{ api }` | Once, after first render. |
| `sortChanged` | `{ api, sortModel }` | Sort model changes. |
| `filterChanged` | `{ api, quickFilter }` | Quick filter changes. |
| `selectionChanged` | `{ api, selectedRows, selectedNodes }` | Selection changes. |
| `paginationChanged` | `{ api, page, pageSize, totalPages, totalRows }` | Page or page size changes. |
| `cellClicked` | `{ data, node, colDef, value, event }` | Cell pointer click. |
| `rowClicked` | `{ data, node, event }` | Row pointer click. |

## `GridApi`

Returned from `(gridReady)`. All methods are synchronous.

### Data

- `getRowData(): TRow[]`
- `applyTransaction({ add?, remove?, update? })` — currently emits a console warning if you don't also re-bind `[rowData]`; this is the same one-way data flow Angular uses for inputs.

### Columns

- `getColumnDefs(): ColumnDef<TRow>[]`
- `sizeColumnsToFit()`
- `autoSizeColumn(colId)` / `autoSizeAllColumns()`
- `setColumnVisible(colId, visible)`
- `setColumnPinned(colId, 'left' | 'right' | null)`
- `moveColumn(colId, toIndex)`

### Sorting

- `setSortModel(SortModelItem[])`
- `getSortModel(): SortModelItem[]`

### Filtering

- `setQuickFilter(text)`

### Selection

- `selectAll()` / `deselectAll()`
- `getSelectedRows(): TRow[]`
- `getSelectedNodes(): RowNode<TRow>[]`

### Pagination

- `paginationGoToFirstPage()` / `paginationGoToPreviousPage()` / `paginationGoToNextPage()` / `paginationGoToLastPage()`
- `paginationGoToPage(p)`
- `paginationGetCurrentPage()` / `paginationGetTotalPages()` / `paginationGetPageSize()`
- `paginationSetPageSize(size)`

### Misc

- `ensureIndexVisible(index, position?)`
- `refreshCells()` — signal-driven re-derive happens automatically; this is a no-op kept for API parity.
- `destroy()` — host removal handles cleanup; no manual call required.
