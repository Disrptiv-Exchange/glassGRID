import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi, type ServerSideDatasource, type ServerSideStoreParams } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-server-side',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Server-side row model (basic)</h1>
      <p>Pass a <code>ServerSideDatasource</code> via API: the grid calls <code>getRows(params)</code> with start/end rows, sort &amp; filter model. The example below simulates a backend with a 250ms delay.</p>
      <div class="controls">
        <span data-testid="server-load-count">Server loads: {{ loadCount() }}</span>
        <span data-testid="server-rows">Loaded rows: {{ loaded() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="server-side-grid"
        [columnDefs]="cols"
        [rowData]="loadedData()"
        [defaultColDef]="{ sortable: true }"
        (gridReady)="onReady($event.api)"
      />
    </section>
  `,
})
export class ServerSideFeature {
  api?: GridApi<Employee>;
  readonly loadCount = signal(0);
  readonly loaded = signal(0);
  readonly loadedData = signal<Employee[]>([]);
  private readonly backend = makeRows(2000);

  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
    { field: 'location', width: 160 },
  ];

  readonly datasource: ServerSideDatasource<Employee> = {
    getRows: async (p: ServerSideStoreParams<Employee>) => {
      this.loadCount.update(n => n + 1);
      await new Promise(r => setTimeout(r, 250));
      const slice = this.backend.slice(p.startRow, p.endRow);
      return { rows: slice, rowCount: this.backend.length };
    },
  };

  onReady(api: GridApi<Employee>) {
    this.api = api;
    this.datasource.getRows({ startRow: 0, endRow: 100, sortModel: [], filterModel: {}, groupKeys: [] })
      .then((res: { rows: Employee[]; rowCount?: number }) => { this.loadedData.set(res.rows); this.loaded.set(res.rows.length); });
  }
}
