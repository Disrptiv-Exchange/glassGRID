# Getting started with glassGRID

This guide walks a developer from `npm install` to a feature-complete grid in their own Angular app. It covers installation, the minimum component, the three sets of bindings you'll reach for first (columns, data, theming), and how to wire up the most-requested features.

> Already shipping? Jump straight to the [API reference](api-reference.md) or the [recipes](recipes.md).

---

## 1. Install

glassGRID is published as a single Angular library with **no runtime dependencies** outside Angular itself.

```bash
npm install glassgrid
```

**Peer dependencies** (must already be in your app):

| Package           | Version    |
|-------------------|------------|
| `@angular/core`   | `>= 17.0`  |
| `@angular/common` | `>= 17.0`  |

> The library is built and tested against **Angular 21.2**, but the only modern features it relies on are standalone components and signals, both available from Angular 17.

Add the theme stylesheet to your global styles (`styles.scss` or `angular.json` styles array):

```scss
// styles.scss
@import "glassgrid/themes/quartz.scss";
```

That's the entire setup. No `NgModule`, no `providers`, no `forRoot()`.

---

## 2. Minimum viable grid

`GlassGridComponent` is a standalone component — import it directly into any component that needs a grid.

```typescript
import { Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface Person {
  id: number;
  name: string;
  role: string;
  salary: number;
}

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [GlassGridComponent],
  template: `
    <glass-grid
      class="gg-theme-quartz"
      [columnDefs]="cols"
      [rowData]="rows()"
      [defaultColDef]="{ sortable: true, resizable: true, filter: true }"
      [pagination]="true"
      [paginationPageSize]="20"
      style="height: 600px; width: 100%;"
    />
  `,
})
export class PeoplePage {
  rows = signal<Person[]>([
    { id: 1, name: 'Ada Lovelace',     role: 'Engineer',           salary: 145000 },
    { id: 2, name: 'Grace Hopper',     role: 'Compiler architect', salary: 162000 },
    { id: 3, name: 'Margaret Hamilton', role: 'Apollo lead',       salary: 178000 },
  ]);

  cols: ColumnDef<Person>[] = [
    { field: 'id',     headerName: '#', width: 80  },
    { field: 'name',   width: 240 },
    { field: 'role',   width: 240 },
    { field: 'salary', width: 160, locale: 'en-US', currency: 'USD' },
  ];
}
```

Three things to notice:

1. **The grid needs a height.** It does not auto-grow with the page — give it a `style="height:"` (or a wrapping flex container).
2. **`[rowData]` is a signal.** Update the signal and the grid re-renders. You can also pass a plain array — but a signal lets you mutate without re-binding.
3. **`<ColumnDef<Person>>` is generic.** The grid carries the row type through every callback (`valueGetter`, `cellRenderer`, `valueFormatter` …) and through the `GridApi`.

---

## 3. Columns

A `ColumnDef<TRow>` describes one column. The full surface lives in [column-definitions.md](column-definitions.md); the highlights:

### Sizing

```typescript
{ field: 'name', width: 240 }                    // fixed width
{ field: 'name', flex: 1 }                       // share remaining width
{ field: 'name', minWidth: 120, maxWidth: 360 }  // clamp during resize
```

Combine `flex` with `minWidth`/`maxWidth` for responsive layouts. Call `gridApi.sizeColumnsToFit()` after the viewport changes.

### Sorting

```typescript
{ field: 'name', sortable: true }
{ field: 'salary', sortable: true, sort: 'desc', sortIndex: 0 }   // initial sort
{ field: 'startDate', comparator: (a, b) => a.getTime() - b.getTime() }
```

Hold **Shift** and click another header to multi-sort.

### Filtering

```typescript
{ field: 'name',   filter: 'text' }
{ field: 'salary', filter: 'number' }
{ field: 'role',   filter: 'set' }       // checkbox list of distinct values
{ field: 'start',  filter: 'date' }
{ field: 'tags',   filter: true, floatingFilter: true }  // floating-filter row under header
```

Both glassGRID short names (`'text'`) and ag-grid aliases (`'agTextColumnFilter'`) are accepted, so existing column defs migrate cleanly.

### Locale-aware number / currency formatting

```typescript
{ field: 'salary', locale: 'en-US', currency: 'USD' }   // $145,000.00
{ field: 'bonus',  locale: 'en-IN', currency: 'INR' }   // ₹1,45,000.00
{ field: 'price',  locale: 'vi-VN', currency: 'VND' }   // 145.000 ₫
{ field: 'rank',   locale: 'de-DE' }                    // 1.234 (decimal in German locale)

// Full control — pass Intl.NumberFormatOptions directly.
{ field: 'pct', numberFormatOptions: { style: 'percent', minimumFractionDigits: 2 } }
```

No manual `valueFormatter` needed. Cached `Intl.NumberFormat` instances are reused across all cells in the column.

