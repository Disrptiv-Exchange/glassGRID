import type { ColumnDef, ColumnGroupDef, ColumnGroupState } from '../types';
import { isColumnGroupDef } from '../types';

export interface ResolvedColumnGroup<TRow = unknown> {
  groupId: string;
  headerName: string;
  marryChildren: boolean;
  headerClass?: string | string[];
  /** Resolved child colIds in display order. */
  childColIds: string[];
  /** Span at the bottom (number of leaf columns). */
  span: number;
  /** Depth within the header tree (0 = leaves). */
  level: number;
  /** Open state — when closed, only first child column shows. */
  open: boolean;
}

export interface HeaderTreeLevel<TRow = unknown> {
  /** Bracketing groups at this level (left → right). */
  groups: ResolvedColumnGroup<TRow>[];
  /** Total span across all groups at this level. */
  span: number;
}

export interface HeaderTree<TRow = unknown> {
  levels: HeaderTreeLevel<TRow>[];
  /** All flat columns in display order (after applying open/closed state). */
  flatColumns: ColumnDef<TRow>[];
  /** Map of groupId -> resolved group for state queries. */
  groupsById: Map<string, ResolvedColumnGroup<TRow>>;
}

let seq = 0;

/**
 * Walks a mixed array of ColumnDef + ColumnGroupDef and produces a header tree
 * plus the flat column list (respecting group open/closed state).
 */
export function buildHeaderTree<TRow>(
  input: (ColumnDef<TRow> | ColumnGroupDef<TRow>)[],
  state: Map<string, boolean>,
): HeaderTree<TRow> {
  const levels: HeaderTreeLevel<TRow>[] = [];
  const flat: ColumnDef<TRow>[] = [];
  const groupsById = new Map<string, ResolvedColumnGroup<TRow>>();

  function visit(items: (ColumnDef<TRow> | ColumnGroupDef<TRow>)[], depth: number): number {
    let totalSpan = 0;
    for (const item of items) {
      if (!isColumnGroupDef(item)) {
        flat.push(item);
        totalSpan += 1;
        continue;
      }
      const groupId = item.groupId ?? `_grp_${++seq}`;
      const desiredOpen = state.has(groupId) ? state.get(groupId)! : (item.openByDefault ?? true);
      const childColIds: string[] = [];
      const visibleChildren = desiredOpen ? item.children : item.children.slice(0, 1);
      const span = visit(visibleChildren, depth + 1);
      for (const c of item.children) {
        if (!isColumnGroupDef(c)) {
          childColIds.push(c.colId ?? c.field ?? `_col_${++seq}`);
        }
      }
      const g: ResolvedColumnGroup<TRow> = {
        groupId,
        headerName: item.headerName,
        marryChildren: !!item.marryChildren,
        headerClass: item.headerClass,
        childColIds,
        span,
        level: depth,
        open: desiredOpen,
      };
      groupsById.set(groupId, g);
      (levels[depth] ??= { groups: [], span: 0 }).groups.push(g);
      levels[depth]!.span += span;
      totalSpan += span;
    }
    return totalSpan;
  }

  visit(input, 0);
  // reverse so level 0 is top, deepest is bottom
  levels.reverse();
  return { levels, flatColumns: flat, groupsById };
}

export function applyGroupState(state: ColumnGroupState[]): Map<string, boolean> {
  return new Map(state.map((s) => [s.groupId, s.open]));
}
