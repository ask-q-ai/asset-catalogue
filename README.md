# Asset Catalogue

A hardened SvelteKit starter template built so AI agents and humans can ship
software without context rot, monolith files, silent type escapes, or broken
screens. What the app is for, and what it must do, lives in
[docs/PRD.md](docs/PRD.md). How to work on it lives in [AGENTS.md](AGENTS.md)
and the [golden rules](.agents/skills/golden-rules/SKILL.md).

## Start a new app from this template

Keep `blank-canvas` as the single source of truth for the web-app harness
(skills, lint rules, architecture tests, CI, and screen quality gates), and
scaffold each new app into its own repository:

```sh
node scaffold.mjs ../my-app "My App"
cd ../my-app
npm ci
npx playwright install chromium
npm run verify
```

Then ask your agent to run the `write-prd` skill. Only create a separate base
template repository when the runtime itself is fundamentally different (for
example, a native mobile app or a Python worker), keeping the same 4-skill
workflow and `verify` philosophy across every template.

## What you need

- Node 22 (see `.nvmrc`). `npm ci` refuses other versions. On a Mac with
  Homebrew: `export PATH="$(brew --prefix node@22)/bin:$PATH"`.

## Run it

```sh
npm ci                 # install exactly what package-lock.json lists
npm run dev            # http://localhost:5173, reloads as you edit
```

To run the built app the way it runs in production:

```sh
npm run build
npm start              # node build, on http://localhost:3000 (set PORT to change)
```

## Test it

```sh
npm run test:unit          # Vitest unit tests (src/**/*.test.ts)
npm run test:e2e:install   # once: download the Chromium browser for Playwright
npm run build              # browser tests run against the built app
npm run test:e2e           # Playwright, desktop (1440 wide) and phone (390 wide)
```

The browser tests check that the home page has no sideways scrolling at
1440, 1024, 700, 390 and 320 wide, that text is at least 16px with
line-height 1.5, and that buttons and links are at least 44px. Screenshots
land in `test-results/`.

## Check everything

```sh
npm run verify
```

This runs, in order, and stops at the first failure:

1. `npm run check` — Svelte 5 runes and TypeScript type check (`svelte-check --fail-on-warnings`).
2. `npm run lint` — Prettier formatting, then strict type-checked ESLint (`noInlineConfig: true`, routes ≤ 120 code lines, files ≤ 200 code lines, functions ≤ 45 code lines, complexity ≤ 10, depth ≤ 3).
3. `npm run knip` — Dead code, unused exports, and dependency hygiene check.
4. `npm run test:unit` — Unit tests, architecture boundaries (no escape hatches, no circular imports, no cross-route imports, no dumping-ground or lazy-split filenames, ≤ 8 source files per `src/lib/` directory), and PRD validation with per-file V8 coverage (≥ 90% lines/functions/statements, ≥ 85% branches).
5. `npm run build` — Production build (`build/`).
6. `npm run test:e2e` — Playwright screen quality tests across 5 widths on desktop and phone.

`npm run format` fixes formatting. GitHub Actions (`.github/workflows/ci.yml`)
runs the same steps, plus a secrets scan, on every pull request and on pushes
to `main`.

## Agent workflow skills

| Skill           | When to use it                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `golden-rules`  | Read before planning, building, reviewing, or reporting on anything in the repo                            |
| `write-prd`     | Interview the owner with multiple-choice questions and write or update `docs/PRD.md` (`R1, R2 …`)          |
| `prd-to-issues` | Split agreed PRD requirements into small, independently shippable GitHub issues with milestones and labels |
| `issue-to-done` | Take one issue from open to a verified, screenshotted pull request (`Closes #n`) without ever auto-merging |

## Where things live

| Path              | What it is                                                          |
| ----------------- | ------------------------------------------------------------------- |
| `docs/PRD.md`     | The plan: purpose, users, numbered requirements (R1, R2 …)          |
| `src/app.css`     | Every design token (colours, text sizes, control size)              |
| `src/routes/`     | Pages                                                               |
| `src/lib/`        | Shared code and its unit tests                                      |
| `tests/`          | Playwright browser tests                                            |
| `.agents/skills/` | Golden rules and the write-prd, prd-to-issues, issue-to-done skills |
