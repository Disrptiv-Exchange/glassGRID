import type { ColumnDef, DefaultColDef } from '../types';

export interface ResolvedColumn<TRow = unknown> {
  colDef: ColumnDef<TRow>;
  colId: string;
  field: string | undefined;
  headerName: string;
  width: number;
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
): ResolvedColumn<TRow>[] {
  return defs.map((d) => {
    const merged: ColumnDef<TRow> = { ...defaultColDef, ...d };
    const colId = merged.colId ?? merged.field ?? `col_${++counter}`;
    return {
      colDef: merged,
      colId,
      field: merged.field,
      headerName: merged.headerName ?? prettify(merged.field ?? colId),
      width: merged.width ?? DEFAULTS.width,
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
