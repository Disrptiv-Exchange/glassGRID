import { Directive, ElementRef, OnDestroy, OnChanges, SimpleChanges, inject, input } from '@angular/core';

/**
 * Mounts a renderer-supplied `HTMLElement` (or any DOM `Node`) directly into
 * its host element, replacing whatever was there before.
 *
 * Why this exists — see also `GlassGridLinkCellComponent`:
 *   The legacy ag-grid `cellRenderer` contract supports renderers that return
 *   a fully-built DOM node carrying attached event listeners
 *   (`element.addEventListener('click', …)`). The library originally serialised
 *   such returns to `innerHTML` for delivery through `[innerHTML]=
 *   bypassSecurityTrustHtml(html)`. Two problems with that:
 *     1. Event listeners are lost — JS handlers can't be serialised through
 *        innerHTML. The rendered `<a>` looks clickable but the click is a no-op.
 *     2. `bypassSecurityTrustHtml(...)` returns a fresh SafeHtml wrapper every
 *        change-detection cycle, which Angular treats as "value changed" and
 *        forces a full DOM reset of the inner span on every CD pass. Real-user
 *        clicks fail because mousedown and mouseup land on different node
 *        instances (browsers refuse to fire `click` in that case).
 *
 * This directive sidesteps both. We hold the user's actual `Node` reference,
 * append it once, and only swap it when a NEW reference is supplied — Angular
 * change detection never touches the DOM inside the user-supplied node.
 *
 * Pair with `GlassGridComponent.cellRendererNode(...)`, which is memoised
 * per row/column so the same `Node` instance is returned across CD cycles
 * for the same value.
 */
@Directive({
  selector: '[ggCellNode]',
  standalone: true,
})
export class CellNodeDirective implements OnChanges, OnDestroy {
  readonly ggCellNode = input<Node | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private current: Node | null = null;

  ngOnChanges(_changes: SimpleChanges): void {
    const next = this.ggCellNode() ?? null;
    if (next === this.current) return;
    if (this.current && this.current.parentNode === this.host.nativeElement) {
      this.host.nativeElement.removeChild(this.current);
    }
    if (next) {
      this.host.nativeElement.appendChild(next);
    }
    this.current = next;
  }

  ngOnDestroy(): void {
    if (this.current && this.current.parentNode === this.host.nativeElement) {
      this.host.nativeElement.removeChild(this.current);
    }
    this.current = null;
  }
}
