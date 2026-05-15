import type { ColumnDef, RowNode, ValueFormatterParams, ValueGetterParams } from '../types';

export function getCellValue<TRow>(
  colDef: ColumnDef<TRow>,
  node: RowNode<TRow>,
): unknown {
  if (colDef.valueGetter) {
    return colDef.valueGetter({ data: node.data, node, colDef } as ValueGetterParams<TRow>);
  }
  if (colDef.field) {
    return readPath(node.data as Record<string, unknown>, colDef.field);
  }
  return undefined;
}

/**
 * Cache Intl.NumberFormat instances per (locale, currency, options-stringified) tuple.
 * Construction is reasonably expensive; we may format millions of cells so memoise it.
 */
const numberFormatCache = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(
  locale: string | undefined,
  currency: string | undefined,
  override: Intl.NumberFormatOptions | undefined,
): Intl.NumberFormat {
  // Build the effective options. Explicit override wins.
  let opts: Intl.NumberFormatOptions;
  if (override) {
    opts = { ...override };
    if (currency && !opts.currency) { opts.currency = currency; if (!opts.style) opts.style = 'currency'; }
  } else if (currency) {
    opts = { style: 'currency', currency };
  } else {
    opts = {};
  }
  const lc = locale ?? (currency ? 'en-US' : undefined);
  const key = `${lc ?? 'default'}|${JSON.stringify(opts)}`;
  let fmt = numberFormatCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(lc, opts);
    numberFormatCache.set(key, fmt);
  }
  return fmt;
}

export function formatCellValue<TRow>(
  colDef: ColumnDef<TRow>,
  node: RowNode<TRow>,
  value: unknown,
): string {
  // 1) Consumer-provided valueFormatter is the highest-priority override.
  if (colDef.valueFormatter) {
    const params: ValueFormatterParams<TRow, unknown> = {
      value,
      data: node.data,
      node,
      colDef: colDef as ColumnDef<TRow, unknown>,
    };
    return colDef.valueFormatter(params) ?? '';
  }
  // 2) Locale / currency / numberFormatOptions on the colDef → Intl.NumberFormat.
  if (typeof value === 'number' && !isNaN(value) &&
      (colDef.locale || colDef.currency || colDef.numberFormatOptions)) {
    try {
      return getNumberFormatter(colDef.locale, colDef.currency, colDef.numberFormatOptions).format(value);
    } catch {
      // Bad locale / currency code — fall through to default.
    }
  }
  // 3) Default — plain string coercion.
  return value == null ? '' : String(value);
}

function readPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  const sa = String(a);
  const sb = String(b);
  return sa.localeCompare(sb, undefined, { sensitivity: 'base', numeric: true });
}
