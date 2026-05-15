# glassGRID

A modern, lightweight Angular data grid. Signal-native, tree-shakeable, themeable through CSS custom properties, and designed to feel familiar to anyone coming from ag-grid.

[![Status](https://img.shields.io/badge/status-active-success)](#)
[![Tests](https://img.shields.io/badge/playwright-36%2F36%20passing-brightgreen)](#testing)
[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031)](https://angular.dev)
[![Bundle](https://img.shields.io/badge/fesm2022-248KB%20raw%20%2F%2049KB%20gzipped-blue)](#bundle-size)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why glassGRID

- **Tiny.** Zero runtime dependencies in the core. Features opt-in via provider functions.
- **Signal-native.** Inputs, derived state, and the public API are all built on Angular signals — no Zone.js required.
- **Themeable.** Every visual value is a `--gg-*` CSS custom property. Themes are pure CSS.
- **Typed end-to-end.** `<glass-grid>` carries the row generic `<TRow>` through every API and event.
- **Familiar.** Column defs, sort models, and the `GridApi` mirror ag-grid where it makes sense, so migration is mostly mechanical.
- **Battle-tested.** 36/36 Playwright routes exercise every shipped feature with real sample data.

---

## Installation

glassGRID is published to **GitHub Packages** as a private scoped package. To install it in a consumer project:

**1. Create a `.npmrc` in your project root** (template at [`.npmrc.example`](.npmrc.example)):

```
@disrptiv-exchange:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**2. Set `GITHUB_TOKEN`** to a personal access token with `read:packages` scope (create one at https://github.com/settings/tokens):

```bash
export GITHUB_TOKEN=ghp_xxx
```

**3. Install:**

```bash
npm install @disrptiv-exchange/glassgrid
```

That's it — from this point on it behaves like any other npm dependency. Gitignore your `.npmrc` if it contains a hard-coded token (the template uses `${GITHUB_TOKEN}` so it's safe to commit).

---

## Quick start

```bash
npm install @disrptiv-exchange/glassgrid
```

```typescript
import { Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from '@disrptiv-exchange/glassgrid';

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
    { field: 'id',     headerName: '#', width: 80 },
    { field: 'name',   width: 240 },
    { field: 'role',   width: 240 },
    { field: 'salary', width: 160, locale: 'en-US', currency: 'USD' },
  ];
}
```

Add the theme stylesheet to your global styles:

```scss
// styles.scss
@import "@disrptiv-exchange/glassgrid/themes/quartz.scss";
```

That's the entire setup. No `NgModule`, no `providers`, no `forRoot()`.

**→ Full step-by-step guide: [docs/getting-started.md](docs/getting-started.md)**

---

## Feature matrix

| Area              | What you get                                                                                                                          |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **Data binding**  | Client-side, infinite, and server-side row models. `getRowId` for stable identity. `applyTransaction` for incremental updates.        |
| **Columns**       | Width / minWidth / maxWidth / flex. Pin left or right (sticky during horizontal scroll). Drag-to-reorder. Drag-to-resize. Auto-size.  |
| **Sorting**       | Single + multi-column. Custom comparators. Locale-aware default sort. `sortChanged` event.                                            |
| **Filtering**     | Quick filter, text / number / date / set filters, floating filter row, **custom floating-filter components**, multi-filter, advanced filter builder. |
| **Number format** | Locale + currency-aware via `Intl.NumberFormat` — `{ locale: 'en-IN', currency: 'INR' }` → `₹1,45,000.00`. Cached per column.         |
| **Editing**       | Built-in text / number / date / select / checkbox / largeText editors. Custom editors. Undo / redo. `cellValueChanged` events.        |
| **Selection**     | Single + multi-row. Checkbox column + header select-all. Click-to-select. Range selection. Copy as TSV.                                |
| **Grouping**      | Row grouping (multi-level), aggregations (sum/min/max/avg/count/first/last), tree data, master / detail.                              |
| **Pagination**    | Page size selector, auto page size, full pagination API.                                                                              |
| **Virtualisation**| Row virtualisation by default — verified at 100,000 rows / 60fps. Column virtualisation available.                                    |
| **Export**        | CSV + Excel XML export. Save / restore full grid state as JSON.                                                                        |
| **Theming**       | Quartz / Material / Balham themes (light + dark). All visual values are `--gg-*` CSS variables. Reduced-motion respected.            |
| **a11y**          | `role="grid"`, full ARIA attributes, complete keyboard nav (arrows, Tab, PageUp/Down, Home/End, Space, Enter, F2).                    |
| **Charts**        | Lightweight pure-SVG sparklines (`lineSparkline`, `barSparkline`, `areaSparkline`).                                                   |
| **i18n / RTL**    | `[getLocaleText]` callback. `[enableRtl]` flips layout.                                                                                |
| **Print**         | `@media print` strips chrome and unwinds virtualisation onto a single flow.                                                            |

> **Status (2026-05-15):** 190 features shipped · 48 partial · 11 fully pending · 249 total.
> See [FEATURES.md](FEATURES.md) for the full shipped catalogue and [ROADMAP.md](ROADMAP.md) for what's next.

---

## Documentation

| Doc                                              | What's inside                                                              |
|--------------------------------------------------|----------------------------------------------------------------------------|
| [Getting started](docs/getting-started.md)       | Install → first grid → columns, API, selection, editing, theming, perf.   |
| [Concepts](docs/concepts.md)                     | Row models, column lifecycle, the `GridApi`.                              |
| [Column definitions](docs/column-definitions.md) | Every `ColumnDef<TRow>` property with examples.                            |
| [Filtering](docs/filtering.md)                   | Quick filter, per-column filters, floating filters, custom components.    |
| [Editing](docs/editing.md)                       | Built-in editors, custom editors, undo / redo, lifecycle events.          |
| [Grouping](docs/grouping.md)                     | Row groups, aggregates, tree data, master / detail.                       |
| [Export & state](docs/export.md)                 | CSV, Excel, save / restore.                                                |
| [Theming](docs/theming.md)                       | Themes, dark mode, every CSS variable.                                     |
| [API reference](docs/api-reference.md)           | The full `GridApi<TRow>` surface — ~70 typed methods.                     |
| [Events](docs/events.md)                         | Every event with its payload type.                                         |
| [Recipes](docs/recipes.md)                       | Drop-in patterns: search box, footer aggregates, custom filter dropdown.  |

---

## Installation & requirements

| Package           | Minimum   |
|-------------------|-----------|
| Angular           | 17.0      |
| Built & tested on | 21.2      |
| TypeScript        | 5.0       |
| Node              | 18 LTS    |

Browsers: all evergreen Chromium / Firefox / Safari from the last 2 years.

```bash
npm install @disrptiv-exchange/glassgrid
```

The library carries **no transitive runtime deps** outside `tslib`. Peer deps are `@angular/core` and `@angular/common`.

---

## Repository layout

```
glassGRID/
├── README.md                   # you are here
├── ROADMAP.md                  # what's still to do
├── FEATURES.md                 # what's shipped, in plain English
├── CONTRIBUTING.md             # how to work on the codebase
├── LICENSE                     # MIT
├── docs/                       # user manual + technical docs
│   ├── getting-started.md
│   ├── concepts.md · column-definitions.md · filtering.md · editing.md
│   ├── grouping.md · export.md · theming.md
│   ├── api-reference.md · events.md · recipes.md
│   ├── screenshots/
│   └── test-reports/
└── glassgrid-workspace/
    ├── projects/
    │   ├── glassgrid/          # the publishable library
    │   └── demo/               # demo + feature-gallery app
    ├── scripts/                # build / screenshot / e2e helpers
    └── package.json
```

---

## Running locally

```bash
git clone https://github.com/Disrptiv-Exchange/glassGRID.git
cd glassGRID/glassgrid-workspace
npm install
npx ng build glassgrid          # build the library
npx ng serve                    # demo on http://localhost:4200
```

### Testing

```bash
node scripts/e2e.mjs            # 36-route Playwright suite, headless
```

The script auto-builds the library, serves the demo, and walks every feature route. Latest run: **36 pass · 0 fail · 36 total**.

### Bundle size

After `npx ng build glassgrid`:

| Artefact                              | Size    |
|---------------------------------------|---------|
| `dist/glassgrid/` (full package)      | 652 KB  |
| `fesm2022/glassgrid.mjs` (raw)        | 248 KB  |
| `fesm2022/glassgrid.mjs` (gzipped)    | **49 KB** |

The 49 KB gzipped figure is the entire shipped JavaScript surface — every feature in the catalogue above. When consumed in an Angular app, tree-shaking strips unused features further; a grid that only uses sorting + selection + pagination drops well under 30 KB gzipped.

---

## ag-grid compatibility

Existing ag-grid column definitions are largely drop-in. The library accepts:

- ag-grid filter aliases — `agTextColumnFilter`, `agNumberColumnFilter`, `agDateColumnFilter`, `agSetColumnFilter`, `agMultiColumnFilter`
- `gridOptions`-style binding via `setGridOption(key, value)`
- `forEachNode`, `forEachNodeAfterFilter`, `forEachNodeAfterFilterAndSort`
- `refreshInfiniteCache()` / `purgeInfiniteCache()` / `infiniteRowModel.resetCache()`
- ag-grid event names on the `GridApi`

Most apps migrate by swapping the import and the selector. The library doesn't claim affiliation with ag-grid; it just keeps the surface area familiar so you don't have to relearn it.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the codebase tour, local setup, conventions, and the workflow that takes a roadmap item to production.

## License

[MIT](LICENSE) © Disrptiv Exchange
