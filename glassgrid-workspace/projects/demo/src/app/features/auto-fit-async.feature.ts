import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface Row {
  id: number;
  status: string;
  company: string;
  qty: number;
  unit: string;
}

const initialEmpty: Row[] = [];
const asyncBatch: Row[] = [
  { id: 1, status: 'Order Approved',   company: 'P.T. Multi Bintang Indonesia Tbk', qty: 500,   unit: 'Case' },
  { id: 2, status: 'In Progress',      company: 'Hindustan Unilever Limited',         qty: 5_000, unit: 'Case' },
  { id: 3, status: 'Completed',        company: 'Nestle India Limited',               qty: 12,    unit: 'PKG'  },
];

@Component({
  selector: 'demo-auto-fit-async',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Auto-fit with async data (regression fixture for v0.4.17)</h1>
      <p>
        Grid mounts with empty <code>rowData</code>, then 250 ms later the rows arrive. Columns
        have no explicit <code>width</code>. Auto-fit must <strong>re-measure</strong> when the
        cells appear — otherwise short-header / long-cell columns ("Company") truncate, and
        short-cell / long-header columns also lock at the header-only width. Before v0.4.17
        the rAF probe finalised on the empty-cell measurement and never re-fired.
      </p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="auto-fit-async-grid"
        [columnDefs]="cols()"
        [rowData]="rows()"
      />
    </section>
  `,
})
export class AutoFitAsyncFeature {
  readonly rows = signal<Row[]>(initialEmpty);
  readonly cols = signal<ColumnDef<Row>[]>([
    { field: 'id', headerName: 'Order Line ID' },
    { field: 'status', headerName: 'Status' },
    { field: 'company', headerName: 'Company' },
    { field: 'qty', headerName: 'Ordered Quantity' },
    { field: 'unit', headerName: 'Unit' },
  ]);

  constructor() {
    setTimeout(() => this.rows.set(asyncBatch), 250);
  }
}
