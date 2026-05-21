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
 * Hosts a custom floating-filter component dynamically.
 *
 * Compared to `*ngComponentOutlet`, this directive owns the
 * `ComponentRef` so we can call lifecycle hooks (`agInit`,
 * `onParentModelChanged`) on the instance after creation — required for
 * ag-grid drop-in floating-filter components that implement the
 * `AgFloatingFilterComponent` contract.
 *
 * Two consumption styles are supported transparently:
 *  1. ag-grid style — component implements `agInit(params)` and
 *     `onParentModelChanged(parentModel)`. We invoke `agInit` once with the
 *     adapted params, and `onParentModelChanged` whenever the column's
 *     filter model changes externally.
 *  2. New (glass-grid) style — component declares `params` as an Angular
 *     input. We set it directly on the instance and let the component's
 *     change-detection wire pick up updates.
 */
@Directive({
  selector: '[ggFloatingFilterHost]',
  standalone: true,
})
export class FloatingFilterHostDirective implements OnChanges, OnDestroy {
  /** Component class to instantiate. Resolved by the parent grid (handles string-name lookup). */
  readonly componentType = input.required<Type<unknown> | null>({ alias: 'ggFloatingFilterHost' });

  /**
   * Adapted params object passed to the mounted component. Carries
   * `parentFilterInstance`, `column`, `colDef`, `context`, `value`, plus
   * any extras from `floatingFilterComponentParams`.
   *
   * Treated as a one-shot — agInit is called once on first creation with
   * this value. Subsequent updates are surfaced via `currentFilterItem`
   * (which drives `onParentModelChanged`).
   */
  readonly params = input<Record<string, unknown> | null>(null, { alias: 'ggFilterParams' });

  /**
   * Current filter-model item for this column. When this changes the
   * directive calls `onParentModelChanged(item)` on the instance (if the
   * method exists). Pass `null` when the filter is cleared.
   */
  readonly currentFilterItem = input<unknown>(null, { alias: 'ggCurrentFilterItem' });

  /**
   * Fired when the component invokes `parentFilterInstance(cb)` → `cb.onFloatingFilterChanged(type, value)`.
   * Parent grid translates this into a filter-model update.
   */
  readonly filterChanged = output<{ type: string | null; value: unknown }>({ alias: 'ggFilterChanged' });

  private readonly vcr = inject(ViewContainerRef);
  private ref: ComponentRef<{ agInit?: (p: unknown) => void; onParentModelChanged?: (m: unknown) => void; params?: unknown }> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componentType']) {
      this.mountComponent();
    } else if (changes['currentFilterItem'] && this.ref) {
      this.notifyParentModelChanged();
    }
  }

  ngOnDestroy(): void {
    this.ref?.destroy();
    this.ref = null;
  }

  private mountComponent(): void {
    this.ref?.destroy();
    this.ref = null;
    const cmp = this.componentType();
    if (!cmp) return;

    // ViewContainerRef.createComponent — gives us the instance handle that
    // *ngComponentOutlet doesn't expose. Required for the ag-grid lifecycle.
    this.ref = this.vcr.createComponent(cmp) as ComponentRef<{
      agInit?: (p: unknown) => void;
      onParentModelChanged?: (m: unknown) => void;
      params?: unknown;
    }>;

    const adapted = this.buildAdaptedParams();
    const instance = this.ref.instance;

    // ag-grid style — call agInit once.
    if (typeof instance.agInit === 'function') {
      instance.agInit(adapted);
    }

    // New (glass-grid) style — set the `params` field if the component
    // declares one. Safe whether it's a signal input or a plain property;
    // Angular's set-input handles signal-input writes correctly.
    if ('params' in instance) {
      try {
        this.ref.setInput('params', adapted);
      } catch {
        // Not a declared input — fall back to direct assignment (plain field).
        try { instance.params = adapted; } catch { /* readonly */ }
      }
    }

    // Notify with the current filter item right after mount so the
    // component can sync its UI to the existing filter state.
    this.notifyParentModelChanged();
  }

  private notifyParentModelChanged(): void {
    if (!this.ref) return;
    const instance = this.ref.instance;
    if (typeof instance.onParentModelChanged === 'function') {
      instance.onParentModelChanged(this.currentFilterItem());
    }
  }

  /**
   * Build the ag-grid-shaped params object. `parentFilterInstance` is a
   * closure that fires the `filterChanged` output, which the parent grid
   * listens to and translates into a real filter-model update.
   */
  private buildAdaptedParams(): Record<string, unknown> {
    const userParams = this.params() ?? {};
    return {
      ...userParams,
      parentFilterInstance: (cb: (instance: { onFloatingFilterChanged(type: string | null, value: unknown): void }) => void) => {
        cb({
          onFloatingFilterChanged: (type, value) => {
            this.filterChanged.emit({ type, value });
          },
        });
      },
    };
  }
}
