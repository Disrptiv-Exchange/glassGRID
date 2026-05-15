import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { Type } from '@angular/core';
import type { IDatasource } from './types';

import type {
  CellClickedEvent,
  CellContextMenuEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellFocusedEvent,
  CellKeyDownEvent,
  CellMouseEnterEvent,
  CellMouseLeaveEvent,
  CellRange,
  CellRendererParams,
  CellValueChangedEvent,
  ColumnDef,
  ColumnFilterChangedEvent,
  ColumnGroupDef,
  ColumnGroupState,
  ColumnStateItem,
  ContextMenuItem,
  CsvExportOptions,
  DefaultColDef,
  ExcelExportOptions,
  FilterChangedEvent,
  FilterModel,
  FilterModelItem,
  FilterOp,
  GridApi,
  GridReadyEvent,
  GridSchema,
  GridState,
  InfiniteDatasource,
  LocaleTextFn,
  PaginationChangedEvent,
  RangeSelectionChangedEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  RowDragEvent,
  RowNode,
  RowSelectionMode,
  SelectionChangedEvent,
  ServerSideDatasource,
  SideBarDef,
  SortChangedEvent,
  SortDirection,
  SortModelItem,
} from './types';
import { isColumnGroupDef } from './types';
import { resolveColumns, type ResolvedColumn } from './internal/resolve-column';
import { formatCellValue, getCellValue } from './internal/value';
import { sortRows, nextSortDirection } from './internal/sort';
import { applyQuickFilter } from './internal/filter';
import { applyColumnFilters, DATE_OPS, FILTER_OP_LABELS, NUMBER_OPS, TEXT_OPS, resolveFilterType } from './internal/column-filter';
import { aggregate } from './internal/aggregation';
import {
  buildGroupTree,
  type FlattenedRow,
  type GroupRow,
} from './internal/grouping';
import { buildTree } from './internal/tree-data';
import { downloadCsv, toCsv } from './internal/csv-export';
import { rowsToTsv, writeClipboard } from './internal/clipboard';
import { parseClipboardText, readClipboard } from './internal/clipboard-paste';
import { resolveLocale } from './internal/locale';
import { buildHeaderTree, type ResolvedColumnGroup, type HeaderTree } from './internal/column-groups';
import { pivotTransform } from './internal/pivot';
import { toExcelXml, downloadExcel } from './internal/excel-export';

interface RenderColumn<TRow> extends ResolvedColumn<TRow> {
  computedWidth: number;
  left: number;
  /** True when this column is the rightmost left-pinned column (divider edge). */
  isLeftPinnedEdge?: boolean;
  /** True when this column is the leftmost right-pinned column (divider edge). */
  isRightPinnedEdge?: boolean;
}

interface EditState {
  rowIndex: number;
  colId: string;
  oldValue: unknown;
  popup: boolean;
}

interface UndoEntry {
  rowId: string;
  colId: string;
  oldValue: unknown;
  newValue: unknown;
}

const FIND_HIGHLIGHT_CLASS = 'gg-find-match';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@Component({
  selector: 'glass-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, NgComponentOutlet],
  templateUrl: './glass-grid.component.html',
  styleUrl: './glass-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'grid',
    class: 'gg-grid',
    '[class.gg-dark]': 'darkMode()',
    '[class.gg-rtl]': 'enableRtl()',
    '[class.gg-has-sidebar]': '!!sideBar() && sideBarVisible()',
    '[attr.aria-rowcount]': 'displayedRows().length',
    '[attr.aria-colcount]': 'visibleColumns().length',
    '[attr.aria-multiselectable]': 'rowSelection() === "multiple"',
    '[attr.dir]': 'enableRtl() ? "rtl" : null',
  },
})
export class GlassGridComponent<TRow extends object = Record<string, unknown>> {
  // ===== inputs =====
  readonly columnDefs = input<(ColumnDef<TRow> | ColumnGroupDef<TRow>)[]>([]);
  readonly rowData = input<TRow[]>([]);
  readonly pinnedTopRowData = input<TRow[]>([]);
  readonly pinnedBottomRowData = input<TRow[]>([]);
  readonly defaultColDef = input<DefaultColDef<TRow>>({});
  readonly getRowId = input<((row: TRow) => string) | null>(null);

  // server / infinite row models
  readonly serverSideDatasource = input<ServerSideDatasource<TRow> | null>(null);
  readonly infiniteDatasource = input<InfiniteDatasource<TRow> | null>(null);
  readonly serverSideStoreType = input<'partial' | 'full'>('partial');
  readonly cacheBlockSize = input(100);
  readonly maxBlocksInCache = input(10);

  // pivot
  readonly pivotMode = input(false);
  readonly pivotColIds = input<string[]>([]);

  // tool panels
  readonly toolPanelFactories = input<Record<string, (host: HTMLElement, api: GridApi<TRow>) => () => void>>({});

  // clipboard paste
  readonly enableClipboardPaste = input(true);

  /**
   * 'fitGridWidth' (default): if total natural column width is less than the body viewport, distribute
   *   the leftover horizontal space proportionally so columns fill the viewport.
   * 'fitCellContents': call autoSizeAllColumns() once on grid ready.
   * null: leave column widths exactly as declared.
   */
  readonly autoSizeStrategy = input<'fitGridWidth' | 'fitCellContents' | null>('fitGridWidth');

  // ---- ag-grid drop-in inputs ----
  /** ag-grid-style `[gridOptions]` bag — applied as a one-shot config on grid ready. */
  readonly gridOptions = input<import('./types').GridOptions<TRow> | null>(null);
  /** Row model: 'clientSide' (default) | 'infinite' | 'serverSide' | 'viewport'. */
  readonly rowModelType = input<import('./types').RowModelType>('clientSide');
  readonly suppressScrollOnNewData = input(false);
  /** ag-grid `[debug]` — when true, the grid logs lifecycle events to console. No-op otherwise. */
  readonly debug = input(false);

  readonly rowSelection = input<RowSelectionMode>(null);
  readonly suppressRowClickSelection = input(false);
  readonly suppressRowDeselection = input(false);

  readonly pagination = input(false);
  readonly paginationPageSize = input(20);
  readonly paginationPageSizeSelector = input<number[] | false>([10, 20, 50, 100]);
  readonly paginationAutoPageSize = input(false);

  readonly rowHeight = input(36);
  readonly headerHeight = input(40);
  readonly quickFilterText = input('');
  readonly darkMode = input(false);
  readonly animateRows = input(true);
  readonly enableCellChangeFlash = input(false);
  readonly multiSortKey = input<'ctrl' | 'always'>('always');

  readonly loading = input(false);
  readonly noRowsMessage = input('No rows to show');
  readonly loadingMessage = input('Loading…');

  // editing
  readonly singleClickEdit = input(false);
  readonly suppressClickEdit = input(false);
  readonly stopEditingWhenCellsLoseFocus = input(true);
  readonly readOnlyEdit = input(false);

  // grouping
  readonly groupDefaultExpanded = input(0);
  readonly autoGroupColumnDef = input<Partial<ColumnDef<TRow>>>({});
  readonly suppressAggFuncInHeader = input(false);

  // tree data
  readonly treeData = input(false);
  readonly getDataPath = input<((row: TRow) => string[]) | null>(null);

  // master-detail
  readonly masterDetail = input(false);
  readonly detailRowHeight = input(220);
  readonly detailCellRenderer = input<((row: TRow) => string | Node) | null>(null);
  readonly isRowMaster = input<((row: TRow) => boolean) | null>(null);

  // row drag
  readonly rowDragManaged = input(false);
  readonly suppressRowDrag = input(false);

  // range
  readonly enableRangeSelection = input(false);
  readonly enableFillHandle = input(false);
  readonly suppressMultiRangeSelection = input(false);

  // side bar / status bar / context menu
  readonly sideBar = input<SideBarDef | false>(false);
  readonly statusBar = input<{ panels: ('selected' | 'filtered' | 'total' | 'avg' | 'sum' | 'min' | 'max')[]; aggField?: string } | null>(null);
  readonly getContextMenuItems = input<((params: { data: TRow | null; node: RowNode<TRow> | null; colDef: ColumnDef<TRow> | null }) => ContextMenuItem<TRow>[]) | null>(null);
  readonly suppressContextMenu = input(false);

  // locale / RTL
  readonly enableRtl = input(false);
  readonly getLocaleText = input<LocaleTextFn | null>(null);

  // misc
  readonly fullWidthCellRenderer = input<((row: TRow) => string | Node) | null>(null);
  readonly isFullWidthRow = input<((row: TRow) => boolean) | null>(null);
  readonly suppressRowVirtualisation = input(false);
  readonly suppressColumnVirtualisation = input(true);
  readonly print = input(false);

  // ===== outputs =====
  readonly gridReady = output<GridReadyEvent<TRow>>();
  readonly firstDataRendered = output<GridReadyEvent<TRow>>();
  readonly bodyScroll = output<{ top: number; left: number }>();
  readonly bodyScrollEnd = output<{ top: number; left: number }>();
  readonly selectionChanged = output<SelectionChangedEvent<TRow>>();
  readonly sortChanged = output<SortChangedEvent<TRow>>();
  readonly filterChanged = output<FilterChangedEvent<TRow>>();
  readonly columnFilterChanged = output<ColumnFilterChangedEvent<TRow>>();
  readonly paginationChanged = output<PaginationChangedEvent<TRow>>();
  readonly cellClicked = output<CellClickedEvent<TRow>>();
  readonly cellDoubleClicked = output<CellDoubleClickedEvent<TRow>>();
  readonly cellContextMenu = output<CellContextMenuEvent<TRow>>();
  readonly cellMouseEnter = output<CellMouseEnterEvent<TRow>>();
  readonly cellMouseLeave = output<CellMouseLeaveEvent<TRow>>();
  readonly cellFocused = output<CellFocusedEvent<TRow>>();
  readonly cellKeyDown = output<CellKeyDownEvent<TRow>>();
  readonly rowClicked = output<RowClickedEvent<TRow>>();
  readonly rowDoubleClicked = output<RowDoubleClickedEvent<TRow>>();
  readonly cellEditingStarted = output<CellEditingStartedEvent<TRow>>();
  readonly cellEditingStopped = output<CellEditingStoppedEvent<TRow>>();
  readonly cellValueChanged = output<CellValueChangedEvent<TRow>>();
  readonly rowGroupOpened = output<{ groupId: string; expanded: boolean }>();
  readonly rowDragEnd = output<RowDragEvent<TRow>>();
  readonly rangeSelectionChanged = output<RangeSelectionChangedEvent<TRow>>();

  // ===== internal state =====
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly sanitizer = inject(DomSanitizer);

  // ag-grid drop-in mirrors
  protected readonly loadingOverlayInternal = signal(false);
  protected readonly attachedDatasource = signal<IDatasource<TRow> | null>(null);
  protected readonly gridOptionsOverride = signal<Partial<import('./types').GridOptions<TRow>>>({});
  protected readonly infiniteFetched = new Set<number>();

  protected readonly internalQuickFilter = signal('');
  private readonly internalColumnState = signal<Map<string, Partial<ResolvedColumn<TRow>>>>(new Map());
  private readonly internalColumnOrder = signal<string[] | null>(null);
  private readonly sortModel = signal<SortModelItem[]>([]);
  private readonly currentPage = signal(0);
  private readonly userPageSize = signal<number | null>(null);
  private readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly focusedCell = signal<{ row: number; col: number } | null>(null);
  private readonly resizing = signal<{ colId: string; startX: number; startWidth: number } | null>(null);
  protected readonly draggingCol = signal<{ colId: string; overColId: string | null } | null>(null);
  protected readonly flashCells = signal<Set<string>>(new Set());

  // viewport
  private readonly viewportHeight = signal(400);
  private readonly viewportWidth = signal(1000);
  private readonly scrollTop = signal(0);
  /** Exposed to template so header + floating-filter row can translate by -scrollLeft to track body scroll. */
  protected readonly scrollLeft = signal(0);

  // filtering
  protected readonly filterModel = signal<FilterModel>({});
  protected readonly openFilterColId = signal<string | null>(null);
  /** Pixel coordinates (relative to the grid host) where the filter popup should anchor. */
  protected readonly filterPopupAnchor = signal<{ top: number; left: number } | null>(null);
  protected readonly draftFilter = signal<FilterModelItem>({ type: 'contains', filter: '' });

  protected setDraftFilterType(type: FilterOp) {
    this.draftFilter.set({ ...this.draftFilter(), type });
  }
  protected setDraftFilterValue(filter: string | number | null) {
    this.draftFilter.set({ ...this.draftFilter(), filter });
  }
  protected setDraftFilterTo(filterTo: string | number | null) {
    this.draftFilter.set({ ...this.draftFilter(), filterTo });
  }

