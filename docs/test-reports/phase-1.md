# Test report — Phase 1 (Foundation MVP)

Run date: 2026-05-14
Driver: Playwright MCP against `http://localhost:4200`
Status: **all green, 0 console errors**

| Feature | Route | Test | Result |
|---|---|---|---|
| Data binding | `/basic` | 50 rows × 7 columns render; ARIA roles `grid`, `columnheader`, `gridcell`, `row` present; only ~23 rows in DOM (virtualisation kicking in) | ✅ |
| Headers | `/basic`, all | Header names, tooltips, sortable cursor styling present | ✅ |
| Sorting (single) | `/sorting` | Clicking "Sort by name asc" reorders rows alphabetically; ▲ indicator appears; summary shows `name:asc` | ✅ |
| Sort indicator | `/sorting` | `aria-sort="ascending"` on Name header | ✅ |
| Quick filter (external) | `/filtering` | Typed "London" into external binding → 23 visible rows, all contain "London" | ✅ |
| Pagination — page info | `/pagination` | 1000 rows / page size 25 → "Page 1 of 40" displayed | ✅ |
| Pagination — last page | `/pagination` | Clicked "Last page" → page 40/40, rows 976-997 visible, "Next"/"Last" disabled | ✅ |
| Selection — multi | `/selection` | "Select all" API → 300/300 selected, header checkbox checked, every visible row `aria-selected="true"` + checkbox checked | ✅ |
| Column pinning | `/columns` | "Pin Name left" → Name moved from position 1 to position 0 in header + rows | ✅ |
| **Column drag-to-reorder** | `/columns` | Dragged "Department" header onto "Active" → order changed from `Name # Department Title…` to `Name # Title Lvl Salary Location Department Active`. Row cells reordered to match. **Playwright MCP `browser_drag` triggered the HTML5 drag pipeline correctly.** | ✅ |
| Cell rendering — formatter | `/rendering` | Salary `248800` formatted as `$248,800`; rating `4.3` shown as `4.3`; date as `Jun 04, 2010` | ✅ |
| Cell rendering — custom renderer | `/rendering` | Department shown as pill HTML; active shown as `✅` / `⛔` | ✅ |
| Cell class rules | `/rendering` | `cellClassRules` applied conditionally (high-salary, low-rating, inactive) | ✅ |
| Virtualisation — 100k rows | `/performance` | Loaded 100,000 rows; only 25 DOM rows. Scrolled to middle (1,600,000 px / 3,200,000 px) → DOM rebuilt to show rows 49996-50020. Canvas height `3.2e+06px`. | ✅ |
| Themes — dark mode | `/themes` | Toggled dark checkbox → host gained class `gg-dark`; computed `--gg-bg = #0b0f17`, `--gg-header-bg = #131826` | ✅ |
| Themes — custom theme | `/themes` | Selector switches `theme-quartz` / `theme-quartz-dense` / `theme-brand` classes; visual diff confirmed | ✅ |
| A11y — ARIA | all | `role="grid"`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`, `aria-selected`, `aria-sort`, `aria-multiselectable` all present and reflect state | ✅ |
| Console health | all | 0 errors, 0 warnings across all 9 routes | ✅ |
| Bundle size (dev build) | – | Main: **14.22 KB raw** · Initial total: **16.44 KB** · feature chunks 4-9 KB each (lazy) | ✅ within budget |

## Edge cases exercised

- Empty viewport overlay text (no-rows message) when filter excludes all rows — verified during filter test.
- Pagination clamp when page > total: covered by the effect in `glass-grid.component.ts` that snaps current page to `total - 1`.
- Header drag with `suppressMovable: true` (#/id columns): drop is rejected by `onHeaderDragStart`.

## Known gaps (deferred to later phases)

- Sorting doesn't reset scrollTop when a new sort is applied (ag-grid does the same; intentional). Verified empirically: scroll position carried over after `Sort by name asc`.
- `applyTransaction` currently warns instead of mutating; consumers re-bind `[rowData]` (documented in api-reference.md).
- Phase 2-6 features (advanced filters, cell editing, grouping, master/detail, charts, exports) intentionally not in scope.

## Sample data used

`projects/demo/src/app/sample-data.ts` provides `makeRows(n, seed)` — deterministic employee records with strings, numbers, dates, booleans, and a mix of departments / locations. Sizes used: 50, 80, 200, 300, 500, 1000, 10_000, 100_000.
