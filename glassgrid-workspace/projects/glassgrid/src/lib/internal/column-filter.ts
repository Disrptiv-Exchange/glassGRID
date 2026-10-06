import type { ColumnDef, FilterModel, FilterModelItem, FilterOp, FilterParams, RowNode } from '../types';
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
  // Prefer ag-grid-shaped dateFrom/dateTo; fall back to filter/filterTo for
  // backwards compatibility with items written before this fix was applied.
  const f = asDate(item.dateFrom ?? item.filter);
  const f2 = asDate(item.dateTo ?? item.filterTo);
  // Operator ids reach us from our own popup, from ag-grid drop-in floating
  // filters, and from `filterParams.filterOptions` lists written by hand --
  // where the date operators are often capitalised ('Before' / 'After').
  // Compare lower-cased so a declared option always reaches the branch that
  // implements it instead of silently falling through to `default: true`.
  const t = String(item.type ?? '').toLowerCase();
  if (t === 'blank') return v == null;
  if (t === 'notblank') return v != null;
  if (v == null || f == null) return false;
  switch (t) {
    case 'equals': return v === f;
    case 'notequal': return v !== f;
    case 'before':
    case 'lessthan': return v < f;
    case 'after':
    case 'greaterthan': return v > f;
    case 'inrange': return f2 != null && v >= f && v <= f2;
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

/**
 * Date-column overrides for FILTER_OP_LABELS.
 *
 * The shared labels name the comparison operators after their numeric
 * equivalents ('Less than', 'Greater than', 'In range'), which reads wrong on
 * a date column. ag-grid calls the same three operators Before / After /
 * Between, so date columns borrow those names.
 */
export const DATE_OP_LABELS: Record<string, string> = {
  lessThan: 'Before',
  lessThanOrEqual: 'On or before',
  greaterThan: 'After',
  greaterThanOrEqual: 'On or after',
  inRange: 'Between',
  notEqual: 'Does not equal',
};

/** Every operator id we know how to render, lower-cased for loose matching. */
const KNOWN_OP_IDS = new Set<string>(Object.keys(FILTER_OP_LABELS).map((o) => o.toLowerCase()));

/**
 * Resolve the operator list a column's filter popup should offer.
 *
 * `filterParams.filterOptions` is ag-grid's escape hatch for narrowing (or
 * renaming) that list -- e.g. a date column that should only offer Equals /
 * Before / After / Between. Entries are either plain operator ids or
 * `{ displayKey, displayName }` objects.
 *
 * The original spelling is preserved, not normalised: host apps map the
 * emitted `type` straight onto their own query operators, and some of them
 * key off the capitalised spellings ('Before') they declared here. Entries
 * that match no known operator are dropped rather than rendered as dead
 * options, and a list that resolves to nothing falls back to the column-type
 * defaults so the popup is never left with an empty dropdown.
 */
export function resolveFilterOps(
  baseOps: readonly FilterOp[],
  filterOptions: FilterParams['filterOptions'] | undefined,
): FilterOp[] {
  if (!filterOptions || filterOptions.length === 0) return [...baseOps];
  const out: FilterOp[] = [];
  for (const entry of filterOptions) {
    const id = typeof entry === 'string' ? entry : entry?.displayKey;
    if (!id || !KNOWN_OP_IDS.has(String(id).toLowerCase())) continue;
    if (!out.includes(id as FilterOp)) out.push(id as FilterOp);
  }
  return out.length > 0 ? out : [...baseOps];
}
