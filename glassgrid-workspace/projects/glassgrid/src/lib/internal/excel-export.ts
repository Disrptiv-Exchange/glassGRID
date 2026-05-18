import type { ColumnDef, ExcelExportOptions, RowNode } from '../types';
import { formatCellValue, getCellValue } from './value';

/**
 * Excel 2003 XML SpreadsheetML — a single-file XML format that Excel + Numbers + LibreOffice
 * all accept. Avoids the heavy weight of OOXML (.xlsx) zip packaging.
 */
export function toExcelXml<TRow>(
  cols: readonly ColumnDef<TRow>[],
  nodes: readonly RowNode<TRow>[],
  opts: ExcelExportOptions<TRow> = {},
): string {
  const selectedCols = opts.columnKeys?.length
    ? cols.filter((c) => opts.columnKeys!.includes((c.colId ?? c.field ?? '') as string))
    : cols;
  const sheetName = opts.sheetName ?? 'Sheet1';
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const out: string[] = [];
  out.push('<?xml version="1.0"?>');
  out.push('<?mso-application progid="Excel.Sheet"?>');
  out.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">');
  out.push('  <Styles>');
  out.push('    <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EEEEEE" ss:Pattern="Solid"/></Style>');
  out.push('    <Style ss:ID="Currency"><NumberFormat ss:Format="Currency"/></Style>');
  out.push('  </Styles>');
  out.push(`  <Worksheet ss:Name="${esc(sheetName)}">`);
  out.push('    <Table>');
  if (!opts.skipHeader) {
    out.push('      <Row>');
    for (const c of selectedCols) {
      out.push(`        <Cell ss:StyleID="Header"><Data ss:Type="String">${esc(c.headerName ?? c.field ?? c.colId ?? '')}</Data></Cell>`);
    }
    out.push('      </Row>');
  }
  const images: { row: number; col: number; dataUrl: string; w: number; h: number }[] = [];
  let excelRowIndex = opts.skipHeader ? 0 : 1; // 0-based, header counts as row 0

  for (const node of nodes) {
    out.push('      <Row>');
    let colIdx = 0;
    for (const c of selectedCols) {
      let value: unknown = getCellValue(c, node);
      if (opts.processCellCallback) value = opts.processCellCallback({ data: node.data, node, colDef: c, value });
      let type = 'String';
      let formatted: string;
      if (typeof value === 'number' && !isNaN(value)) {
        type = 'Number';
        formatted = String(value);
      } else if (value instanceof Date) {
        type = 'DateTime';
        formatted = value.toISOString();
      } else if (typeof value === 'boolean') {
        type = 'Boolean';
        formatted = value ? '1' : '0';
      } else {
        formatted = esc(formatCellValue(c, node, value));
      }
      const note = opts.noteFor?.({ data: node.data, node, colDef: c, value });
      const link = opts.hyperlinkFor?.({ data: node.data, node, colDef: c, value });
      const img = opts.imageFor?.({ data: node.data, node, colDef: c, value });
      const attrs: string[] = [];
      if (link) attrs.push(`ss:HRef="${esc(link)}"`);
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
      out.push(`        <Cell${attrStr}>${note ? `<Comment><Data ss:Type="String">${esc(note)}</Data></Comment>` : ''}<Data ss:Type="${type}">${formatted}</Data></Cell>`);
      if (img?.dataUrl) {
        images.push({ row: excelRowIndex, col: colIdx, dataUrl: img.dataUrl, w: img.width ?? 64, h: img.height ?? 64 });
      }
      colIdx++;
    }
    out.push('      </Row>');
    excelRowIndex++;

    // master / detail export
    if (opts.detailRowProvider) {
      const detail = opts.detailRowProvider(node.data);
      if (detail?.length) {
        for (const detailRow of detail) {
          out.push('      <Row>');
          for (const cell of detailRow) {
            out.push(`        <Cell><Data ss:Type="String">${esc(cell ?? '')}</Data></Cell>`);
          }
          out.push('      </Row>');
          excelRowIndex++;
        }
      }
    }
  }
  out.push('    </Table>');

  // images — emit as anchored shapes (Excel 2003 XML syntax)
  if (images.length) {
    out.push(`    <x:WorksheetOptions xmlns:x="urn:schemas-microsoft-com:office:excel">`);
    for (const img of images) {
      out.push(`      <Image>`);
      out.push(`        <RowIndex>${img.row}</RowIndex>`);
      out.push(`        <ColumnIndex>${img.col}</ColumnIndex>`);
      out.push(`        <Width>${img.w}</Width>`);
      out.push(`        <Height>${img.h}</Height>`);
      out.push(`        <Source>${img.dataUrl}</Source>`);
      out.push(`      </Image>`);
    }
    out.push(`    </x:WorksheetOptions>`);
  }

  out.push('  </Worksheet>');
  out.push('</Workbook>');
  return out.join('\n');
}

export function downloadExcel(filename: string, xml: string) {
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
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
