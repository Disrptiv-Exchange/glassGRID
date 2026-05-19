/**
 * Public type surface for glassGRID.
 * Generics propagate: TRow is the row data type the consumer binds.
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface ValueGetterParams<TRow = unknown> {
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow>;
}

export interface ValueFormatterParams<TRow = unknown, TValue = unknown> {
  value: TValue;
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
}

export interface CellClassParams<TRow = unknown, TValue = unknown> {
  value: TValue;
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
}

export interface CellRendererParams<TRow = unknown, TValue = unknown> {
  value: TValue;
  formattedValue: string;
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
}

export type CellClassRule<TRow = unknown, TValue = unknown> = (params: CellClassParams<TRow, TValue>) => boolean;

export type Comparator<TValue> = (a: TValue, b: TValue, isInverted?: boolean) => number;

export interface ColumnDef<TRow = unknown, TValue = unknown> {
  /** Property path on the row. Either `field` or `valueGetter` is required. */
  field?: keyof TRow & string;
  /** Stable id; if omitted, derived from `field` or auto-generated. */
  colId?: string;
  /** Header label. Defaults to the field path. */
  headerName?: string;
  /** Header tooltip. */
  headerTooltip?: string;

  // sizing
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;

  // visibility / pinning
  hide?: boolean;
  initialHide?: boolean;
  pinned?: 'left' | 'right' | null;
  lockPosition?: boolean | 'left' | 'right';
  lockVisible?: boolean;
  lockPinned?: boolean;

  // behaviour
  sortable?: boolean;
  resizable?: boolean;
  suppressMovable?: boolean;

  // sorting
  sort?: SortDirection;
  sortIndex?: number | null;
  initialSort?: SortDirection;
  initialSortIndex?: number | null;
  comparator?: Comparator<TValue>;
  sortingOrder?: SortDirection[];

  // values
  valueGetter?: (params: ValueGetterParams<TRow>) => TValue;
  valueFormatter?: (params: ValueFormatterParams<TRow, TValue>) => string;

  /**
   * Locale-aware number formatting via Intl.NumberFormat.
   * Examples:
   *   - For Indian Rupee:        { locale: 'en-IN', currency: 'INR' }   → ₹1,23,450.50
   *   - For Vietnamese Dong:     { locale: 'vi-VN', currency: 'VND' }   → 1.234.500 ₫
   *   - For US Dollar:           { locale: 'en-US', currency: 'USD' }   → $1,234,500.00
   *   - For Indian decimal only: { locale: 'en-IN' }                    → 1,23,450.50
   *   - For European decimal:    { locale: 'de-DE' }                    → 1.234.450,50
   * If only `currency` is set without `locale`, defaults to en-US locale.
   * If only `locale` is set without `currency`, formats as a decimal in that locale.
   * For full control, pass `numberFormatOptions` directly.
   */
  locale?: string;
  /** ISO 4217 currency code: 'USD' | 'EUR' | 'INR' | 'VND' | 'GBP' | 'JPY' | … */
  currency?: string;
  /** Escape hatch: full Intl.NumberFormatOptions object (overrides `locale` / `currency` shortcuts). */
  numberFormatOptions?: Intl.NumberFormatOptions;

  // rendering
  cellRenderer?: CellRenderer<TRow, TValue>;
  cellRendererSelector?: (params: CellRendererParams<TRow, TValue>) => { component: CellRenderer<TRow, TValue>; params?: Record<string, unknown> } | null;
  cellRendererParams?: Record<string, unknown>;
  /** Render an Angular component per cell. The component receives a `params` input of type CellRendererParams. */
  cellComponent?: unknown;
  /** Extra inputs passed to `cellComponent` (merged with `{ params }`). */
  cellComponentInputs?: Record<string, unknown>;
  /** Provide an inline HTML string used as the column header label (instead of `headerName`). */
  headerComponent?: (params: { colDef: ColumnDef<TRow>; api: GridApi<TRow> }) => string;
  /** Hook to render a custom tooltip (returns HTML string). When set, replaces native title attribute. */
  tooltipComponent?: (params: { value: unknown; data: TRow; colDef: ColumnDef<TRow, TValue> }) => string;
  cellClass?: string | string[] | ((params: CellClassParams<TRow, TValue>) => string | string[]);
  cellStyle?: Record<string, string> | ((params: CellClassParams<TRow, TValue>) => Record<string, string>);
  cellClassRules?: Record<string, CellClassRule<TRow, TValue>>;
  /** Treat this row as full-width when this returns true; cellRenderer becomes the full row. */
  isFullWidthRow?: boolean;
  /** Wrap long text inside cells (uses CSS white-space: normal). */
  wrapText?: boolean;
  /** Allow cells to grow tall to fit content (works with `wrapText`). */
  autoHeight?: boolean;

  // filtering — phase 2
  // Accepts both glassGRID short names and ag-grid aliases for drop-in compatibility.
  filter?:
    | boolean
    | 'text' | 'number' | 'date' | 'set'
    | 'agTextColumnFilter' | 'agNumberColumnFilter' | 'agDateColumnFilter' | 'agSetColumnFilter'
    | 'agMultiColumnFilter';
  filterParams?: FilterParams<TRow, TValue>;
  floatingFilter?: boolean;
  floatingFilterComponent?: unknown;

  // editing — phase 2
  editable?: boolean | ((params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow, TValue> }) => boolean);
  cellEditor?: BuiltInCellEditor | CellEditorFactory<TRow, TValue>;
  cellEditorParams?: Record<string, unknown>;
  cellEditorPopup?: boolean;
  valueParser?: (params: { newValue: string; oldValue: TValue; data: TRow; colDef: ColumnDef<TRow, TValue> }) => TValue;
  valueSetter?: (params: { newValue: TValue; oldValue: TValue; data: TRow; colDef: ColumnDef<TRow, TValue> }) => boolean;

  // aggregation — phase 3
  aggFunc?: AggFunc | ((values: TValue[]) => TValue);
  rowGroup?: boolean;
  rowGroupIndex?: number;
  enableRowGroup?: boolean;

  // colSpan / rowSpan — phase 6
  colSpan?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow, TValue> }) => number;
  rowSpan?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow, TValue> }) => number;

  // pivot — phase 5
  pivot?: boolean;
  pivotIndex?: number;
  enablePivot?: boolean;
  pivotComparator?: Comparator<TValue>;

  // selection helper
  checkboxSelection?: boolean | ((params: { data: TRow; node: RowNode<TRow> }) => boolean);
  headerCheckboxSelection?: boolean;

  // misc
  tooltipField?: keyof TRow & string;
  tooltipValueGetter?: (params: ValueGetterParams<TRow>) => string | null | undefined;
  suppressKeyboardEvent?: (params: { event: KeyboardEvent; data: TRow }) => boolean;

  /**
   * Column-type template key(s) that pull defaults from the grid's `[columnTypes]` map.
   * Accepts a single key or comma/space-separated list of keys; later types override earlier ones,
   * and explicit per-column properties always win.
   */
  type?: string | string[];
}

