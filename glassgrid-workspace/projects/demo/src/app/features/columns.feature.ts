import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef, type GridApi } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

/** Extra synthetic fields added on top of Employee, so the demo has 18 columns
 *  and a total width that forces horizontal scroll when nothing is pinned. */
interface WideEmployee extends Employee {
  manager: string;
  team: string;
  phone: string;
  city: string;
  country: string;
  postalCode: string;
  startDate: Date;
  reviewScore: number;
  bonus: number;
  rank: number;
  tags: string;
  notes2: string;
}

@Component({
  selector: 'demo-columns',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column features</h1>
      <p>
        <strong>Right-click any column header</strong> for a menu of column actions: sort, pin left / pin right / unpin, auto-size, hide.
        A green vertical line marks the boundary between pinned and unpinned columns.
        Drag a header onto another to reorder; drag the right edge of a header to resize.
      </p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="columns-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [autoSizeStrategy]="null"
        [defaultColDef]="{ sortable: true, resizable: true }"
        (gridReady)="api = $event.api"
      />
    </section>
  `,
})
export class ColumnsFeature {
  api?: GridApi<WideEmployee>;
  readonly rows: WideEmployee[] = makeRows(300).map((r, i) => ({
    ...r,
    manager: `Mgr ${1 + (i % 12)}`,
    team: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'][i % 5]!,
    phone: `+1 415 ${String(1000 + i).padStart(4, '0')}`,
    city: ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Singapore'][i % 7]!,
    country: ['USA', 'UK', 'Germany', 'Japan', 'Australia', 'Singapore'][i % 6]!,
    postalCode: `${94000 + (i % 1000)}`,
    startDate: new Date(2018 + (i % 7), i % 12, 1 + (i % 27)),
    reviewScore: 3 + (i % 30) / 10,
    bonus: Math.round(1000 + (i % 50) * 50),
    rank: 1 + (i % 100),
    tags: ['remote', 'senior', 'lead', 'mentor', 'oncall'][i % 5]!,
    notes2: `Note ${i}`,
  }));

  // 18 columns — total natural width ~ 2400px, well above viewport, so horizontal scroll is on
  // until you pin a few left. autoSizeStrategy is null so widths don't get stretched to viewport.
  readonly cols: ColumnDef<WideEmployee>[] = [
    { field: 'id', headerName: '#', width: 70, suppressMovable: true },
    { field: 'name', width: 180 },
    { field: 'email', width: 220 },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'level', headerName: 'Lvl', width: 80 },
    { field: 'manager', width: 130 },
    { field: 'team', width: 110 },
    { field: 'phone', width: 160 },
    { field: 'city', width: 150 },
    { field: 'country', width: 140 },
    { field: 'postalCode', headerName: 'Zip', width: 100 },
    { field: 'location', headerName: 'Office', width: 160 },
    { field: 'startDate', headerName: 'Start', width: 130,
      valueFormatter: (p) => p.value instanceof Date ? (p.value as Date).toISOString().slice(0, 10) : '' },
    // Locale + currency formatting via Intl.NumberFormat — no manual valueFormatter needed.
    { field: 'salary',  headerName: 'Salary (USD)', width: 140, locale: 'en-US', currency: 'USD' },
    { field: 'bonus',   headerName: 'Bonus (INR)',  width: 140, locale: 'en-IN', currency: 'INR' },
    { field: 'rank',    headerName: 'Rank (de-DE)', width: 120, locale: 'de-DE' },
    { field: 'tags', width: 110 },
  ];
}
