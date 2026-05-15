import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type FloatingFilterParams } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

/** A dropdown-style floating-filter component. Reads/writes its column's filter value
 *  through the params.onValueChange callback the grid passes in. */
@Component({
  selector: 'demo-dept-floating-filter',
  standalone: true,
  template: `
    <select
      class="ff-dropdown"
      [value]="params().value ?? ''"
      (change)="params().onValueChange($any($event.target).value || null)"
      [attr.data-testid]="'floating-filter-' + params().colDef.field"
    >
      <option value="">(all)</option>
      @for (d of options; track d) {
        <option [value]="d">{{ d }}</option>
      }
    </select>
  `,
  styles: `
    .ff-dropdown {
      width: 100%; padding: 4px 6px;
      border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
      border-radius: 6px; background: var(--gg-bg); color: var(--gg-fg); font: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeptFloatingFilter {
  readonly params = input.required<FloatingFilterParams<Employee>>();
  readonly options = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Design'];
}

@Component({
  selector: 'demo-floating-filter-component',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Floating filter — Angular component</h1>
      <p>The <em>Department</em> column uses a custom Angular dropdown component as its floating filter (declared via <code>floatingFilterComponent</code>). All other columns fall back to the built-in text input.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="floating-filter-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true, floatingFilter: true }"
      />
    </section>
  `,
})
export class FloatingFilterComponentFeature {
  readonly rows = makeRows(300);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70, filter: 'number' },
    { field: 'name', width: 200, filter: 'text' },
    { field: 'department', width: 200, filter: 'text', floatingFilterComponent: DeptFloatingFilter },
    { field: 'title', width: 200, filter: 'text' },
    { field: 'salary', width: 130, filter: 'number' },
    { field: 'location', width: 160, filter: 'text' },
  ];
}