  protected hasAnyFloatingFilter(): boolean {
    return this.renderColumns().some(c => c.colDef.floatingFilter === true);
  }
  protected findColumnById(colId: string | null): ResolvedColumn<TRow> | undefined {
    if (!colId) return undefined;
    return this.columnsWithState().find(c => c.colId === colId);
  }

  // editing
  protected readonly editingCell = signal<EditState | null>(null);
  private readonly undoStack: UndoEntry[] = [];
  private readonly redoStack: UndoEntry[] = [];
  /** In-place value overrides (used so we don't mutate the input rowData array). */
  private readonly editedValues = signal<Map<string, Map<string, unknown>>>(new Map());

  // grouping
  protected readonly rowGroupColIds = signal<string[]>([]);
  protected readonly toggledGroupIds = signal<Set<string>>(new Set());

  // tree data
  protected readonly toggledTreeIds = signal<Set<string>>(new Set());

  // master-detail
  protected readonly expandedDetailIds = signal<Set<string>>(new Set());

  // range selection
  protected readonly ranges = signal<CellRange[]>([]);
  protected readonly rangeAnchor = signal<{ row: number; col: number } | null>(null);
  private readonly rangeDragging = signal(false);

  // find
  protected readonly findQuery = signal('');
  protected readonly findMatches = signal<{ rowIndex: number; colIndex: number }[]>([]);
  protected readonly findIndex = signal(-1);

  // side bar
  protected readonly sideBarVisible = signal(false);
  protected readonly openToolPanelId = signal<string | null>(null);

  // context menu
  protected readonly contextMenu = signal<{ x: number; y: number; rowIndex: number | null; colId: string | null; source: 'cell' | 'header' } | null>(null);

  // row drag
  protected readonly rowDragSource = signal<{ rowId: string; overIndex: number | null } | null>(null);

  // row order override (for managed row drag)
  private readonly rowOrder = signal<string[] | null>(null);

  // ===== derived =====
  protected readonly t = computed(() => resolveLocale(this.getLocaleText()));

  /** Local row data override — populated by applyTransaction(). null = use input rowData. */
  private readonly localRowData = signal<TRow[] | null>(null);

  readonly nodes = computed<RowNode<TRow>[]>(() => {
    const local = this.localRowData();
    const data = local ?? this.rowData() ?? [];
    const idFn = this.getRowId();
    const edited = this.editedValues();
    return data.map((row, i) => {
      const id = idFn ? idFn(row) : (row as { id?: string | number }).id != null
        ? String((row as { id: string | number }).id)
        : `_n${i}`;
      // apply any in-place edits to a shallow row copy
      const overrides = edited.get(id);
      const effectiveRow = overrides ? this.applyOverrides(row, overrides) : row;
      const node: RowNode<TRow> = {
        id,
        data: effectiveRow,
        rowIndex: i,
        selected: this.selectedIds().has(id),
      };
      return node;
    });
  });

  private applyOverrides(row: TRow, overrides: Map<string, unknown>): TRow {
    const out = { ...row } as Record<string, unknown>;
    for (const [colId, v] of overrides) {
      const colDef = this.resolvedColumns().find((c) => c.colId === colId)?.colDef;
      const field = colDef?.field ?? colId;
      out[field] = v;
    }
    return out as TRow;
  }

  // column group state
  protected readonly columnGroupOpen = signal<Map<string, boolean>>(new Map());

  readonly headerTree = computed<HeaderTree<TRow>>(() => {
    const input = this.columnDefs() ?? [];
    return buildHeaderTree(input, this.columnGroupOpen());
  });

  readonly resolvedColumns = computed<ResolvedColumn<TRow>[]>(() => {
    const flat = this.headerTree().flatColumns;
    const def = this.defaultColDef();
    return resolveColumns(flat, def);
  });

  /** Seed rowGroupColIds from column defs. */
  readonly initialRowGroupColIds = computed(() => {
    return this.resolvedColumns()
      .filter((c) => c.colDef.rowGroup)
      .sort((a, b) => (a.colDef.rowGroupIndex ?? 0) - (b.colDef.rowGroupIndex ?? 0))
      .map((c) => c.colId);
  });

  readonly columnsWithState = computed<ResolvedColumn<TRow>[]>(() => {
    const base = this.resolvedColumns();
    const state = this.internalColumnState();
    const order = this.internalColumnOrder();
    const merged = base.map((c) => ({ ...c, ...(state.get(c.colId) ?? {}) }));
    if (!order) return merged;
    const byId = new Map(merged.map((c) => [c.colId, c]));
    const ordered: ResolvedColumn<TRow>[] = [];
    for (const id of order) {
      const found = byId.get(id);
      if (found) { ordered.push(found); byId.delete(id); }
    }
    for (const c of byId.values()) ordered.push(c);
    return ordered;
  });

  readonly visibleColumns = computed(() => {
    const grouped = new Set(this.rowGroupColIds());
    return this.columnsWithState().filter((c) => !c.hide && !grouped.has(c.colId));
  });

  readonly colDefById = computed<Map<string, ColumnDef<TRow>>>(() => {
    const m = new Map<string, ColumnDef<TRow>>();
    for (const c of this.columnsWithState()) m.set(c.colId, c.colDef);
    return m;
  });

  /** Apply external row order override (row drag). */
  readonly orderedNodes = computed<RowNode<TRow>[]>(() => {
    const all = this.nodes();
    const order = this.rowOrder();
    if (!order) return all;
    const byId = new Map(all.map((n) => [n.id, n] as const));
    const out: RowNode<TRow>[] = [];
    for (const id of order) {
      const n = byId.get(id);
      if (n) { out.push(n); byId.delete(id); }
    }
    for (const n of byId.values()) out.push(n);
    return out;
  });

  /** Server-side / infinite store: lazily-loaded rows. */
  protected readonly serverSideRows = signal<TRow[]>([]);
  protected readonly serverSideTotal = signal<number | null>(null);

  readonly filteredNodes = computed<RowNode<TRow>[]>(() => {
    const all = this.orderedNodes();
    const q = this.internalQuickFilter() || this.quickFilterText();
    const visibleColDefs = this.visibleColumns().map((c) => c.colDef);
    const quickFiltered = applyQuickFilter(all, q, visibleColDefs);
    return applyColumnFilters(quickFiltered, this.filterModel(), this.colDefById());
  });

  readonly sortedFilteredNodes = computed<RowNode<TRow>[]>(() => {
    return sortRows(this.filteredNodes(), this.sortModel(), this.colDefById());
  });

  /** Pivot transform result (Record-based rows + dynamic columns). */
  readonly pivotResult = computed(() => {
    if (!this.pivotMode() || !this.pivotColIds().length) return null;
    const valueColIds = this.columnsWithState().filter((c) => c.colDef.aggFunc).map((c) => c.colId);
    return pivotTransform(
      this.sortedFilteredNodes(),
      this.rowGroupColIds(),
      this.pivotColIds(),
      valueColIds,
      this.colDefById(),
    );
  });

  /** Pinned top rows materialised as RowNodes. */
  readonly pinnedTopNodes = computed<RowNode<TRow>[]>(() => {
    const data = this.pinnedTopRowData() ?? [];
    return data.map((row, i) => ({ id: `_pinTop_${i}`, data: row, rowIndex: -1 - i, selected: false }));
  });

  /** Pinned bottom rows materialised as RowNodes. */
  readonly pinnedBottomNodes = computed<RowNode<TRow>[]>(() => {
    const data = this.pinnedBottomRowData() ?? [];
    return data.map((row, i) => ({ id: `_pinBot_${i}`, data: row, rowIndex: 1_000_000 + i, selected: false }));
  });

  /** Flat list of all rows to render (leaves + group rows + detail rows). */
  readonly displayedRows = computed<FlattenedRow<TRow>[]>(() => {
    const baseNodes = this.sortedFilteredNodes();
    let flat: FlattenedRow<TRow>[] = [];

    if (this.treeData() && this.getDataPath()) {
      const { flat: f } = buildTree(baseNodes, this.getDataPath()!, this.toggledTreeIds(), this.groupDefaultExpanded() > 0);
      flat = f;
    } else if (this.rowGroupColIds().length) {
      const aggCols = this.columnsWithState().filter((c) => c.colDef.aggFunc).map((c) => c.colId);
      const { flat: f } = buildGroupTree(
        baseNodes,
        this.rowGroupColIds(),
        this.colDefById(),
        aggCols,
        this.toggledGroupIds(),
        this.groupDefaultExpanded() > 0,
      );
      flat = f;
    } else {
      flat = baseNodes.map((node) => ({ kind: 'leaf' as const, node, id: node.id, level: 0 }));
    }

    // expand detail rows (filtered by isRowMaster)
    if (this.masterDetail()) {
      const expanded = this.expandedDetailIds();
      const isRowMaster = this.isRowMaster();
      const out: FlattenedRow<TRow>[] = [];
      for (const r of flat) {
        out.push(r);
        if (r.kind === 'leaf' && r.node && expanded.has(r.node.id) && (!isRowMaster || isRowMaster(r.node.data))) {
          out.push({ kind: 'detail', node: r.node, id: `${r.node.id}::detail`, level: r.level });
        }
      }
      flat = out;
    }
    // pinned top + bottom rows wrap the displayed rows (not virtualised; rendered separately by template)
    return flat;
  });

  readonly totalDisplayed = computed(() => this.displayedRows().length);

