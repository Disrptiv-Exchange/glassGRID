import type { RowNode } from '../types';
import type { FlattenedRow } from './grouping';

export interface TreeNode<TRow = unknown> {
  id: string;
  node: RowNode<TRow>;
  level: number;
  path: string[];
  children: TreeNode<TRow>[];
  parentId: string | null;
  hasChildren: boolean;
  expanded: boolean;
}

export function buildTree<TRow>(
  nodes: readonly RowNode<TRow>[],
  getDataPath: (row: TRow) => string[],
  expandedIds: ReadonlySet<string>,
  defaultExpanded: boolean,
): { tree: TreeNode<TRow>[]; flat: FlattenedRow<TRow>[] } {
  const byPath = new Map<string, TreeNode<TRow>>();
  const roots: TreeNode<TRow>[] = [];

  const sorted = nodes.slice().sort((a, b) => {
    const pa = getDataPath(a.data);
    const pb = getDataPath(b.data);
    return pa.length - pb.length || pa.join('/').localeCompare(pb.join('/'));
  });

  for (const node of sorted) {
    const path = getDataPath(node.data);
    const id = path.join('/');
    const parentId = path.length > 1 ? path.slice(0, -1).join('/') : null;
    const tn: TreeNode<TRow> = {
      id,
      node,
      level: path.length - 1,
      path,
      children: [],
      parentId,
      hasChildren: false,
      expanded: expandedIds.has(id) ? !defaultExpanded : defaultExpanded,
    };
    byPath.set(id, tn);
    if (parentId && byPath.has(parentId)) {
      byPath.get(parentId)!.children.push(tn);
      byPath.get(parentId)!.hasChildren = true;
    } else {
      roots.push(tn);
    }
  }

  const flat: FlattenedRow<TRow>[] = [];
  function walk(list: TreeNode<TRow>[]) {
    for (const tn of list) {
      flat.push({ kind: 'leaf', node: tn.node, id: tn.id, level: tn.level });
      if (tn.expanded && tn.children.length) walk(tn.children);
    }
  }
  walk(roots);
  return { tree: roots, flat };
}
