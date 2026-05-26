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
    // declares one. Two paths:
    //   1. Modern signal-input components (declared with `input()`):
    //      use `ref.setInput('params', adapted)`.
    //   2. ag-grid-era components where `params` is just a plain class
    //      field (no @Input decorator): write directly to the instance.
    //
    // We DON'T call `setInput` unconditionally and catch the throw,
    // because Angular's NG0303 error fires from inside `setInput` BEFORE
    // the throw bubbles out — meaning the console gets polluted with
    // false-positive errors for every legacy filter component. Probe
    // for a registered input on the ComponentDef first; if not found,
    // skip straight to the direct assignment path.
    if ('params' in instance) {
      const cmpDef = (this.ref.componentType as { ɵcmp?: { inputs?: Record<string, unknown> } }).ɵcmp;
      const isSignalInput = !!cmpDef?.inputs && 'params' in cmpDef.inputs;
      if (isSignalInput) {
        try { this.ref.setInput('params', adapted); } catch { /* swallow */ }
      } else {
        // Plain field (ag-grid-style `params!: IFloatingFilterParams`).
        try { instance.params = adapted; } catch { /* readonly */ }
      }
    }

    // Notify with the current filter item right after mount so the
    // component can sync its UI to the existing filter state — but ONLY
    // when there's an actual filter value to sync. Many ag-grid-era
    // components implement `onParentModelChanged(null)` as
    // `selectedvalue = null`, which de-selects their "(All)" placeholder
    // option whose value is `""`. Skipping the no-op null call preserves
    // the initial state set by agInit (e.g. `selectedvalue = ""`).
    const initial = this.currentFilterItem();
    if (initial !== null && initial !== undefined) {
      this.notifyParentModelChanged();
    }

    // agInit assigns plain fields on the instance (this.label, this.values,
    // etc.). For default-strategy components Angular eventually picks these
    // up on the next CD pass, but the FIRST render can land *before* those
    // assignments are reflected in the template — visible as empty
    // placeholder text on dropdowns whose `label` is set inside agInit.
    // Explicitly trigger CD now so the component re-renders with the
    // post-agInit state.
    this.ref.changeDetectorRef.detectChanges();
  }

  private notifyParentModelChanged(): void {
    if (!this.ref) return;
    const instance = this.ref.instance;
    if (typeof instance.onParentModelChanged === 'function') {
      instance.onParentModelChanged(this.currentFilterItem());
      // Same reasoning as in mountComponent — onParentModelChanged is a
      // plain method call; Angular needs an explicit nudge to re-render
      // with the component's updated fields.
      this.ref.changeDetectorRef.detectChanges();
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
