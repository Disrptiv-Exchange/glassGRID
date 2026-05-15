/**
 * /ag-binding — glassGRID using the EXACT binding pattern from glassRUN's existing
 * ag-grid screens. This file mirrors the shape of
 *   src/sample_code/view-shipto-location-master.page 1.ts
 * field-for-field so consumers can migrate from ag-grid with minimal edits.
 */
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { GlassGridComponent, type CellRendererParams, type ColumnDef, type IDatasource, type IGetRowsParams, type GridReadyEvent } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'app-ag-binding',
  standalone: true,
  imports: [GlassGridComponent],
  template: `
    <section class="feature">
      <h1>ag-grid drop-in binding pattern</h1>
      <p>Identical to glassRUN's existing <code>ag-grid-angular</code> screens — <code>[gridOptions]</code>, <code>[defaultColDef]</code>, <code>[rowModelType]</code>, <code>[columnDefs]</code>, <code>(gridReady)</code> with <code>$event.api</code> / <code>$event.columnApi</code>, infinite datasource via <code>setGridOption('datasource', ds)</code>, <code>params.successCallback(rows, total)</code>. No code changes needed when migrating.</p>
      <div class="ag_grid_angular_planning" style="position: relative;">
        <glass-grid #agGrid
          data-testid="ag-binding-grid"
          class="gg-theme-glassrun ag_grid_with_actionbtn"
          [animateRows]="true"
          [debug]="true"
          [defaultColDef]="defaultColDef"
          [rowData]="rowData"
          id="myGrid"
          [columnDefs]="columnDefs"
          [rowHeight]="rowHeight"
          [singleClickEdit]="true"
          [gridOptions]="gridOptions"
          [pagination]="true"
          (firstDataRendered)="onFirstDataRendered($event)"
          (gridReady)="onGridReady($event)"
          [suppressRowClickSelection]="true"
          [rowSelection]="rowSelection"
          [rowModelType]="rowModelType"
          [suppressScrollOnNewData]="true"
          [paginationPageSize]="defaultPageSize"
          [maxBlocksInCache]="maxBlocksInCache"
          [cacheBlockSize]="defaultPageSize"
          [enableRangeSelection]="true">
        </glass-grid>
      </div>
      <div class="paging_control controls">
        Page size:
        <select (change)="onPageSizeChanged($event)" data-testid="ag-binding-page-size">
          <option value="10">10</option>
          <option value="20">20</option>
          <option selected value="50">50</option>
          <option value="100">100</option>
        </select>
        <span data-testid="ag-binding-loads">Datasource loads: {{ loadCount }}</span>
        <span data-testid="ag-binding-rows">Rows in model: {{ gridDataCount }}</span>
      </div>
    </section>
  `,
})
export class AgBindingFeature implements OnInit {
  @ViewChild('agGrid') agGrid!: ElementRef;

  // ---- exact ag-grid binding shape ----
  defaultColDef = {
    flex: 1,
    resizable: true,
    floatingFilter: true,
    filter: true,
    sortable: true,
    suppressAndOrCondition: true,
    suppressMenu: true,
  };
  gridOptions = {
    headerHeight: 30,
    floatingFiltersHeight: 25,
    enableCellTextSelection: true,
  };
  rowData: Employee[] = [];
  columnDefs: ColumnDef<Employee>[] = [];
  rowHeight = 40;
  rowSelection: 'multiple' | 'single' = 'single';
  defaultPageSize = 50;
  rowModelType: 'clientSide' | 'infinite' | 'serverSide' = 'infinite';
  maxBlocksInCache = 1;
  gridDataCount = 0;
  gridParams: unknown;
  gridApi: import('glassgrid').GridApi<Employee> | null = null;
  gridColumnApi: import('glassgrid').GridApi<Employee> | null = null;
  loadCount = 0;
  ResData = { res_LocationUI_LocationName: 'Location Name', res_LocationUI_LocationCode: 'Code', res_LocationUI_AddressLine1: 'Address 1', res_LocationUI_CreatedDate: 'Created' };

  // 2,000 simulated backend rows
  private readonly backend = makeRows(2000);

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.columnDefs = this.UserDetailsColumnsList();
  }

  onGridReady(params: GridReadyEvent<Employee>) {
    this.gridParams = params;
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.showLoadingOverlay();
    setTimeout(() => {
      this.gridApi?.setGridOption('datasource', this.dataSource);
    }, 0);
  }

  onFirstDataRendered(_params: GridReadyEvent<Employee>) {
    // first data is on screen — hook your post-render logic here
  }

  dataSource: IDatasource<Employee> = {
    getRows: (params: IGetRowsParams<Employee>) => {
      this.loadCount++;
      // simulate a 200ms backend delay
      setTimeout(() => {
        const slice = this.backend.slice(params.startRow, params.endRow);
        this.gridDataCount = this.backend.length;
        params.successCallback(slice, this.backend.length);
        this.gridApi?.hideOverlay();
      }, 200);
    },
  };

  onPageSizeChanged(event: Event) {
    const size = Number((event.target as HTMLSelectElement).value);
    this.defaultPageSize = size;
    this.gridApi?.setGridOption('cacheBlockSize', size);
    this.gridApi?.infiniteRowModel.resetCache();
    this.gridApi?.paginationSetPageSize(size);
  }

  // mirrors the sample's `UserDetailsColumnsList()` shape
  UserDetailsColumnsList(): ColumnDef<Employee>[] {
    return [
      {
        headerName: this.ResData.res_LocationUI_LocationName, field: 'name',
        filterParams: { alwaysShowBothConditions: false, suppressAndOrCondition: true },
      },
      {
        headerName: this.ResData.res_LocationUI_LocationCode, field: 'department',
        filterParams: { alwaysShowBothConditions: false, suppressAndOrCondition: true },
      },
      {
        headerName: this.ResData.res_LocationUI_AddressLine1, field: 'title',
        filter: 'agTextColumnFilter',
        filterParams: { alwaysShowBothConditions: false, suppressAndOrCondition: true },
      },
      {
        headerName: 'Salary', field: 'salary',
        filter: 'agNumberColumnFilter',
        filterParams: { alwaysShowBothConditions: false, suppressAndOrCondition: true, buttons: ['clear'] },
      },
      {
        headerName: this.ResData.res_LocationUI_CreatedDate, field: 'hireDate',
        valueFormatter: this.dateFormatter,
        floatingFilterComponent: 'dateFilterComponent',
        filter: 'agDateColumnFilter',
        filterParams: { alwaysShowBothConditions: false, suppressAndOrCondition: true, buttons: ['clear'] },
      },
      {
        headerName: 'Edit', field: 'id',
        cellRenderer: this.EditHyperLink.bind(this),
        filter: false,
        sortable: false,
      },
    ];
  }

  dateFormatter(params: { value: unknown }): string {
    const v = params.value;
    return v instanceof Date ? v.toISOString().slice(0, 10) : '';
  }

  // mirrors the sample's renderer pattern — returns an HTMLElement built via Renderer2
  EditHyperLink(params: CellRendererParams<Employee>): HTMLElement | string {
    if (!params.data) return '';
    const container: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(container, 'grid-action-column-multi-button');
    const editButton: HTMLElement = this.renderer.createElement('button');
    this.renderer.setProperty(editButton, 'textContent', 'Edit');
    this.renderer.addClass(editButton, 'gr-secondary-button');
    this.renderer.addClass(editButton, 'edit-button');
    this.renderer.setAttribute(editButton, 'data-testid', `ag-binding-edit-${params.data.id}`);
    this.renderer.appendChild(container, editButton);
    return container;
  }
}
