# Test report — Phases 2-6 features (ready for user testing)

Date: 2026-05-14
Driver: dev server compile ✅ + smoke-load ✅ (HTTP 200 on all routes). End-to-end Playwright passes deferred to the user's testing session.

The dev server is running at `http://localhost:4200` with the following demo routes:

| Route | Feature(s) under test | Manual steps |
|---|---|---|
| `/editing` | Cell editing — built-in text / number / date / select / checkbox / largeText; undo / redo | Double-click any cell. Try Tab to commit-and-move. Edit a few cells then `Ctrl/Cmd+Z` twice. |
| `/advanced-filtering` | Per-column filter popups + floating filter row (text / number / date) | Click ⏷ button in a header. Pick `inRange` for level/salary. Type in the floating filter under a column. |
| `/grouping` | Multi-level row grouping + aggregation | Click "Group by department + level". Click group rows to expand/collapse. Check sum/avg on group rows. |
| `/tree` | Tree data via `getDataPath` | Click folders to expand/collapse the hierarchy. |
| `/master-detail` | Per-row expandable detail panel | Click ▸ in the leftmost cell of any row to expand. |
| `/range` | Range selection + clipboard copy | Click-drag a rectangle of cells. Press Ctrl/Cmd+C. Paste into a spreadsheet to confirm TSV. |
| `/row-drag` | Managed row reorder via drag | Drag any row by the ⋮⋮ handle on the left to a new position. |
| `/sidebar-statusbar` | Right side bar with Columns + Filters panels; status bar | Click ☰ in toolbar. Toggle column visibility. See status bar update with selected / filtered / total / sum / avg of salary. |
| `/sparklines` | Inline SVG line / bar / area sparklines via `cellRenderer` | Just inspect. Confirm three different sparkline styles render in 24px-high cells. |
| `/export-state` | CSV export · grid state save/restore | Sort, filter, paginate. Click "Save state". Sort differently. Click "Load state" — original sort/filter/page restored. |
| `/themes` | Quartz / Material / Balham / brand themes · dark · RTL | Switch theme, toggle dark, toggle RTL — layout should mirror horizontally. |

## Other surfaces to exercise

- **Find** — type in the toolbar Find input on any route. The first match scrolls into view and is highlighted; navigate via `findNext` / `findPrev` API.
- **Context menu** — right-click any cell to see Copy / Copy with headers / CSV export / Expand all / Collapse all. Override with `[getContextMenuItems]`.
- **Keyboard shortcuts** — `F2` to edit, `Ctrl/Cmd+C` to copy, `Ctrl/Cmd+A` to select all, `Ctrl/Cmd+Z` undo, `Shift+Ctrl/Cmd+Z` redo.

## Compile health

- Initial bundle (demo shell): **17.95 KB** raw
- glassGRID library lazy chunk: **~222 KB** raw with all features
- Zero TypeScript errors, zero template errors after the rewrite.
- Phase 1 features (already shipped) re-verified live during integration.

## Known scope gaps (still pending)

- Column groups (nested header rows)
- Custom tooltip components (only the native `title` is shown currently)
- Paste-from-clipboard
- Excel (`.xlsx`) export
- Pivoting, server-side row model
- Integrated charts (only sparkline renderers ship)
- Fill handle (drag-fill series)
- Full-width rows, `colSpan` / `rowSpan` rendering
- Row resize handle (only column resize is wired)
- Theme builder UI
- AI toolkit / MCP server

These are explicitly listed in [ROADMAP.md](../../ROADMAP.md) and don't break the public API when later added.
