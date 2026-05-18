# glassGRID — Project Instructions

You are helping build **glassGRID**, a lightweight Angular data grid that aims to cover the feature surface of ag-grid while staying tree-shakeable, modern, and easy to style.

> **New developer?** Run **`/onboardgridagent`** in Claude Code — it loads every piece of context (this file, ROADMAP, FEATURES, agents, install flow) and prints a current-state summary. The command is at [`.claude/commands/onboardgridagent.md`](.claude/commands/onboardgridagent.md).

## Current release status (2026-05-18)

- Published package: **`@disrptiv-exchange/glassgrid@0.4.8`** on GitHub Packages
- Built against **Angular 20.1.6** (`@angular/core@20.1.6`, ng-packagr 20.1.0). Peer deps `>=20.0.0 <22.0.0`.
- Single built-in theme: **glassRUN** (primary green `#329B2A`, Montserrat, 16–20px radii) — baked into the component's `:host`; no `@import` needed on the consumer side.
- Bundle: 248 KB raw / **49 KB gzipped** (full feature surface).
- 36/36 Playwright e2e routes green.

## Project layout

```
glassGRID/
├── ROADMAP.md                  # pending features (source of truth for what's left)
├── FEATURES.md                 # shipped features with human-readable descriptions
├── README.md                   # repo entry point for external developers
├── docs/                       # user manual: getting-started, api-reference, recipes, theming, …
├── .github/workflows/
│   └── publish.yml             # auto-publishes on v* tag push (GitHub Packages)
├── .claude/
│   ├── CLAUDE.md               # this file
│   ├── commands/
│   │   └── onboardgridagent.md # `/onboardgridagent` slash command
│   ├── agents/
│   │   ├── grid-architect.md   # 15+ years senior grid engineer
│   │   └── grid-tester.md      # Playwright-MCP-driven feature tester
│   ├── memory/
│   │   ├── grid-architect/     # self-updating memory for the dev agent
│   │   └── grid-tester/        # self-updating memory for the test agent
│   └── scripts/
│       └── promote-feature.sh  # move a roadmap line to FEATURES.md
└── glassgrid-workspace/
    ├── projects/
    │   ├── glassgrid/          # the library (publishable to npm)
    │   └── demo/               # demo + feature gallery app
    ├── scripts/
    │   ├── e2e.mjs             # 36-route Playwright suite
    │   └── render-probe.mjs    # idle/scroll/hover CD profiler
    └── ...
```

## Stack & conventions

- **Angular** (latest stable, standalone components, no NgModule).
- **Signals** for reactive state (`signal`, `computed`, `effect`).
- **Modern inputs/outputs**: `input()`, `output()`, `model()` — no `@Input/@Output` decorators.
- **Strict TypeScript**: generics for row data (`<TRow>`), narrow types on column defs.
- **SCSS** with **CSS custom properties** for theming. Never hardcode colors / sizes.
- **Zero runtime dependencies** in the library (peer deps on Angular only).
- **Modular registration**: features must be opt-in / tree-shakeable. Importing `<glass-grid>` alone should NOT pull in editing, filtering, charts, etc. Use a feature-module pattern (provider functions like `provideEditing()`, `provideFiltering()`).
- **No NgModule**, **no Zone.js dependency if avoidable** (lean on signals + OnPush).

## Naming

- Library prefix: `glass-` (e.g. `<glass-grid>`, `<glass-column>`).
- Public APIs mirror ag-grid where sensible (`columnDefs`, `rowData`, `defaultColDef`, `gridApi`, `onGridReady`) so migration is easy, but only when ag-grid's name is genuinely the clearest one.
- Avoid `Ag` / `ag` references in code (don't claim affiliation).

## Workflow

1. **Pick a feature**: take the next unchecked item in `ROADMAP.md` (top-down, phase order).
2. **Implement**: scope to that single feature; don't bundle drive-by changes.
3. **Test**: use the `grid-tester` agent (Playwright MCP) to exercise it with sample data. Don't move on until tests pass.
4. **Promote**: mark the item `[x]` in `ROADMAP.md`, then `bash .claude/scripts/promote-feature.sh "<exact line text>"` (or move it manually) to `FEATURES.md` with a human-readable description.
5. **Update memory**: if you learned something reusable (decision, gotcha, pattern), append to the appropriate agent's memory.

## Publish + install flow

Publishes to **GitHub Packages** as `@disrptiv-exchange/glassgrid`. Consumers need a `.npmrc` and a PAT with `read:packages`:

```
@disrptiv-exchange:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

To release a new version:

```bash
# 1. bump version in glassgrid-workspace/projects/glassgrid/package.json
# 2. build + publish
cd glassgrid-workspace && rm -rf dist/glassgrid && npx ng build glassgrid
cd dist/glassgrid && {
  echo "@disrptiv-exchange:registry=https://npm.pkg.github.com"
  echo "//npm.pkg.github.com/:_authToken=$(gh auth token)"
} > .npmrc && npm publish ; rm -f .npmrc
# 3. commit + tag + push  (auto-publish workflow also fires on tag push)
git add ../../../projects/glassgrid/package.json
git commit -m "Release vX.Y.Z — <one-line summary>"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main && git push origin vX.Y.Z
```

## Build, run, test

From `glassgrid-workspace/`:

| Action | Command |
|---|---|
| Install deps | `npm install` |
| Build the library | `npx ng build glassgrid` |
| Serve the demo on :4200 | `npx ng serve` |
| Serve on a different port (if 4200 busy) | `npx ng serve --port 4250` |
| Run 36-route e2e | `node scripts/e2e.mjs` (or `GG_BASE=http://localhost:4250 node scripts/e2e.mjs`) |
| Profile change-detection | `node scripts/render-probe.mjs [route]` |

## Quality bars

- **Bundle size**: the core grid (no optional features) should stay under ~30KB gzipped.
- **Performance**: scroll a 100k-row dataset at 60fps on a 2020 MacBook Air.
- **A11y**: full keyboard nav + ARIA attributes from Phase 1 onward — don't bolt on later.
- **DX**: column defs are strictly typed against the row generic. `<TRow>` propagates through API, events, renderers.

## When in doubt

- Prefer **explicit, simple code** over clever generic abstractions.
- Prefer **CSS variables** over runtime style objects.
- Prefer **signals + computed** over RxJS `BehaviorSubject` chains.
- Prefer **standalone files per feature** (one folder per feature in `projects/glassgrid/src/lib/`).

## Don't

- Don't add features outside the current roadmap item.
- Don't introduce runtime deps without justification.
- Don't write multi-paragraph comments. Names + types should carry the meaning.
- Don't claim affiliation with ag-grid in code, docs, or marketing copy.
