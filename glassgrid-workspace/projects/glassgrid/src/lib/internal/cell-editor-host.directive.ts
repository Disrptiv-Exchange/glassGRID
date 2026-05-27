import {
  ComponentRef,
  Directive,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Type,
  ViewContainerRef,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Hosts a custom cell-editor component dynamically — the ag-grid
 * `cellEditor` contract.
 *
 * Existing glassrun-frontend pages declare editable columns as:
 *   {
 *     editable: (e) => boolean,
 *     cellEditor: 'shiftDropdownComponent',     // string → components registry
 *     cellEditorParams: this.getShiftList.bind(this),
 *     onCellValueChanged: (e) => { … },
 *   }
 * and the editor components implement ag-grid's ICellEditorAngularComp:
 *   - agInit(params)     — params carries value/data/node/colDef/api/
 *                          column/stopEditing + the cellEditorParams extras
 *   - getValue()         — returns the committed value
 *   - afterGuiAttached() — optional, fired after the editor is in the DOM
 *                          (editors open their mat-select / datepicker here)
 *   - isPopup()          — optional, whether the editor renders as a popup
 *
 * This directive owns the ComponentRef so the grid can call `getValue()`
 * on commit and `afterGuiAttached()` after mount. It emits itself via
 * `(ggEditorReady)` so the parent grid can hold a reference and read the
 * value when the editor signals `stopEditing`.
 */
export interface CellEditorInstance {
  agInit?: (params: unknown) => void;
  getValue?: () => unknown;
  afterGuiAttached?: () => void;
  isPopup?: () => boolean;
  params?: unknown;
}

@Directive({
  selector: '[ggCellEditorHost]',
  standalone: true,
})
export class CellEditorHostDirective implements OnChanges, OnDestroy {
  /** Editor component class. Resolved by the grid (string-name lookup handled there). */
  readonly componentType = input.required<Type<unknown> | null>({ alias: 'ggCellEditorHost' });

  /** ag-grid-shaped editor params (value, data, node, colDef, api, column, stopEditing, +extras). */
  readonly params = input<Record<string, unknown> | null>(null, { alias: 'ggEditorParams' });

  /** Emits this directive instance once the editor is mounted, so the grid can call getValue(). */
  readonly ready = output<CellEditorHostDirective>({ alias: 'ggEditorReady' });

  private readonly vcr = inject(ViewContainerRef);
  private ref: ComponentRef<CellEditorInstance> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componentType']) this.mount();
  }

  ngOnDestroy(): void {
    this.ref?.destroy();
    this.ref = null;
  }

  private mount(): void {
    this.ref?.destroy();
    this.ref = null;
    const cmp = this.componentType();
    if (!cmp) return;

    this.ref = this.vcr.createComponent(cmp) as ComponentRef<CellEditorInstance>;
    const instance = this.ref.instance;
    const adapted = this.params() ?? {};

    // ag-grid style — agInit once.
    if (typeof instance.agInit === 'function') {
      instance.agInit(adapted);
    }
    // New-style components that declare `params` as a plain field.
    if ('params' in instance) {
      try { instance.params = adapted; } catch { /* readonly */ }
    }

    // Render the editor's template before afterGuiAttached so the editor's
    // ViewChild refs (mat-select, datepicker) are available.
    this.ref.changeDetectorRef.detectChanges();

    // Editors open their dropdown / datepicker inside afterGuiAttached.
    // Defer one microtask so the view is fully attached.
    queueMicrotask(() => {
      try { instance.afterGuiAttached?.(); } catch { /* editor opted out */ }
    });

    this.ready.emit(this);
  }

  /** Read the editor's committed value. Called by the grid when editing stops. */
  getValue(): unknown {
    const instance = this.ref?.instance;
    return typeof instance?.getValue === 'function' ? instance.getValue() : undefined;
  }

  /** Whether the editor wants popup rendering. */
  isPopup(): boolean {
    const instance = this.ref?.instance;
    return typeof instance?.isPopup === 'function' ? !!instance.isPopup() : false;
  }
}
