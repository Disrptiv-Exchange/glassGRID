import type { ColumnDef, RowNode } from '../types';
import { formatCellValue, getCellValue } from './value';

export function rowsToTsv<TRow>(cols: readonly ColumnDef<TRow>[], nodes: readonly RowNode<TRow>[], includeHeaders: boolean): string {
  const lines: string[] = [];
  if (includeHeaders) lines.push(cols.map((c) => c.headerName ?? c.field ?? c.colId ?? '').join('\t'));
  for (const node of nodes) {
    lines.push(cols.map((c) => formatCellValue(c, node, getCellValue(c, node))).join('\t'));
  }
  return lines.join('\n');
}

export async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* fallthrough */ }
  }
  // fallback for non-secure contexts
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
}
