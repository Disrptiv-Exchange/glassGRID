import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface FileRow {
  path: string[];
  size: number;
  modified: string;
}

const FILES: FileRow[] = [
  { path: ['src'], size: 0, modified: '2026-05-14' },
  { path: ['src', 'app'], size: 0, modified: '2026-05-14' },
  { path: ['src', 'app', 'app.ts'], size: 580, modified: '2026-05-14' },
  { path: ['src', 'app', 'app.html'], size: 1200, modified: '2026-05-14' },
  { path: ['src', 'app', 'features'], size: 0, modified: '2026-05-14' },
  { path: ['src', 'app', 'features', 'home.ts'], size: 1800, modified: '2026-05-12' },
  { path: ['src', 'app', 'features', 'basic.ts'], size: 920, modified: '2026-05-12' },
  { path: ['src', 'app', 'features', 'editing.ts'], size: 1400, modified: '2026-05-14' },
  { path: ['src', 'styles.scss'], size: 320, modified: '2026-05-10' },
  { path: ['docs'], size: 0, modified: '2026-05-14' },
  { path: ['docs', 'index.md'], size: 2200, modified: '2026-05-14' },
  { path: ['docs', 'api-reference.md'], size: 4800, modified: '2026-05-14' },
  { path: ['package.json'], size: 980, modified: '2026-05-09' },
];

@Component({
  selector: 'demo-tree',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Tree data</h1>
      <p>Pass <code>[getDataPath]</code> to render a hierarchical view. Toggle a folder by clicking it.</p>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="tree-grid"
        [treeData]="true"
        [getDataPath]="getPath"
        [groupDefaultExpanded]="1"
        [autoGroupColumnDef]="{ headerName: 'Path', width: 320 }"
        [columnDefs]="cols"
        [rowData]="rows"
      />
    </section>
  `,
})
export class TreeFeature {
  readonly rows = FILES;
  readonly getPath = (r: FileRow) => r.path;
  readonly cols: ColumnDef<FileRow>[] = [
    { field: 'size', width: 110, valueFormatter: p => typeof p.value === 'number' && p.value > 0 ? `${p.value} B` : '' },
    { field: 'modified', headerName: 'Modified', width: 140 },
  ];
}
