# Filtering

glassGRID supports two filter surfaces:

1. **Quick filter** — single-input cross-column substring match.
2. **Column filters** — per-column popups with operators (contains, equals, gt/lt, in-range, before/after, blank, …), optionally with a *floating filter row* under the header.

## Quick filter

```html
<glass-grid [quickFilterText]="search()" ...></glass-grid>
```

Or use the built-in input in the grid's toolbar. Programmatic: `api.setQuickFilter(text)`.

## Column filters

Add `filter` to each column you want to filter:

```typescript
const cols: ColumnDef<Employee>[] = [
  { field: 'name',       filter: 'text' },
  { field: 'level',      filter: 'number' },
  { field: 'hireDate',   filter: 'date' },
  { field: 'department', filter: 'text', filterParams: { caseSensitive: false } },
];
```

This adds a ⏷ button to the header that opens a popup with op + value fields.

## Floating filter row

Set `floatingFilter: true` per column (or via `defaultColDef`) to add a compact always-visible input under the header:

```typescript
defaultColDef = { sortable: true, filter: 'text', floatingFilter: true };
```

The floating input drives the same model as the popup; both stay in sync.

## Operators

| Filter type | Available `type` values |
|---|---|
| `'text'` | `contains`, `notContains`, `equals`, `notEqual`, `startsWith`, `endsWith`, `blank`, `notBlank` |
| `'number'` | `equals`, `notEqual`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `inRange`, `blank`, `notBlank` |
| `'date'` | `equals`, `notEqual`, `before`, `after`, `inRange`, `blank`, `notBlank` |

## Programmatic filter model

```typescript
api.setFilterModel({
  level:    { type: 'greaterThanOrEqual', filter: 3 },
  hireDate: { type: 'after', filter: '2022-01-01' },
  name:     { type: 'contains', filter: 'ada' },
});

api.getFilterModel();   // -> FilterModel
api.destroyFilter('level');
```

Subscribe to `(columnFilterChanged)` for live updates.

## Side bar filter panel

Set `[sideBar]="{ toolPanels: [{ id: 'filters', labelDefault: 'Filters', toolPanel: 'filters' }] }"` to expose all filter inputs in a right-side drawer (open via the toolbar ☰ button).
