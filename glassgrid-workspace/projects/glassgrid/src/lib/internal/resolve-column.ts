import type { ColumnDef, ColumnTypeMap, DefaultColDef } from '../types';

export interface ResolvedColumn<TRow = unknown> {
  colDef: ColumnDef<TRow>;
  colId: string;
  field: string | undefined;
  headerName: string;
  width: number;
  /** True iff the consumer set `width` directly on this per-column ColumnDef
   *  (NOT inherited from defaultColDef). `defaultColDef.width` is treated as an
   *  initial value only — the auto-fit pass is still free to widen the column to
   *  fit header + cell content. Matches ag-grid: `defaultColDef.width` is a
   *  default, not a lock; only a per-column `width:` is honoured as explicit. */
  widthExplicit: boolean;
  minWidth: number;
  maxWidth: number | undefined;
  flex: number | undefined;
  hide: boolean;
  pinned: 'left' | 'right' | null;
  sortable: boolean;
  resizable: boolean;
  suppressMovable: boolean;
  filter: ColumnDef<TRow>['filter'];
}

const DEFAULTS = {
  width: 200,
  minWidth: 40,
  hide: false,
  pinned: null as 'left' | 'right' | null,
  sortable: false,
  resizable: true,
  suppressMovable: false,
};

let counter = 0;

export function resolveColumns<TRow>(
  defs: readonly ColumnDef<TRow>[],
  defaultColDef?: DefaultColDef<TRow>,
  columnTypes?: ColumnTypeMap<TRow>,
): ResolvedColumn<TRow>[] {
  return defs.map((d) => {
    // Apply column types in order: defaultColDef → each type from `columnTypes` → per-column def.
    let merged: ColumnDef<TRow> = { ...defaultColDef };
    if (d.type && columnTypes) {
      const typeKeys = (Array.isArray(d.type) ? d.type : d.type.split(/[\s,]+/)).filter(Boolean);
      for (const key of typeKeys) {
        const t = columnTypes[key];
        if (t) merged = { ...merged, ...t };
      }
    }
    merged = { ...merged, ...d };
    const colId = merged.colId ?? merged.field ?? `col_${++counter}`;
    return {
      colDef: merged,
      colId,
      field: merged.field,
      headerName: merged.headerName ?? prettify(merged.field ?? colId),
      width: merged.width ?? DEFAULTS.width,
      widthExplicit: d.width !== undefined,
      minWidth: merged.minWidth ?? DEFAULTS.minWidth,
      maxWidth: merged.maxWidth,
      flex: merged.flex,
      hide: merged.hide ?? merged.initialHide ?? DEFAULTS.hide,
      pinned: merged.pinned ?? DEFAULTS.pinned,
      sortable: merged.sortable ?? DEFAULTS.sortable,
      resizable: merged.resizable ?? DEFAULTS.resizable,
      suppressMovable: merged.suppressMovable ?? DEFAULTS.suppressMovable,
      filter: merged.filter,
    };
  });
}

function prettify(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}
