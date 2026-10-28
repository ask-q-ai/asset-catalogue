---
name: golden-rules
description: Mandatory rules for any work in this app — the owner's data and decisions, the plan, words, secrets, code, screens and checking. Read before planning, building, reviewing or reporting on anything here.
---

# Golden rules

The owner's rules for building this app. They apply with `AGENTS.md` and win
over anything else in the repo. When a problem shows up that a rule would
have prevented, add the rule the same day (see "Adding a rule" at the end).

## 1. The owner's data and decisions

1. **Real data for anything the owner looks at.** Previews, screenshots and
   running apps shown to the owner use real data. Made-up data is only for
   automated tests, kept in test fixtures.
2. **Never put test, sample or temporary data where real data lives,** and
   never test against copies or throwaway instances of the owner's real
   systems.
3. **Never make the owner's decisions.** Never press buttons, approve,
   merge, accept terms or record a choice on the owner's behalf. A decision is
   recorded only from the owner's own words, with where and when they said it.
4. **Ask with choices.** Every question to the owner is multiple choice, one
   decision at a time, in plain English, with your recommendation first and
   one line on what each choice means. Ask only what changes what you do
   next; decide the rest yourself and say what you chose.
5. **Nothing is hard-deleted** unless the PRD says so. People's records are
   archived and can be restored. History is append-only; a correction is a
   new dated entry.
6. **Never stop, delete or replace work (a branch, a file, a running job, a
   pull request) without asking first.**
7. **Never save anything you might want to keep in `/tmp` (or system temp folders).**
   Plans, PRDs, projects, apps and working files live only in their permanent
   repository, workspace or project directories.

## 2. The plan

7. **`docs/PRD.md` is the plan.** Every change traces to a numbered
   requirement (R1, R2 …) or a GitHub issue that does. Work the plan does not
   cover needs the owner's agreement first, and then goes into the PRD.
8. **Read every doc before acting:** the PRD, everything in `docs/` (plans,
   decisions), `AGENTS.md`, this file and the README. Code is the final
   authority; when a doc and the code disagree, say so and fix the doc.
9. **Keep docs in step.** When behaviour changes, the PRD and the doc that
   describes it change in the same pull request.
10. **One owner per fact.** Each kind of data, format, schema, clock or queue
    has exactly one owner in the code. No duplicate parsers, schemas or
    parallel ways of doing the same thing; lists and totals are derived from
    the records, not stored twice.

## 3. Words

11. **Agreed names only.** Use the names the PRD uses for things. A new name
    for something a person sees needs the owner's agreement first.
12. **Plain English** in everything a person reads: no jargon or code names.
    Errors say what happened and what to do next.

## 4. Secrets and safety

13. **The owner approves every step that creates keys, changes access,
    spends money or accepts terms,** and each approval covers that step only.
14. **Secrets are never printed, logged, committed or sent to the browser.**
    They live in environment variables or `.env` files that git ignores. A
    secret that leaks is rotated, not just removed.
15. **People's data never crosses.** Each person's data is read and written
    only with their own access, using IDs from their own records.
16. **Local first.** Build and test on the owner's machine. Nothing is
    deployed or published until it works locally and the owner says go.

## 5. Code

17. **Inspect before writing.** Read the existing code, its callers and its
    tests, and reuse them. Say what exists and how you will reuse it before
    adding anything new.
18. **One file, one purpose.** When a file, function, or folder grows beyond the
    limits enforced by `npm run verify` (routes ≤ 120 code lines, `src/lib/`
    files ≤ 200 code lines, functions ≤ 45 code lines / complexity ≤ 10 / depth
    ≤ 3, and ≤ 8 non-test files per `src/lib/` directory), split it by domain
    responsibility into `src/lib/<domain>/` modules; never squeeze code onto
    fewer lines or use dumping-ground (`utils`, `helpers`, `common`, `shared`,
    `index`) or lazy-split (`orders2`, `orders-part2`, `orders-helpers`) names.
19. **Strict types.** No `any`, no unchecked casts, no `@ts-ignore`, no
    `eslint-disable`, no weakened compiler or lint settings. Outside input is
    `unknown` until it is checked.
20. **No invented defaults.** A missing setting stops with a plain message
    naming it and where to set it. Never guess requirements, behaviour or
    values: find out from the code, the docs or the owner.
21. **Every outside call has a time limit** and an `AbortSignal`; no retry
    loops.

## 6. Screens

22. **The owner approves a mockup before a screen is built or changed.**
    Approval covers only what they saw. Keep screens simple, with no two
    controls that do the same thing.
23. **Svelte 5 runes only.** Style with Tailwind CSS v4 utilities made from
    the tokens in `src/app.css`, which owns every colour, text size and
    control size. Never raw colours or Tailwind's default palette.
24. **Readable:** text at least 16px with line-height 1.5 and at least 7:1
    contrast, buttons and links at least 44px, and no text running over or
    sideways scrolling at 1440, 1024, 700, 390 and 320 wide. Wrap or scroll;
    never shrink text to fit.
25. **Everything that looks clickable is clickable,** and every count opens
    what it counts.

## 7. Checking

26. **Never claim something works without proof:** a test of the behaviour
    and a screenshot of the real screen. A running server or a page that
    loads is not proof.
27. **Test every change.** Add or update tests that would fail without the
    change. While working, run the tests for the files you changed, with a
    time limit; run `npm run verify` before every pull request.
28. **Report honestly:** say what passed, what failed and what was not
    checked. Keep tests, builds, screenshots and checks on real devices or
    services separate.
29. **One issue, one branch, one pull request.** The pull request links its
    issue (`Closes #n`). Never push to `main` and never merge without the
    owner.
30. **Commit only your own files.** When anyone else works in the same
    checkout, commit with explicit paths (`git commit -- <paths>`) and check
    `git show --stat` before pushing. Never commit `node_modules`, build
    output or secrets.

## Adding a rule

When a problem shows a missing rule, add it to the right section with the
next number, written as one short, plain instruction, and add a dated line to
the History saying what happened.

## History

- 2026-10-27: Expanded rule 18 with automatic refactor triggers (file/function size, complexity, folder density, and lazy-split filename bans).

- 2026-10-27: Added rule 31 after a plan and scaffolded app were placed in /tmp.

- 2026-10-27: Created with rules 1–30, adapted from the Dave HQ golden rules
  for any app made from the Blank Canvas starter template.
