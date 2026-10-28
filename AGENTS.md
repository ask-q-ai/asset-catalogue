# Working in Asset Catalogue

Before planning or changing anything, read and follow the
[golden rules](.agents/skills/golden-rules/SKILL.md). They win over anything
else in the repo.

## Core Architecture & Best Practices

- **The plan:** [docs/PRD.md](docs/PRD.md) says what the app is for and lists
  its numbered requirements (R1, R2 …). If it is still the placeholder, run
  the `write-prd` skill first before writing any code.
- **Svelte 5 Runes Only:**
  - Component props: `let { title, count = 0 }: Props = $props();`.
  - Local state: `let open = $state(false);`.
  - Computed values: `const total = $derived(items.length);` (never copy state in `$effect`).
  - Shared / domain state: Encapsulated classes or factories in `src/lib/<domain>.svelte.ts` using `$state` and `$derived`. Testable in Vitest without a browser.
  - Component composition: `let { children }: { children: Snippet } = $props();` with `{@render children()}`. Never `<slot />`.
  - Events: Callback props (`let { onselect }: { onselect: (id: string) => void } = $props();`). Never `createEventDispatcher` or `on:click`.
  - No `svelte/store`: `writable` and `derived` stores are forbidden.
- **Modular Boundaries:**
  - `src/lib/server/`: Server-only code (DB, secrets, external calls). SvelteKit refuses browser imports here.
  - `src/lib/`: Domain models, pure business logic, Zod schemas, components.
  - `src/routes/`: Thin routing, server `load` functions, and Form Actions with `use:enhance`. No cross-route imports.
  - No dumping grounds: `utils.ts`, `helpers.ts`, `common.ts`, `shared.ts`, `misc.ts`, barrel `index.ts`, and lazy-split suffixes (`orders2.ts`, `orders-part2.ts`, `orders-helpers.ts`) are forbidden. Name each file after the single domain concept it owns.
  - Refactor triggers (enforced in `npm run verify`): routes ≤ 120 code lines, `src/lib/` files ≤ 200 code lines (300 total lines max), functions ≤ 45 code lines with cyclomatic complexity ≤ 10 and nesting depth ≤ 3, at most 8 implementation files per `src/lib/` folder (group into `src/lib/<domain>/`), and ≥ 90% per-file unit test coverage.
  - No circular dependencies: `architecture.test.ts` blocks any import cycle in `src/`.
- **Validation & Timeouts at Boundaries:**
  - All form data, API bodies, and external responses are parsed with `zod`.
  - All outside HTTP/fetch calls must use an `AbortSignal` with budgets from `src/lib/server/timeouts.ts`.
- **Styling:**
  - `src/app.css` owns every design token through Tailwind CSS v4 `@theme`. Never use raw hex colors or arbitrary values.
  - Readable text (≥16px, line-height ≥1.5) and tap targets (≥44px) are mandatory.
- **Testing & Quality Proof:**
  - Fast domain unit tests in Vitest with coverage enforcement (`npm run test:unit`).
  - Real-browser quality tests in Playwright (`tests/quality.ts`: `expectScreenQuality(page, testInfo, name)`) checking zero console errors, zero sideways scroll across 5 viewport widths, text size, and touch targets.
  - Run `npm run verify` (typecheck, lint, knip, unit+coverage, build, e2e) before opening a pull request.
- **Commands:** Node 22 (`.nvmrc`).
  - `npm ci` — install dependencies.
  - `npm run dev` — start dev server.
  - `npm run verify` — run the full 6-gate quality pipeline.
