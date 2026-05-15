import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-row-drag',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Row drag (managed reorder)</h1>
      <p>Drag a row to reorder. With <code>[rowDragManaged]</code> the grid updates the internal row order automatically.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="row-drag-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [rowDragManaged]="true"
      />
    </section>
  `,
})
export class RowDragFeature {
  readonly rows = makeRows(30);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 80 },
    { field: 'name', width: 200 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
  ];
}
