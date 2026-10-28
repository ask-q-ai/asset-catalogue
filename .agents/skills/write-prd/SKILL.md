---
name: write-prd
description: Interview the owner with multiple-choice questions, one decision at a time, and write or update docs/PRD.md in the fixed outline with numbered, testable requirements (R1, R2 …). Use when the PRD is missing or still the placeholder, when the owner wants to plan the app or a new phase, or when requirements change.
---

# Write the PRD

The PRD (`docs/PRD.md`) is the plan every other skill builds from. This skill
finds out what the owner wants by asking, then writes it down in a fixed
outline. Follow the [golden rules](../golden-rules/SKILL.md) throughout.

## 1. Read first

1. Read `AGENTS.md`, the golden rules, `README.md` and the current
   `docs/PRD.md`.
2. Read every other doc in the repo: everything in `docs/` (plans, decisions,
   ADRs), any `*.md` at the top level, and the skills in `.agents/skills/`.
3. Look at the code: `src/routes/` (what screens exist), `src/lib/` (what
   data and logic exist) and the tests. Code is the final authority.
4. If a PRD already exists, you are **updating** it: keep every requirement
   number that exists (never renumber or reuse one), and mark removed ones
   "Withdrawn (date, why)" instead of deleting them.

Tell the owner in two or three plain sentences what you found and what you
will ask about.

## 2. Interview the owner

Ask **one decision at a time**, in plain English, always as multiple choice:

- Give 2–4 concrete choices. Put your recommendation first, marked
  "(Recommended)", and say in one line what each choice means for them.
- Use the question tool your helper has for clickable choices (for example
  `AskUserQuestion`). Never end a message with open questions written in
  prose.
- Build your choices from what you read: the docs, the code, and the owner's
  earlier answers. Always allow "Something else" so they can say it in their
  own words.
- Skip what the docs already settle; confirm it in one line instead.
- Don't ask about things that don't change the plan. Decide small things
  yourself and list them under "Decisions" for the owner to see.

Cover these, in this order:

1. **Problem** — what is wrong or missing today, and for whom.
2. **Users** — who uses it (kinds of people, how many, on what devices).
3. **Goals** — the two to five outcomes that make it worth building.
4. **Non-goals** — what it will deliberately not do (at least two).
5. **User stories** — "As a <user>, I want <thing> so that <reason>", for
   each kind of user.
6. **Screens** — each screen, who uses it, and what they do there.
7. **Data** — what is stored, who owns it, who can see it, how long it is
   kept, and what can be archived or restored.
8. **Constraints** — devices, offline use, sign-in, privacy, outside
   services, budget, deadlines, hosting.
9. **Success measures** — how the owner will know it works (numbers where
   possible).
10. **Phases** — what ships first, and what waits.
11. **Open questions** — anything the owner wants to decide later.

After each few answers, sum up in two lines what you have so far so the owner
can correct it.

## 3. Write `docs/PRD.md`

Use exactly this outline and these headings (the home page reads section 1,
so keep its heading and number):

```markdown
# <App name> — Product requirements

Status: <Draft | Agreed by the owner on YYYY-MM-DD>
Last updated: YYYY-MM-DD

## 1. Purpose

<One or two plain sentences: what the app is for and who it helps.>

## 2. Problem

## 3. Users

## 4. Goals

## 5. Non-goals

## 6. User stories

## 7. Screens

<One subsection per screen: who uses it, what they do, which requirements.>

## 8. Data

## 9. Constraints

## 10. Requirements

| ID  | Requirement              | Phase | How we test it                 |
| --- | ------------------------ | ----- | ------------------------------ |
| R1  | <One testable sentence.> | 1     | <Unit / browser test / manual> |

## 11. Success measures

## 12. Phases

<Phase 1, Phase 2 … each listing its requirement IDs.>

## 13. Open questions

## 14. Decisions

<Dated decisions, each with where the owner made it.>

## 15. History

- YYYY-MM-DD: <What changed and why.>
```

Rules for requirements:

- Number them R1, R2 … in order; never reuse or renumber.
- Each one is **one testable sentence** about behaviour a person can see or
  a test can check ("A guest can join with a 6-digit code"), not a task or a
  wish ("Make joining easy").
- Each names its phase and how it will be tested.
- Every user story and screen points to the requirements that deliver it.

## 4. Check with the owner

1. Show the owner the Purpose, Goals, Non-goals and the requirements table,
   and ask (multiple choice) whether to agree it, change something, or keep
   it as a draft.
2. Only when they agree, set `Status: Agreed by the owner on <date>` and add
   the decision under Decisions with where they said it.
3. Keep other docs in step: if the README, `AGENTS.md` or a plan in `docs/`
   now disagrees with the PRD, update it or list the disagreement for the
   owner.
4. Run `npm run test:unit` (it reads the Purpose section) with a time limit.
5. Report what you wrote, what is still open, and suggest the prd-to-issues
   skill as the next step.
