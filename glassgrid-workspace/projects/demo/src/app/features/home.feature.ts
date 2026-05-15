import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'demo-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feature">
      <h1>glassGRID — feature gallery</h1>
      <p>A modern, lightweight Angular data grid. Each link below exercises a feature with realistic sample data.</p>
      <div class="card-grid">
        <a class="card" routerLink="/basic"><h3>Basic data binding</h3><p>Columns, rows, headers, default rendering.</p></a>
        <a class="card" routerLink="/sorting"><h3>Sorting</h3><p>Single &amp; multi-column with Shift / Ctrl modifiers.</p></a>
        <a class="card" routerLink="/filtering"><h3>Quick filter</h3><p>Case-insensitive substring match across visible columns.</p></a>
        <a class="card" routerLink="/pagination"><h3>Pagination</h3><p>Page size selector, navigation buttons, auto-page-size.</p></a>
        <a class="card" routerLink="/selection"><h3>Row selection</h3><p>Single, multi, and checkbox-driven selection.</p></a>
        <a class="card" routerLink="/columns"><h3>Column features</h3><p>Resize, reorder (drag), pin left/right, hide/show.</p></a>
        <a class="card" routerLink="/rendering"><h3>Cell rendering</h3><p>Value formatters, cell renderers, class rules, styles.</p></a>
        <a class="card" routerLink="/themes"><h3>Themes</h3><p>Quartz theme, dark mode, CSS-variable customisation.</p></a>
        <a class="card" routerLink="/performance"><h3>Performance</h3><p>100,000-row virtualised dataset; smooth scroll.</p></a>
        <a class="card" routerLink="/editing"><h3>Cell editing</h3><p>Text / number / date / select / checkbox editors with undo.</p></a>
        <a class="card" routerLink="/advanced-filtering"><h3>Column filters</h3><p>Per-column filter popup + floating filter row.</p></a>
        <a class="card" routerLink="/grouping"><h3>Grouping &amp; aggregation</h3><p>Multi-level row groups, sum / avg / count / min / max.</p></a>
        <a class="card" routerLink="/tree"><h3>Tree data</h3><p>Hierarchical rows via <code>getDataPath</code>.</p></a>
        <a class="card" routerLink="/master-detail"><h3>Master / Detail</h3><p>Custom expandable detail content per row.</p></a>
        <a class="card" routerLink="/range"><h3>Range selection</h3><p>Click+drag to select; Ctrl/Cmd+C to copy as TSV.</p></a>
        <a class="card" routerLink="/row-drag"><h3>Row drag</h3><p>Drag rows to reorder, managed by the grid.</p></a>
        <a class="card" routerLink="/sidebar-statusbar"><h3>Side bar + status bar</h3><p>Columns / filters panels, live aggregates footer.</p></a>
        <a class="card" routerLink="/sparklines"><h3>Sparklines</h3><p>Inline SVG line / bar / area mini-charts.</p></a>
        <a class="card" routerLink="/export-state"><h3>CSV export · State</h3><p>Download as CSV, save / restore JSON state.</p></a>
      </div>
    </section>
  `,
  styles: `
    .card-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;
    }
    .card {
      display: block; padding: 14px; border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
      border-radius: 10px; color: inherit; text-decoration: none;
      transition: border-color 150ms, transform 150ms, box-shadow 150ms;
    }
    .card:hover {
      border-color: #3884ff;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(56, 132, 255, 0.12);
    }
    .card h3 { margin: 0 0 6px; font-size: 15px; }
    .card p { margin: 0; color: color-mix(in srgb, currentColor 60%, transparent); font-size: 13px; }
  `,
})
export class HomeFeature {}
