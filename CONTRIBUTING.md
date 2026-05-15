# Contributing to glassGRID

Thanks for your interest. This file describes how the codebase is laid out, how to run it locally, the conventions to follow, and how to submit changes.

## Repository layout

```
glassGRID/
├── ROADMAP.md                  # pending features (source of truth for what's left)
├── FEATURES.md                 # shipped features with human-readable descriptions
├── docs/                       # user manual + technical docs
├── .claude/                    # agent definitions + memory (used during development)
└── glassgrid-workspace/
    ├── projects/
    │   ├── glassgrid/          # the publishable library
    │   └── demo/               # demo + feature-gallery app
    ├── scripts/                # build / screenshot / e2e helpers
    └── package.json
```

The library lives in `glassgrid-workspace/projects/glassgrid/`. The demo app under `projects/demo/` doubles as the e2e harness.

## Getting started locally

```bash
git clone https://github.com/Disrptiv-Exchange/glassGRID.git
cd glassGRID/glassgrid-workspace
npm install
npx ng build glassgrid
npx ng serve              # demo app on http://localhost:4200
```

To run the Playwright-based end-to-end suite (36 routes):

```bash
node scripts/e2e.mjs
```

The script auto-builds the library, serves the demo, and exercises every feature route headlessly.

## Conventions

The repo follows the rules in [`.claude/CLAUDE.md`](.claude/CLAUDE.md). Highlights:

- **Angular** with **standalone components only**. No `NgModule`.
- **Signals everywhere** — `signal()`, `computed()`, `effect()`. No `BehaviorSubject` chains.
- **Modern inputs/outputs** — `input()`, `output()`, `model()`. No `@Input` / `@Output` decorators.
- **Strict TypeScript** with row generics (`<TRow>`) propagating end-to-end.
- **SCSS with CSS custom properties** — never hardcode colours, sizes, durations.
- **Zero runtime deps** in the library (peer deps on `@angular/core` + `@angular/common` only).
- **Modular registration** — features should be opt-in / tree-shakeable so importing `<glass-grid>` doesn't pull in editing, filtering, charts, etc.
- **No `Ag` / `ag-grid` references** in code, docs, or marketing copy. We mirror its public-API shape for familiarity but don't claim affiliation.

## Workflow

1. **Pick a feature** — take the next unchecked item in [ROADMAP.md](ROADMAP.md). Top-down, phase order.
2. **Implement** — scope to that single feature; don't bundle drive-by changes.
3. **Test** — add or extend a route in `projects/demo/src/app/features/` and verify with `node scripts/e2e.mjs`. All 36/36 routes must stay green.
4. **Promote** — mark the roadmap line `[x]`, then move it (or run `bash .claude/scripts/promote-feature.sh "<exact line>"`) into [FEATURES.md](FEATURES.md) with a one-line human-readable description.
5. **Commit** — small, focused commits. Conventional-style prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`) are preferred but not required.

## Quality bars

| Concern         | Bar                                                                    |
|-----------------|------------------------------------------------------------------------|
| Bundle size     | Core grid (no optional features) stays under ~30KB gzipped.            |
| Performance     | 100,000 rows scroll at 60fps on a 2020 MacBook Air.                    |
| Accessibility   | Full keyboard nav + ARIA from Phase 1 onward. Not bolted on later.     |
| DX              | Column defs strictly typed against the row generic. `<TRow>` propagates through API, events, renderers. |
| Tests           | 36/36 Playwright routes green before promotion.                        |

## Filing issues

Use the GitHub issue tracker. Include:

- Angular version
- glassGRID version
- A minimal reproduction (StackBlitz / repo / inline component)
- Screenshot or console output if relevant

For security issues, please email the maintainers privately before filing publicly.

## Pull requests

- Branch off `main`.
- Keep PRs scoped to one roadmap item.
- Include a `test plan` section listing the routes you verified.
- Add screenshots for any visual change.
- Don't widen the public API without a `// public` rationale in the PR description.
