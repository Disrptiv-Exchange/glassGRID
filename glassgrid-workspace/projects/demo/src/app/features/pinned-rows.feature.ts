import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-pinned-rows',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Pinned top &amp; bottom rows</h1>
      <p>Pinned rows live outside the scrollable body — they stay visible while the body scrolls. Common use: summary or totals rows.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="pinned-rows-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [pinnedTopRowData]="pinnedTop()"
        [pinnedBottomRowData]="pinnedBottom()"
      />
    </section>
  `,
})
export class PinnedRowsFeature {
  readonly rows = makeRows(200);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', width: 180 },
    { field: 'department', width: 140 },
    { field: 'salary', width: 130, valueFormatter: p => typeof p.value === 'number' ? `$${(p.value as number).toLocaleString()}` : '' },
    { field: 'rating', width: 100 },
    { field: 'location', width: 160 },
  ];
  readonly pinnedTop = computed(() => [{
    id: 0, name: 'Highest paid', email: '', department: 'Engineering', title: '', level: 5,
    salary: Math.max(...this.rows.map((r) => r.salary)), hireDate: new Date(), active: true, rating: 5, location: '-', notes: '',
  } as Employee]);
  readonly pinnedBottom = computed(() => [{
    id: -1, name: 'TOTAL', email: '', department: 'Ops', title: '', level: 1,
    salary: this.rows.reduce((s, r) => s + r.salary, 0), hireDate: new Date(), active: true, rating: 0, location: '-', notes: '',
  } as Employee]);
}
