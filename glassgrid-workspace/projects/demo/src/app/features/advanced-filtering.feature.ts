import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-advanced-filtering',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column filters</h1>
      <p>Click the ⏷ button in a header to open a per-column filter popup. The <em>floating filter row</em> is a compact always-visible input. Text, number and date filter types are all built-in.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="adv-filter-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true, floatingFilter: true }"
      />
    </section>
  `,
})
export class AdvancedFilteringFeature {
  readonly rows = makeRows(500);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 80, filter: 'number' },
    { field: 'name', width: 200, filter: 'text' },
    { field: 'department', width: 160, filter: 'text' },
    { field: 'level', headerName: 'Lvl', width: 90, filter: 'number' },
    { field: 'salary', width: 130, filter: 'number' },
    { field: 'hireDate', headerName: 'Hire date', width: 150, filter: 'date',
      valueFormatter: p => p.value instanceof Date ? p.value.toISOString().slice(0, 10) : '' },
    { field: 'location', width: 160, filter: 'text' },
  ];
}
