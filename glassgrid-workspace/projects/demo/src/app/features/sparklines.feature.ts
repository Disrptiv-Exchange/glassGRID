import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef, areaSparkline, barSparkline, lineSparkline } from 'glassgrid';

interface MetricRow {
  id: number;
  name: string;
  values: number[];
}

function seq(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function makeMetrics(count: number): MetricRow[] {
  const r = seq(13);
  const names = ['CPU usage', 'Memory', 'Requests/s', 'Latency ms', 'Errors', 'Disk I/O', 'Network in', 'Network out'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length]!,
    values: Array.from({ length: 24 }, () => Math.round(r() * 100)),
  }));
}

@Component({
  selector: 'demo-sparklines',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Sparklines</h1>
      <p>Lightweight inline SVG sparklines (line, bar, area) via <code>cellRenderer</code>. Zero charting dependencies.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="sparklines-grid"
        [columnDefs]="cols"
        [rowData]="rows"
      />
    </section>
  `,
  styles: `::ng-deep glass-grid { --gg-row-height: 40px; }`,
})
export class SparklinesFeature {
  readonly rows = makeMetrics(10);
  readonly cols: ColumnDef<MetricRow>[] = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'name', headerName: 'Metric', width: 180 },
    { headerName: 'Line', width: 150, cellRenderer: (p) => lineSparkline((p.data as MetricRow).values, { width: 130, height: 24, stroke: '#3884ff' }) },
    { headerName: 'Bar', width: 150, cellRenderer: (p) => barSparkline((p.data as MetricRow).values, { width: 130, height: 24, fill: '#11a36b' }) },
    { headerName: 'Area', width: 150, cellRenderer: (p) => areaSparkline((p.data as MetricRow).values, { width: 130, height: 24, stroke: '#a445ff', fill: '#a445ff' }) },
  ];
}
