import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GlassGridComponent, type ColumnDef } from 'glassgrid';

interface WideRow { id: number; [k: string]: number | string }

function makeWide(cols: number, rows: number): { rows: WideRow[]; defs: ColumnDef<WideRow>[] } {
  const data: WideRow[] = [];
  for (let r = 0; r < rows; r++) {
    const row: WideRow = { id: r };
    for (let c = 0; c < cols; c++) row[`c${c}`] = Math.round(Math.random() * 10000);
    data.push(row);
  }
  const defs: ColumnDef<WideRow>[] = [{ field: 'id', headerName: '#', width: 70, pinned: 'left' }];
  for (let c = 0; c < cols; c++) defs.push({ field: `c${c}`, headerName: `c${c}`, width: 100 });
  return { rows: data, defs };
}

@Component({
  selector: 'demo-column-virt',
  standalone: true,
  imports: [GlassGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>Column virtualisation</h1>
      <p>{{ colCount() }} columns × {{ rowCount() }} rows. With column virtualisation on, only the horizontally-visible columns plus a buffer are in the DOM.</p>
      <div class="controls">
        <label>Cols:
          <select [value]="colCount()" (change)="setCols(+$any($event.target).value)" data-testid="col-count-select">
            <option [value]="20">20</option>
            <option [value]="100">100</option>
            <option [value]="500">500</option>
          </select>
        </label>
        <label>
          <input type="checkbox" [checked]="!suppress()" (change)="suppress.set(!$any($event.target).checked)" data-testid="col-virt-toggle" />
          Column virtualisation
        </label>
        <span data-testid="dom-col-count">DOM column count: live</span>
      </div>
      <glass-grid
        class="gg-theme-glassrun"
        data-testid="column-virt-grid"
        [columnDefs]="data().defs"
        [rowData]="data().rows"
        [suppressColumnVirtualisation]="suppress()"
      />
    </section>
  `,
})
export class ColumnVirtFeature {
  readonly colCount = signal(100);
  readonly rowCount = signal(500);
  readonly suppress = signal(false);
  readonly data = signal(makeWide(this.colCount(), this.rowCount()));
  setCols(n: number) {
    this.colCount.set(n);
    this.data.set(makeWide(n, this.rowCount()));
  }
}
