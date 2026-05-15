import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { GlassGridComponent, type CellRendererParams, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

/** Cell component: dropdown bound to row.department with real Angular event handling. */
@Component({
  selector: 'demo-dept-dropdown-cell',
  standalone: true,
  template: `
    <select
      class="dept-cell"
      [value]="params().value"
      (change)="onChange($any($event.target).value)"
      [attr.data-testid]="'dept-cell-' + params().data.id"
    >
      @for (d of departments; track d) {
        <option [value]="d">{{ d }}</option>
      }
    </select>
  `,
  styles: `
    .dept-cell { width: 100%; padding: 4px 6px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); border-radius: 4px; background: transparent; color: inherit; font: inherit; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeptDropdownCell {
  readonly params = input.required<CellRendererParams<Employee>>();
  readonly departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Design'];
  onChange(v: string) {
    // direct mutation of bound row data — fine because we keep ref identity
    (this.params().data as Employee).department = v as Employee['department'];
  }
}

/** Cell component: numeric stepper. */
@Component({
  selector: 'demo-stepper-cell',
  standalone: true,
  template: `
    <div class="stepper">
      <button type="button" (click)="step(-1)" [attr.data-testid]="'stepper-dec-' + params().data.id">−</button>
      <span class="val" [attr.data-testid]="'stepper-val-' + params().data.id">{{ value() }}</span>
      <button type="button" (click)="step(1)" [attr.data-testid]="'stepper-inc-' + params().data.id">+</button>
    </div>
  `,
  styles: `
    .stepper { display: inline-flex; align-items: center; gap: 6px; }
    .stepper button { width: 22px; height: 22px; line-height: 1; padding: 0; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: transparent; color: inherit; border-radius: 4px; cursor: pointer; }
    .val { min-width: 24px; text-align: center; font-variant-numeric: tabular-nums; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperCell {
  readonly params = input.required<CellRendererParams<Employee>>();
  readonly bump = signal(0);
  readonly value = computed(() => (this.params().data.level as number) + this.bump());
  step(delta: number) {
    const next = Math.max(1, Math.min(5, this.value() + delta));
    (this.params().data as Employee).level = next as Employee['level'];
    this.bump.update((b) => b + delta);
  }
}

/** Cell component: action buttons. */
@Component({
  selector: 'demo-actions-cell',
  standalone: true,
  template: `
    <div class="actions">
      <button type="button" (click)="emit('view')" [attr.data-testid]="'action-view-' + params().data.id">View</button>
      <button type="button" (click)="emit('archive')" [attr.data-testid]="'action-archive-' + params().data.id">Archive</button>
    </div>
  `,
  styles: `
    .actions { display: inline-flex; gap: 6px; }
    .actions button { padding: 3px 8px; font-size: 11px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: transparent; color: inherit; border-radius: 4px; cursor: pointer; }
    .actions button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsCell {
  readonly params = input.required<CellRendererParams<Employee>>();
  readonly onAction = input<((kind: string, row: Employee) => void) | null>(null);
  emit(kind: string) {
    this.onAction()?.(kind, this.params().data);
  }
}

@Component({
  selector: 'demo-cell-components',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Angular component cells</h1>
      <p>Each cell is a real Angular component rendered via <code>ngComponentOutlet</code>. The component receives a strongly-typed <code>params</code> input (<code>CellRendererParams&lt;TRow&gt;</code>) plus any extra inputs declared in <code>cellComponentInputs</code>.</p>
      <div class="controls">
        <span data-testid="last-action">{{ lastAction() || '(no action yet)' }}</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="cell-components-grid"
        [columnDefs]="cols"
        [rowData]="rows"
      />
    </section>
  `,
})
export class CellComponentsFeature {
  readonly rows = makeRows(15);
  readonly lastAction = signal('');
  readonly handleAction = (kind: string, row: Employee) => {
    this.lastAction.set(`${kind}: ${row.name}`);
  };
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    {
      field: 'department',
      headerName: 'Dept (dropdown component)',
      width: 220,
      cellComponent: DeptDropdownCell,
    },
    {
      field: 'level',
      headerName: 'Lvl (stepper component)',
      width: 200,
      cellComponent: StepperCell,
    },
    {
      headerName: 'Actions',
      width: 200,
      cellComponent: ActionsCell,
      cellComponentInputs: { onAction: this.handleAction },
    },
    { field: 'salary', width: 130 },
  ];
}
