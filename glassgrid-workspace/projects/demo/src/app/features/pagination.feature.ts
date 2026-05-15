import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-pagination',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Pagination</h1>
      <p>Built-in pagination footer with page-size selector and navigation buttons. Use the API to drive pagination programmatically.</p>
      <div class="controls">
        <button type="button" (click)="api?.paginationGoToFirstPage()" data-testid="goto-first">⏮ First</button>
        <button type="button" (click)="api?.paginationGoToPreviousPage()" data-testid="goto-prev">◀ Prev</button>
        <button type="button" (click)="api?.paginationGoToNextPage()" data-testid="goto-next">Next ▶</button>
        <button type="button" (click)="api?.paginationGoToLastPage()" data-testid="goto-last">Last ⏭</button>
        <span data-testid="page-info">Page: {{ page() + 1 }} / {{ totalPages() }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="pagination-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        [pagination]="true"
        [paginationPageSize]="25"
        [paginationPageSizeSelector]="[10, 25, 50, 100]"
        (gridReady)="api = $event.api"
        (paginationChanged)="onPage($event.page, $event.totalPages)"
      />
    </section>
  `,
})
export class PaginationFeature {
  readonly rows = makeRows(1000);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
    { field: 'location', width: 160 },
  ];
  api?: GridApi<Employee>;
  readonly page = signal(0);
  readonly totalPages = signal(1);
  onPage(p: number, t: number) { this.page.set(p); this.totalPages.set(t); }
}
