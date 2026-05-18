---
description: Onboard a new developer's Claude Code agent to the glassGRID project — load all conventions, agent definitions, current release status, and workflow context.
---

# /onboardgridagent — full glassGRID context load

You are about to work on the **glassGRID** project. This command primes you with every piece of context needed to be productive immediately. Follow this onboarding sequence verbatim.

## 1. Read the project conventions

Read [`.claude/CLAUDE.md`](.claude/CLAUDE.md) first. It is the single source of truth for stack, naming, workflow, quality bars, and what NOT to do. Do not skip it. Adhere to it strictly.

## 2. Read the current status

Read [`ROADMAP.md`](ROADMAP.md) and [`FEATURES.md`](FEATURES.md). Note:

- `ROADMAP.md` tracks pending + partial items (`[ ]`, `[~]`, `[x]`). Pick from here when implementing.
- `FEATURES.md` is the human-readable shipped catalogue, organised by phase.
- The status header at the top of each file is the most recent authoritative state.

## 3. Read the agent definitions

Two specialist sub-agents are available and should be used proactively:

- [`.claude/agents/grid-architect.md`](.claude/agents/grid-architect.md) — senior grid engineer. Use for designing + implementing roadmap items.
- [`.claude/agents/grid-tester.md`](.claude/agents/grid-tester.md) — QA specialist that drives the demo via Playwright MCP. Use after every grid-architect feature, before promotion to FEATURES.md.

Each agent has self-updating memory under `.claude/memory/<agent>/MEMORY.md` — read its index when handing off a task.

## 4. Understand the publish + install flow

The library publishes to **GitHub Packages** as `@disrptiv-exchange/glassgrid`. Consumer projects install with:

```
# .npmrc in consumer project root:
@disrptiv-exchange:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
export GITHUB_TOKEN=ghp_xxx   # PAT with read:packages
npm install @disrptiv-exchange/glassgrid
```

To **publish a new version** (do not do this without an explicit request from the user):

1. Bump `glassgrid-workspace/projects/glassgrid/package.json` `version`.
2. `cd glassgrid-workspace && rm -rf dist/glassgrid && npx ng build glassgrid`
3. `cd dist/glassgrid && echo "@disrptiv-exchange:registry=https://npm.pkg.github.com" > .npmrc && echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> .npmrc && npm publish; rm .npmrc`
4. Commit, tag `vX.Y.Z`, `git push origin main && git push origin vX.Y.Z`.

The GitHub Action at `.github/workflows/publish.yml` also auto-publishes on `v*` tag push, so step 3 is only needed when publishing from local.

## 5. Read the developer-facing docs

To answer "how do I use this in my app?" questions:

- [`README.md`](README.md) — repo entry point, quick start, feature matrix, install instructions.
- [`docs/getting-started.md`](docs/getting-started.md) — step-by-step tutorial: install → first grid → columns → API → selection → editing → theming → perf → troubleshooting.
- [`docs/api-reference.md`](docs/api-reference.md) — `GridApi<TRow>` surface (~70 methods).
- [`docs/column-definitions.md`](docs/column-definitions.md) — every `ColumnDef<TRow>` property.
- [`docs/filtering.md`](docs/filtering.md), [`docs/editing.md`](docs/editing.md), [`docs/grouping.md`](docs/grouping.md), [`docs/export.md`](docs/export.md), [`docs/theming.md`](docs/theming.md), [`docs/recipes.md`](docs/recipes.md), [`docs/events.md`](docs/events.md).

## 6. Know the build + test commands

From the workspace root (`glassgrid-workspace/`):

| Action | Command |
|---|---|
| Install deps | `npm install` |
| Build the library | `npx ng build glassgrid` |
| Serve the demo (default :4200) | `npx ng serve` |
| Serve on a different port (when 4200 is taken) | `npx ng serve --port 4250` |
| Run the full e2e suite | `node scripts/e2e.mjs` (assumes demo on :4200; override with `GG_BASE=http://localhost:4250 node scripts/e2e.mjs`) |
| Render-tick probe | `node scripts/render-probe.mjs [route]` |

The e2e suite walks **36 feature routes** in headless Chrome for Testing. All 36 must stay green before any release.

## 7. Confirm onboarding

After reading everything above, produce a single concise message back to the user containing:

1. The current library version (read from `glassgrid-workspace/projects/glassgrid/package.json`).
2. The current Angular target (read the workspace `package.json`).
3. Last 5 commits from `git log --oneline -5` so the user knows what landed recently.
4. The next 3 unchecked items in `ROADMAP.md` so the user can pick one.
5. One sentence: "Onboarded. Ready for instructions."

Do **not** start changing code, opening files unrelated to onboarding, or running long commands until the user gives a specific instruction.

## Rules of engagement (recap from CLAUDE.md)

- Standalone components, signals only — **no NgModule**, no `@Input`/`@Output` decorators.
- One feature per change-set. Don't drive-by-fix unrelated things.
- Use `grid-architect` for design + impl, `grid-tester` for Playwright verification.
- Mark roadmap items `[x]` and move them to FEATURES.md only after grid-tester reports green.
- Don't claim ag-grid affiliation in code or docs.
- Don't introduce runtime deps. Peer deps on `@angular/core` + `@angular/common` only.
