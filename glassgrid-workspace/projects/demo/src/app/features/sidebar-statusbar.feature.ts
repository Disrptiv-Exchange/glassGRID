import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type SideBarDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-sidebar-statusbar',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Side bar &amp; status bar</h1>
      <p>Right-side panel with built-in <strong>Columns</strong> and <strong>Filters</strong> tool panels. Status bar shows row counts and live aggregates over the visible / selected rows.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="sb-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [rowSelection]="'multiple'"
        [defaultColDef]="{ sortable: true, filter: 'text', floatingFilter: false }"
        [sideBar]="sb"
        [statusBar]="{ panels: ['selected', 'filtered', 'total', 'sum', 'avg'], aggField: 'salary' }"
      />
    </section>
  `,
})
export class SidebarStatusbarFeature {
  readonly rows = makeRows(500);
  readonly sb: SideBarDef = {
    toolPanels: [
      { id: 'columns', labelDefault: 'Columns', toolPanel: 'columns' },
      { id: 'filters', labelDefault: 'Filters', toolPanel: 'filters' },
    ],
  };
  readonly cols: ColumnDef<Employee>[] = [
    { headerName: '', width: 44, checkboxSelection: true, headerCheckboxSelection: true, suppressMovable: true, filter: undefined },
    { field: 'id', headerName: '#', width: 70, filter: 'number' },
    { field: 'name', width: 180, filter: 'text' },
    { field: 'department', width: 140, filter: 'text' },
    { field: 'level', width: 80, filter: 'number' },
    { field: 'salary', width: 130, filter: 'number' },
    { field: 'rating', width: 100, filter: 'number' },
    { field: 'location', width: 160, filter: 'text' },
  ];
}
