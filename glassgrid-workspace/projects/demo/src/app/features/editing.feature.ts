import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type CellValueChangedEvent } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-editing',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Cell editing</h1>
      <p>Double-click a cell (or press <kbd>F2</kbd>) to edit. <kbd>Enter</kbd> commits, <kbd>Esc</kbd> cancels, <kbd>Tab</kbd> commits + moves. Built-in editors: text, number, date, select, checkbox, large-text. Undo with <kbd>Ctrl/Cmd+Z</kbd>, redo with <kbd>Shift+Ctrl/Cmd+Z</kbd>.</p>
      <div class="controls">
        <span data-testid="last-edit">{{ lastEdit() || '(no edits yet)' }}</span>
        <button (click)="grid.undoCellEditing()" data-testid="undo">Undo</button>
        <button (click)="grid.redoCellEditing()" data-testid="redo">Redo</button>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="editing-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [enableCellChangeFlash]="true"
        (gridReady)="grid = $event.api"
        (cellValueChanged)="onChanged($event)"
      />
    </section>
  `,
})
export class EditingFeature {
  grid!: import('glassgrid').GridApi<Employee>;
  readonly rows = makeRows(50);
  readonly lastEdit = signal<string>('');
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', editable: true, cellEditor: 'text', width: 180 },
    { field: 'department', editable: true, cellEditor: 'select', cellEditorParams: { values: ['Engineering','Sales','Marketing','Finance','Ops','Design'] }, width: 150 },
    { field: 'title', editable: true, cellEditor: 'text', width: 200 },
    { field: 'level', editable: true, cellEditor: 'number', width: 90 },
    { field: 'salary', editable: true, cellEditor: 'number', width: 130 },
    { field: 'hireDate', editable: true, cellEditor: 'date', width: 140, valueFormatter: p => p.value instanceof Date ? p.value.toLocaleDateString() : '' },
    { field: 'active', editable: true, cellEditor: 'checkbox', width: 90 },
    { field: 'notes', editable: true, cellEditor: 'largeText', width: 220 },
  ];
  onChanged(e: CellValueChangedEvent<Employee>) {
    this.lastEdit.set(`${e.colDef.field}: ${e.oldValue} → ${e.newValue}`);
  }
}