/** Map of named column "types" — reusable defaults referenced by `ColumnDef.type`. */
export type ColumnTypeMap<TRow = unknown> = Record<string, Partial<ColumnDef<TRow>>>;

export type CellRenderer<TRow = unknown, TValue = unknown> =
  | string
  | ((params: CellRendererParams<TRow, TValue>) => string | Node);

// ---- editing ----
export type BuiltInCellEditor = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'largeText';
export type AggFunc = 'sum' | 'min' | 'max' | 'avg' | 'count' | 'first' | 'last';

export interface CellEditorParams<TRow = unknown, TValue = unknown> {
  value: TValue;
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
  /** Submit a new value and stop editing. */
  commit(newValue: TValue): void;
  /** Cancel editing without committing. */
  cancel(): void;
  /** Original key press that triggered editing (if any). */
  charPress?: string;
}

export interface CellEditor<TRow = unknown, TValue = unknown> {
  /** DOM root for the editor. */
  element: HTMLElement;
  /** Programmatic focus. */
  focus?(): void;
  /** Cleanup. */
  destroy?(): void;
  /** Override how to read the current value. Default reads `.value` from an HTMLInputElement. */
  getValue?(): TValue;
}

export type CellEditorFactory<TRow = unknown, TValue = unknown> = (params: CellEditorParams<TRow, TValue>) => CellEditor<TRow, TValue>;

