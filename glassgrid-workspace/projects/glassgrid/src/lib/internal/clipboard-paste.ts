import type { ColumnDef, RowNode } from '../types';

/**
 * Parse TSV/CSV-ish clipboard text into a 2D grid.
 * - Tab between cells, newline between rows
 * - Handles quoted cells with embedded newlines/commas
 */
export function parseClipboardText(text: string, delim = '\t'): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let cur = '';
  let row: string[] = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === delim) { row.push(cur); cur = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export async function readClipboard(): Promise<string> {
  if (navigator.clipboard?.readText) {
    try { return await navigator.clipboard.readText(); } catch { /* fall back */ }
  }
  // no synchronous fallback; require the caller to pass text directly
  return '';
}
