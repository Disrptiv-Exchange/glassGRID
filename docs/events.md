# Events

All outputs are strongly typed against `<TRow>`. Subscribe with normal Angular output bindings.

```html
<glass-grid
  (gridReady)="onReady($event)"
  (sortChanged)="onSort($event)"
  (filterChanged)="onFilter($event)"
  (selectionChanged)="onSelection($event)"
  (paginationChanged)="onPagination($event)"
  (cellClicked)="onCell($event)"
  (rowClicked)="onRow($event)"
/>
```

```typescript
import type {
  GridReadyEvent, SortChangedEvent, FilterChangedEvent,
  SelectionChangedEvent, PaginationChangedEvent,
  CellClickedEvent, RowClickedEvent,
} from 'glassgrid';

onReady(e: GridReadyEvent<Person>)            { this.api = e.api; }
onSort(e: SortChangedEvent<Person>)           { /* e.sortModel */ }
onFilter(e: FilterChangedEvent<Person>)       { /* e.quickFilter */ }
onSelection(e: SelectionChangedEvent<Person>) { /* e.selectedRows */ }
onPagination(e: PaginationChangedEvent<Person>){ /* e.page, e.pageSize, e.totalPages */ }
onCell(e: CellClickedEvent<Person>)           { /* e.data, e.value, e.colDef */ }
onRow(e: RowClickedEvent<Person>)             { /* e.data */ }
```

## When events fire

| Event | Trigger |
|---|---|
| `gridReady` | Once, after the first render. |
| `sortChanged` | Whenever the sort model changes (header click, `setSortModel`, initial sort applied). |
| `filterChanged` | Whenever the active quick filter changes (toolbar input, `setQuickFilter`, external binding). |
| `selectionChanged` | Whenever the selected set changes. Emits the full current selection. |
| `paginationChanged` | When page, page size, or total pages change. |
| `cellClicked` | Pointer click on a cell. |
| `rowClicked` | Pointer click anywhere on a row (also fires before the row is selected, if selection is enabled). |