// ---- column-level filter ----
export type FilterOp =
  | 'contains' | 'notContains' | 'equals' | 'notEqual' | 'startsWith' | 'endsWith' | 'blank' | 'notBlank'
  | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'inRange'
  | 'before' | 'after';

export interface FilterModelItem {
  type: FilterOp;
  filter?: string | number | null;
  filterTo?: string | number | null;
}

export interface FilterParams<TRow = unknown, TValue = unknown> {
  values?: TValue[] | ((cb: (values: TValue[]) => void) => void);
  defaultOption?: FilterOp;
  caseSensitive?: boolean;
  /**
   * Floating-filter input debounce in ms. Defaults to 500 for text / number
   * filters and 0 for date filters (matching ag-grid). The empty / clear case
   * always applies immediately. Blur and Enter on the input flush any pending
   * debounce.
   */
  debounceMs?: number;
  /** ag-grid compatibility — surfaced for type-checking; behaviour is best-effort. */
  alwaysShowBothConditions?: boolean;
  suppressAndOrCondition?: boolean;
  filterOptions?: Array<string | { displayKey: string; displayName: string; predicate?: (filterValues: unknown[], cellValue: unknown) => boolean }>;
  buttons?: ('apply' | 'clear' | 'reset' | 'cancel')[];
}

export type FilterModel = Record<string, FilterModelItem | FilterModelItem[]>;

/** Inputs received by a custom floating-filter component. */
export interface FloatingFilterParams<TRow = unknown, TValue = unknown> {
  /** Current filter value (e.g. string for text/number, ISO date for date). null if not filtered. */
  value: TValue | string | null;
  /** The column this filter belongs to. */
  colDef: ColumnDef<TRow, TValue>;
  /** Call this with the new value to update the grid's filter model. Pass '' or null to clear. */
  onValueChange(value: TValue | string | null): void;
}

// ---- row-model types (ag-grid drop-in) ----
export type RowModelType = 'clientSide' | 'infinite' | 'serverSide' | 'viewport';

/** ag-grid-compatible IDatasource for infinite/server row models. */
export interface IDatasource<TRow = unknown> {
  getRows(params: IGetRowsParams<TRow>): void;
  /** Optional cleanup hook. */
  destroy?(): void;
}

/** ag-grid-compatible IGetRowsParams. Consumers call `successCallback` or `failCallback`. */
export interface IGetRowsParams<TRow = unknown> {
  startRow: number;
  endRow: number;
  sortModel: SortModelItem[];
  filterModel: FilterModel;
  context?: unknown;
  successCallback(rows: TRow[], lastRow?: number): void;
  failCallback(): void;
}

/** Loose `gridOptions` bag — a subset of ag-grid GridOptions for drop-in style. */
export interface GridOptions<TRow = unknown> {
  headerHeight?: number;
  rowHeight?: number;
  floatingFiltersHeight?: number;
  enableCellTextSelection?: boolean;
  animateRows?: boolean;
  pagination?: boolean;
  paginationPageSize?: number;
  cacheBlockSize?: number;
  maxBlocksInCache?: number;
  rowSelection?: 'single' | 'multiple' | null;
  rowModelType?: RowModelType;
  suppressScrollOnNewData?: boolean;
  suppressRowClickSelection?: boolean;
  singleClickEdit?: boolean;
  enableRangeSelection?: boolean;
  debug?: boolean;
  defaultColDef?: DefaultColDef<TRow>;
  columnDefs?: (ColumnDef<TRow> | ColumnGroupDef<TRow>)[];
  /** Initial datasource for `rowModelType: 'infinite'`. */
  datasource?: IDatasource<TRow>;
}

