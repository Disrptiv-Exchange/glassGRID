import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-multi-filter',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Multi-filter combinations</h1>
      <p>The filter model accepts arrays of <code>FilterModelItem</code> per column — multiple conditions AND together within a column.</p>
      <p>Click the ⏷ filter button on Salary to add multiple conditions (e.g. <em>&gt; 50,000</em> AND <em>&lt; 150,000</em>).</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="multi-filter-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true, floatingFilter: true }"
      />
    </section>
  `,
})
export class MultiFilterFeature {
  readonly rows = makeRows(300);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180, filter: 'text' },
    { field: 'department', width: 140, filter: 'text' },
    { field: 'salary', width: 130, filter: 'number' },
    { field: 'rating', width: 100, filter: 'number' },
    { field: 'hireDate', headerName: 'Hire', width: 130, filter: 'date',
      valueFormatter: p => p.value instanceof Date ? p.value.toISOString().slice(0, 10) : '' },
  ];
}
