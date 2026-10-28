---
name: prd-to-issues
description: Read docs/PRD.md and every doc in the repo, split the work into small, independently shippable GitHub issues with acceptance criteria, tests, dependencies and the requirements they cover, show the list for the owner's approval, then create them with the gh CLI with labels and a milestone per phase. Use after the PRD is agreed, or when it gains new requirements.
---

# Turn the PRD into issues

Each issue is one small piece of work that can be built, tested and merged on
its own. Follow the [golden rules](../golden-rules/SKILL.md) throughout.

## 1. Read first

1. Read `docs/PRD.md` in full. If it is still the placeholder, or not marked
   agreed, stop and suggest the write-prd skill.
2. Read every other doc: everything in `docs/` (plans, decisions, ADRs),
   `AGENTS.md`, the golden rules, `README.md`.
3. Look at the code and tests to see which requirements already work, so you
   don't plan work that is done.
4. Read the existing issues, labels and milestones, so you never make
   duplicates:

   ```sh
   gh issue list --state all --limit 200 --json number,title,state,labels,milestone,body
   gh label list
   gh api repos/{owner}/{repo}/milestones --jq '.[].title'
   ```

## 2. Split the work

- One issue per small, shippable piece: usually one requirement, or one slice
  of one screen. If an issue needs more than about a day, or more than one
  pull request, split it.
- Design slices around clean domain modules (`src/lib/<domain>/`) so each file stays well within the repo's refactor triggers (routes ≤ 120 code lines, `src/lib/` files ≤ 200 code lines, functions ≤ 45 code lines, ≤ 8 implementation files per folder, and ≥ 90% per-file unit test coverage).
- Put foundations first (data, then the screens that use it).
- Each issue covers at least one requirement; every requirement in the
  current phase is covered by at least one issue.
- No issue for work the code already does; note it as "already done (R3)".

Each issue body uses this outline:

```markdown
## Why

<One or two sentences in plain English: who it helps and how.>

## Covers

R2, R5 (docs/PRD.md)

## Acceptance criteria

- [ ] <Something a person can see or a test can check.>
- [ ] Readable at 1440, 1024, 700, 390 and 320 wide (screens only).

## Tests that prove it

- Unit: <which behaviour, which file>
- Browser: <which flow, desktop and phone>

## Depends on

#<n> <title>, or "Nothing".

## Notes

<Docs to update, mockup needed (yes/no), open questions.>
```

Title: a short plain-English outcome ("Guests can join with a code"), not a
task ("Implement join endpoint").

## 3. Show the list and wait for approval

Show the owner the whole list before creating anything: for each issue its
title, the requirements it covers, the phase, its labels and what it depends
on, plus any requirement left uncovered. Then ask (multiple choice,
recommendation first) whether to create them all, change some first, or
stop. **Create nothing until the owner approves.** Approval covers only the
list they saw; show it again if you change it.

## 4. Create them

1. Labels, created only if missing: `phase-<n>` for each phase, and kind
   labels such as `screen`, `data`, `test`, `docs`.

   ```sh
   gh label create phase-1 --description "PRD phase 1" --color 0E8A16
   ```

2. One milestone per PRD phase, created only if missing, titled like
   `Phase 1 — <phase name from the PRD>`:

   ```sh
   gh api repos/{owner}/{repo}/milestones -f title="Phase 1 — <name>" -f description="docs/PRD.md section 12"
   ```

3. Create issues in dependency order so "Depends on" can use real numbers.
   Write each body to a temporary file and pass it with `--body-file`:

   ```sh
   gh issue create --title "<title>" --body-file <file> --label phase-1,screen --milestone "Phase 1 — <name>"
   ```

4. Read back what was made (`gh issue list --milestone "<milestone>"`) and
   check every approved issue exists once, with its labels and milestone.

## 5. Keep docs in step and report

- If splitting showed a requirement that is unclear, not testable or
  missing, don't invent it: list it for the owner and suggest the write-prd
  skill to fix the PRD.
- Report the issues created (number and title), which requirements each
  covers, any requirement not covered, and anything that failed.
