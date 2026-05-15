# Recipes

Small focused examples that combine the documented APIs.

## Currency formatting

```typescript
{
  field: 'salary',
  width: 140,
  valueFormatter: p => typeof p.value === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.value)
    : '',
}
```

## Conditional row highlighting

```typescript
{
  field: 'priority',
  cellClassRules: {
    'p0': p => p.value === 'P0',
    'p1': p => p.value === 'P1',
  },
}
```

```scss
glass-grid .gg-cell.p0 { background: rgba(255, 64, 64, 0.12); font-weight: 600; }
glass-grid .gg-cell.p1 { background: rgba(255, 145, 0, 0.10); }
```

## A "status pill" renderer

```typescript
{
  field: 'status',
  width: 120,
  cellRenderer: p => `<span class="pill pill-${p.value}">${p.formattedValue}</span>`,
}
```

## Custom comparator (case-insensitive)

```typescript
{
  field: 'name',
  comparator: (a, b) => String(a).toLowerCase().localeCompare(String(b).toLowerCase()),
}
```

## Controlled quick filter

```html
<input #q (input)="api.setQuickFilter(q.value)" placeholder="Search…" />
<glass-grid (gridReady)="api = $event.api" …></glass-grid>
```

## Multi-sort that requires Ctrl/Shift

```html
<glass-grid [multiSortKey]="'ctrl'" …></glass-grid>
```

## Reading the selection

```typescript
onSelection(e: SelectionChangedEvent<Person>) {
  this.selectedIds.set(new Set(e.selectedRows.map(r => r.id)));
}
```

## Programmatic pagination

```typescript
onGridReady(e: GridReadyEvent<Person>) {
  this.api = e.api;
  this.api.paginationSetPageSize(50);
  this.api.paginationGoToPage(0);
}
```

## Dense layout via theme variables

```scss
glass-grid.dense {
  --gg-row-height: 28px;
  --gg-header-height: 32px;
  --gg-cell-padding-x: 8px;
  --gg-font: 12px/1.4 system-ui;
}
```

```html
<glass-grid class="gg-theme-quartz dense" …></glass-grid>
```
