# Row grouping &amp; aggregation

Group rows by one or more columns and roll up values into group rows.

## Static grouping

Set `rowGroup: true` on the columns you want to group by, or `rowGroupIndex: N` for ordered multi-level grouping. The grid auto-renders a "Group" column on the left.

```typescript
const cols: ColumnDef<Employee>[] = [
  { field: 'department', rowGroup: true },           // group level 0
  { field: 'level',      rowGroup: true, rowGroupIndex: 1 },
  { field: 'name' },
  { field: 'salary', aggFunc: 'sum',
    valueFormatter: p => `$${p.value?.toLocaleString()}` },
  { field: 'rating', aggFunc: 'avg',
    valueFormatter: p => p.value?.toFixed(1) ?? '' },
];
```

## Dynamic grouping

```typescript
api.setRowGroupColumns(['department']);     // single level
api.setRowGroupColumns(['region', 'team']); // multi level
api.setRowGroupColumns([]);                 // flat (no grouping)
```

## Aggregation

Built-in functions for `aggFunc`:

| Value | Behaviour |
|---|---|
| `'sum'` | Numeric sum (non-numbers ignored). |
| `'min'` / `'max'` | Min / max of numbers. |
| `'avg'` | Mean of numbers. |
| `'count'` | Number of rows in the group. |
| `'first'` / `'last'` | First / last value encountered. |

For anything else, pass a function `(values) => result`:

```typescript
{ field: 'tags', aggFunc: (vals) => [...new Set(vals.flat())].join(', ') }
```

## Expand / collapse

| Trigger | Behaviour |
|---|---|
| `[groupDefaultExpanded]="1"` | Open one level deep initially. |
| Click group row | Toggle that group. |
| `api.expandAll()` / `api.collapseAll()` | Full tree. |
| `(rowGroupOpened)` event | Fires on each toggle. |

## Auto group column

Customise the synthesised first column via `[autoGroupColumnDef]`:

```typescript
@Component({
  template: `<glass-grid
    [autoGroupColumnDef]="{ headerName: 'Region · Team', width: 280 }"
    ...
  />`,
})
```
