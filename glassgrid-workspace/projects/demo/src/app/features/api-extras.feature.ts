import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-api-extras',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Extra APIs · Excel · Schema · Transactions · Paste</h1>
      <p>Exercises <code>applyTransaction</code>, <code>exportDataAsExcel</code>, <code>getStructuredSchema</code>, <code>pasteFromClipboard</code>, and <code>ensureColumnVisible</code>.</p>
      <div class="controls">
        <button (click)="addRow()" data-testid="add-row">Add row</button>
        <button (click)="removeFirst()" data-testid="remove-first">Remove first</button>
        <button (click)="updateFirst()" data-testid="update-first">Update first</button>
        <button (click)="api?.exportDataAsExcel({ fileName: 'glassgrid.xls' })" data-testid="excel-export">Excel export</button>
        <button (click)="getSchema()" data-testid="get-schema">AI schema</button>
        <button (click)="pasteSample()" data-testid="paste-sample">Paste 2×2 TSV</button>
        <button (click)="api?.ensureColumnVisible('location')" data-testid="scroll-to-location">Scroll to Location</button>
        <span data-testid="row-count">Rows: {{ rows().length }}</span>
        <span data-testid="schema-out" style="display:block; white-space:pre; font-family:monospace; font-size:11px; max-width:100%; overflow-x:auto">{{ schemaOut() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="api-extras-grid"
        [columnDefs]="cols"
        [rowData]="rows()"
        [defaultColDef]="{ editable: true, sortable: true }"
        [enableClipboardPaste]="true"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class ApiExtrasFeature {
  api?: GridApi<Employee>;
  readonly rows = signal<Employee[]>(makeRows(30));
  readonly schemaOut = signal('(no schema fetched yet)');
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 160 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
    { field: 'location', width: 200, colId: 'location' },
    { field: 'active', headerName: 'Active', width: 100 },
  ];

  addRow() {
    const newRow: Employee = {
      id: this.rows().length + 1000,
      name: 'New Person ' + (this.rows().length + 1),
      email: 'new@example.com',
      department: 'Engineering',
      title: 'Engineer',
      level: 2,
      salary: 100_000,
      hireDate: new Date(),
      active: true,
      rating: 3.5,
      location: 'Remote',
      notes: '',
    };
    this.api?.applyTransaction({ add: [newRow] });
    this.rows.set(this.api?.getRowData() ?? this.rows());
  }
  removeFirst() {
    const first = this.api?.getRowData()[0];
    if (first) this.api?.applyTransaction({ remove: [first] });
    this.rows.set(this.api?.getRowData() ?? this.rows());
  }
  updateFirst() {
    const first = this.api?.getRowData()[0];
    if (first) this.api?.applyTransaction({ update: [{ ...first, salary: first.salary + 1000 } as Employee] });
    this.rows.set(this.api?.getRowData() ?? this.rows());
  }
  getSchema() {
    const schema = this.api?.getStructuredSchema();
    this.schemaOut.set(JSON.stringify(schema, null, 2));
  }
  async pasteSample() {
    await this.api?.pasteFromClipboard('Pasted\t123\nPasted2\t456');
  }
}
