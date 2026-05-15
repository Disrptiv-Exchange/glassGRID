# Concepts

## Row data and row nodes

Pass any array via `[rowData]`. Internally, each row is wrapped in a **RowNode**:

```typescript
interface RowNode<TRow> {
  id: string;
  data: TRow;
  rowIndex: number;
  selected: boolean;
}
```

By default the grid derives row identity from a `.id` field on the row, or from its array index. For stable identity across data refreshes — required for selection persistence and animated row reordering — bind `[getRowId]`:

```html
<glass-grid [rowData]="rows" [getRowId]="getRowId" />
```

```typescript
getRowId = (row: Person) => `person:${row.uuid}`;
```

## Columns

Pass an array of `ColumnDef<TRow>` to `[columnDefs]`. The minimum is `field` (a key path on the row) or `valueGetter`:

```typescript
{ field: 'salary', headerName: 'Salary (USD)' }
{ valueGetter: p => p.data.first + ' ' + p.data.last, headerName: 'Full name' }
```

Defaults shared across columns go in `[defaultColDef]`:

```typescript
defaultColDef = { sortable: true, resizable: true, minWidth: 80 };
```

### Column lifecycle

A definition flows through three states inside the grid:

1. **Authored** — the `ColumnDef` you wrote.
2. **Resolved** — merged with `defaultColDef`, with a stable `colId`, computed `headerName`, etc.
3. **Rendered** — partitioned by pinning (left / center / right) and laid out with computed widths.

The `GridApi` operates on **colIds** — either the one you set, the `field` path, or an auto-generated `col_N`.

## Reactive state

State (sort model, filter text, selection, pagination, column overrides) lives in Angular signals inside the grid. Inputs and the `GridApi` write to these signals; the template re-renders automatically.

Consumers can read state via the `GridApi` returned in `(gridReady)`:

```typescript
onGridReady({ api }: GridReadyEvent<Person>) {
  this.api = api;
  api.setSortModel([{ colId: 'name', sort: 'asc' }]);
}
```

## Events

All outputs are typed against `<TRow>`. The most common:

- `(gridReady)` — fires once when the API is ready.
- `(sortChanged)` — sort model changed.
- `(filterChanged)` — quick filter changed.
- `(selectionChanged)` — selected rows changed.
- `(paginationChanged)` — page or page size changed.
- `(cellClicked)` / `(rowClicked)` — pointer interactions on cells / rows.

See [events.md](events.md) for the full list.
