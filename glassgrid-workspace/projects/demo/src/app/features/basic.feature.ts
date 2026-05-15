import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-basic',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Basic data binding</h1>
      <p>Bind any array of objects via <code>[rowData]</code> and a typed <code>[columnDefs]</code> array. Field paths support nested keys.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="basic-grid"
        [columnDefs]="cols()"
        [rowData]="rows()"
        [defaultColDef]="{ sortable: false, resizable: true }"
      />
    </section>
  `,
})
export class BasicFeature {
  readonly rows = signal<Employee[]>(makeRows(50));
  readonly cols = signal<ColumnDef<Employee>[]>([
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'level', headerName: 'Lvl', width: 70 },
    { field: 'location', width: 160 },
    { field: 'active', headerName: 'Active', width: 90 },
  ]);
}