### Pinning

```typescript
{ field: 'id',     pinned: 'left',  width: 80 }
{ field: 'action', pinned: 'right', width: 96 }
```

Pinned columns are sticky during horizontal scroll. A green vertical line marks the boundary. Right-click any header for a menu of pin/unpin/auto-size/hide actions.

### Custom cell rendering

Three options, in order of complexity:

```typescript
// 1. Inline HTML string (or function returning a string)
{ field: 'avatar', cellRenderer: (p) => `<img src="${p.value}" class="avatar" />` }

// 2. Function returning a DOM node
{ field: 'status', cellRenderer: (p) => {
    const el = document.createElement('span');
    el.textContent = p.value;
    el.classList.add(p.value === 'active' ? 'badge-green' : 'badge-grey');
    return el;
  }
}

// 3. Full Angular component (signals, DI, etc.)
import { StatusBadge } from './status-badge.component';
{ field: 'status', cellComponent: StatusBadge,
  cellComponentInputs: { theme: 'compact' } }
```

The component receives a `params` input of type `CellRendererParams<TRow>`:

```typescript
@Component({ selector: 'app-status-badge', standalone: true, template: `…` })
export class StatusBadge {
  params = input.required<CellRendererParams<Person, string>>();
}
```

### Custom floating-filter component

For the "advanced filter section" — e.g. a dropdown that picks one of N values:

```typescript
{ field: 'team', filter: true, floatingFilter: true, floatingFilterComponent: TeamDropdown }

@Component({
  selector: 'app-team-dropdown',
  standalone: true,
  template: `
    <select [value]="params().value ?? ''" (change)="onChange($event)">
      <option value="">All</option>
      <option value="Alpha">Alpha</option>
      <option value="Bravo">Bravo</option>
    </select>
  `,
})
export class TeamDropdown {
  params = input.required<FloatingFilterParams<any, string>>();
  onChange(e: Event) {
    this.params().onValueChange((e.target as HTMLSelectElement).value || null);
  }
}
```

---

## 4. The `GridApi`

The imperative side of the grid. Grab a handle in `(gridReady)`:

```typescript
@Component({
  template: `
    <glass-grid
      [columnDefs]="cols"
      [rowData]="rows()"
      (gridReady)="api = $event.api"
    />
    <button (click)="exportCsv()">Export CSV</button>
  `,
})
export class Page {
  api?: GridApi<Person>;

  exportCsv() {
    this.api?.exportDataAsCsv({ fileName: 'people.csv', onlySelected: false });
  }
}
```

Common calls:

| Need                              | Call                                                |
|-----------------------------------|-----------------------------------------------------|
| Filter from a search box          | `api.setQuickFilter('grace')`                       |
| Programmatically sort             | `api.setSortModel([{ colId: 'salary', sort: 'desc' }])` |
| Pin a column                      | `api.setColumnPinned('id', 'left')`                 |
| Get current selection             | `api.getSelectedRows()`                             |
| Save / restore layout             | `api.getGridState()` / `api.applyGridState(state)`  |
| Export CSV                        | `api.exportDataAsCsv()`                             |
| Export Excel                      | `api.exportDataAsExcel()`                           |
| Scroll a row into view            | `api.ensureIndexVisible(500, 'middle')`             |
| Start editing a cell              | `api.startEditingCell(3, 'name')`                   |
| Undo last edit                    | `api.undoCellEditing()`                             |
| Refresh data after mutation       | `api.refreshCells()`                                |

The full list is in [api-reference.md](api-reference.md) — about 70 methods, all typed against `<TRow>`.

---

## 5. Selection

```html
<glass-grid
  [columnDefs]="cols"
  [rowData]="rows()"
  rowSelection="multiple"
  (selectionChanged)="onSel($event)"
/>
```

```typescript
onSel(e: SelectionChangedEvent<Person>) {
  console.log('Selected', e.selectedRows.length, 'rows');
}
```

Add a checkbox column by setting `checkboxSelection: true` on one of your columns:

```typescript
{ field: 'name', checkboxSelection: true, headerCheckboxSelection: true, width: 240 }
```

`headerCheckboxSelection` adds a master select-all checkbox in the header.

---

## 6. Editing

Make cells editable by setting `editable: true` (or a predicate):

```typescript
{ field: 'name', editable: true, cellEditor: 'text' }
{ field: 'salary', editable: true, cellEditor: 'number' }
{ field: 'role', editable: true, cellEditor: 'select',
  cellEditorParams: { values: ['Engineer', 'Manager', 'Director'] } }
```

Listen for changes:

```html
<glass-grid (cellValueChanged)="onChange($event)" />
```

Undo/redo: `api.undoCellEditing()` / `api.redoCellEditing()` — Ctrl/Cmd-Z and Ctrl/Cmd-Shift-Z work out of the box.

