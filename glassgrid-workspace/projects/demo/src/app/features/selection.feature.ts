import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi, type RowSelectionMode } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-selection',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Row selection</h1>
      <p>Choose single or multi-select. With multi-select, use Ctrl / Cmd / Shift / Space to add to selection. Checkbox columns and a header "select all" checkbox are both supported.</p>
      <div class="controls">
        <label>Mode:
          <select [value]="mode()" (change)="mode.set($any($event.target).value)" data-testid="select-mode">
            <option value="single">single</option>
            <option value="multiple">multiple</option>
          </select>
        </label>
        <button type="button" (click)="api?.selectAll()" data-testid="select-all">Select all</button>
        <button type="button" (click)="api?.deselectAll()" data-testid="deselect-all">Deselect all</button>
        <span data-testid="selected-count">Selected: {{ selectedCount() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="selection-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        [rowSelection]="mode()"
        (gridReady)="api = $event.api"
        (selectionChanged)="selectedCount.set($event.selectedRows.length)"
      />
    </section>
  `,
})
export class SelectionFeature {
  readonly rows = makeRows(300);
  readonly mode = signal<RowSelectionMode>('multiple');
  readonly selectedCount = signal(0);
  api?: GridApi<Employee>;
  readonly cols: ColumnDef<Employee>[] = [
    { headerName: '', width: 44, checkboxSelection: true, headerCheckboxSelection: true, suppressMovable: true, resizable: false },
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
  ];
}
