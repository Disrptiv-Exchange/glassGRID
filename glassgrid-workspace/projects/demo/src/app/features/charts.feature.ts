import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { GlassGridComponent, type ColumnDef, type SelectionChangedEvent, type RowNode } from 'glassgrid';
import { makeRows, type Employee } from '../sample-data';

@Component({
  selector: 'demo-charts',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Integrated charts (lightweight)</h1>
      <p>Select rows; a bar + line chart renders from the selected salary values. Implemented as an inline SVG component — no chart library.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="charts-grid"
        [columnDefs]="cols"
        [rowData]="rows"
        [rowSelection]="'multiple'"
        [defaultColDef]="{ sortable: true }"
        (selectionChanged)="onSel($event)"
      />
      <div class="chart-row" data-testid="chart-output" [innerHTML]="chartSvg()"></div>
    </section>
  `,
  styles: `
    .chart-row {
      margin-top: 16px; padding: 18px;
      border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
      border-radius: 8px;
      display: grid; gap: 8px;
    }
    .chart-row svg { display: block; width: 100%; height: 240px; }
  `,
})
export class ChartsFeature {
  readonly rows = makeRows(60);
  readonly selected = signal<RowNode<Employee>[]>([]);
  readonly cols: ColumnDef<Employee>[] = [
    { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 44, suppressMovable: true, resizable: false },
    { field: 'name', width: 220 },
    { field: 'department', width: 160 },
    { field: 'salary', width: 130 },
    { field: 'rating', width: 100 },
  ];
  onSel(e: SelectionChangedEvent<Employee>) {
    this.selected.set(e.selectedNodes);
  }

  private readonly sanitizer = inject(DomSanitizer);
  readonly chartSvg = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.buildChartHtml()));

  private buildChartHtml(): string {
    const nodes = this.selected();
    if (!nodes.length) return '<em style="opacity:0.6">Select rows to render the chart.</em>';
    const values = nodes.map(n => n.data.salary);
    const labels = nodes.map(n => n.data.name);
    const w = 700, h = 240, pad = 30;
    const max = Math.max(...values);
    const min = 0;
    const range = max - min || 1;
    const bw = (w - pad * 2) / values.length;
    const points = values.map((v, i) => `${pad + i * bw + bw / 2},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
    const bars = values.map((v, i) => {
      const hgt = ((v - min) / range) * (h - pad * 2);
      const x = pad + i * bw + bw * 0.15;
      const y = h - pad - hgt;
      return `<rect x="${x}" y="${y}" width="${bw * 0.7}" height="${hgt}" fill="#3884ff" opacity="0.4" />`;
    }).join('');
    const lblText = labels.map((l, i) => `<text x="${pad + i * bw + bw / 2}" y="${h - 8}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">${escapeSvg(l).slice(0, 12)}</text>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${bars}
      <polyline fill="none" stroke="#11a36b" stroke-width="2" points="${points}" />
      ${values.map((v, i) => `<circle cx="${pad + i * bw + bw / 2}" cy="${h - pad - ((v - min) / range) * (h - pad * 2)}" r="3" fill="#11a36b" />`).join('')}
      ${lblText}
      <text x="${pad}" y="14" font-size="11" fill="currentColor" opacity="0.7">$0 – $${max.toLocaleString()} · ${nodes.length} rows</text>
    </svg>`;
  }
}

function escapeSvg(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
