import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

type ThemeName = 'glassrun' | 'quartz' | 'quartz-dense' | 'material' | 'balham' | 'brand';

@Component({
  selector: 'demo-themes',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Themes</h1>
      <p>Themes are pure CSS — every visual value is a <code>--gg-*</code> custom property. Swap themes by toggling a class, or fork a theme and override variables in your own stylesheet.</p>
      <div class="controls">
        <label>Theme:
          <select [value]="theme()" (change)="theme.set($any($event.target).value)" data-testid="theme-select">
            <option value="glassrun">glassRUN (default)</option>
            <option value="quartz">Quartz</option>
            <option value="quartz-dense">Quartz (dense)</option>
            <option value="material">Material</option>
            <option value="balham">Balham</option>
            <option value="brand">Custom brand</option>
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
    ::ng-deep glass-grid.theme-quartz-dense {
      --gg-row-height: 28px;
      --gg-header-height: 32px;
      --gg-cell-padding-x: 8px;
      --gg-border-radius: 6px;
    }
    ::ng-deep glass-grid.theme-brand {
      --gg-accent: #ff4593;
      --gg-row-selected-bg: rgba(255, 69, 147, 0.16);
      --gg-focus-ring: rgba(255, 69, 147, 0.35);
      --gg-header-bg: #fff0f7;
    }
    ::ng-deep glass-grid.theme-brand.gg-dark {
      --gg-header-bg: #2a1421;
    }
  `,
})
export class ThemesFeature {
  readonly rows = makeRows(80);
  readonly theme = signal<ThemeName>('glassrun');
  readonly dark = signal(false);
  readonly rtl = signal(false);
  readonly hostClass = computed(() => {
    const t = this.theme();
    if (t === 'glassrun') return 'gg-theme-glassrun';
    if (t === 'quartz' || t === 'quartz-dense' || t === 'brand') return `gg-theme-quartz theme-${t}`;
    if (t === 'material') return 'gg-theme-material';
    if (t === 'balham') return 'gg-theme-balham';
    return 'gg-theme-glassrun';
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