// ---- async transactions ----
export interface RowDataTransaction<TRow = unknown> {
  add?: TRow[];
  addIndex?: number;
  remove?: TRow[];
  update?: TRow[];
}

export interface AsyncTransactionsFlushedEvent<TRow = unknown> {
  results: { add: number; remove: number; update: number }[];
}

// ---- MCP server descriptors ----
/**
 * A JSON Schema-like description of a glassGRID grid, suitable for exposure to
 * an MCP (Model Context Protocol) server so AI agents can introspect and operate
 * on the grid.
 */
export interface McpToolDescriptor {
  /** Tool name as exposed to the MCP client. */
  name: string;
  /** Short, agent-readable description. */
  description: string;
  /** JSON-schema for the tool's input. */
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: unknown[]; items?: unknown } | undefined>;
    required?: string[];
  };
}

export interface McpServerAdapter<TRow = unknown> {
  /** Stable identifier for this grid (used by AI agents to address it). */
  gridId: string;
  /** Human-readable summary of the grid. */
  description: string;
  /** Returns the current grid schema (columns + state). */
  schema: () => GridSchema;
  /** Returns the list of tools the grid offers to an MCP client. */
  tools: () => McpToolDescriptor[];
  /** Invoke a named tool with JSON args. */
  invoke: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

// ---- column groups ----
export interface ColumnGroupDef<TRow = unknown> {
  /** Group id used in state. */
  groupId?: string;
  /** Header label for the group. */
  headerName: string;
  /** Children — either columns or nested groups. */
  children: (ColumnDef<TRow> | ColumnGroupDef<TRow>)[];
  /** Optional CSS class applied to the group header cell. */
  headerClass?: string | string[];
  /** "Marry children": when true, group columns can't be moved out of the group. */
  marryChildren?: boolean;
  /** Initial open/closed state. */
  openByDefault?: boolean;
}

export function isColumnGroupDef<TRow>(d: ColumnDef<TRow> | ColumnGroupDef<TRow>): d is ColumnGroupDef<TRow> {
  return (d as ColumnGroupDef<TRow>).children !== undefined;
}

export interface ColumnGroupState {
  groupId: string;
  open: boolean;
}

// ---- server-side / infinite row models ----
export interface ServerSideStoreParams<TRow = unknown> {
  startRow: number;
  endRow: number;
  sortModel: SortModelItem[];
  filterModel: FilterModel;
  groupKeys: string[];
}

export interface ServerSideStoreResponse<TRow = unknown> {
  rows: TRow[];
  /** Total row count (when known). */
  rowCount?: number;
}

export interface ServerSideDatasource<TRow = unknown> {
  getRows(params: ServerSideStoreParams<TRow>): Promise<ServerSideStoreResponse<TRow>>;
}

export interface InfiniteDatasource<TRow = unknown> {
  /** Total rows (-1 if unknown). */
  rowCount: number;
  getRows(params: { startRow: number; endRow: number }): Promise<{ rows: TRow[]; lastRow?: number }>;
}

// ---- pivot ----
export interface PivotResultColumn<TRow = unknown> extends ColumnDef<TRow> {
  pivotKey: string;
  pivotValueColumn?: string;
}

// ---- AI toolkit ----
export interface GridSchema {
  columns: { colId: string; field?: string; headerName: string; type: 'string' | 'number' | 'date' | 'boolean' | 'unknown' }[];
  rowCount: number;
  sortModel: SortModelItem[];
  filterModel: FilterModel;
  groupBy: string[];
}

// ---- CSV export ----
export interface CsvExportOptions<TRow = unknown> {
  fileName?: string;
  delimiter?: string;
  onlySelected?: boolean;
  columnKeys?: string[];
  skipHeader?: boolean;
  processCellCallback?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow>; value: unknown }) => string | number;
}

