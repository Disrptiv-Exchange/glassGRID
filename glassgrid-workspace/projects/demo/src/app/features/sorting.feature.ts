import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi, type SortModelItem } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-sorting',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Sorting</h1>
      <p>Click a header to cycle <em>asc → desc → none</em>. Hold <kbd>Shift</kbd> / <kbd>Ctrl</kbd> to add additional sort columns; the indicator subscript shows priority. Pass a <code>comparator</code> for custom logic.</p>
      <div class="controls">
        <button type="button" (click)="clearSort()" data-testid="clear-sort">Clear sort</button>
        <button type="button" (click)="sortByName()" data-testid="sort-by-name">Sort by name asc</button>
        <span data-testid="sort-summary">Active: {{ summary() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="sorting-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        [multiSortKey]="'ctrl'"
        (gridReady)="onReady($event.api)"
        (sortChanged)="onSort($event.sortModel)"
      />
    </section>
  `,
})
export class SortingFeature {
  readonly rows = makeRows(200);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'level', headerName: 'Lvl', width: 80 },
    { field: 'salary', width: 130 },
    { field: 'hireDate', headerName: 'Hire date', width: 130, comparator: (a, b) => (a as Date).getTime() - (b as Date).getTime() },
    { field: 'rating', width: 100 },
  ];
  private api?: GridApi<Employee>;
  readonly summary = signal('(none)');

  onReady(api: GridApi<Employee>) { this.api = api; }
  clearSort() { this.api?.setSortModel([]); }
  sortByName() { this.api?.setSortModel([{ colId: 'name', sort: 'asc' }]); }
  onSort(model: SortModelItem[]) {
    this.summary.set(model.length ? model.map(m => `${m.colId}:${m.sort}`).join(', ') : '(none)');
  }
}