---

## 7. Theming

Every visual value is a `--gg-*` CSS custom property. Override them at the host or globally:

```scss
.gg-theme-quartz {
  --gg-accent:      #329B2A;     // primary green
  --gg-header-bg:   #f8fafc;
  --gg-row-hover:   #f1f5f9;
  --gg-border:      #e5e7eb;
  --gg-radius:      12px;
  --gg-font:        'Inter', system-ui, sans-serif;
  --gg-row-height:  36px;
  --gg-anim-duration: 180ms;
}
```

Dark mode:

```html
<glass-grid class="gg-theme-quartz" [darkMode]="true" />
<!-- or class-based: -->
<glass-grid class="gg-theme-quartz gg-dark" />
```

A `prefers-reduced-motion` media query zeroes out animations automatically — no extra work required for accessibility.

Full theme variable list: see [theming.md](theming.md).

---

## 8. Performance — large datasets

The grid virtualises rows by default. Tested at **100,000 rows at 60fps** on a 2020 MacBook Air.

```html
<glass-grid
  [columnDefs]="cols"
  [rowData]="hundredThousandRows()"
  [rowBuffer]="20"
  [suppressColumnVirtualisation]="false"
/>
```

For truly server-paginated data:

```typescript
const datasource: InfiniteDatasource<Row> = {
  rowCount: -1,    // unknown; will discover from response
  async getRows({ startRow, endRow }) {
    const rows = await fetch(`/api/rows?start=${startRow}&end=${endRow}`).then(r => r.json());
    return { rows };
  },
};
api.setInfiniteDatasource(datasource);
```

Or full server-side row model with grouping / filtering pushed to the backend:

```typescript
api.setServerSideDatasource({
  async getRows({ startRow, endRow, sortModel, filterModel, groupKeys }) {
    const res = await fetch('/api/rows', {
      method: 'POST',
      body: JSON.stringify({ startRow, endRow, sortModel, filterModel, groupKeys }),
    }).then(r => r.json());
    return { rows: res.rows, rowCount: res.total };
  },
});
```

---

## 9. ag-grid compatibility / migration

Existing ag-grid column defs are mostly drop-in. The grid accepts:

- ag-grid filter aliases — `agTextColumnFilter`, `agNumberColumnFilter`, `agDateColumnFilter`, `agSetColumnFilter`, `agMultiColumnFilter`
- `gridOptions` style binding via `setGridOption(key, value)`
- `forEachNode`, `forEachNodeAfterFilter`, `forEachNodeAfterFilterAndSort`
- `refreshInfiniteCache()` / `purgeInfiniteCache()` / `infiniteRowModel.resetCache()`
- ag-grid event naming on the `GridApi`

Most apps migrate by swapping the import and the selector. The library doesn't claim affiliation with ag-grid; it just keeps the surface area familiar so you don't have to relearn it.

---

## 10. Where next

| You want to…                              | Read                                             |
|-------------------------------------------|--------------------------------------------------|
| See every shipped feature with examples   | [FEATURES.md](../FEATURES.md)                    |
| Look up a specific API call               | [api-reference.md](api-reference.md)             |
| Build a custom cell editor                | [editing.md](editing.md)                         |
| Wire up row grouping / aggregates         | [grouping.md](grouping.md)                       |
| Export to CSV / Excel, save/restore state | [export.md](export.md)                           |
| Drop-in recipes (search box, etc.)        | [recipes.md](recipes.md)                         |
| Customise the theme                       | [theming.md](theming.md)                         |
| Run the demo locally                      | `cd glassgrid-workspace && npm i && npx ng serve` |

---

## Troubleshooting

**The grid is invisible / 0 height.**
The grid does not auto-size to content. Give the host a height (`style="height: 600px"` or place inside a flex container with `flex: 1`).

**Columns overflow / horizontal scrolls but I didn't want it.**
You're either over-specifying widths or setting `autoSizeStrategy="null"`. Either reduce column widths, switch to `flex: 1` on at least one column, or call `api.sizeColumnsToFit()` on `(gridReady)`.

**Sort/filter doesn't fire.**
Did you set `sortable: true` / `filter: 'text'` on the column, or in `defaultColDef`? Per-column settings are off by default.

**Custom cell component doesn't receive `params`.**
The component must declare `params = input<CellRendererParams<TRow>>()` (or `input.required(...)`). Plain `@Input` decorators won't pick it up — the library uses the new signal-based `input()` API.

**Currency renders as a number with no symbol.**
Set `currency: 'USD'` (or another ISO 4217 code). If you set `locale` alone, the value formats as a decimal in that locale — no currency symbol.

**Pinned column scrolls with the body.**
Make sure the cell isn't inside a custom renderer that ignores `position: sticky`. Avoid `transform` on parents of the cell — `transform` breaks `position: sticky` in CSS.
