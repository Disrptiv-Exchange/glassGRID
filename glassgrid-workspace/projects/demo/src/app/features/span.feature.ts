import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-span',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column / row span (typed)</h1>
      <p>ColumnDef accepts <code>colSpan</code> and <code>rowSpan</code> callbacks. Full visual span rendering requires a custom cell renderer template — these are typed in the API and consumers can implement them inline.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="span-grid"
        [columnDefs]="cols"
        [rowData]="rows"
      />
      <p style="opacity: 0.7; font-size: 12px;">Note: <code>colSpan</code>/<code>rowSpan</code> are wired through the API but full visual merging is a known limitation; cells render at their natural width. Use the <code>cellRenderer</code> to merge content visually.</p>
    </section>
  `,
})
export class SpanFeature {
  readonly rows = makeRows(20);
  readonly cols: ColumnDef<Employee>[] = [
    { field: 'id', headerName: '#', width: 70 },
    {
      field: 'name', width: 200,
      colSpan: (p) => (p.data as Employee).level === 5 ? 2 : 1,
    },
    { field: 'department', width: 140 },
    { field: 'title', width: 200 },
    { field: 'salary', width: 130 },
  ];
}
