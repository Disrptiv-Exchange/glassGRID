import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-grouping',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Row grouping &amp; aggregation</h1>
      <p>Group rows by one or more columns; aggregations roll up to group rows. Click the auto-group cell or row to expand / collapse.</p>
      <div class="controls">
        <button (click)="setGroup(['department'])" data-testid="group-dept">Group by department</button>
        <button (click)="setGroup(['department','level'])" data-testid="group-dept-level">Group by department + level</button>
        <button (click)="setGroup([])" data-testid="group-none">No grouping</button>
        <button (click)="api?.expandAll()" data-testid="expand-all">Expand all</button>
        <button (click)="api?.collapseAll()" data-testid="collapse-all">Collapse all</button>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="grouping-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true, resizable: true }"
        [groupDefaultExpanded]="1"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class GroupingFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(500);
  readonly currentGroup = signal<string[]>([]);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'department', enableRowGroup: true },
    { field: 'level', headerName: 'Lvl' },
    { field: 'name', width: 200 },
    { field: 'title', width: 180 },
    { field: 'salary', width: 130, aggFunc: 'sum', valueFormatter: p => typeof p.value === 'number' ? `$${(p.value as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '' },
    { field: 'rating', width: 110, aggFunc: 'avg', valueFormatter: p => typeof p.value === 'number' ? (p.value as number).toFixed(1) : '' },
    { field: 'location', width: 150 },
  ];
  setGroup(cols: string[]) {
    this.currentGroup.set(cols);
    this.api?.setRowGroupColumns(cols);
  }
}