  readonly effectivePageSize = computed(() => {
    if (!this.pagination()) return this.totalDisplayed();
    if (this.paginationAutoPageSize()) return Math.max(1, Math.floor(this.viewportHeight() / this.rowHeight()));
    return this.userPageSize() ?? this.paginationPageSize();
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalDisplayed() / Math.max(1, this.effectivePageSize()))));

  readonly pagedRows = computed<FlattenedRow<TRow>[]>(() => {
    const rows = this.displayedRows();
    if (!this.pagination()) return rows;
    const size = this.effectivePageSize();
    const page = Math.min(this.currentPage(), this.totalPages() - 1);
    return rows.slice(page * size, page * size + size);
  });

  /** Cumulative offset for each paged row (accounts for variable detail heights). */
  readonly rowOffsets = computed<{ tops: number[]; total: number }>(() => {
    const rows = this.pagedRows();
    const rh = this.rowHeight();
    const dh = this.detailRowHeight();
    const tops: number[] = new Array(rows.length);
    let acc = 0;
    for (let i = 0; i < rows.length; i++) {
      tops[i] = acc;
      acc += rows[i]!.kind === 'detail' ? dh : rh;
    }
    return { tops, total: acc };
  });

  readonly visibleRowRange = computed<{ start: number; end: number }>(() => {
    const { tops } = this.rowOffsets();
    const total = tops.length;
    if (this.suppressRowVirtualisation()) return { start: 0, end: total };
    const vh = this.viewportHeight();
    const top = this.scrollTop();
    let start = 0;
    while (start < total && (tops[start + 1] ?? Infinity) < top - this.rowHeight() * 3) start++;
    let end = start;
    const limit = top + vh + this.rowHeight() * 6;
    while (end < total && tops[end]! < limit) end++;
    return { start: Math.max(0, start - 3), end: Math.min(total, end + 3) };
  });

  readonly renderedRows = computed(() => {
    const rows = this.pagedRows();
    const { tops } = this.rowOffsets();
    const { start, end } = this.visibleRowRange();
    const slice: { row: FlattenedRow<TRow>; offset: number; index: number; height: number }[] = [];
    const rh = this.rowHeight();
    const dh = this.detailRowHeight();
    for (let i = start; i < end; i++) {
      const row = rows[i];
      if (!row) continue;
      slice.push({ row, offset: tops[i] ?? 0, index: i, height: row.kind === 'detail' ? dh : rh });
    }
    return slice;
  });

  readonly bodyTotalHeight = computed(() => this.rowOffsets().total);

  readonly renderColumns = computed<RenderColumn<TRow>[]>(() => {
    const cols = this.visibleColumns();
    // ensure auto-group column is first if grouping
    const groupColIds = this.rowGroupColIds();
    const auto = (groupColIds.length || this.treeData() || this.masterDetail()) ? this.makeAutoGroupColumn() : null;
    const allCols = auto ? [auto, ...cols] : cols;

    const left: ResolvedColumn<TRow>[] = [];
    const center: ResolvedColumn<TRow>[] = [];
    const right: ResolvedColumn<TRow>[] = [];
    for (const c of allCols) {
      if (c.pinned === 'left') left.push(c);
      else if (c.pinned === 'right') right.push(c);
      else center.push(c);
    }
    const lastLeftId = left.length ? left[left.length - 1]!.colId : null;
    const firstRightId = right.length ? right[0]!.colId : null;
    const all = [...left, ...center, ...right];

    // ---- autoSizeStrategy: 'fitGridWidth' — scale widths so total fills the viewport ----
    let factor = 1;
    if (this.autoSizeStrategy() === 'fitGridWidth' && all.length) {
      const naturalSum = all.reduce((s, c) => s + c.width, 0);
      const vw = this.viewportWidth();
      if (naturalSum > 0 && vw > naturalSum) {
        factor = vw / naturalSum;
      }
    }

    let acc = 0;
    return all.map((c) => {
      const w = Math.floor(c.width * factor);
      const minW = c.minWidth ?? 40;
      const finalW = Math.max(minW, w);
      const out = {
        ...c,
        computedWidth: finalW,
        left: acc,
        isLeftPinnedEdge: c.colId === lastLeftId,
        isRightPinnedEdge: c.colId === firstRightId,
      } as RenderColumn<TRow>;
      acc += finalW;
      return out;
    });
  });

  private makeAutoGroupColumn(): ResolvedColumn<TRow> {
    const defOverride = this.autoGroupColumnDef();
    const base: ColumnDef<TRow> = {
      colId: '_autoGroup',
      headerName: this.t()('group') || 'Group',
      width: 240,
      pinned: 'left',
      sortable: true,
      resizable: true,
      suppressMovable: true,
      ...defOverride,
    };
    return {
      colDef: base,
      colId: '_autoGroup',
      field: undefined,
      headerName: base.headerName ?? 'Group',
      width: base.width ?? 240,
      minWidth: base.minWidth ?? 80,
      maxWidth: base.maxWidth,
      flex: base.flex,
      hide: false,
      pinned: base.pinned ?? 'left',
      sortable: !!base.sortable,
      resizable: base.resizable ?? true,
      suppressMovable: base.suppressMovable ?? true,
      filter: base.filter,
    } as ResolvedColumn<TRow>;
  }

  readonly totalContentWidth = computed(() => this.renderColumns().reduce((a, c) => a + c.computedWidth, 0));

  /** Columns to actually render this frame — windowed by scrollLeft+viewportWidth when column virtualisation is on. */
  readonly renderedColumns = computed<RenderColumn<TRow>[]>(() => {
    const cols = this.renderColumns();
    if (this.suppressColumnVirtualisation()) return cols;
    const vw = this.viewportWidth();
    const sl = this.scrollLeft();
    const buffer = 200;
    // pinned cols always render; for centre cols, only those intersecting the visible window
    return cols.filter((c) => {
      if (c.pinned) return true;
      const right = c.left + c.computedWidth;
      return right >= sl - buffer && c.left <= sl + vw + buffer;
    });
  });

  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly allSelected = computed(() => {
    const ids = this.selectedIds();
    const nodes = this.filteredNodes();
    if (nodes.length === 0) return false;
    return nodes.every((n) => ids.has(n.id));
  });

  // ===== API =====
  readonly api: GridApi<TRow> = this.buildApi();

  // ===== ctor / effects =====
  constructor() {
    queueMicrotask(() => {
      // Apply [gridOptions] one-shot bag on first render (ag-grid drop-in pattern).
      const opts = this.gridOptions();
      if (opts?.datasource) {
        // Defer datasource wiring until the next microtask to ensure ngAfterViewInit has run.
        queueMicrotask(() => this.api.setGridOption('datasource', opts.datasource));
      }
      if (this.debug()) {
        // eslint-disable-next-line no-console
        console.log('[glassGRID] gridReady', { rowModelType: this.rowModelType(), totalRows: this.totalDisplayed() });
      }
      this.gridReady.emit({ api: this.api, columnApi: this.api });
    });

    // seed sort model + row group ids from defs
    effect(() => {
      const cols = this.resolvedColumns();
      const initialGroup = this.initialRowGroupColIds();
      untracked(() => {
        if (this.sortModel().length === 0) {
          const initial = cols
            .filter((c) => c.colDef.sort || c.colDef.initialSort)
            .map((c) => ({
              colId: c.colId,
              sort: (c.colDef.sort ?? c.colDef.initialSort) as 'asc' | 'desc',
              idx: c.colDef.sortIndex ?? c.colDef.initialSortIndex ?? 0,
            }))
            .sort((a, b) => a.idx - b.idx)
            .map(({ colId, sort }) => ({ colId, sort }));
          if (initial.length) this.sortModel.set(initial);
        }
        if (this.rowGroupColIds().length === 0 && initialGroup.length) {
          this.rowGroupColIds.set(initialGroup);
        }
      });
    });

    // emit selection / sort / filter / pagination
    effect(() => {
      const ids = this.selectedIds();
      const nodes = untracked(() => this.nodes());
      const selectedNodes = nodes.filter((n) => ids.has(n.id));
      untracked(() => this.selectionChanged.emit({ api: this.api, selectedRows: selectedNodes.map((n) => n.data), selectedNodes }));
    });
    effect(() => { const m = this.sortModel(); untracked(() => this.sortChanged.emit({ api: this.api, sortModel: m })); });
    effect(() => {
      const q = this.internalQuickFilter() || this.quickFilterText();
      untracked(() => this.filterChanged.emit({ api: this.api, quickFilter: q }));
    });
    effect(() => {
      const m = this.filterModel();
      untracked(() => this.columnFilterChanged.emit({ api: this.api, filterModel: m }));
    });
    effect(() => {
      const page = this.currentPage();
      const size = this.effectivePageSize();
      const totalPages = this.totalPages();
      const totalRows = this.totalDisplayed();
      untracked(() => this.paginationChanged.emit({ api: this.api, page, pageSize: size, totalPages, totalRows }));
    });
    effect(() => {
      const ranges = this.ranges();
      untracked(() => this.rangeSelectionChanged.emit({ api: this.api, ranges }));
    });

    // clamp page
    effect(() => {
      const total = this.totalPages();
      const page = this.currentPage();
      if (page >= total) untracked(() => this.currentPage.set(Math.max(0, total - 1)));
    });

    // firstDataRendered (once when totalDisplayed > 0)
    let firedFirstData = false;
    effect(() => {
      const t = this.totalDisplayed();
      if (!firedFirstData && t > 0) {
        firedFirstData = true;
        untracked(() => this.firstDataRendered.emit({ api: this.api, columnApi: this.api }));
      }
    });

    // datasource attachment effect: when consumer calls gridApi.setGridOption('datasource', ds),
    // fetch the first block immediately (ag-grid behaviour).
    effect(() => {
      const ds = this.attachedDatasource();
      if (!ds) return;
      untracked(() => {
        this.infiniteFetched.clear();
        this.fetchInfiniteBlock(0);
      });
    });
  }

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLDivElement>;

  @HostListener('window:resize') onWindowResize() { this.measureViewport(); }
  ngAfterViewInit() { this.measureViewport(); }
  private measureViewport() {
    const vp = this.viewportRef?.nativeElement;
    if (vp) {
      this.viewportHeight.set(vp.clientHeight);
      this.viewportWidth.set(vp.clientWidth);
    }
  }

  private scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
  onBodyScroll(ev: Event) {
    const el = ev.target as HTMLDivElement;
    this.scrollTop.set(el.scrollTop);
    this.scrollLeft.set(el.scrollLeft);
    this.bodyScroll.emit({ top: el.scrollTop, left: el.scrollLeft });
    if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
    this.scrollEndTimer = setTimeout(() => this.bodyScrollEnd.emit({ top: el.scrollTop, left: el.scrollLeft }), 150);
  }

  // ===== header interactions (sort / resize / drag / filter button) =====
  onHeaderClick(col: ResolvedColumn<TRow>, ev: MouseEvent) {
    if (!col.sortable) return;
    const wantMulti = this.multiSortKey() === 'always' || ev.shiftKey || ev.ctrlKey || ev.metaKey;
    const model = this.sortModel().slice();
    const existing = model.findIndex((m) => m.colId === col.colId);
    const currentDir: SortDirection = existing >= 0 ? model[existing]!.sort : null;
    const nextDir = nextSortDirection(currentDir, col.colDef.sortingOrder);
    if (!wantMulti) {
      this.sortModel.set(nextDir ? [{ colId: col.colId, sort: nextDir }] : []);
    } else {
      if (existing >= 0) {
        if (nextDir == null) model.splice(existing, 1);
        else model[existing] = { colId: col.colId, sort: nextDir };
      } else if (nextDir) {
        model.push({ colId: col.colId, sort: nextDir });
      }
      this.sortModel.set(model);
    }
  }

  sortIndicator(col: ResolvedColumn<TRow>): { dir: SortDirection; index: number | null } {
    const model = this.sortModel();
    const i = model.findIndex((m) => m.colId === col.colId);
    if (i < 0) return { dir: null, index: null };
    return { dir: model[i]!.sort, index: model.length > 1 ? i + 1 : null };
  }

  onResizeStart(col: ResolvedColumn<TRow>, ev: PointerEvent) {
    if (!col.resizable) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.resizing.set({ colId: col.colId, startX: ev.clientX, startWidth: col.width });
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
  }
  onResizeMove(ev: PointerEvent) {
    const r = this.resizing();
    if (!r) return;
    const dx = ev.clientX - r.startX;
    const col = this.columnsWithState().find((c) => c.colId === r.colId);
    if (!col) return;
    const min = col.minWidth ?? 40;
    const max = col.maxWidth ?? Infinity;
    const next = Math.min(max, Math.max(min, r.startWidth + dx));
    const state = new Map(this.internalColumnState());
    state.set(r.colId, { ...(state.get(r.colId) ?? {}), width: next });
    this.internalColumnState.set(state);
  }
  onResizeEnd(ev: PointerEvent) {
    if (this.resizing()) {
      (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
      this.resizing.set(null);
    }
  }

  onHeaderDragStart(col: ResolvedColumn<TRow>, ev: DragEvent) {
    if (col.suppressMovable || col.colDef.lockPosition) { ev.preventDefault(); return; }
    ev.dataTransfer?.setData('text/plain', col.colId);
    ev.dataTransfer!.effectAllowed = 'move';
    this.draggingCol.set({ colId: col.colId, overColId: null });
  }
  onHeaderDragOver(col: ResolvedColumn<TRow>, ev: DragEvent) {
    const d = this.draggingCol();
    if (!d) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (d.overColId !== col.colId) this.draggingCol.set({ ...d, overColId: col.colId });
  }
  onHeaderDrop(target: ResolvedColumn<TRow>, ev: DragEvent) {
    ev.preventDefault();
    const d = this.draggingCol();
    this.draggingCol.set(null);
    if (!d || d.colId === target.colId) return;
    this.moveColumnInternal(d.colId, target.colId);
  }
  onHeaderDragEnd() { this.draggingCol.set(null); this.pinZoneHot.set(false); }

  /** True when a column header is being dragged over the left pin zone. */
  protected readonly pinZoneHot = signal(false);
  onPinZoneDragOver(ev: DragEvent) {
    if (!this.draggingCol()) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (!this.pinZoneHot()) this.pinZoneHot.set(true);
  }
  onPinZoneDragLeave() { this.pinZoneHot.set(false); }
  onPinZoneDrop(ev: DragEvent) {
    ev.preventDefault();
    const d = this.draggingCol();
    this.draggingCol.set(null);
    this.pinZoneHot.set(false);
    if (!d) return;
    const col = this.columnsWithState().find((c) => c.colId === d.colId);
    if (!col || col.colDef.lockPinned) return;
    if (col.pinned === 'left') return; // already pinned left
    this.api.setColumnPinned(d.colId, 'left');
  }
  private moveColumnInternal(sourceId: string, beforeTargetId: string | null) {
    const order = this.columnsWithState().map((c) => c.colId);
    const from = order.indexOf(sourceId);
    if (from < 0) return;
    order.splice(from, 1);
    if (beforeTargetId == null) order.push(sourceId);
    else {
      const to = order.indexOf(beforeTargetId);
      order.splice(to < 0 ? order.length : to, 0, sourceId);
    }
    this.internalColumnOrder.set(order);
  }

  // ===== column filter popup =====
  onFilterButtonClick(col: ResolvedColumn<TRow>, ev: MouseEvent) {
    ev.stopPropagation();
    const current = this.filterModel()[col.colId];
    const item = Array.isArray(current) ? current[0]! : (current ?? this.defaultFilterDraft(col));
    this.draftFilter.set({ ...item });
    // Anchor the popup just below the clicked filter button (or its header cell), relative to the grid host.
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const target = (ev.currentTarget ?? ev.target) as HTMLElement | null;
    const headerCell = target?.closest('.gg-header-cell') as HTMLElement | null;
    const btnRect = (target ?? headerCell)?.getBoundingClientRect();
    if (btnRect) {
      const popupWidth = 240;   // matches min-width in SCSS
      const left = Math.max(8, Math.min(hostRect.width - popupWidth - 8, btnRect.left - hostRect.left));
      const top = btnRect.bottom - hostRect.top + 4;
      this.filterPopupAnchor.set({ top, left });
    } else {
      this.filterPopupAnchor.set({ top: 80, left: hostRect.width - 240 - 20 });
    }
    this.openFilterColId.set(this.openFilterColId() === col.colId ? null : col.colId);
  }
  defaultFilterDraft(col: ResolvedColumn<TRow>): FilterModelItem {
    const type = resolveFilterType(col.colDef.filter);
    if (type === 'number') return { type: 'equals', filter: null };
    if (type === 'date') return { type: 'equals', filter: null };
    return { type: 'contains', filter: '' };
  }
  filterOpsFor(col: ResolvedColumn<TRow>): FilterOp[] {
    const t = resolveFilterType(col.colDef.filter);
    if (t === 'number') return NUMBER_OPS;
    if (t === 'date') return DATE_OPS;
    return TEXT_OPS;
  }
  filterOpLabel(op: FilterOp): string { return FILTER_OP_LABELS[op] ?? op; }

  applyDraftFilter(col: ResolvedColumn<TRow>) {
    const item = this.draftFilter();
    const m = { ...this.filterModel() };
    if (item.filter == null || item.filter === '') {
      if (item.type !== 'blank' && item.type !== 'notBlank') {
        delete m[col.colId];
      } else { m[col.colId] = item; }
    } else { m[col.colId] = item; }
    this.filterModel.set(m);
    this.openFilterColId.set(null);
    this.currentPage.set(0);
  }
  clearFilter(col: ResolvedColumn<TRow>) {
    const m = { ...this.filterModel() };
    delete m[col.colId];
    this.filterModel.set(m);
    this.openFilterColId.set(null);
    this.currentPage.set(0);
  }
  /** Optional Angular component declared in `colDef.floatingFilterComponent`. */
  floatingFilterComponentType(col: ResolvedColumn<TRow>): Type<unknown> | null {
    const c = col.colDef.floatingFilterComponent;
    return (c && typeof c === 'function') ? (c as Type<unknown>) : null;
  }

  /** Inputs object passed to the floating-filter ngComponentOutlet. */
  floatingFilterComponentInputs(col: ResolvedColumn<TRow>): Record<string, unknown> {
    const params = {
      value: this.floatingFilterValue(col),
      colDef: col.colDef,
      onValueChange: (v: string | number | null) => {
        const s = v == null ? '' : String(v);
        this.onFloatingFilterInput(col, s);
      },
    };
    return { params };
  }

  floatingFilterValue(col: ResolvedColumn<TRow>): string {
    const v = this.filterModel()[col.colId];
    if (!v) return '';
    const item = Array.isArray(v) ? v[0]! : v;
    return item?.filter == null ? '' : String(item.filter);
  }
  onFloatingFilterInput(col: ResolvedColumn<TRow>, value: string) {
    const m = { ...this.filterModel() };
    const ft = resolveFilterType(col.colDef.filter);
    const t = ft === 'number' || ft === 'date' ? 'equals' : 'contains';
    if (value.trim() === '') delete m[col.colId];
    else m[col.colId] = { type: t, filter: ft === 'number' ? +value : value };
    this.filterModel.set(m);
    this.currentPage.set(0);
  }
  isFilterActive(col: ResolvedColumn<TRow>): boolean {
    return !!this.filterModel()[col.colId];
  }

  // ===== selection =====
  toggleRowSelection(node: RowNode<TRow>, ev: MouseEvent | KeyboardEvent) {
    const mode = this.rowSelection();
    if (!mode) return;
    const ids = new Set(this.selectedIds());
    const isMulti = mode === 'multiple' && (ev.ctrlKey || ev.metaKey || ev.shiftKey || (ev as KeyboardEvent).key === ' ');
    if (ids.has(node.id)) {
      if (!this.suppressRowDeselection()) ids.delete(node.id);
    } else {
      if (!isMulti) ids.clear();
      ids.add(node.id);
    }
    this.selectedIds.set(ids);
  }
  toggleHeaderCheckbox() {
    if (this.allSelected()) this.selectedIds.set(new Set());
    else this.selectedIds.set(new Set(this.filteredNodes().map((n) => n.id)));
  }
  toggleRowCheckbox(node: RowNode<TRow>, ev: Event) {
    ev.stopPropagation();
    const ids = new Set(this.selectedIds());
    if (ids.has(node.id)) ids.delete(node.id);
    else ids.add(node.id);
    if (this.rowSelection() === 'single' && ids.size > 1) { ids.clear(); ids.add(node.id); }
    this.selectedIds.set(ids);
  }

  // ===== events / dispatch =====
  onRowClick(node: RowNode<TRow>, ev: MouseEvent) {
    this.rowClicked.emit({ data: node.data, node, event: ev });
    if (this.rowSelection() && !this.suppressRowClickSelection()) this.toggleRowSelection(node, ev);
  }
  onRowDblClick(node: RowNode<TRow>, ev: MouseEvent) {
    this.rowDoubleClicked.emit({ data: node.data, node, event: ev });
  }
  onCellClick(node: RowNode<TRow>, col: ResolvedColumn<TRow>, rowIndex: number, colIndex: number, ev: MouseEvent) {
    const value = getCellValue(col.colDef, node);
    this.cellClicked.emit({ data: node.data, node, colDef: col.colDef, value, event: ev });
    if (this.enableRangeSelection()) this.startRangeFromCell(rowIndex, colIndex, ev);
    if (this.singleClickEdit() && !this.suppressClickEdit()) this.tryStartEdit(node, col, rowIndex);
  }
  onCellDblClick(node: RowNode<TRow>, col: ResolvedColumn<TRow>, rowIndex: number, ev: MouseEvent) {
    const value = getCellValue(col.colDef, node);
    this.cellDoubleClicked.emit({ data: node.data, node, colDef: col.colDef, value, event: ev });
    if (!this.singleClickEdit() && !this.suppressClickEdit()) this.tryStartEdit(node, col, rowIndex);
  }
  onCellContextMenu(node: RowNode<TRow>, col: ResolvedColumn<TRow>, rowIndex: number, ev: MouseEvent) {
    const value = getCellValue(col.colDef, node);
    this.cellContextMenu.emit({ data: node.data, node, colDef: col.colDef, value, event: ev });
    if (!this.suppressContextMenu()) {
      ev.preventDefault();
      // Coordinates are host-relative (host has `contain: layout` so absolute positioning anchors here).
      const hostRect = this.el.nativeElement.getBoundingClientRect();
      const x = Math.max(8, Math.min(hostRect.width - 220 - 8, ev.clientX - hostRect.left));
      const y = Math.max(8, Math.min(hostRect.height - 320 - 8, ev.clientY - hostRect.top));
      this.contextMenu.set({ x, y, rowIndex, colId: col.colId, source: 'cell' });
    }
  }
  /** Right-click on a column header → open a column menu (sort / pin / autosize / hide). */
  onHeaderContextMenu(col: ResolvedColumn<TRow>, ev: MouseEvent) {
    if (this.suppressContextMenu()) return;
    ev.preventDefault();
    ev.stopPropagation();
    // Anchor relative to the GRID HOST (not the viewport) because the host uses `contain: layout`
    // which makes it the containing block for absolutely-positioned descendants.
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const headerEl = (ev.currentTarget ?? ev.target) as HTMLElement | null;
    const r = headerEl?.closest('.gg-header-cell')?.getBoundingClientRect();
    const menuW = 220, menuH = 320;
    let x: number, y: number;
    if (r) {
      x = Math.max(8, Math.min(hostRect.width - menuW - 8, r.left - hostRect.left));
      y = Math.max(8, Math.min(hostRect.height - menuH - 8, r.bottom - hostRect.top + 4));
    } else {
      x = ev.clientX - hostRect.left;
      y = ev.clientY - hostRect.top;
    }
    this.contextMenu.set({ x, y, rowIndex: null, colId: col.colId, source: 'header' });
  }
  onCellMouseEnter(node: RowNode<TRow>, col: ResolvedColumn<TRow>, ev: MouseEvent) {
    const value = getCellValue(col.colDef, node);
    this.cellMouseEnter.emit({ data: node.data, node, colDef: col.colDef, value, event: ev });
  }
  onCellMouseLeave(node: RowNode<TRow>, col: ResolvedColumn<TRow>, ev: MouseEvent) {
    const value = getCellValue(col.colDef, node);
    this.cellMouseLeave.emit({ data: node.data, node, colDef: col.colDef, value, event: ev });
  }

  // ===== keyboard nav =====
  @HostListener('keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    const target = ev.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
    if (this.editingCell()) return;

    const totalRows = this.pagedRows().length;
    const cols = this.renderColumns().length;
    if (!totalRows || !cols) return;

    // global shortcuts
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'c') { this.copySelectionToClipboard(); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') { this.api.selectAll(); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { this.api.undoCellEditing(); ev.preventDefault(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) { this.api.redoCellEditing(); ev.preventDefault(); return; }
    if (ev.key === 'F2') {
      const f = this.focusedCell();
      if (f) {
        const col = this.renderColumns()[f.col];
        const row = this.pagedRows()[f.row];
        if (col && row?.kind === 'leaf' && row.node) this.tryStartEdit(row.node, col, f.row);
      }
      ev.preventDefault();
      return;
    }

    const f = this.focusedCell() ?? { row: 0, col: 0 };
    let { row, col } = f;
    switch (ev.key) {
      case 'ArrowDown': row = Math.min(totalRows - 1, row + 1); break;
      case 'ArrowUp': row = Math.max(0, row - 1); break;
      case 'ArrowRight': col = Math.min(cols - 1, col + 1); break;
      case 'ArrowLeft': col = Math.max(0, col - 1); break;
      case 'Tab': col = ev.shiftKey ? Math.max(0, col - 1) : Math.min(cols - 1, col + 1); break;
      case 'Home': col = ev.ctrlKey ? (row = 0, 0) : 0; break;
      case 'End': if (ev.ctrlKey) row = totalRows - 1; col = cols - 1; break;
      case 'PageDown': row = Math.min(totalRows - 1, row + Math.floor(this.viewportHeight() / this.rowHeight())); break;
      case 'PageUp': row = Math.max(0, row - Math.floor(this.viewportHeight() / this.rowHeight())); break;
      case ' ':
        if (this.rowSelection()) {
          const fr = this.pagedRows()[row];
          if (fr?.kind === 'leaf' && fr.node) this.toggleRowSelection(fr.node, ev);
          ev.preventDefault();
        }
        return;
      case 'Enter':
        if (this.rowSelection() && !this.suppressRowClickSelection()) {
          const fr = this.pagedRows()[row];
          if (fr?.kind === 'leaf' && fr.node) this.toggleRowSelection(fr.node, ev);
        }
        return;
      default:
        // dispatch cellKeyDown for the focused cell
        {
          const fr = this.pagedRows()[row];
          const c = this.renderColumns()[col];
          if (fr?.kind === 'leaf' && fr.node && c) {
            this.cellKeyDown.emit({ data: fr.node.data, node: fr.node, colDef: c.colDef, value: getCellValue(c.colDef, fr.node), event: ev });
          }
        }
        return;
    }
    ev.preventDefault();
    this.focusedCell.set({ row, col });
    const c = this.renderColumns()[col];
    if (c) this.cellFocused.emit({ rowIndex: row, colId: c.colId, api: this.api });
    this.scrollRowIntoView(row);
  }

  private scrollRowIntoView(rowIndex: number) {
    const vp = this.viewportRef?.nativeElement;
    if (!vp) return;
    const top = this.rowOffsets().tops[rowIndex] ?? rowIndex * this.rowHeight();
    const rh = this.rowHeight();
    if (top < vp.scrollTop) vp.scrollTop = top;
    else if (top + rh > vp.scrollTop + vp.clientHeight) vp.scrollTop = top + rh - vp.clientHeight;
  }

  isCellFocused(rowIndex: number, colIndex: number): boolean {
    const f = this.focusedCell();
    return !!f && f.row === rowIndex && f.col === colIndex;
  }

  // ===== editing =====
  private tryStartEdit(node: RowNode<TRow>, col: ResolvedColumn<TRow>, rowIndex: number) {
    if (!this.isEditable(node, col)) return;
    const oldValue = getCellValue(col.colDef, node);
    this.editingCell.set({ rowIndex, colId: col.colId, oldValue, popup: !!col.colDef.cellEditorPopup });
    this.cellEditingStarted.emit({ data: node.data, node, colDef: col.colDef, oldValue });
  }
  private isEditable(node: RowNode<TRow>, col: ResolvedColumn<TRow>): boolean {
    const e = col.colDef.editable;
    if (typeof e === 'function') return e({ data: node.data, node, colDef: col.colDef });
    return !!e;
  }
  /** Read `colDef.filter` (incl. ag-grid alias names) and produce the internal short type. */
  filterTypeFor(col: ResolvedColumn<TRow>): 'text' | 'number' | 'date' | 'set' | null {
    return resolveFilterType(col.colDef.filter);
  }
  editorTypeFor(col: ResolvedColumn<TRow>): 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'largeText' | 'custom' {
    const e = col.colDef.cellEditor;
    if (typeof e === 'string') return e;
    if (typeof e === 'function') return 'custom';
    const ft = resolveFilterType(col.colDef.filter);
    if (ft === 'number') return 'number';
    if (ft === 'date') return 'date';
    return 'text';
  }
  selectOptions(col: ResolvedColumn<TRow>): unknown[] {
    const p = col.colDef.cellEditorParams as { values?: unknown[] } | undefined;
    return p?.values ?? [];
  }
  editorInitialValue(): string {
    const e = this.editingCell();
    if (!e) return '';
    const v = e.oldValue;
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  }
  commitEdit(rawValue: string) {
    const e = this.editingCell();
    if (!e) return;
    const col = this.columnsWithState().find((c) => c.colId === e.colId);
    const node = this.pagedRows()[e.rowIndex];
    if (!col || node?.kind !== 'leaf' || !node.node) { this.cancelEdit(); return; }
    let parsed: unknown = rawValue;
    if (col.colDef.valueParser) {
      parsed = col.colDef.valueParser({ newValue: rawValue, oldValue: e.oldValue as never, data: node.node.data, colDef: col.colDef });
    } else if (this.editorTypeFor(col) === 'number') {
      const n = parseFloat(rawValue);
      parsed = isNaN(n) ? null : n;
    } else if (this.editorTypeFor(col) === 'date') {
      const d = new Date(rawValue);
      parsed = isNaN(d.getTime()) ? null : d;
    } else if (this.editorTypeFor(col) === 'checkbox') {
      parsed = rawValue === 'true';
    }
    const changed = parsed !== e.oldValue;
    if (changed) {
      const map = new Map(this.editedValues());
      const rowMap = new Map(map.get(node.node.id) ?? new Map());
      rowMap.set(e.colId, parsed);
      map.set(node.node.id, rowMap);
      this.editedValues.set(map);
      this.undoStack.push({ rowId: node.node.id, colId: e.colId, oldValue: e.oldValue, newValue: parsed });
      this.redoStack.length = 0;
      if (this.enableCellChangeFlash()) this.flashCell(node.node.id, e.colId);
      this.cellValueChanged.emit({ data: node.node.data, node: node.node, colDef: col.colDef, oldValue: e.oldValue as never, newValue: parsed as never });
    }
    this.editingCell.set(null);
    this.cellEditingStopped.emit({
      data: node.node.data, node: node.node, colDef: col.colDef,
      oldValue: e.oldValue as never, newValue: parsed as never, valueChanged: changed,
    });
    queueMicrotask(() => this.viewportRef?.nativeElement.focus());
  }
  cancelEdit() {
    const e = this.editingCell();
    if (!e) return;
    const col = this.columnsWithState().find((c) => c.colId === e.colId);
    const node = this.pagedRows()[e.rowIndex];
    this.editingCell.set(null);
    if (col && node?.kind === 'leaf' && node.node) {
      this.cellEditingStopped.emit({
        data: node.node.data, node: node.node, colDef: col.colDef,
        oldValue: e.oldValue as never, newValue: e.oldValue as never, valueChanged: false,
      });
    }
  }
  private flashCell(rowId: string, colId: string) {
    const set = new Set(this.flashCells());
    const key = `${rowId}:${colId}`;
    set.add(key);
    this.flashCells.set(set);
    setTimeout(() => {
      const s = new Set(this.flashCells());
      s.delete(key);
      this.flashCells.set(s);
    }, 700);
  }
  onEditorKeyDown(ev: KeyboardEvent, value: string) {
    if (ev.key === 'Enter') { this.commitEdit(value); ev.preventDefault(); }
    else if (ev.key === 'Escape') { this.cancelEdit(); ev.preventDefault(); }
    else if (ev.key === 'Tab') {
      this.commitEdit(value);
      ev.preventDefault();
      const f = this.focusedCell();
      if (f) {
        const dir = ev.shiftKey ? -1 : 1;
        const next = Math.max(0, Math.min(this.renderColumns().length - 1, f.col + dir));
        this.focusedCell.set({ row: f.row, col: next });
      }
    }
  }
  onEditorBlur(value: string) {
    if (this.stopEditingWhenCellsLoseFocus()) this.commitEdit(value);
  }

  // ===== context menu =====
  closeContextMenu() { this.contextMenu.set(null); }
  defaultContextMenuItems(): ContextMenuItem<TRow>[] {
    const t = this.t();
    return [
      { name: t('copy'), action: () => this.copySelectionToClipboard(false) },
      { name: t('copyWithHeaders'), action: () => this.copySelectionToClipboard(true) },
      { separator: true, name: '' },
      { name: t('csvExport'), action: () => this.api.exportDataAsCsv() },
      { separator: true, name: '' },
      { name: t('expandAll'), action: () => this.api.expandAll() },
      { name: t('collapseAll'), action: () => this.api.collapseAll() },
    ];
  }
  computedContextMenuItems(): ContextMenuItem<TRow>[] {
    const cm = this.contextMenu();
    if (!cm) return [];
    if (cm.source === 'header' && cm.colId) {
      return this.headerContextMenuItems(cm.colId);
    }
    const userFn = this.getContextMenuItems();
    if (userFn) {
      const row = cm.rowIndex != null ? this.pagedRows()[cm.rowIndex] : null;
      const node = row?.kind === 'leaf' ? row.node ?? null : null;
      const colDef = cm.colId ? this.colDefById().get(cm.colId) ?? null : null;
      return userFn({ data: node?.data ?? null, node, colDef });
    }
    return this.defaultContextMenuItems();
  }

  /** Build the header right-click menu for one column. */
  private headerContextMenuItems(colId: string): ContextMenuItem<TRow>[] {
    const col = this.columnsWithState().find((c) => c.colId === colId);
    if (!col) return [];
    const lockPin = !!col.colDef.lockPinned;
    const lockVis = !!col.colDef.lockVisible;
    const isLeft = col.pinned === 'left';
    const cur = this.sortModel().find((s) => s.colId === colId);
    return [
      { name: cur?.sort === 'asc' ? '✓ Sort ascending' : 'Sort ascending',
        disabled: !col.sortable,
        action: () => this.api.setSortModel([{ colId, sort: 'asc' }]) },
      { name: cur?.sort === 'desc' ? '✓ Sort descending' : 'Sort descending',
        disabled: !col.sortable,
        action: () => this.api.setSortModel([{ colId, sort: 'desc' }]) },
      { name: 'Clear sort',
        disabled: !cur,
        action: () => this.api.setSortModel(this.sortModel().filter((s) => s.colId !== colId)) },
      { separator: true, name: '' },
      { name: isLeft ? '✓ Pin left' : 'Pin left',
        disabled: lockPin || isLeft,
        action: () => this.api.setColumnPinned(colId, 'left') },
      { name: 'Unpin',
        disabled: lockPin || !isLeft,
        action: () => this.api.setColumnPinned(colId, null) },
      { separator: true, name: '' },
      { name: 'Auto-size this column',
        action: () => this.api.autoSizeColumn(colId) },
      { name: 'Auto-size all columns',
        action: () => this.api.autoSizeAllColumns() },
      { name: 'Size columns to fit',
        action: () => this.api.sizeColumnsToFit() },
      { separator: true, name: '' },
      { name: 'Hide column',
        disabled: lockVis,
        action: () => this.api.setColumnVisible(colId, false) },
    ];
  }
  invokeContextMenu(item: ContextMenuItem<TRow>) {
    const cm = this.contextMenu();
    if (item.separator) return;
    if (item.action) {
      const row = cm?.rowIndex != null ? this.pagedRows()[cm.rowIndex] : null;
      const node = row?.kind === 'leaf' ? row.node ?? null : null;
      const colDef = cm?.colId ? this.colDefById().get(cm.colId) ?? null : null;
      item.action({ data: node?.data ?? null, node, colDef, api: this.api });
    }
    this.closeContextMenu();
  }

  // ===== group / tree toggle =====
  toggleGroup(g: GroupRow<TRow>) {
    const s = new Set(this.toggledGroupIds());
    if (s.has(g.id)) s.delete(g.id); else s.add(g.id);
    this.toggledGroupIds.set(s);
    this.rowGroupOpened.emit({ groupId: g.id, expanded: !s.has(g.id) ? (this.groupDefaultExpanded() > 0) : !(this.groupDefaultExpanded() > 0) });
  }
  toggleTreeNode(id: string) {
    const s = new Set(this.toggledTreeIds());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.toggledTreeIds.set(s);
  }
  toggleDetail(rowId: string) {
    const s = new Set(this.expandedDetailIds());
    if (s.has(rowId)) s.delete(rowId); else s.add(rowId);
    this.expandedDetailIds.set(s);
  }

  // ===== range selection =====
  private startRangeFromCell(rowIndex: number, colIndex: number, ev: MouseEvent) {
    if (ev.button !== 0) return;
    if (!this.enableRangeSelection()) return;
    if (ev.shiftKey) {
      const anchor = this.rangeAnchor();
      if (anchor) {
        this.ranges.set([{
          startRow: Math.min(anchor.row, rowIndex), endRow: Math.max(anchor.row, rowIndex),
          startCol: Math.min(anchor.col, colIndex), endCol: Math.max(anchor.col, colIndex),
        }]);
        return;
      }
    }
    this.rangeAnchor.set({ row: rowIndex, col: colIndex });
    this.ranges.set([{ startRow: rowIndex, endRow: rowIndex, startCol: colIndex, endCol: colIndex }]);
    this.rangeDragging.set(true);
  }
  onCellMouseDown(rowIndex: number, colIndex: number, ev: MouseEvent) {
    if (!this.enableRangeSelection() || ev.button !== 0) return;
    this.startRangeFromCell(rowIndex, colIndex, ev);
  }
  onCellMouseEnterRange(rowIndex: number, colIndex: number) {
    if (!this.rangeDragging()) return;
    const anchor = this.rangeAnchor();
    if (!anchor) return;
    this.ranges.set([{
      startRow: Math.min(anchor.row, rowIndex), endRow: Math.max(anchor.row, rowIndex),
      startCol: Math.min(anchor.col, colIndex), endCol: Math.max(anchor.col, colIndex),
    }]);
  }
  @HostListener('document:mouseup') onDocMouseUp() {
    this.rangeDragging.set(false);
    if (this.fillState()) this.commitFill();
  }
  isCellInRange(rowIndex: number, colIndex: number): boolean {
    for (const r of this.ranges()) {
      if (rowIndex >= r.startRow && rowIndex <= r.endRow && colIndex >= r.startCol && colIndex <= r.endCol) return true;
    }
    return false;
  }
  /** True if the cell is at the bottom-right corner of the active range (where the fill handle sits). */
  isFillHandle(rowIndex: number, colIndex: number): boolean {
    if (!this.enableFillHandle()) return false;
    const ranges = this.ranges();
    if (!ranges.length) return false;
    const r = ranges[0]!;
    return rowIndex === r.endRow && colIndex === r.endCol;
  }
  /** Active fill-drag state: the source range + the preview destination range. */
  protected readonly fillState = signal<{ from: CellRange; preview: CellRange } | null>(null);
  /** True if the cell is currently in the fill preview area. */
  isFillPreview(rowIndex: number, colIndex: number): boolean {
    const f = this.fillState();
    if (!f) return false;
    const p = f.preview;
    return rowIndex >= p.startRow && rowIndex <= p.endRow && colIndex >= p.startCol && colIndex <= p.endCol;
  }
  onFillHandleDown(ev: PointerEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    const range = this.ranges()[0];
    if (!range) return;
    this.fillState.set({ from: range, preview: range });
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }
  onCellPointerEnterFill(rowIndex: number, colIndex: number) {
    const f = this.fillState();
    if (!f) return;
    const preview: CellRange = {
      startRow: f.from.startRow,
      endRow: Math.max(f.from.endRow, rowIndex),
      startCol: f.from.startCol,
      endCol: Math.max(f.from.endCol, colIndex),
    };
    this.fillState.set({ ...f, preview });
  }
  private commitFill() {
    const f = this.fillState();
    this.fillState.set(null);
    if (!f) return;
    if (f.preview.endRow <= f.from.endRow && f.preview.endCol <= f.from.endCol) return;
    const cols = this.renderColumns();
    const rows = this.pagedRows();
    const srcRowSlice = rows.slice(f.from.startRow, f.from.endRow + 1).filter((r) => r.kind === 'leaf' && r.node);
    if (!srcRowSlice.length) return;
    for (let r = f.from.endRow + 1; r <= f.preview.endRow; r++) {
      const target = rows[r];
      if (!target || target.kind !== 'leaf' || !target.node) continue;
      const src = srcRowSlice[(r - f.from.endRow - 1) % srcRowSlice.length];
      if (!src?.node) continue;
      for (let c = f.from.startCol; c <= f.from.endCol; c++) {
        const col = cols[c];
        if (!col || !col.colDef.field) continue;
        const newValue = getCellValue(col.colDef, src.node);
        const oldValue = getCellValue(col.colDef, target.node);
        const map = new Map(this.editedValues());
        const rowMap = new Map(map.get(target.node.id) ?? new Map());
        rowMap.set(col.colId, newValue);
        map.set(target.node.id, rowMap);
        this.editedValues.set(map);
        this.cellValueChanged.emit({ data: target.node.data, node: target.node, colDef: col.colDef, oldValue: oldValue as never, newValue: newValue as never });
      }
    }
    // expand the range to include filled area
    this.ranges.set([f.preview]);
  }

  // ===== clipboard =====
  async copySelectionToClipboard(withHeaders = false) {
    const ranges = this.ranges();
    const cols = this.renderColumns();
    if (ranges.length) {
      // copy the first range as TSV
      const r = ranges[0]!;
      const rows = this.pagedRows().slice(r.startRow, r.endRow + 1)
        .filter((x) => x.kind === 'leaf')
        .map((x) => x.node!);
      const slicedCols = cols.slice(r.startCol, r.endCol + 1).map((c) => c.colDef);
      const tsv = rowsToTsv(slicedCols, rows, withHeaders);
      await writeClipboard(tsv);
      return;
    }
    // fall back to selected rows
    const selected = this.api.getSelectedNodes();
    if (!selected.length) return;
    const tsv = rowsToTsv(cols.map((c) => c.colDef), selected, withHeaders);
    await writeClipboard(tsv);
  }

  // ===== row drag =====
  protected readonly rowDragMultiIds = signal<Set<string>>(new Set());
  /** Optional callback to provide drag-image text (e.g. "3 rows"). */
  readonly rowDragText = input<((nodes: RowNode<TRow>[]) => string) | null>(null);

  onRowDragStart(node: RowNode<TRow>, ev: DragEvent) {
    if (this.suppressRowDrag()) { ev.preventDefault(); return; }
    // multi-row: if dragged row is part of the selection, drag the entire selection
    const ids = this.selectedIds();
    const multi = ids.has(node.id) && ids.size > 1 ? new Set(ids) : new Set([node.id]);
    this.rowDragMultiIds.set(multi);
    const dragNodes = this.nodes().filter((n) => multi.has(n.id));
    const text = this.rowDragText() ? this.rowDragText()!(dragNodes) : (multi.size > 1 ? `${multi.size} rows` : node.id);
    ev.dataTransfer?.setData('text/plain', text);
    ev.dataTransfer!.effectAllowed = 'move';
    this.rowDragSource.set({ rowId: node.id, overIndex: null });
  }
  onRowDragOver(targetIndex: number, ev: DragEvent) {
    if (!this.rowDragSource()) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    const s = this.rowDragSource()!;
    if (s.overIndex !== targetIndex) this.rowDragSource.set({ ...s, overIndex: targetIndex });
  }
  onRowDrop(targetIndex: number, ev: DragEvent) {
    ev.preventDefault();
    const s = this.rowDragSource();
    this.rowDragSource.set(null);
    if (!s) return;
    if (this.rowDragManaged()) this.applyManagedRowDrop(s.rowId, targetIndex);
    // emit event regardless
    const targetRow = this.pagedRows()[targetIndex];
    if (targetRow?.kind === 'leaf' && targetRow.node) {
      const sourceNode = this.nodes().find((n) => n.id === s.rowId);
      if (sourceNode) this.rowDragEnd.emit({ node: sourceNode, overIndex: targetIndex, event: ev });
    }
  }
  private applyManagedRowDrop(sourceId: string, targetIndex: number) {
    const order = this.orderedNodes().map((n) => n.id);
    const multi = this.rowDragMultiIds();
    const ids = multi.size > 1 ? Array.from(multi) : [sourceId];
    // remove all dragged ids
    for (const id of ids) {
      const i = order.indexOf(id);
      if (i >= 0) order.splice(i, 1);
    }
    const targetRow = this.pagedRows()[targetIndex];
    let toId: string | null = null;
    if (targetRow?.kind === 'leaf' && targetRow.node) toId = targetRow.node.id;
    const toIndex = toId ? order.indexOf(toId) : order.length;
    order.splice(toIndex < 0 ? order.length : toIndex, 0, ...ids);
    this.rowOrder.set(order);
    this.rowDragMultiIds.set(new Set());
  }

  // ===== pagination handlers =====
  paginationNext() { this.api.paginationGoToNextPage(); }
  paginationPrev() { this.api.paginationGoToPreviousPage(); }
  paginationFirst() { this.api.paginationGoToFirstPage(); }
  paginationLast() { this.api.paginationGoToLastPage(); }
  onPageSizeChange(size: number) { this.userPageSize.set(size); this.currentPage.set(0); }
  onQuickFilterInput(value: string) { this.internalQuickFilter.set(value); this.currentPage.set(0); }

  // ===== cell text / rendering =====
  cellText(col: ResolvedColumn<TRow>, node: RowNode<TRow>): string {
    if (col.colId === '_autoGroup') return ''; // auto-group renders via template
    const v = getCellValue(col.colDef, node);
    return formatCellValue(col.colDef, node, v);
  }
  cellRendererHtml(col: ResolvedColumn<TRow>, node: RowNode<TRow>): SafeHtml | null {
    const value = getCellValue(col.colDef, node);
    const formattedValue = formatCellValue(col.colDef, node, value);
    // dynamic selector wins over static renderer
    const params = { value, formattedValue, data: node.data, node, colDef: col.colDef };
    const sel = col.colDef.cellRendererSelector?.(params);
    const r = sel?.component ?? col.colDef.cellRenderer;
    if (!r) return null;
    let html: string | null = null;
    if (typeof r === 'string') {
      // built-in renderer names
      html = this.builtInRenderer(r, value, formattedValue, node);
    } else {
      const out = r(params);
      if (typeof out === 'string') html = out;
      else if (out && typeof (out as Node).nodeType === 'number') {
        // Renderer returned an HTMLElement / DOM Node (ag-grid pattern, e.g. via Renderer2).
        // Serialise to HTML and pass through DomSanitizer.
        const tmp = document.createElement('div');
        tmp.appendChild(out as Node);
        html = tmp.innerHTML;
      }
    }
    if (html == null) return null;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Built-in renderer names: agAnimateShowChange, agAnimateSlide, agGroup, agCheckbox. */
  private builtInRenderer(name: string, value: unknown, formatted: string, node: RowNode<TRow>): string {
    switch (name) {
      case 'agAnimateShowChange': {
        const prev = this.prevValues.get(node.id);
        const arrow = prev != null && typeof prev === 'number' && typeof value === 'number'
          ? value > prev ? '<span class="gg-up">▲</span> ' : value < prev ? '<span class="gg-down">▼</span> ' : ''
          : '';
        this.prevValues.set(node.id, value);
        return `${arrow}<span class="gg-anim-show-change">${escapeHtml(formatted)}</span>`;
      }
      case 'agAnimateSlide': {
        return `<span class="gg-anim-slide">${escapeHtml(formatted)}</span>`;
      }
      case 'agGroup': {
        return `<span class="gg-group-built-in">${escapeHtml(formatted)}</span>`;
      }
      case 'agCheckbox': {
        const checked = !!value;
        return `<input type="checkbox" class="gg-cell-checkbox" ${checked ? 'checked' : ''} disabled />`;
      }
      default: return escapeHtml(name); // treat as literal
    }
  }
  private readonly prevValues = new Map<string, unknown>();
  groupCellText(col: ResolvedColumn<TRow>, group: GroupRow<TRow>): string {
    if (col.colId === '_autoGroup') {
      return `${String(group.groupKey ?? '(blank)')} (${group.count})`;
    }
    const agg = group.aggregates[col.colId];
    if (agg == null) return '';
    return formatCellValue(col.colDef, { id: group.id, data: {} as TRow, rowIndex: -1, selected: false }, agg);
  }
  cellClasses(col: ResolvedColumn<TRow>, node: RowNode<TRow>): Record<string, boolean> {
    const out: Record<string, boolean> = { 'gg-cell': true };
    out[`gg-col-pinned-${col.pinned ?? 'none'}`] = true;
    // mark the cell at the pinned-edge so the green divider renders on body cells too
    const renderCol = col as ResolvedColumn<TRow> & { isLeftPinnedEdge?: boolean; isRightPinnedEdge?: boolean };
    if (renderCol.isLeftPinnedEdge) out['gg-pinned-edge-left'] = true;
    if (renderCol.isRightPinnedEdge) out['gg-pinned-edge-right'] = true;
    if (col.colDef.wrapText) out['gg-wrap-text'] = true;
    if (col.colDef.autoHeight) out['gg-auto-height'] = true;
    const cls = col.colDef.cellClass;
    if (cls) {
      const value = getCellValue(col.colDef, node);
      const resolved = typeof cls === 'function' ? cls({ value, data: node.data, node, colDef: col.colDef }) : cls;
      const arr = Array.isArray(resolved) ? resolved : [resolved];
      for (const c of arr) if (c) out[c] = true;
    }
    const rules = col.colDef.cellClassRules;
    if (rules) {
      const value = getCellValue(col.colDef, node);
      for (const [className, fn] of Object.entries(rules)) {
        if (fn({ value, data: node.data, node, colDef: col.colDef })) out[className] = true;
      }
    }
    if (this.flashCells().has(`${node.id}:${col.colId}`)) out['gg-flash'] = true;
    if (this.findIndex() >= 0) {
      const m = this.findMatches()[this.findIndex()];
      const colIndex = this.renderColumns().findIndex((c) => c.colId === col.colId);
      if (m && this.pagedRows()[m.rowIndex]?.kind === 'leaf' && this.pagedRows()[m.rowIndex]?.node?.id === node.id && m.colIndex === colIndex) {
        out[FIND_HIGHLIGHT_CLASS] = true;
      }
    }
    return out;
  }
  cellStyles(col: ResolvedColumn<TRow>, node: RowNode<TRow>): Record<string, string> {
    // Prefer the post-autoSize / post-resize width (RenderColumn.computedWidth) when present,
    // so leaf cells stay aligned with header cells.
    const renderCol = col as ResolvedColumn<TRow> & { computedWidth?: number };
    const w = renderCol.computedWidth ?? col.width;
    const style: Record<string, string> = { width: `${w}px`, 'min-width': `${w}px` };
    const cs = col.colDef.cellStyle;
    if (cs) {
      const value = getCellValue(col.colDef, node);
      const resolved = typeof cs === 'function' ? cs({ value, data: node.data, node, colDef: col.colDef }) : cs;
      Object.assign(style, resolved);
    }
    return style;
  }
  detailHtml(row: FlattenedRow<TRow>): SafeHtml | null {
    if (row.kind !== 'detail' || !row.node) return null;
    const r = this.detailCellRenderer();
    const html = !r ? `<pre>${JSON.stringify(row.node.data, null, 2)}</pre>`
      : (typeof r(row.node.data) === 'string' ? r(row.node.data) as string : null);
    if (html == null) return null;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  trackByCol = (_: number, c: ResolvedColumn<TRow>) => c.colId;
  trackByRow = (_: number, r: { row: FlattenedRow<TRow> }) => r.row.id;
  trackByCtx = (_: number, item: ContextMenuItem<TRow>) => item.name + (item.separator ? '|sep' : '');

  /** Resolve the component type passed via colDef.cellComponent. */
  cellComponentType(col: ResolvedColumn<TRow>): Type<unknown> | null {
    const c = col.colDef.cellComponent;
    return (c as Type<unknown> | undefined) ?? null;
  }

  /** Build the inputs object for ngComponentOutlet — always includes a `params` input. */
  cellComponentInputs(col: ResolvedColumn<TRow>, node: RowNode<TRow>): Record<string, unknown> {
    const value = getCellValue(col.colDef, node);
    const formattedValue = formatCellValue(col.colDef, node, value);
    const params: CellRendererParams<TRow> = {
      value: value as never,
      formattedValue,
      data: node.data,
      node,
      colDef: col.colDef as never,
    };
    const extra = col.colDef.cellComponentInputs ?? {};
    return { params, ...extra };
  }

  /** Compute the visible width of a column-group cell by summing widths of its rendered children. */
  groupSpanWidth(g: ResolvedColumnGroup<TRow>): number {
    const renderCols = this.renderColumns();
    let total = 0;
    for (const id of g.childColIds) {
      const c = renderCols.find((rc) => rc.colId === id);
      if (c) total += c.computedWidth;
    }
    return total || 100;
  }

  /** Renders headerComponent (function returning HTML string) as sanitized SafeHtml. */
  headerHtml(col: ResolvedColumn<TRow>): SafeHtml {
    const fn = col.colDef.headerComponent;
    if (!fn) return this.sanitizer.bypassSecurityTrustHtml('');
    const html = fn({ colDef: col.colDef, api: this.api });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Custom tooltip HTML (via tooltipComponent), used when set; else falls back to title attr. */
  tooltipHtml(col: ResolvedColumn<TRow>, node: RowNode<TRow>): SafeHtml | null {
    const fn = col.colDef.tooltipComponent;
    if (!fn) return null;
    const value = getCellValue(col.colDef, node);
    const html = fn({ value, data: node.data, colDef: col.colDef });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ===== status bar =====
  protected readonly statusAgg = computed(() => {
    const sb = this.statusBar();
    if (!sb || !sb.aggField) return null;
    const col = this.columnsWithState().find((c) => c.colId === sb.aggField || c.field === sb.aggField);
    if (!col) return null;
    const nodes = this.api.getSelectedNodes().length ? this.api.getSelectedNodes() : this.filteredNodes();
    const values = nodes.map((n) => getCellValue(col.colDef, n));
    const out: Record<string, unknown> = {};
    for (const p of sb.panels) {
      if (p === 'sum' || p === 'avg' || p === 'min' || p === 'max') out[p] = aggregate(values, p);
    }
    return out;
  });

  // ===== find =====
  setFindQuery(q: string) {
    this.findQuery.set(q);
    if (!q) { this.findMatches.set([]); this.findIndex.set(-1); return; }
    const ql = q.toLowerCase();
    const matches: { rowIndex: number; colIndex: number }[] = [];
    const rows = this.pagedRows();
    const cols = this.renderColumns();
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (row?.kind !== 'leaf' || !row.node) continue;
      for (let c = 0; c < cols.length; c++) {
        const colDef = cols[c]!.colDef;
        const v = getCellValue(colDef, row.node);
        if (formatCellValue(colDef, row.node, v).toLowerCase().includes(ql)) matches.push({ rowIndex: r, colIndex: c });
      }
    }
    this.findMatches.set(matches);
    this.findIndex.set(matches.length ? 0 : -1);
    if (matches.length) this.scrollRowIntoView(matches[0]!.rowIndex);
  }

  // ===== api builder =====
  private buildApi(): GridApi<TRow> {
    const self = this;
    return {
      setRowData(rows) {
        self.localRowData.set(rows.slice());
      },
      getRowData() { return self.localRowData() ?? self.rowData(); },
      applyTransaction({ add, remove, update }) {
        const idFn = self.getRowId();
        const idOf = (r: TRow): string => idFn ? idFn(r) : ((r as { id?: string | number }).id != null ? String((r as { id: string | number }).id) : '');
        const current = (self.localRowData() ?? self.rowData()).slice();
        if (remove?.length) {
          const ids = new Set(remove.map(idOf));
          for (let i = current.length - 1; i >= 0; i--) {
            if (ids.has(idOf(current[i]!))) current.splice(i, 1);
          }
        }
        if (update?.length) {
          for (const u of update) {
            const id = idOf(u);
            const i = current.findIndex((r) => idOf(r) === id);
            if (i >= 0) current[i] = { ...current[i]!, ...u };
          }
        }
        if (add?.length) current.push(...add);
        self.localRowData.set(current);
      },

      setColumnDefs() { throw new Error('setColumnDefs unsupported — rebind [columnDefs]'); },
      getColumnDefs() { return self.columnDefs(); },
      sizeColumnsToFit() {
        const host = self.el.nativeElement.querySelector('.gg-body') as HTMLElement | null;
        if (!host) return;
        const cols = self.columnsWithState();
        const total = host.clientWidth;
        const fixed = cols.filter((c) => !c.flex);
        const flexed = cols.filter((c) => !!c.flex);
        const fixedSum = fixed.reduce((a, c) => a + c.width, 0);
        const flexSum = flexed.reduce((a, c) => a + (c.flex ?? 0), 0) || 1;
        const remaining = Math.max(0, total - fixedSum);
        const state = new Map(self.internalColumnState());
        for (const c of flexed) {
          const w = Math.max(c.minWidth ?? 40, Math.floor((remaining * (c.flex ?? 1)) / flexSum));
          state.set(c.colId, { ...(state.get(c.colId) ?? {}), width: w });
        }
        self.internalColumnState.set(state);
      },
      autoSizeColumn(colId) {
        const col = self.columnsWithState().find((c) => c.colId === colId);
        if (!col) return;
        const state = new Map(self.internalColumnState());
        state.set(colId, { ...(state.get(colId) ?? {}), width: self.computeAutoWidth(col) });
        self.internalColumnState.set(state);
      },
      autoSizeAllColumns() {
        const state = new Map(self.internalColumnState());
        for (const c of self.columnsWithState()) state.set(c.colId, { ...(state.get(c.colId) ?? {}), width: self.computeAutoWidth(c) });
        self.internalColumnState.set(state);
      },
      setColumnVisible(colId, visible) {
        const col = self.columnsWithState().find((c) => c.colId === colId);
        if (col?.colDef.lockVisible) return;
        const state = new Map(self.internalColumnState());
        state.set(colId, { ...(state.get(colId) ?? {}), hide: !visible });
        self.internalColumnState.set(state);
      },
      setColumnPinned(colId, pinned) {
        const col = self.columnsWithState().find((c) => c.colId === colId);
        if (col?.colDef.lockPinned) return;
        const state = new Map(self.internalColumnState());
        state.set(colId, { ...(state.get(colId) ?? {}), pinned });
        self.internalColumnState.set(state);
      },
      moveColumn(colId, toIndex) {
        const col = self.columnsWithState().find((c) => c.colId === colId);
        if (col?.colDef.lockPosition) return;
        const order = self.columnsWithState().map((c) => c.colId);
        const from = order.indexOf(colId);
        if (from < 0) return;
        order.splice(from, 1);
        order.splice(Math.max(0, Math.min(order.length, toIndex)), 0, colId);
        self.internalColumnOrder.set(order);
      },

      setSortModel(model) { self.sortModel.set(model.slice()); },
      getSortModel() { return self.sortModel().slice(); },

      setQuickFilter(text) { self.internalQuickFilter.set(text ?? ''); self.currentPage.set(0); },
      setFilterModel(m) { self.filterModel.set(m ?? {}); self.currentPage.set(0); },
      getFilterModel() { return self.filterModel(); },
      destroyFilter(colId) { const m = { ...self.filterModel() }; delete m[colId]; self.filterModel.set(m); },

      startEditingCell(rowIndex, colId) {
        const col = self.columnsWithState().find((c) => c.colId === colId);
        const row = self.pagedRows()[rowIndex];
        if (col && row?.kind === 'leaf' && row.node) self.tryStartEdit(row.node, col, rowIndex);
      },
      stopEditing(cancel) { if (cancel) self.cancelEdit(); else self.commitEdit(''); },
      getEditingCell() {
        const e = self.editingCell();
        return e ? { rowIndex: e.rowIndex, colId: e.colId } : null;
      },
      undoCellEditing() {
        const u = self.undoStack.pop();
        if (!u) return;
        self.redoStack.push(u);
        const map = new Map(self.editedValues());
        const rowMap = new Map(map.get(u.rowId) ?? new Map());
        rowMap.set(u.colId, u.oldValue);
        map.set(u.rowId, rowMap);
        self.editedValues.set(map);
      },
      redoCellEditing() {
        const u = self.redoStack.pop();
        if (!u) return;
        self.undoStack.push(u);
        const map = new Map(self.editedValues());
        const rowMap = new Map(map.get(u.rowId) ?? new Map());
        rowMap.set(u.colId, u.newValue);
        map.set(u.rowId, rowMap);
        self.editedValues.set(map);
      },

      exportDataAsCsv(opts) {
        const csv = self.api.getDataAsCsv(opts);
        downloadCsv(opts?.fileName ?? 'glassgrid-export.csv', csv);
      },
      getDataAsCsv(opts) {
        const cols = self.columnsWithState().filter((c) => !c.hide).map((c) => c.colDef);
        const rows = opts?.onlySelected ? self.api.getSelectedNodes() : self.sortedFilteredNodes();
        return toCsv(cols, rows, opts);
      },

      setRowGroupColumns(colIds) { self.rowGroupColIds.set(colIds.slice()); },
      expandAll() {
        // expand: when defaultExpanded is true, toggled = NOT-defaulted. We want full expand → empty toggled (when default), full toggled (when default-collapsed).
        const def = self.groupDefaultExpanded() > 0;
        if (def) self.toggledGroupIds.set(new Set());
        else {
          // collect all group ids
          const aggCols = self.columnsWithState().filter((c) => c.colDef.aggFunc).map((c) => c.colId);
          const { tree } = buildGroupTree(self.sortedFilteredNodes(), self.rowGroupColIds(), self.colDefById(), aggCols, new Set(), false);
          const ids = new Set<string>();
          const walk = (list: typeof tree) => list.forEach((e) => { if (e.kind === 'group') { ids.add(e.id); walk(e.children); } });
          walk(tree);
          self.toggledGroupIds.set(ids);
        }
      },
      collapseAll() {
        const def = self.groupDefaultExpanded() > 0;
        if (!def) self.toggledGroupIds.set(new Set());
        else {
          const aggCols = self.columnsWithState().filter((c) => c.colDef.aggFunc).map((c) => c.colId);
          const { tree } = buildGroupTree(self.sortedFilteredNodes(), self.rowGroupColIds(), self.colDefById(), aggCols, new Set(), true);
          const ids = new Set<string>();
          const walk = (list: typeof tree) => list.forEach((e) => { if (e.kind === 'group') { ids.add(e.id); walk(e.children); } });
          walk(tree);
          self.toggledGroupIds.set(ids);
        }
      },

      getCellRanges() { return self.ranges(); },
      clearRangeSelection() { self.ranges.set([]); self.rangeAnchor.set(null); },

      findNext(q) {
        self.setFindQuery(q);
        const next = self.findIndex() + 1;
        if (next < self.findMatches().length) {
          self.findIndex.set(next);
          self.scrollRowIntoView(self.findMatches()[next]!.rowIndex);
        }
      },
      findPrev(q) {
        self.setFindQuery(q);
        const prev = self.findIndex() - 1;
        if (prev >= 0) {
          self.findIndex.set(prev);
          self.scrollRowIntoView(self.findMatches()[prev]!.rowIndex);
        }
      },
      clearFind() { self.findQuery.set(''); self.findMatches.set([]); self.findIndex.set(-1); },

      getColumnState(): ColumnStateItem[] {
        return self.columnsWithState().map((c) => ({
          colId: c.colId,
          width: c.width,
          hide: c.hide,
          pinned: c.pinned,
          flex: c.flex,
          sort: self.sortModel().find((s) => s.colId === c.colId)?.sort ?? null,
          sortIndex: self.sortModel().findIndex((s) => s.colId === c.colId),
          rowGroup: self.rowGroupColIds().includes(c.colId),
          rowGroupIndex: self.rowGroupColIds().indexOf(c.colId),
        }));
      },
      applyColumnState(state) {
        const stateMap = new Map(self.internalColumnState());
        const order: string[] = [];
        const sortModel: SortModelItem[] = [];
        const groupCols: string[] = [];
        for (const s of state) {
          order.push(s.colId);
          stateMap.set(s.colId, { ...(stateMap.get(s.colId) ?? {}), width: s.width, hide: s.hide, pinned: s.pinned ?? null, flex: s.flex });
          if (s.sort) sortModel.push({ colId: s.colId, sort: s.sort });
          if (s.rowGroup) groupCols.push(s.colId);
        }
        self.internalColumnState.set(stateMap);
        self.internalColumnOrder.set(order);
        self.sortModel.set(sortModel);
        self.rowGroupColIds.set(groupCols);
      },
      getGridState(): GridState {
        return {
          columns: self.api.getColumnState(),
          sortModel: self.sortModel(),
          filterModel: self.filterModel(),
          quickFilter: self.internalQuickFilter() || self.quickFilterText(),
          pagination: { page: self.currentPage(), pageSize: self.effectivePageSize() },
        };
      },
      applyGridState(state) {
        self.api.applyColumnState(state.columns);
        self.sortModel.set(state.sortModel.slice());
        self.filterModel.set({ ...state.filterModel });
        self.internalQuickFilter.set(state.quickFilter ?? '');
        self.currentPage.set(state.pagination.page);
        self.userPageSize.set(state.pagination.pageSize);
      },

      setSideBarVisible(v) { self.sideBarVisible.set(v); },
      isSideBarVisible() { return self.sideBarVisible(); },
      openToolPanel(id) { self.sideBarVisible.set(true); self.openToolPanelId.set(id); },
      closeToolPanel() { self.openToolPanelId.set(null); },

      selectAll() { self.selectedIds.set(new Set(self.filteredNodes().map((n) => n.id))); },
      deselectAll() { self.selectedIds.set(new Set()); },
      getSelectedRows() { const ids = self.selectedIds(); return self.nodes().filter((n) => ids.has(n.id)).map((n) => n.data); },
      getSelectedNodes() { const ids = self.selectedIds(); return self.nodes().filter((n) => ids.has(n.id)); },

      paginationGoToPage(p) { self.currentPage.set(Math.max(0, Math.min(self.totalPages() - 1, Math.floor(p)))); },
      paginationGoToNextPage() { self.api.paginationGoToPage(self.currentPage() + 1); },
      paginationGoToPreviousPage() { self.api.paginationGoToPage(self.currentPage() - 1); },
      paginationGoToFirstPage() { self.api.paginationGoToPage(0); },
      paginationGoToLastPage() { self.api.paginationGoToPage(self.totalPages() - 1); },
      paginationGetCurrentPage() { return self.currentPage(); },
      paginationGetTotalPages() { return self.totalPages(); },
      paginationGetPageSize() { return self.effectivePageSize(); },
      paginationSetPageSize(size) { self.userPageSize.set(size); self.currentPage.set(0); },

      ensureIndexVisible(index, position = 'top') {
        const rh = self.rowHeight();
        const vp = self.viewportRef?.nativeElement;
        if (!vp) return;
        const top =
          position === 'top' ? index * rh
          : position === 'middle' ? Math.max(0, index * rh - vp.clientHeight / 2 + rh / 2)
          : Math.max(0, index * rh - vp.clientHeight + rh);
        vp.scrollTop = top;
      },
      ensureColumnVisible(colId) {
        const cols = self.renderColumns();
        const i = cols.findIndex((c) => c.colId === colId);
        if (i < 0) return;
        const vp = self.viewportRef?.nativeElement;
        if (!vp) return;
        const left = cols[i]!.left;
        const right = left + cols[i]!.computedWidth;
        if (left < vp.scrollLeft) vp.scrollLeft = left;
        else if (right > vp.scrollLeft + vp.clientWidth) vp.scrollLeft = right - vp.clientWidth;
      },
      refreshCells() { /* signals re-derive */ },
      destroy() { /* host removal handles cleanup */ },

      // ---- column groups ----
      setColumnGroupState(state) {
        const m = new Map<string, boolean>();
        for (const s of state) m.set(s.groupId, s.open);
        self.columnGroupOpen.set(m);
      },
      getColumnGroupState() {
        const out: ColumnGroupState[] = [];
        for (const [groupId, open] of self.columnGroupOpen()) out.push({ groupId, open });
        return out;
      },
      setColumnGroupOpened(groupId, opened) {
        const m = new Map(self.columnGroupOpen());
        m.set(groupId, opened);
        self.columnGroupOpen.set(m);
      },
      resetColumnGroupState() { self.columnGroupOpen.set(new Map()); },

      // ---- pivoting ----
      setPivotMode(_enable) { console.warn('[glassGRID] setPivotMode: rebind [pivotMode] input.'); },
      isPivotMode() { return self.pivotMode(); },
      setPivotColumns(_colIds) { console.warn('[glassGRID] setPivotColumns: rebind [pivotColIds] input.'); },
      getPivotColumns() { return self.pivotColIds(); },
      getPivotResult() { return self.pivotResult(); },

      // ---- server-side / infinite ----
      setServerSideDatasource(ds) {
        // input-driven, but we trigger an initial load
        if (!ds) { self.serverSideRows.set([]); return; }
        ds.getRows({ startRow: 0, endRow: self.cacheBlockSize(), sortModel: self.sortModel(), filterModel: self.filterModel(), groupKeys: [] })
          .then((res) => { self.serverSideRows.set(res.rows); if (res.rowCount != null) self.serverSideTotal.set(res.rowCount); });
      },
      setInfiniteDatasource(ds) {
        if (!ds) { self.serverSideRows.set([]); return; }
        ds.getRows({ startRow: 0, endRow: self.cacheBlockSize() })
          .then((res) => { self.serverSideRows.set(res.rows); if (res.lastRow != null) self.serverSideTotal.set(res.lastRow); });
      },
      refreshServerSideStore() {
        const ds = self.serverSideDatasource();
        if (ds) self.api.setServerSideDatasource(ds);
      },

      // ---- AI / schema ----
      getStructuredSchema(): GridSchema {
        const cols = self.columnsWithState().filter((c) => !c.hide).map((c) => {
          const v = self.sortedFilteredNodes()[0] ? getCellValue(c.colDef, self.sortedFilteredNodes()[0]!) : undefined;
          const t = v == null ? 'unknown' as const
            : v instanceof Date ? 'date' as const
            : typeof v === 'number' ? 'number' as const
            : typeof v === 'boolean' ? 'boolean' as const
            : 'string' as const;
          return { colId: c.colId, field: c.field, headerName: c.headerName, type: t };
        });
        return {
          columns: cols,
          rowCount: self.sortedFilteredNodes().length,
          sortModel: self.sortModel(),
          filterModel: self.filterModel(),
          groupBy: self.rowGroupColIds(),
        };
      },

      // ---- excel export ----
      exportDataAsExcel(opts) {
        const xml = self.api.getDataAsExcelXml(opts);
        downloadExcel((opts?.fileName ?? 'glassgrid-export.xls'), xml);
      },
      getDataAsExcelXml(opts) {
        const cols = self.columnsWithState().filter((c) => !c.hide).map((c) => c.colDef);
        const rows = opts?.onlySelected ? self.api.getSelectedNodes() : self.sortedFilteredNodes();
        return toExcelXml(cols, rows, opts);
      },

      // ---- clipboard paste ----
      async pasteFromClipboard(text) {
        if (!self.enableClipboardPaste()) return;
        const txt = text ?? await readClipboard();
        if (!txt) return;
        const grid = parseClipboardText(txt);
        // start at focused cell
        const focused = self.focusedCell();
        if (!focused) return;
        const rows = self.pagedRows();
        const cols = self.renderColumns();
        for (let r = 0; r < grid.length; r++) {
          const targetRow = rows[focused.row + r];
          if (!targetRow || targetRow.kind !== 'leaf' || !targetRow.node) continue;
          for (let c = 0; c < grid[r]!.length; c++) {
            const col = cols[focused.col + c];
            if (!col || !col.colDef.field) continue;
            const newValue = grid[r]![c];
            const oldValue = getCellValue(col.colDef, targetRow.node);
            const map = new Map(self.editedValues());
            const rowMap = new Map(map.get(targetRow.node.id) ?? new Map());
            rowMap.set(col.colId, newValue);
            map.set(targetRow.node.id, rowMap);
            self.editedValues.set(map);
            self.cellValueChanged.emit({ data: targetRow.node.data, node: targetRow.node, colDef: col.colDef, oldValue: oldValue as never, newValue: newValue as never });
          }
        }
      },

      // ---- ag-grid drop-in: loading overlay ----
      showLoadingOverlay() { self.loadingOverlayInternal.set(true); },
      hideOverlay() { self.loadingOverlayInternal.set(false); },

      // ---- iteration ----
      forEachNode(cb) { self.nodes().forEach((n, i) => cb(n, i)); },
      forEachNodeAfterFilter(cb) { self.filteredNodes().forEach((n, i) => cb(n, i)); },
      forEachNodeAfterFilterAndSort(cb) { self.sortedFilteredNodes().forEach((n, i) => cb(n, i)); },

      getDisplayedRowCount() { return self.totalDisplayed(); },

      // ---- ag-grid setGridOption ----
      setGridOption(key, value) {
        // Map a known whitelist of keys to internal handlers; unknown keys are stored.
        const k = key as string;
        if (k === 'datasource') {
          self.attachedDatasource.set(value as IDatasource<TRow> | null);
        } else if (k === 'paginationPageSize') {
          self.userPageSize.set(value as number);
          self.currentPage.set(0);
        } else {
          self.gridOptionsOverride.update((o) => ({ ...o, [k]: value as never }));
        }
      },

      // ---- ag-grid: infinite cache ----
      refreshInfiniteCache() {
        const ds = self.attachedDatasource();
        if (!ds) return;
        self.localRowData.set([]);
        self.infiniteFetched.clear();
        self.fetchInfiniteBlock(0);
      },
      purgeInfiniteCache() { self.api.refreshInfiniteCache(); },
      get infiniteRowModel() {
        return {
          resetCache: () => self.api.refreshInfiniteCache(),
        };
      },
    };
  }

  /**
   * Fetch one block of rows from the attached IDatasource and merge into localRowData.
   * The grid uses this to satisfy ag-grid's infinite row-model pattern:
   *   gridApi.setGridOption('datasource', { getRows(params) { ... params.successCallback(rows, total) } })
   */
  fetchInfiniteBlock(blockIndex: number) {
    const ds = this.attachedDatasource();
    if (!ds) return;
    if (this.infiniteFetched.has(blockIndex)) return;
    this.infiniteFetched.add(blockIndex);
    const blockSize = this.gridOptionsOverride().cacheBlockSize ?? this.cacheBlockSize();
    const startRow = blockIndex * blockSize;
    const endRow = startRow + blockSize;
    this.loadingOverlayInternal.set(true);
    ds.getRows({
      startRow,
      endRow,
      sortModel: this.sortModel(),
      filterModel: this.filterModel(),
      successCallback: (rows: TRow[], lastRow?: number) => {
        const existing = this.localRowData() ?? this.rowData() ?? [];
        const next = existing.slice();
        for (let i = 0; i < rows.length; i++) next[startRow + i] = rows[i]!;
        // trim trailing if lastRow known
        if (typeof lastRow === 'number' && next.length > lastRow) next.length = lastRow;
        this.localRowData.set(next);
        this.loadingOverlayInternal.set(false);
        if (this.debug()) console.log('[glassGRID] infinite block loaded', { blockIndex, startRow, endRow, lastRow, rows: rows.length });
      },
      failCallback: () => {
        this.infiniteFetched.delete(blockIndex);
        this.loadingOverlayInternal.set(false);
      },
    });
  }

  private computeAutoWidth(col: ResolvedColumn<TRow>): number {
    const padding = 32;
    let max = (col.headerName?.length ?? 0) * 8 + padding;
    for (const n of this.sortedFilteredNodes().slice(0, 200)) {
      const s = this.cellText(col, n);
      max = Math.max(max, s.length * 7 + padding);
    }
    return Math.min(col.maxWidth ?? 600, Math.max(col.minWidth ?? 40, max));
  }

  // ===== misc helpers used by template =====
  isGroupRow(r: FlattenedRow<TRow>): r is FlattenedRow<TRow> & { kind: 'group'; group: GroupRow<TRow> } {
    return r.kind === 'group';
  }
  isLeafRow(r: FlattenedRow<TRow>): r is FlattenedRow<TRow> & { kind: 'leaf'; node: RowNode<TRow> } {
    return r.kind === 'leaf';
  }
  isDetailRow(r: FlattenedRow<TRow>): r is FlattenedRow<TRow> & { kind: 'detail'; node: RowNode<TRow> } {
    return r.kind === 'detail';
  }
  isExpandedDetail(node: RowNode<TRow>): boolean {
    return this.expandedDetailIds().has(node.id);
  }

  /** First column index that exists in render (used for cell positioning offsets). */
  startOffsetFor(rowKind: 'group' | 'detail'): number {
    return rowKind === 'group' ? 0 : 0;
  }
}
