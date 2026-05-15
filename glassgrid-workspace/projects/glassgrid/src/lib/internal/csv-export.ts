import type { ColumnDef, CsvExportOptions, RowNode } from '../types';
import { formatCellValue, getCellValue } from './value';

function escape(cell: string, delimiter: string): string {
  if (cell == null) return '';
  const needsQuote = cell.includes(delimiter) || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
  if (!needsQuote) return cell;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function toCsv<TRow>(
  cols: readonly ColumnDef<TRow>[],
  nodes: readonly RowNode<TRow>[],
  opts: CsvExportOptions<TRow> = {},
): string {
  const delim = opts.delimiter ?? ',';
  const out: string[] = [];
  const selectedCols = opts.columnKeys?.length
    ? cols.filter((c) => opts.columnKeys!.includes((c.colId ?? c.field ?? '') as string))
    : cols;
  if (!opts.skipHeader) {
    out.push(selectedCols.map((c) => escape(c.headerName ?? c.field ?? c.colId ?? '', delim)).join(delim));
  }
  for (const node of nodes) {
    const cells = selectedCols.map((c) => {
      const v = getCellValue(c, node);
      if (opts.processCellCallback) {
        const r = opts.processCellCallback({ data: node.data, node, colDef: c, value: v });
        return escape(String(r ?? ''), delim);
      }
      return escape(formatCellValue(c, node, v), delim);
    });
    out.push(cells.join(delim));
  }
  return out.join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