// ---- state ----
export interface ColumnStateItem {
  colId: string;
  width?: number;
  hide?: boolean;
  pinned?: 'left' | 'right' | null;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number;
  rowGroup?: boolean;
  rowGroupIndex?: number;
  flex?: number;
}

export interface GridState {
  columns: ColumnStateItem[];
  sortModel: SortModelItem[];
  filterModel: FilterModel;
  quickFilter: string;
  pagination: { page: number; pageSize: number };
}

// ---- context menu ----
export interface ContextMenuItem<TRow = unknown> {
  name: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  action?: (params: { data: TRow | null; node: RowNode<TRow> | null; colDef: ColumnDef<TRow> | null; api: GridApi<TRow> }) => void;
  subMenu?: ContextMenuItem<TRow>[];
  /** Special separator entry. */
  separator?: boolean;
}

// ---- side bar ----
export interface SideBarDef {
  toolPanels: ToolPanelDef[];
  defaultToolPanel?: string;
  position?: 'left' | 'right';
}

export interface ToolPanelDef {
  id: string;
  labelDefault: string;
  iconKey?: string;
  toolPanel?: 'columns' | 'filters' | ((host: HTMLElement, api: GridApi<unknown>) => () => void);
}

// ---- localization ----
export type LocaleTextFn = (key: string, defaultValue: string) => string;

export interface DefaultColDef<TRow = unknown> extends Partial<ColumnDef<TRow>> {}

export interface RowNode<TRow = unknown> {
  readonly id: string;
  readonly data: TRow;
  readonly rowIndex: number;
  /** True if selected. */
  selected: boolean;
}

export interface SortModelItem {
  colId: string;
  sort: 'asc' | 'desc';
}

export type RowSelectionMode = 'single' | 'multiple' | null;

export interface GridReadyEvent<TRow = unknown> {
  api: GridApi<TRow>;
  /** ag-grid compatibility — same object as `api` (column ops live on `api` itself). */
  columnApi: GridApi<TRow>;
}

export interface SelectionChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  selectedRows: TRow[];
  selectedNodes: RowNode<TRow>[];
}

export interface SortChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  sortModel: SortModelItem[];
}

export interface FilterChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  quickFilter: string;
}

export interface PaginationChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
}

export interface CellClickedEvent<TRow = unknown, TValue = unknown> {
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
  value: TValue;
  event: MouseEvent;
}

export interface CellDoubleClickedEvent<TRow = unknown, TValue = unknown> extends CellClickedEvent<TRow, TValue> {}
export interface CellContextMenuEvent<TRow = unknown, TValue = unknown> extends CellClickedEvent<TRow, TValue> {}
export interface CellMouseEnterEvent<TRow = unknown, TValue = unknown> extends CellClickedEvent<TRow, TValue> {}
export interface CellMouseLeaveEvent<TRow = unknown, TValue = unknown> extends CellClickedEvent<TRow, TValue> {}
export interface CellFocusedEvent<TRow = unknown> {
  rowIndex: number;
  colId: string;
  api: GridApi<TRow>;
}
export interface CellKeyDownEvent<TRow = unknown, TValue = unknown> {
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
  value: TValue;
  event: KeyboardEvent;
}

export interface RowClickedEvent<TRow = unknown> {
  data: TRow;
  node: RowNode<TRow>;
  event: MouseEvent;
}

export interface RowDoubleClickedEvent<TRow = unknown> extends RowClickedEvent<TRow> {}

// ---- editing events ----
export interface CellEditingStartedEvent<TRow = unknown, TValue = unknown> {
  data: TRow;
  node: RowNode<TRow>;
  colDef: ColumnDef<TRow, TValue>;
  oldValue: TValue;
}

