import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-performance',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Performance — virtualised scrolling</h1>
      <p>Row virtualisation keeps only the visible window in the DOM. Try 10k or 100k rows and scroll — only ~30 rows exist at any time.</p>
      <div class="controls">
        <label>Rows:
          <select [value]="size()" (change)="setSize(+$any($event.target).value)" data-testid="rowcount-select">
            <option [value]="100">100</option>
            <option [value]="1000">1 000</option>
            <option [value]="10000">10 000</option>
            <option [value]="100000">100 000</option>
          </select>
        </label>
        <span data-testid="row-total">Total: {{ rows().length.toLocaleString() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="performance-grid"
        [columnDefs]="cols"
        [rowData]="rows()"
        [defaultColDef]="{ sortable: true, resizable: true }"
        [rowHeight]="32"
      />
    </section>
  `,
})
export class PerformanceFeature {
  readonly size = signal(10_000);
  readonly rows = signal<Employee[]>(makeRows(10_000));
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 80 },
    { field: 'name', width: 180 },
    { field: 'email', width: 240 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'level', headerName: 'Lvl', width: 70 },
    { field: 'salary', width: 130 },
    { field: 'location', width: 160 },
  ];
  setSize(n: number) { this.size.set(n); this.rows.set(makeRows(n)); }
}
