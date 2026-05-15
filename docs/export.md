# CSV export · State save/restore

## CSV export

```typescript
// Download the current view as a .csv
api.exportDataAsCsv({ fileName: 'employees.csv' });

// Or get the string yourself
const csv = api.getDataAsCsv();
```

### Options

```typescript
api.exportDataAsCsv({
  fileName: 'top10.csv',
  delimiter: ',',          // default ','
  onlySelected: true,      // export only selected rows
  columnKeys: ['name', 'salary'], // limit columns
  skipHeader: false,
  processCellCallback: ({ value, colDef }) => {
    return colDef.field === 'salary' ? Math.round(Number(value)) : (value as string);
  },
});
```

Quoting follows RFC 4180 — commas, quotes, and newlines are escaped automatically. A UTF-8 BOM is prepended so Excel opens the file correctly.

## Grid state

Persist and restore the full grid configuration (columns, sort, filters, pagination, quick filter) as JSON.

```typescript
// snapshot
const state = api.getGridState();
localStorage.setItem('myGrid', JSON.stringify(state));

// later
const saved = JSON.parse(localStorage.getItem('myGrid')!);
api.applyGridState(saved);
```

### Subset: just columns

```typescript
api.getColumnState();             // ColumnStateItem[]
api.applyColumnState(snapshot);
```

`ColumnStateItem` covers `width`, `hide`, `pinned`, `sort`, `sortIndex`, `rowGroup`, `rowGroupIndex`, and `flex`.
