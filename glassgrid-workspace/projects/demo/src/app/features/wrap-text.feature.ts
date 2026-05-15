import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-wrap-text',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Wrap text + auto-height</h1>
      <p>Set <code>wrapText: true</code> + <code>autoHeight: true</code> on a column to let cells grow to fit content. Long text wraps within the column width.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="wrap-text-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [rowHeight]="64"
      />
    </section>
  `,
})
export class WrapTextFeature {
  readonly rows = makeRows(20).map(r => ({ ...r, notes: 'A long note about ' + r.name + '. ' + (r.notes || '').repeat(3) + ' They prefer working from ' + r.location + ' and were hired ' + r.hireDate.toLocaleDateString() + '. Their rating is ' + r.rating + '.' }));
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'notes', headerName: 'Notes', width: 360, wrapText: true, autoHeight: true },
    { field: 'department', width: 140 },
  ];
}
