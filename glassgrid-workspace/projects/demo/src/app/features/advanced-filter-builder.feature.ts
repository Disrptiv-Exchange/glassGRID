import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type FilterModel, type FilterOp, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

interface Rule { colId: string; type: FilterOp; filter: string | number }

@Component({
  selector: 'demo-advanced-filter-builder',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Advanced filter builder</h1>
      <p>Compose multiple per-column rules into a single <code>FilterModel</code>. Rules within a column AND together (multi-rule per col); columns also AND.</p>
      <div class="controls">
        @for (r of rules(); track r; let i = $index) {
          <div class="rule" style="display:flex; gap:6px; padding:4px 6px; border:1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius:6px;">
            <select [value]="r.colId" (change)="set(i, 'colId', $any($event.target).value)" [attr.data-testid]="'rule-col-' + i">
              <option value="name">name</option>
              <option value="department">department</option>
              <option value="salary">salary</option>
              <option value="level">level</option>
            </select>
            <select [value]="r.type" (change)="set(i, 'type', $any($event.target).value)" [attr.data-testid]="'rule-op-' + i">
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="greaterThan">&gt;</option>
              <option value="lessThan">&lt;</option>
            </select>
            <input type="text" [value]="r.filter" (input)="set(i, 'filter', $any($event.target).value)" [attr.data-testid]="'rule-val-' + i" />
            <button (click)="remove(i)" [attr.data-testid]="'rule-remove-' + i">×</button>
          </div>
        }
        <button (click)="add()" data-testid="add-rule">+ rule</button>
        <button (click)="apply()" data-testid="apply-rules">Apply</button>
        <button (click)="clear()" data-testid="clear-rules">Clear</button>
        <span data-testid="rule-count">Rules: {{ rules().length }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="advanced-builder-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class AdvancedFilterBuilderFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(500);
  readonly rules = signal<Rule[]>([{ colId: 'department', type: 'equals', filter: 'Engineering' }]);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 160 },
    { field: 'level', headerName: 'Lvl', width: 80, filter: 'number' },
    { field: 'salary', width: 130, filter: 'number' },
    { field: 'title', width: 200 },
  ];

  add() { this.rules.set([...this.rules(), { colId: 'name', type: 'contains', filter: '' }]); }
  remove(i: number) { const arr = this.rules().slice(); arr.splice(i, 1); this.rules.set(arr); }
  set(i: number, field: keyof Rule, value: string | number) {
    const arr = this.rules().slice();
    const r = { ...arr[i]!, [field]: value };
    if (field === 'filter' && (arr[i]!.colId === 'salary' || arr[i]!.colId === 'level')) r.filter = +value;
    arr[i] = r as Rule;
    this.rules.set(arr);
  }
  apply() {
    const m: FilterModel = {};
    for (const r of this.rules()) {
      if (r.filter === '' || r.filter == null) continue;
      const existing = m[r.colId];
      const item = { type: r.type, filter: r.filter };
      if (!existing) m[r.colId] = item;
      else if (Array.isArray(existing)) existing.push(item);
      else m[r.colId] = [existing, item];
    }
    this.api?.setFilterModel(m);
  }
  clear() { this.rules.set([]); this.api?.setFilterModel({}); }
}
