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
      <h1>autoSizeStrategy = 'fitCellContents' (deprecated alias)</h1>
      <p>
        <strong>v0.4.16+:</strong> <code>'fitCellContents'</code> is a deprecated alias for the
        default <code>'fitGridWidth'</code>. Columns size to <code>max(header, cell)</code> so
        neither header nor cell content truncates; if the total is less than the viewport,
        every column is scaled up to fill the body. Here that means each column inflates to
        fit its header ("Branch Plant Code", "Ordered Qty") even though the data underneath is
        short.
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
