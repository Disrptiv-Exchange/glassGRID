import type { ColumnDef, RowNode, SortModelItem } from '../types';
import { defaultCompare, getCellValue } from './value';

export function sortRows<TRow>(
  nodes: readonly RowNode<TRow>[],
  sortModel: readonly SortModelItem[],
  colDefsById: ReadonlyMap<string, ColumnDef<TRow>>,
): RowNode<TRow>[] {
  if (sortModel.length === 0) return nodes.slice();
  const arr = nodes.slice();
  arr.sort((na, nb) => {
    for (const item of sortModel) {
      const colDef = colDefsById.get(item.colId);
      if (!colDef) continue;
      const va = getCellValue(colDef, na);
      const vb = getCellValue(colDef, nb);
      const cmp = colDef.comparator
        ? colDef.comparator(va as never, vb as never)
        : defaultCompare(va, vb);
      if (cmp !== 0) return item.sort === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
  return arr;
}

const DEFAULT_ORDER: ('asc' | 'desc' | null)[] = ['asc', 'desc', null];

export function nextSortDirection(
  current: 'asc' | 'desc' | null,
  order?: ('asc' | 'desc' | null)[],
): 'asc' | 'desc' | null {
  const seq = order ?? DEFAULT_ORDER;
  const idx = seq.indexOf(current);
  return seq[(idx + 1) % seq.length] ?? null;
}
