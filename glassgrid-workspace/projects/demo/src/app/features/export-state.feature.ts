import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi, type GridState } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-export-state',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>CSV export · State save/restore</h1>
      <p>Export the current (sorted + filtered) view as CSV. Save and restore the full grid state (columns, sort, filters, pagination) as JSON.</p>
      <div class="controls">
        <button (click)="api?.exportDataAsCsv({ fileName: 'employees.csv' })" data-testid="csv-download">Download CSV</button>
        <button (click)="showCsv()" data-testid="csv-show">Show CSV (preview)</button>
        <button (click)="saveState()" data-testid="save-state">Save state</button>
        <button (click)="loadState()" [disabled]="!savedState()" data-testid="load-state">Load state</button>
      </div>
      <pre class="preview" data-testid="preview">{{ preview() }}</pre>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="export-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true, filter: 'text', floatingFilter: true }"
        [pagination]="true"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
  styles: `.preview { max-height: 140px; overflow: auto; padding: 8px; font: 11px/1.3 ui-monospace, monospace; background: color-mix(in srgb, currentColor 6%, transparent); border-radius: 6px; }`,
})
export class ExportStateFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(50);
  readonly preview = signal('');
  readonly savedState = signal<GridState | null>(null);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'salary', width: 130 },
    { field: 'rating', width: 110 },
    { field: 'location', width: 160 },
  ];
  showCsv() { this.preview.set(this.api?.getDataAsCsv() ?? ''); }
  saveState() { this.savedState.set(this.api?.getGridState() ?? null); this.preview.set(JSON.stringify(this.savedState(), null, 2)); }
  loadState() { const s = this.savedState(); if (s) this.api?.applyGridState(s); }
}
