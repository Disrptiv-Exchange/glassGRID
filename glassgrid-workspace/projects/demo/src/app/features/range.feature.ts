import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-range',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Range selection &amp; clipboard</h1>
      <p>Click + drag (or click then shift-click) to select a range of cells. Press <kbd>Ctrl/Cmd+C</kbd> to copy as TSV; paste into a spreadsheet.</p>
      <div class="controls">
        <span data-testid="range-summary">{{ rangeSummary() }}</span>
        <button (click)="api?.clearRangeSelection()">Clear range</button>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="range-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [enableRangeSelection]="true"
        (gridReady)="api = $event.api"
        (rangeSelectionChanged)="onRange($event.ranges.length)"
      />
    </section>
  `,
})
export class RangeFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(100);
  readonly rangeSummary = signal('no range');
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'level', headerName: 'Lvl', width: 80 },
    { field: 'salary', width: 130 },
    { field: 'rating', width: 100 },
    { field: 'location', width: 160 },
  ];
  onRange(count: number) {
    const r = this.api?.getCellRanges()[0];
    if (!r) { this.rangeSummary.set('no range'); return; }
    this.rangeSummary.set(`${count} range · rows ${r.startRow}-${r.endRow}, cols ${r.startCol}-${r.endCol}`);
  }
}
