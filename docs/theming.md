# Theming

glassGRID does not bake colors, sizes, or fonts into its components. Every visual value is a CSS custom property scoped to the grid's host element. **Themes are CSS** — no JS, no build step.

## Apply a built-in theme

```scss
// styles.scss (global)
@import "glassgrid/themes/quartz.scss";
```

```html
<glass-grid class="gg-theme-quartz" …></glass-grid>
```

## Dark mode

Pass `[darkMode]="true"` or add the `gg-dark` class to the host:

```html
<glass-grid class="gg-theme-quartz" [darkMode]="isDark()" …></glass-grid>
```

You can also respect the OS preference by adding to your CSS:

```css
@media (prefers-color-scheme: dark) {
  glass-grid.gg-theme-quartz { /* override vars as needed */ }
}
```

## Custom theme

Define your own class and override the variables you care about:

```scss
glass-grid.theme-brand {
  --gg-accent: #ff4593;
  --gg-row-selected-bg: rgba(255, 69, 147, 0.14);
  --gg-row-height: 32px;
  --gg-border-radius: 4px;
  --gg-font: 13px/1.4 "JetBrains Mono", monospace;
}
```

```html
<glass-grid class="theme-brand" …></glass-grid>
```

## Variable reference

### Colors

| Variable | Default (light) | Purpose |
|---|---|---|
| `--gg-bg` | `#ffffff` | Grid background. |
| `--gg-fg` | `#14181f` | Default text color. |
| `--gg-muted-fg` | `#5a6270` | Secondary text (pagination, captions). |
| `--gg-border` | `rgba(0,0,0,0.08)` | All borders. |
| `--gg-header-bg` | `#f8fafc` | Header & toolbar background. |
| `--gg-header-fg` | `#14181f` | Header text. |
| `--gg-row-hover-bg` | `rgba(0,0,0,0.03)` | Row hover. |
| `--gg-row-odd-bg` | `rgba(0,0,0,0.015)` | Striping. |
| `--gg-row-selected-bg` | `rgba(56,132,255,0.12)` | Selected row tint. |
| `--gg-row-selected-fg` | `inherit` | Selected row text. |
| `--gg-accent` | `#3884ff` | Sort indicator, focus ring, primary accent. |
| `--gg-focus-ring` | `rgba(56,132,255,0.35)` | Visible focus halo. |
| `--gg-overlay-bg` | `rgba(255,255,255,0.7)` | Loading / no-rows overlay backdrop. |
| `--gg-flash-color` | `rgba(255,209,0,0.45)` | Cell change-flash color. |

### Sizing

| Variable | Default | Purpose |
|---|---|---|
| `--gg-row-height` | `36px` | Row height. |
| `--gg-header-height` | `40px` | Header height. |
| `--gg-cell-padding-x` | `12px` | Horizontal cell padding. |
| `--gg-cell-padding-y` | `0` | Vertical cell padding. |
| `--gg-border-radius` | `8px` | Outer rounding. |
| `--gg-font` | `13px/1.4 system-ui…` | Font shorthand. |

### Motion

| Variable | Default | Purpose |
|---|---|---|
| `--gg-anim-duration` | `180ms` | All hover / selection / focus transitions. |
| `--gg-anim-easing` | `cubic-bezier(0.2,0.7,0.2,1)` | Easing curve. |

> `@media (prefers-reduced-motion: reduce)` automatically zeroes `--gg-anim-duration`.