export interface CellEditingStoppedEvent<TRow = unknown, TValue = unknown> extends CellEditingStartedEvent<TRow, TValue> {
  newValue: TValue;
  /** True if value changed; false if cancelled or unchanged. */
  valueChanged: boolean;
}

export interface CellValueChangedEvent<TRow = unknown, TValue = unknown> extends CellEditingStartedEvent<TRow, TValue> {
  newValue: TValue;
}

// ---- filter events ----
export interface ColumnFilterChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  filterModel: FilterModel;
}

// ---- row drag events ----
export interface RowDragEvent<TRow = unknown> {
  node: RowNode<TRow>;
  overIndex: number;
  event: DragEvent;
}

// ---- range selection ----
export interface CellRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface RangeSelectionChangedEvent<TRow = unknown> {
  api: GridApi<TRow>;
  ranges: CellRange[];
}

/**
 * Imperative API handed to the consumer via (gridReady).
 * Mirrors a tiny, useful subset of ag-grid's API.
 */
export interface GridApi<TRow = unknown> {
  // data
  setRowData(rows: TRow[]): void;
  getRowData(): TRow[];
  applyTransaction(t: RowDataTransaction<TRow>): { add: number; remove: number; update: number } | void;
  /** Buffer a transaction; flushes via rAF coalescing multiple calls into one update. */
  applyTransactionAsync(t: RowDataTransaction<TRow>, callback?: (res: { add: number; remove: number; update: number }) => void): void;
  /** Force-flush any pending async transactions immediately. */
  flushAsyncTransactions(): void;

  /** Build an MCP-compatible adapter exposing the grid's schema + tools to an AI agent. */
  toMcpServer(opts?: { gridId?: string; description?: string }): McpServerAdapter<TRow>;

  // columns
  setColumnDefs(defs: ColumnDef<TRow>[]): void;
  getColumnDefs(): ColumnDef<TRow>[];
  sizeColumnsToFit(): void;
  autoSizeColumn(colId: string): void;
  autoSizeAllColumns(): void;
  setColumnVisible(colId: string, visible: boolean): void;
  setColumnPinned(colId: string, pinned: 'left' | 'right' | null): void;
  moveColumn(colId: string, toIndex: number): void;

  // sort
  setSortModel(model: SortModelItem[]): void;
  getSortModel(): SortModelItem[];

  // filter
  setQuickFilter(text: string): void;
  setFilterModel(model: FilterModel): void;
  getFilterModel(): FilterModel;
  destroyFilter(colId: string): void;

  // editing
  startEditingCell(rowIndex: number, colId: string): void;
  stopEditing(cancel?: boolean): void;
  getEditingCell(): { rowIndex: number; colId: string } | null;
  undoCellEditing(): void;
  redoCellEditing(): void;

  // export
  exportDataAsCsv(opts?: CsvExportOptions<TRow>): void;
  getDataAsCsv(opts?: CsvExportOptions<TRow>): string;

  // grouping
  setRowGroupColumns(colIds: string[]): void;
  expandAll(): void;
  collapseAll(): void;

  // range selection
  getCellRanges(): CellRange[];
  clearRangeSelection(): void;

  // find
  findNext(query: string): void;
  findPrev(query: string): void;
  clearFind(): void;

  // state
  getColumnState(): ColumnStateItem[];
  applyColumnState(state: ColumnStateItem[]): void;
  getGridState(): GridState;
  applyGridState(state: GridState): void;

  // side bar
  setSideBarVisible(visible: boolean): void;
  isSideBarVisible(): boolean;
  openToolPanel(id: string): void;
  closeToolPanel(): void;

  // selection
  selectAll(): void;
  deselectAll(): void;
  getSelectedRows(): TRow[];
  getSelectedNodes(): RowNode<TRow>[];

