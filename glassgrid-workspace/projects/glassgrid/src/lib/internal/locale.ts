import type { LocaleTextFn } from '../types';

export const DEFAULT_LOCALE: Record<string, string> = {
  // toolbar / overlay
  quickFilter: 'Quick filter…',
  noRows: 'No rows to show',
  loading: 'Loading…',
  selected: 'selected',
  total: 'total',
  filtered: 'filtered',
  // pagination
  pageSize: 'Page size:',
  page: 'Page',
  of: 'of',
  to: 'to',
  rows: 'rows',
  filteredFrom: 'filtered from',
  firstPage: 'First page',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
  // filter popup
  filterApply: 'Apply',
  filterReset: 'Reset',
  filterClear: 'Clear',
  filterCondition1: 'Condition 1',
  filterCondition2: 'Condition 2',
  // context menu
  copy: 'Copy',
  copyWithHeaders: 'Copy with headers',
  paste: 'Paste',
  export: 'Export',
  csvExport: 'CSV export',
  resetColumns: 'Reset columns',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  // side bar
  columns: 'Columns',
  filters: 'Filters',
  // group
  group: 'Group',
};

export function resolveLocale(getLocaleText: LocaleTextFn | null): (key: string) => string {
  return (key: string) => {
    const def = DEFAULT_LOCALE[key] ?? key;
    return getLocaleText ? getLocaleText(key, def) : def;
  };
}
