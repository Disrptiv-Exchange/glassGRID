import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-master-detail',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Master / Detail</h1>
      <p>Each row can expand to show custom detail content. The detail renderer receives the row object.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="master-detail-grid"
        [masterDetail]="true"
        [detailRowHeight]="160"
        [detailCellRenderer]="renderDetail"
        [autoGroupColumnDef]="{ headerName: '', width: 48 }"
        [columnDefs]="cols"
        [rowData]="rows"
      />
    </section>
  `,
})
export class MasterDetailFeature {
  readonly rows = makeRows(30);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'name', width: 200 },
    { field: 'department', width: 160 },
    { field: 'title', width: 180 },
    { field: 'salary', width: 140 },
    { field: 'location', width: 160 },
  ];
  renderDetail = (row: Employee) => `
    <div style="padding: 14px 18px;">
      <h3 style="margin: 0 0 8px; font-size: 14px;">${row.name} · ${row.title}</h3>
      <table style="border-collapse: collapse; font-size: 12px;">
        <tr><td style="padding: 2px 14px 2px 0;">Email:</td><td>${row.email}</td></tr>
        <tr><td style="padding: 2px 14px 2px 0;">Department:</td><td>${row.department}</td></tr>
        <tr><td style="padding: 2px 14px 2px 0;">Hired:</td><td>${row.hireDate.toLocaleDateString()}</td></tr>
        <tr><td style="padding: 2px 14px 2px 0;">Rating:</td><td>${row.rating}</td></tr>
        <tr><td style="padding: 2px 14px 2px 0;">Notes:</td><td>${row.notes || '—'}</td></tr>
      </table>
    </div>
  `;
}
