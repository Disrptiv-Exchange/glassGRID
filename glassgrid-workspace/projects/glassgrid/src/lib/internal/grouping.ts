import type { ColumnDef, RowNode } from '../types';
import { aggregate } from './aggregation';
import { getCellValue } from './value';

export interface GroupRow<TRow = unknown> {
  kind: 'group';
  id: string;
  /** Group field colIds in path order. */
  groupPath: string[];
  /** Display key for this level. */
  groupKey: unknown;
  /** Level (0 = top). */
  level: number;
  /** Number of leaf descendants. */
  count: number;
  /** Children: either further groups or leaves. */
  children: (GroupRow<TRow> | LeafRow<TRow>)[];
  /** Aggregations indexed by colId. */
  aggregates: Record<string, unknown>;
  expanded: boolean;
  /** Parent group id, or null at top level. */
  parentId: string | null;
}

export interface LeafRow<TRow = unknown> {
  kind: 'leaf';
  node: RowNode<TRow>;
}

export type GroupOrLeaf<TRow = unknown> = GroupRow<TRow> | LeafRow<TRow>;

export interface FlattenedRow<TRow = unknown> {
  kind: 'group' | 'leaf' | 'detail';
  group?: GroupRow<TRow>;
  node?: RowNode<TRow>;
  /** Composite stable id used for trackBy. */
  id: string;
  level: number;
}

/**
 * Builds a group tree from flat nodes by `rowGroupColIds` (in order) using `field` lookup.
 * Computes aggregates per group from `aggCols` (col defs with aggFunc set).
 */
export function buildGroupTree<TRow>(
  nodes: readonly RowNode<TRow>[],
  rowGroupColIds: string[],
  colDefsById: ReadonlyMap<string, ColumnDef<TRow>>,
  aggColIds: string[],
  expandedIds: ReadonlySet<string>,
  defaultExpanded: boolean,
): { tree: GroupOrLeaf<TRow>[]; flat: FlattenedRow<TRow>[] } {
  if (rowGroupColIds.length === 0) {
    const tree: LeafRow<TRow>[] = nodes.map((node) => ({ kind: 'leaf' as const, node }));
    const flat: FlattenedRow<TRow>[] = nodes.map((node) => ({ kind: 'leaf' as const, node, id: node.id, level: 0 }));
    return { tree, flat };
  }

  const root = buildLevel<TRow>(nodes, rowGroupColIds, 0, [], colDefsById, aggColIds, expandedIds, defaultExpanded, null);
  const flat: FlattenedRow<TRow>[] = [];
  walk(root, flat);
  return { tree: root, flat };
}

function buildLevel<TRow>(
  nodes: readonly RowNode<TRow>[],
  colIds: string[],
  level: number,
  pathAcc: string[],
  colDefsById: ReadonlyMap<string, ColumnDef<TRow>>,
  aggColIds: string[],
  expandedIds: ReadonlySet<string>,
  defaultExpanded: boolean,
  parentId: string | null,
): GroupOrLeaf<TRow>[] {
  if (level >= colIds.length) return nodes.map((node) => ({ kind: 'leaf' as const, node }));
  const colId = colIds[level]!;
  const colDef = colDefsById.get(colId);
  if (!colDef) return nodes.map((node) => ({ kind: 'leaf' as const, node }));
  const buckets = new Map<unknown, RowNode<TRow>[]>();
  const order: unknown[] = [];
  for (const node of nodes) {
    const v = getCellValue(colDef, node);
    if (!buckets.has(v)) {
      buckets.set(v, []);
      order.push(v);
    }
    buckets.get(v)!.push(node);
  }
  const out: GroupOrLeaf<TRow>[] = [];
  for (const key of order) {
    const groupNodes = buckets.get(key)!;
    const groupPath = [...pathAcc, String(key ?? '')];
    const id = `g:${colIds.slice(0, level + 1).join('|')}:${groupPath.join('|')}`;
    const children = buildLevel<TRow>(groupNodes, colIds, level + 1, groupPath, colDefsById, aggColIds, expandedIds, defaultExpanded, id);
    const aggregates: Record<string, unknown> = {};
    for (const aggColId of aggColIds) {
      const aggColDef = colDefsById.get(aggColId);
      if (!aggColDef?.aggFunc) continue;
      const values = groupNodes.map((n) => getCellValue(aggColDef, n));
      aggregates[aggColId] = aggregate(values, aggColDef.aggFunc);
    }
    const expanded = expandedIds.has(id) ? !defaultExpanded : defaultExpanded;
    out.push({
      kind: 'group',
      id,
      groupPath,
      groupKey: key,
      level,
      count: groupNodes.length,
      children,
      aggregates,
      expanded,
      parentId,
    });
  }
  return out;
}

function walk<TRow>(tree: GroupOrLeaf<TRow>[], flat: FlattenedRow<TRow>[]) {
  for (const entry of tree) {
    if (entry.kind === 'leaf') {
      flat.push({ kind: 'leaf', node: entry.node, id: entry.node.id, level: 0 });
    } else {
      flat.push({ kind: 'group', group: entry, id: entry.id, level: entry.level });
      if (entry.expanded) walk(entry.children, flat);
    }
  }
}
