import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-filtering',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Quick filter</h1>
      <p>Type into the grid's built-in search box, or bind <code>[quickFilterText]</code> externally. The filter runs a case-insensitive substring match across all visible columns' formatted values.</p>
      <div class="controls">
        <label>External filter:
          <input type="text" [value]="external()" (input)="external.set($any($event.target).value)" data-testid="external-filter" />
        </label>
        <span data-testid="row-count">Rows shown: depends on filter</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="filtering-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        [quickFilterText]="external()"
      />
    </section>
  `,
})
export class FilteringFeature {
  readonly rows = makeRows(500);
  readonly external = signal('');
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'email', width: 240 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'location', width: 160 },
  ];
}
