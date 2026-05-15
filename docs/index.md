# glassGRID

A modern, lightweight Angular data grid. Signal-based, tree-shakeable, themeable through CSS custom properties, and designed to feel familiar to anyone coming from ag-grid.

> **Status**: Phase 1 (foundation MVP) shipped. See [ROADMAP.md](../ROADMAP.md) for what's next.

## Why glassGRID

- **Tiny.** Zero runtime dependencies in the core. Features opt-in via provider functions.
- **Signal-native.** Inputs, derived state, and the public API are all built on Angular signals — no Zone.js required.
- **Themeable.** Every visual value is a `--gg-*` CSS custom property. Themes are pure CSS.
- **Typed end-to-end.** `<glass-grid>` carries the row generic `<TRow>` through every API and event.
- **Familiar.** Column defs, sort models, and the `GridApi` mirror ag-grid where it makes sense, so migration is mostly mechanical.

## Quick start

```bash
npm install glassgrid
```

```typescript
import { Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface Person { id: number; name: string; role: string; }

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [GlassGridComponent],
  template: `
    <glass-grid
      class="gg-theme-quartz"
      [columnDefs]="cols"
      [rowData]="rows()"
      [defaultColDef]="{ sortable: true, resizable: true }"
      [pagination]="true"
      [paginationPageSize]="20"
    />
  `,
})
export class People {
  rows = signal<Person[]>([
    { id: 1, name: 'Ada', role: 'Engineer' },
    { id: 2, name: 'Grace', role: 'Compiler architect' },
  ]);
  cols: ColumnDef<Person>[] = [
    { field: 'id', headerName: '#', width: 80 },
    { field: 'name', width: 200 },
    { field: 'role', width: 240 },
  ];
}
```

Include the theme stylesheet in your app's global styles:

```scss
// styles.scss
@import "glassgrid/themes/quartz.scss";
```

## Documentation map

- [Concepts](concepts.md) — row models, column lifecycle, the GridApi
- [Column definitions](column-definitions.md)
- [Filtering](filtering.md) — quick filter + per-column filters + floating filter row
- [Cell editing](editing.md) — built-in editors, custom editors, undo / redo
- [Grouping & aggregation](grouping.md) — row groups, aggregates, tree data
- [Export & state](export.md) — CSV export, state save/restore
- [Theming](theming.md) — Quartz, Material, Balham, dark mode, CSS variables
- [API reference](api-reference.md)
- [Events](events.md)
- [Recipes](recipes.md)

## See also

- [FEATURES.md](../FEATURES.md) — list of shipped features with descriptions
- [ROADMAP.md](../ROADMAP.md) — what's still pending
