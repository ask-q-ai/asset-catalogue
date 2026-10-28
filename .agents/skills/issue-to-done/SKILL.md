---
name: issue-to-done
description: Take one GitHub issue from open to a reviewed pull request — read the PRD, docs, AGENTS.md and golden rules, inspect the code, branch, build it with tests, run npm run verify, screenshot changed screens, update docs, and open a pull request that closes the issue. Never merges. Use when the owner asks to build, fix or do an issue.
---

# Take one issue to done

One issue, one branch, one pull request. Follow the
[golden rules](../golden-rules/SKILL.md) throughout; they win over this
skill.

## 1. Pick the issue

- If the owner named an issue, use it. Otherwise list open issues in the
  earliest open milestone whose dependencies are closed, and ask the owner
  (multiple choice, recommendation first) which to take.

  ```sh
  gh issue list --state open --milestone "<milestone>" --json number,title,labels,body
  gh issue view <n> --comments
  ```

- If an issue it depends on is still open, stop and say so.

## 2. Read before touching code

1. The issue, its comments and the requirements it covers in
   `docs/PRD.md`.
2. Every other doc: everything in `docs/` (plans, decisions, ADRs),
   `AGENTS.md`, the golden rules, `README.md`.
3. The code: the files that own this behaviour, their callers and their
   tests. Find what you can reuse.
4. Tell the owner in a few plain sentences what exists, what you will change
   and reuse, and anything unclear. If the issue, PRD and code disagree, or a
   fact is missing, ask (multiple choice) instead of guessing.
5. **Screens:** if the issue adds or changes a screen, show the owner a
   mockup and wait for their approval before building it.

## 3. Branch

```sh
git status                # stop if there is unrelated unfinished work; ask
git switch main && git pull --ff-only
git switch -c issue-<n>-<short-name>
```

## 4. Build it with tests

- Build only what the issue and its acceptance criteria ask for.
- Follow Svelte 5 Runes: `$state`, `$derived`, `$props()`, `Snippet` (`{@render ...}`). Never use `export let`, `$:`, `<slot>`, or `svelte/store`.
- Place state and domain logic in `src/lib/<domain>.svelte.ts` models with unit tests in Vitest; keep components thin.
- Parse all input data (form actions, API bodies) with `zod` schemas.
- Name each file after the single domain concept it owns; never create dumping-ground files (`utils.ts`, `helpers.ts`, `common.ts`, `shared.ts`, `index.ts`) or lazy-split suffixes (`orders2.ts`, `orders-part2.ts`, `orders-helpers.ts`).
- Respect automatic refactor triggers: routes ≤ 120 code lines, `src/lib/` files ≤ 200 code lines (300 total lines max), functions ≤ 45 code lines with complexity ≤ 10 and nesting depth ≤ 3, and at most 8 non-test files per `src/lib/` directory (group related modules into `src/lib/<domain>/`).
- Add tests that would fail without your change: unit tests next to the code
  (`src/**/*.test.ts`, meeting per-file coverage of ≥ 90% lines/functions/statements and ≥ 85% branches), browser tests in `tests/` for screens and flows
  (desktop and phone).
- Every screen Playwright test must call `expectScreenQuality(page, testInfo, name)` from `tests/quality.ts`.
- Use only the tokens in `src/app.css`; keep text at least 16px, line-height
  1.5, controls at least 44px.
- While working, run just the tests for what you changed, with a time limit
  (for example `timeout 300 npx vitest run src/lib/<file>.test.ts`).

## 5. Verify and look

1. Run the whole check, with a time limit:

   ```sh
   timeout 900 npm run verify
   ```

   This runs, in order:
   - `npm run check` (Svelte 5 runes and TypeScript compilation)
   - `npm run lint` (Prettier and strict type-checked ESLint)
   - `npm run knip` (zero dead code, zero unused exports, zero phantom packages)
   - `npm run test:unit` (unit, architecture, and PRD tests with coverage)
   - `npm run build` (production build)
   - `npm run test:e2e` (Playwright screen quality tests across 5 viewport widths)

   Fix failures; never weaken a test, a type or a lint rule to pass.

2. Screenshot every changed screen at 1440 and 390 wide (the browser tests
   save `home.png`-style shots in `test-results/`; add your own for new
   screens) and **look at them**. Check the acceptance criteria against what
   you see, not what you expect.

## 6. Update the docs

In the same branch: update `docs/PRD.md` (mark the covered requirements
done, add dated decisions the owner made), the README if commands or setup
changed, and any plan or doc in `docs/` that this change makes out of date.

## 7. Open the pull request

1. Commit only your own files, with explicit paths:

   ```sh
   git add -- <paths>
   git commit -m "<what changed, in plain English>" -- <paths>
   git show --stat
   git push -u origin HEAD
   ```

2. Open the pull request, linking the issue so merging closes it:

   ```sh
   gh pr create --title "<issue title>" --body-file <file>
   ```

   The body has: `Closes #<n>`; what changed and why; the requirements
   covered; how it was tested; screenshots; and **what was not checked**.

3. Wait for CI (`gh pr checks <pr> --watch`, with a time limit) and fix any
   failure on the same branch.

## 8. Report honestly — and never merge

Tell the owner: the pull request link; what passed (each verify step, CI);
what you looked at in the screenshots; and what was **not** checked (for
example real devices, real outside services, other browsers). Keep test
results, builds and screenshots separate; never call something done because
a server started or a page loaded.

**Never merge.** The owner reviews and merges; the issue closes itself when
they do. If they ask for changes, make them on the same branch.
