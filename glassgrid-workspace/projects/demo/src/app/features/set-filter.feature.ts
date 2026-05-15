import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-set-filter',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Set filter (multi-select)</h1>
      <p>External multi-select widgets that drive the grid's filter model. (The popup-based set filter renders inside the column filter button.) Click departments to filter:</p>
      <div class="controls">
        @for (d of departments; track d) {
          <label>
            <input type="checkbox"
              [checked]="selected().has(d)"
              (change)="toggle(d, $any($event.target).checked)"
              [attr.data-testid]="'dept-' + d"
            />
            {{ d }}
          </label>
        }
        <button (click)="clear()" data-testid="clear-set-filter">Clear</button>
        <span data-testid="filter-count">Filtering on: {{ selected().size }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="set-filter-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class SetFilterFeature {
  api?: GridApi<Employee>;
  readonly rows = makeRows(400);
  readonly selected = signal(new Set<string>());
  readonly departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Design'];
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 200 },
    { field: 'department', width: 160 },
    { field: 'title', width: 200 },
    { field: 'level', headerName: 'Lvl', width: 80 },
  ];

  toggle(d: string, checked: boolean) {
    const s = new Set(this.selected());
    if (checked) s.add(d); else s.delete(d);
    this.selected.set(s);
    this.apply();
  }
  clear() { this.selected.set(new Set()); this.apply(); }

  apply() {
    if (!this.api) return;
    const s = this.selected();
    if (s.size === 0) { this.api.setFilterModel({}); return; }
    // collapse multi-select into OR of `equals` text filters using array
    this.api.setFilterModel({
      department: Array.from(s).map(v => ({ type: 'equals', filter: v })),
    });
  }
}
