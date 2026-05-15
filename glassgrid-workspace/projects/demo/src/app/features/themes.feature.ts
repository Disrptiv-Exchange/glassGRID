import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

type Variant = 'default' | 'dense' | 'brand';

@Component({
  selector: 'demo-themes',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Theming</h1>
      <p>
        The library ships with one built-in theme (<strong>glassRUN</strong>) baked into the component —
        no <code>@import</code> needed. Override any <code>--gg-*</code> CSS custom property in your own
        stylesheet to retheme without touching the library. Toggle dark / RTL as needed.
      </p>
      <div class="controls">
        <label>Variant:
          <select [value]="variant()" (change)="variant.set($any($event.target).value)" data-testid="theme-select">
            <option value="default">glassRUN (default)</option>
            <option value="dense">Dense (smaller rows)</option>
            <option value="brand">Custom brand (pink)</option>
          </select>
        </label>
        <label>Dark:
          <input type="checkbox" [checked]="dark()" (change)="dark.set($any($event.target).checked)" data-testid="dark-toggle" />
        </label>
        <label>RTL:
          <input type="checkbox" [checked]="rtl()" (change)="rtl.set($any($event.target).checked)" data-testid="rtl-toggle" />
        </label>
      </div>
      <glass-grid
        [class]="hostClass()"
        data-testid="themes-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
        [darkMode]="dark()"
        [enableRtl]="rtl()"
      />
    </section>
  `,
  styles: `
    ::ng-deep glass-grid.variant-dense {
      --gg-row-height: 28px;
      --gg-header-height: 32px;
      --gg-cell-padding-x: 8px;
      --gg-border-radius: 6px;
    }
    ::ng-deep glass-grid.variant-brand {
      --gg-accent: #ff4593;
      --gg-row-selected-bg: rgba(255, 69, 147, 0.16);
      --gg-focus-ring: rgba(255, 69, 147, 0.35);
      --gg-header-bg: #fff0f7;
    }
    ::ng-deep glass-grid.variant-brand.gg-dark {
      --gg-header-bg: #2a1421;
    }
  `,
})
export class ThemesFeature {
  readonly rows = makeRows(80);
  readonly variant = signal<Variant>('default');
  readonly dark = signal(false);
  readonly rtl = signal(false);
  readonly hostClass = computed(() => {
    const v = this.variant();
    return v === 'default' ? '' : `variant-${v}`;
  });
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
    { field: 'location', width: 160 },
  ];
}
