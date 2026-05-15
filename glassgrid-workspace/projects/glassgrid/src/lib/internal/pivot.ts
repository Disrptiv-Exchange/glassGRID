import type { ColumnDef, RowNode } from '../types';
import { aggregate } from './aggregation';
import { getCellValue } from './value';

/**
 * Pivot transforms data: for each combination of row-group colIds and pivot colIds,
 * compute aggregates of value columns (aggFunc set).
 *
 * Returns pivot-result columns + transformed rows where each unique pivot key
 * gets its own column (one per value column).
 */
export function pivotTransform<TRow extends object>(
  nodes: readonly RowNode<TRow>[],
  rowGroupColIds: string[],
  pivotColIds: string[],
  valueColIds: string[],
  colDefsById: ReadonlyMap<string, ColumnDef<TRow>>,
): { rows: Record<string, unknown>[]; pivotKeys: string[]; pivotCols: ColumnDef<TRow>[] } {
  if (!pivotColIds.length || !valueColIds.length) return { rows: nodes.map((n) => n.data as never), pivotKeys: [], pivotCols: [] };

  const pivotKeys = new Set<string>();
  const groupBuckets = new Map<string, { rowKey: string; pivotValues: Map<string, RowNode<TRow>[]>; sample: RowNode<TRow> }>();

  for (const node of nodes) {
    const rowKeyParts = rowGroupColIds.map((id) => {
      const cd = colDefsById.get(id);
      return cd ? String(getCellValue(cd, node) ?? '') : '';
    });
    const rowKey = rowKeyParts.join('|') || '_root';

    const pivotKeyParts = pivotColIds.map((id) => {
      const cd = colDefsById.get(id);
      return cd ? String(getCellValue(cd, node) ?? '') : '';
    });
    const pivotKey = pivotKeyParts.join(' / ');
    pivotKeys.add(pivotKey);

    const bucket = groupBuckets.get(rowKey) ?? { rowKey, pivotValues: new Map(), sample: node };
    const list = bucket.pivotValues.get(pivotKey) ?? [];
    list.push(node);
    bucket.pivotValues.set(pivotKey, list);
    groupBuckets.set(rowKey, bucket);
  }

  const sortedPivotKeys = Array.from(pivotKeys).sort();
  const pivotCols: ColumnDef<TRow>[] = [];
  for (const pk of sortedPivotKeys) {
    for (const vid of valueColIds) {
      const vd = colDefsById.get(vid);
      if (!vd) continue;
      const colId = `${pk}_${vid}`;
      pivotCols.push({
        colId,
        headerName: valueColIds.length === 1 ? pk : `${pk} · ${vd.headerName ?? vid}`,
        width: 130,
        valueGetter: () => undefined, // value pulled from transformed row
        field: colId as keyof TRow & string,
        sortable: true,
      });
    }
  }

  const rows: Record<string, unknown>[] = [];
  for (const bucket of groupBuckets.values()) {
    const row: Record<string, unknown> = {};
    // copy row-group columns from sample
    for (const id of rowGroupColIds) {
      const cd = colDefsById.get(id);
      if (cd?.field) row[cd.field] = getCellValue(cd, bucket.sample);
    }
    for (const pk of sortedPivotKeys) {
      const nodesForPk = bucket.pivotValues.get(pk) ?? [];
      for (const vid of valueColIds) {
        const vd = colDefsById.get(vid);
        if (!vd?.aggFunc) continue;
        const values = nodesForPk.map((n) => getCellValue(vd, n));
        row[`${pk}_${vid}`] = aggregate(values, vd.aggFunc);
      }
    }
    rows.push(row);
  }

  return { rows, pivotKeys: sortedPivotKeys, pivotCols };
}