  // pagination
  paginationGoToPage(page: number): void;
  paginationGoToNextPage(): void;
  paginationGoToPreviousPage(): void;
  paginationGoToFirstPage(): void;
  paginationGoToLastPage(): void;
  paginationGetCurrentPage(): number;
  paginationGetTotalPages(): number;
  paginationGetPageSize(): number;
  paginationSetPageSize(size: number): void;

  // misc
  ensureIndexVisible(index: number, position?: 'top' | 'middle' | 'bottom'): void;
  ensureColumnVisible(colId: string): void;
  refreshCells(): void;
  destroy(): void;

  // column groups
  setColumnGroupState(state: ColumnGroupState[]): void;
  getColumnGroupState(): ColumnGroupState[];
  setColumnGroupOpened(groupId: string, opened: boolean): void;
  resetColumnGroupState(): void;

  // pivoting
  setPivotMode(enable: boolean): void;
  isPivotMode(): boolean;
  setPivotColumns(colIds: string[]): void;
  getPivotColumns(): string[];
  getPivotResult(): { rows: Record<string, unknown>[]; pivotKeys: string[]; pivotCols: ColumnDef<TRow>[] } | null;

  // server / infinite row model
  setServerSideDatasource(ds: ServerSideDatasource<TRow> | null): void;
  setInfiniteDatasource(ds: InfiniteDatasource<TRow> | null): void;
  refreshServerSideStore(): void;

  // AI / schema
  getStructuredSchema(): GridSchema;

  // export
  exportDataAsExcel(opts?: ExcelExportOptions<TRow>): void;
  getDataAsExcelXml(opts?: ExcelExportOptions<TRow>): string;

  // clipboard
  pasteFromClipboard(text?: string): Promise<void>;

  // ---- ag-grid drop-in: loading / generic setters / iteration / infinite cache ----
  /** Show the built-in loading overlay (same as setting `[loading]="true"`). */
  showLoadingOverlay(): void;
  /** Hide any visible overlay (loading or no-rows). */
  hideOverlay(): void;
  /** Generic option setter — accepts the same keys as `GridOptions`. */
  setGridOption<K extends keyof GridOptions<TRow>>(key: K, value: GridOptions<TRow>[K]): void;
  /** Iterate every node currently held by the grid. */
  forEachNode(cb: (node: RowNode<TRow>, index: number) => void): void;
  /** Iterate every node that survives current filtering. */
  forEachNodeAfterFilter(cb: (node: RowNode<TRow>, index: number) => void): void;
  /** Iterate every node after filter AND sort. */
  forEachNodeAfterFilterAndSort(cb: (node: RowNode<TRow>, index: number) => void): void;
  /** Drop the lazy-loaded cache and re-fetch from the datasource. */
  refreshInfiniteCache(): void;
  /** ag-grid alias — same as `refreshInfiniteCache`. */
  purgeInfiniteCache(): void;
  /** Object with `resetCache()` to match ag-grid's `gridApi.infiniteRowModel.resetCache()`. */
  infiniteRowModel: { resetCache(): void };
  /** Read-only count: total rows currently displayed (post-filter). */
  getDisplayedRowCount(): number;
}

export interface ExcelExportOptions<TRow = unknown> extends CsvExportOptions<TRow> {
  sheetName?: string;
  /** Optional callback returning a cell comment / note string. */
  noteFor?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow>; value: unknown }) => string | null | undefined;
  /** Optional callback returning a hyperlink URL for a cell. */
  hyperlinkFor?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow>; value: unknown }) => string | null | undefined;
  /** Optional callback returning an image (Base64 data: URL) anchored at the cell. */
  imageFor?: (params: { data: TRow; node: RowNode<TRow>; colDef: ColumnDef<TRow>; value: unknown }) => { dataUrl: string; width?: number; height?: number } | null | undefined;
  /**
   * Optional callback called once per leaf row that returns rows of additional detail
   * to emit immediately after the row (for master/detail export). The cells span all columns.
   */
  detailRowProvider?: (data: TRow) => string[][] | null | undefined;
}
