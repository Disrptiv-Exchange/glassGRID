import type { ColumnDef, FilterModel, FilterModelItem, FilterOp, RowNode } from '../types';
import { getCellValue } from './value';

function asNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  return null;
}

function asDate(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string' || typeof v === 'number') {
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  return null;
}

function lcStr(v: unknown, cs: boolean): string {
  const s = v == null ? '' : String(v);
  return cs ? s : s.toLowerCase();
}

function matchText(value: unknown, item: FilterModelItem, caseSensitive = false): boolean {
  const v = lcStr(value, caseSensitive);
  const f = lcStr(item.filter, caseSensitive);
  switch (item.type) {
    case 'contains': return v.includes(f);
    case 'notContains': return !v.includes(f);
    case 'equals': return v === f;
    case 'notEqual': return v !== f;
    case 'startsWith': return v.startsWith(f);
    case 'endsWith': return v.endsWith(f);
    case 'blank': return v === '';
    case 'notBlank': return v !== '';
    default: return true;
  }
}

function matchNumber(value: unknown, item: FilterModelItem): boolean {
  const v = asNumber(value);
  const f = asNumber(item.filter);
  const f2 = asNumber(item.filterTo);
  if (item.type === 'blank') return v == null;
  if (item.type === 'notBlank') return v != null;
  if (v == null || f == null) return false;
  switch (item.type) {
    case 'equals': return v === f;
    case 'notEqual': return v !== f;
    case 'greaterThan': return v > f;
    case 'greaterThanOrEqual': return v >= f;
    case 'lessThan': return v < f;
    case 'lessThanOrEqual': return v <= f;
    case 'inRange': return f2 != null && v >= f && v <= f2;
    default: return true;
  }
}

function matchDate(value: unknown, item: FilterModelItem): boolean {
  const v = asDate(value);
  const f = asDate(item.filter);
  const f2 = asDate(item.filterTo);
  if (item.type === 'blank') return v == null;
  if (item.type === 'notBlank') return v != null;
  if (v == null || f == null) return false;
  switch (item.type) {
    case 'equals': return v === f;
    case 'notEqual': return v !== f;
    case 'before':
    case 'lessThan': return v < f;
    case 'after':
    case 'greaterThan': return v > f;
    case 'inRange': return f2 != null && v >= f && v <= f2;
    default: return true;
  }
}

/** Normalise the ag-grid alias names to our internal short names. */
export function resolveFilterType(t: unknown): 'text' | 'number' | 'date' | 'set' | null {
  if (!t || t === true) return 'text';
  if (t === 'agNumberColumnFilter' || t === 'number') return 'number';
  if (t === 'agDateColumnFilter' || t === 'date') return 'date';
  if (t === 'agSetColumnFilter' || t === 'set') return 'set';
  if (t === 'agTextColumnFilter' || t === 'text' || t === 'agMultiColumnFilter') return 'text';
  return null;
}

export function applyColumnFilters<TRow>(
  nodes: readonly RowNode<TRow>[],
  model: FilterModel,
  colDefsById: ReadonlyMap<string, ColumnDef<TRow>>,
): RowNode<TRow>[] {
  const entries = Object.entries(model);
  if (entries.length === 0) return nodes.slice();
  return nodes.filter((node) => {
    for (const [colId, item] of entries) {
      const colDef = colDefsById.get(colId);
      if (!colDef) continue;
      const value = getCellValue(colDef, node);
      const items = Array.isArray(item) ? item : [item];
      const cs = !!colDef.filterParams?.caseSensitive;
      for (const cond of items) {
        const type = resolveFilterType(colDef.filter);
        const pass =
          type === 'number' ? matchNumber(value, cond)
          : type === 'date' ? matchDate(value, cond)
          : matchText(value, cond, cs);
        if (!pass) return false;
      }
    }
    return true;
  });
}

export const TEXT_OPS: FilterOp[] = ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith', 'blank', 'notBlank'];
export const NUMBER_OPS: FilterOp[] = ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange', 'blank', 'notBlank'];
export const DATE_OPS: FilterOp[] = ['equals', 'notEqual', 'before', 'after', 'inRange', 'blank', 'notBlank'];

export const FILTER_OP_LABELS: Record<FilterOp, string> = {
  contains: 'Contains',
  notContains: 'Does not contain',
  equals: 'Equals',
  notEqual: 'Does not equal',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  blank: 'Blank',
  notBlank: 'Not blank',
  greaterThan: 'Greater than',
  greaterThanOrEqual: '≥',
  lessThan: 'Less than',
  lessThanOrEqual: '≤',
  inRange: 'In range',
  before: 'Before',
  after: 'After',
};
