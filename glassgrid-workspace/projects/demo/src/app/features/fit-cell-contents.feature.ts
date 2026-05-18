import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface Line {
  id: number;
  branch: string;
  status: string;
  qty: number;
  unit: string;
  code: string;
}

const data: Line[] = [
  { id: 1, branch: 'PKG01', status: 'OK', qty: 500,   unit: 'EA',   code: 'A1' },
  { id: 2, branch: 'PKG02', status: 'OK', qty: 5_000, unit: 'Case', code: 'B2' },
  { id: 3, branch: 'PKG03', status: 'OK', qty: 0,     unit: 'EA',   code: 'C3' },
  { id: 4, branch: 'PKG01', status: 'OK', qty: 12,    unit: 'PKG',  code: 'D4' },
  { id: 5, branch: 'PKG04', status: 'OK', qty: 7_500, unit: 'EA',   code: 'E5' },
];

@Component({
  selector: 'demo-fit-cell-contents',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>autoSizeStrategy = 'fitCellContents'</h1>
      <p>
        Header labels here are long ("Branch Plant Code", "Ordered Qty") but the cell data is
        short ("PKG01", "500"). With <code>autoSizeStrategy="fitCellContents"</code>, columns
        size to the cell content only — the header ellipsis-truncates if it can't fit. Compare
        to the default <code>'fitGridWidth'</code> on other routes where columns inflate to the
        longer of header vs cell.
      </p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="fit-cell-contents-grid"
        autoSizeStrategy="fitCellContents"
        [columnDefs]="cols()"
        [rowData]="rows()"
        [defaultColDef]="{ resizable: true, minWidth: 60 }"
      />
    </section>
  `,
})
export class FitCellContentsFeature {
  readonly rows = signal<Line[]>(data);
  readonly cols = signal<ColumnDef<Line>[]>([
    { field: 'id', headerName: 'Order Line ID' },
    { field: 'branch', headerName: 'Branch Plant Code' },
    { field: 'status', headerName: 'Approval Status' },
    { field: 'qty', headerName: 'Ordered Qty' },
    { field: 'unit', headerName: 'Unit of Measure' },
    { field: 'code', headerName: 'Reference Code' },
  ]);
}
