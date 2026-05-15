import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, pivotTransform, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-pivot',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Pivot mode (basic)</h1>
      <p>Pivot rotates row values into columns. Here we group rows by <em>department</em>, pivot by <em>level</em>, aggregating <em>salary</em> (sum) and <em>rating</em> (avg). The transformed result is bound to a second grid.</p>
      <div class="controls">
        <button (click)="togglePivot()" data-testid="toggle-pivot">{{ pivotOn() ? 'Disable pivot' : 'Enable pivot' }}</button>
        <span data-testid="pivot-status">Pivot: {{ pivotOn() ? 'on' : 'off' }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="pivot-source-grid"
        [columnDefs]="srcCols"
        [rowData]="rows"
        [pivotMode]="pivotOn()"
        [pivotColIds]="['level']"
        (gridReady)="onReady($event.api)"
      />
      <h3 style="margin-top: 12px">Pivot result</h3>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="pivot-result-grid"
        [columnDefs]="pivotCols()"
        [rowData]="pivotRows()"
      />
    </section>
  `,
  styles: `::ng-deep .feature glass-grid { height: 280px; }`,
})
export class PivotFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(500);
  readonly pivotOn = signal(true);
  readonly pivotRows = signal<Record<string, unknown>[]>([]);
  readonly pivotCols = signal<ColumnDef<Record<string, unknown>>[]>([]);
  readonly srcCols: ColumnDef<Employee>[] = [
    { field: 'department', rowGroup: true, width: 160 },
    { field: 'level', headerName: 'Lvl', width: 80 },
    { field: 'salary', width: 130, aggFunc: 'sum' },
    { field: 'rating', width: 100, aggFunc: 'avg' },
    { field: 'name', width: 200 },
  ];

  togglePivot() { this.pivotOn.set(!this.pivotOn()); setTimeout(() => this.refresh(), 50); }

  onReady(api: GridApi<Employee>) {
    this.api = api;
    this.refresh();
  }

  refresh() {
    const nodes = this.rows.map((row, i) => ({ id: String(i), data: row, rowIndex: i, selected: false }));
    const colMap = new Map<string, ColumnDef<Employee>>();
    for (const c of this.srcCols) {
      const id = c.colId ?? c.field ?? '';
      if (id) colMap.set(id, c);
    }
    const result = pivotTransform(nodes, ['department'], ['level'], ['salary', 'rating'], colMap);
    console.log('[pivot] refresh', { rows: result.rows.length, cols: result.pivotCols.length, keys: result.pivotKeys });
    this.pivotCols.set([{ field: 'department', headerName: 'Department', width: 160 }, ...(result.pivotCols as unknown as ColumnDef<Record<string, unknown>>[])]);
    this.pivotRows.set(result.rows);
  }
}
