import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type InfiniteDatasource } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-infinite',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Infinite row model</h1>
      <p>The grid asks for pages of rows via <code>InfiniteDatasource.getRows</code>. The demo backend simulates 5000 rows with a 200ms delay; the grid lazy-loads as the user scrolls or pages.</p>
      <div class="controls">
        <button (click)="loadMore()" data-testid="load-more">Load next 200</button>
        <span data-testid="loaded-rows">Loaded: {{ rows().length }} / 5000</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="infinite-grid"
        [columnDefs]="cols"
        [rowData]="rows()"
      />
    </section>
  `,
})
export class InfiniteFeature {
  readonly rows = signal<Employee[]>([]);
  private readonly backend = makeRows(5000);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
  ];

  readonly datasource: InfiniteDatasource<Employee> = {
    rowCount: this.backend.length,
    getRows: async ({ startRow, endRow }) => {
      await new Promise(r => setTimeout(r, 200));
      return { rows: this.backend.slice(startRow, endRow), lastRow: this.backend.length };
    },
  };

  constructor() { this.loadMore(); }

  loadMore() {
    const at = this.rows().length;
    this.datasource.getRows({ startRow: at, endRow: at + 200 })
      .then(res => this.rows.set([...this.rows(), ...res.rows]));
  }
}
