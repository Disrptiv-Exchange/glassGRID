import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

const fmtCurrency = (v: unknown) =>
  typeof v === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '';
const fmtDate = (v: unknown) =>
  v instanceof Date ? v.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '';

@Component({
  selector: 'demo-rendering',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Cell rendering</h1>
      <p>Customise output with <code>valueFormatter</code>, return raw HTML from <code>cellRenderer</code>, and apply conditional classes with <code>cellClassRules</code>.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="rendering-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [defaultColDef]="{ sortable: true }"
      />
    </section>
  `,
  styles: `
    ::ng-deep .gg-cell.high-salary { color: #11a36b; font-weight: 600; }
    ::ng-deep .gg-cell.low-rating { color: #d04848; }
    ::ng-deep .gg-cell.inactive { opacity: 0.45; font-style: italic; }
    ::ng-deep .pill {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    ::ng-deep .pill-Engineering { color: #3884ff; }
    ::ng-deep .pill-Sales       { color: #11a36b; }
    ::ng-deep .pill-Marketing   { color: #ff7a45; }
    ::ng-deep .pill-Finance     { color: #a445ff; }
    ::ng-deep .pill-Ops         { color: #d4a017; }
    ::ng-deep .pill-Design      { color: #ff4593; }
  `,
})
export class RenderingFeature {
  readonly rows = makeRows(200);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    {
      field: 'department',
      width: 160,
      cellRenderer: (p) => `<span class="pill pill-${p.value}">${p.formattedValue}</span>`,
    },
    {
      field: 'salary',
      width: 140,
      valueFormatter: (p) => fmtCurrency(p.value),
      cellClassRules: {
        'high-salary': (p) => typeof p.value === 'number' && p.value > 150_000,
      },
    },
    {
      field: 'rating',
      width: 100,
      valueFormatter: (p) => typeof p.value === 'number' ? p.value.toFixed(1) : '',
      cellClassRules: {
        'low-rating': (p) => typeof p.value === 'number' && p.value < 2,
      },
    },
    {
      field: 'hireDate',
      headerName: 'Hire date',
      width: 130,
      valueFormatter: (p) => fmtDate(p.value),
    },
    {
      field: 'active',
      headerName: 'Active',
      width: 90,
      cellRenderer: (p) => p.value ? '✅' : '⛔',
      cellClassRules: {
        'inactive': (p) => p.value === false,
      },
    },
  ];
}
