# Cell editing

Make cells editable by setting `editable: true` (or a callback) on a column. Pick a built-in editor or supply your own.

## Quick start

```typescript
const cols: ColumnDef<Person>[] = [
  { field: 'name', editable: true, cellEditor: 'text' },
  { field: 'role', editable: true, cellEditor: 'select',
    cellEditorParams: { values: ['Engineer', 'Manager', 'Designer'] } },
  { field: 'salary', editable: true, cellEditor: 'number' },
  { field: 'hireDate', editable: true, cellEditor: 'date' },
  { field: 'active', editable: true, cellEditor: 'checkbox' },
  { field: 'notes', editable: true, cellEditor: 'largeText' },
];
```

## Built-in editors

| Key | Renders as | Notes |
|---|---|---|
| `'text'` | `<input type="text">` | Default for string columns. |
| `'number'` | `<input type="number">` | Parses to `number` on commit. |
| `'date'` | `<input type="date">` | Commits a `Date`. |
| `'select'` | `<select>` | Pass options via `cellEditorParams.values`. |
| `'checkbox'` | `<input type="checkbox">` | Commits a boolean. |
| `'largeText'` | `<textarea>` | Multi-line. |

## Editing flow

| Action | Default trigger |
|---|---|
| Start | Double-click cell · `Enter` · `F2` |
| Commit | `Enter` · `Tab` · blur (configurable via `[stopEditingWhenCellsLoseFocus]`) |
| Cancel | `Escape` |
| Move + commit | `Tab` (forward) · `Shift+Tab` (backward) |
| Single-click edit | `[singleClickEdit]="true"` |
| Disable click-to-edit | `[suppressClickEdit]="true"` |

## Custom editor

Pass a function returning a `CellEditor` (an HTMLElement plus optional hooks):

```typescript
{
  field: 'tag',
  editable: true,
  cellEditor: ({ value, commit, cancel }) => {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = String(value ?? '');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit(el.value as never);
      if (e.key === 'Escape') cancel();
    });
    el.addEventListener('blur', () => commit(el.value as never));
    return { element: el, focus: () => el.focus() };
  },
}
```

## Events

```typescript
@Component({
  template: `<glass-grid
    (cellEditingStarted)="onStart($event)"
    (cellEditingStopped)="onStop($event)"
    (cellValueChanged)="onChange($event)"
  />`,
})
class C {
  onStart(e: CellEditingStartedEvent<Person>) { /* e.oldValue */ }
  onStop(e: CellEditingStoppedEvent<Person>)  { /* e.valueChanged */ }
  onChange(e: CellValueChangedEvent<Person>)  { /* persist e.newValue */ }
}
```

## Undo / redo

Built-in via keyboard:
- `Ctrl/Cmd+Z` — undo last cell edit
- `Shift+Ctrl/Cmd+Z` or `Ctrl/Cmd+Y` — redo

Or imperatively: `api.undoCellEditing()` / `api.redoCellEditing()`.

## Read-only edit mode

When you don't want the grid to mutate the row data, set `[readOnlyEdit]="true"` and react to `(cellValueChanged)`:

```typescript
onChange(e: CellValueChangedEvent<Person>) {
  // call your store / API; the grid won't reflect the change until you re-bind [rowData]
  this.store.update(e.data.id, { [e.colDef.field!]: e.newValue });
}
```

## Cell change flash

Set `[enableCellChangeFlash]="true"` to highlight cells whose value just changed (driven by the `--gg-flash-color` CSS variable).
