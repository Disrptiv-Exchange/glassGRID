import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-lock',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column locks</h1>
      <p>Lock columns against position changes, visibility toggling, or pin changes. The buttons below try to violate the locks; the grid silently refuses.</p>
      <div class="controls">
        <button (click)="api?.setColumnVisible('id', false)" data-testid="hide-id">Try hide # (lockVisible)</button>
        <button (click)="api?.setColumnPinned('name', 'right')" data-testid="pin-name-right">Try pin Name right (lockPinned: pinned left)</button>
        <button (click)="api?.moveColumn('id', 5)" data-testid="move-id">Try move # (lockPosition)</button>
        <span data-testid="id-visible">ID visible: {{ idVisible() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="lock-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class LockFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(50);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70, lockVisible: true, lockPosition: true },
    { field: 'name', width: 200, pinned: 'left', lockPinned: true },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
  ];
  idVisible() {
    return !this.api?.getColumnState().find(c => c.colId === 'id')?.hide;
  }
}
