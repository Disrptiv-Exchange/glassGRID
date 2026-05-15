# Column definitions

A column definition (`ColumnDef<TRow>`) describes one column. All properties are optional except for **either** `field` or `valueGetter`.

## Identity & label

| Property | Type | Description |
|---|---|---|
| `field` | `keyof TRow & string` | Property path on the row (supports `a.b.c`). |
| `colId` | `string` | Stable id; defaults to `field` or auto-generated. |
| `headerName` | `string` | Header label. Defaults to a prettified `field`. |
| `headerTooltip` | `string` | Browser-native tooltip on the header. |

## Sizing

| Property | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | `200` | Initial width in px. |
| `minWidth` | `number` | `40` | Hard minimum for drag-resize. |
| `maxWidth` | `number` | – | Hard maximum. |
| `flex` | `number` | – | When `sizeColumnsToFit()` is called, columns with `flex` share the remaining space proportionally. |

## Visibility & position

| Property | Type | Description |
|---|---|---|
| `hide` | `boolean` | Hidden initially. |
| `pinned` | `'left' \| 'right' \| null` | Pin to a side of the viewport. |
| `lockPosition` / `lockVisible` / `lockPinned` | `boolean` | Disallow user-driven changes. |
| `suppressMovable` | `boolean` | Disable drag-to-reorder for this column. |

## Sorting

| Property | Type | Description |
|---|---|---|
| `sortable` | `boolean` | Allow header click to sort. |
| `sort` | `'asc' \| 'desc' \| null` | Initial sort direction. |
| `sortIndex` | `number` | Position in multi-column sort. |
| `comparator` | `(a, b) => number` | Custom comparator. Falls back to a locale-aware compare. |
| `sortingOrder` | `('asc' \| 'desc' \| null)[]` | Custom cycle order. |

## Values

| Property | Type | Description |
|---|---|---|
| `valueGetter` | `(params) => TValue` | Compute a value instead of reading `field`. |
| `valueFormatter` | `(params) => string` | Convert a value to the displayed string. Used for cell text **and** for the quick filter. |

## Rendering

| Property | Type | Description |
|---|---|---|
| `cellRenderer` | `string \| (params) => string \| Node` | Static HTML or a function returning HTML / a DOM node. Use for badges, icons, links. |
| `cellClass` | `string \| string[] \| (params) => …` | Static or dynamic class names. |
| `cellStyle` | `Record<string,string> \| (params) => …` | Inline style overrides. Prefer `cellClass` + CSS variables. |
| `cellClassRules` | `Record<className, (params) => boolean>` | Conditional classes. |

## Selection helpers

| Property | Type | Description |
|---|---|---|
| `checkboxSelection` | `boolean \| (params) => boolean` | Render a checkbox in cells of this column. |
| `headerCheckboxSelection` | `boolean` | Render a "select all" checkbox in the header. |

## Tooltips

| Property | Type | Description |
|---|---|---|
| `tooltipField` | `keyof TRow & string` | Use a row field as the tooltip text. |
| `tooltipValueGetter` | `(params) => string \| null` | Compute the tooltip dynamically. |

## Example

```typescript
import type { ColumnDef } from 'glassgrid';
import type { Person } from './model';

export const cols: ColumnDef<Person>[] = [
  { field: 'id', headerName: '#', width: 80, sortable: true },
  { field: 'name', width: 220, sortable: true,
    cellClassRules: { 'starred': p => p.data.starred } },
  { field: 'salary', width: 140, sortable: true,
    valueFormatter: p => `$${(p.value as number).toLocaleString()}`,
    cellClassRules: { 'big-money': p => (p.value as number) > 200_000 } },
  { headerName: '', width: 44, checkboxSelection: true, headerCheckboxSelection: true,
    suppressMovable: true, resizable: false },
];
```
