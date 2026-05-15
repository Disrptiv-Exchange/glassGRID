import type { ColumnDef, RowNode } from '../types';
import { formatCellValue, getCellValue } from './value';

/**
 * Quick filter: case-insensitive substring match across all visible columns.
 * Empty / whitespace-only query matches everything.
 */
export function applyQuickFilter<TRow>(
  nodes: readonly RowNode<TRow>[],
  query: string,
  cols: readonly ColumnDef<TRow>[],
): RowNode<TRow>[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes.slice();
  return nodes.filter((node) => {
    for (const colDef of cols) {
      const v = getCellValue(colDef, node);
      const s = formatCellValue(colDef, node, v);
      if (s && s.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}
