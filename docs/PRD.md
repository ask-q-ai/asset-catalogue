# Asset Catalogue — Product requirements

Status: Agreed by the owner on 2026-10-29
Last updated: 2026-10-29

## 1. Purpose

A shared catalogue of 3D models that fills itself: an agent or a person
describes a model, the catalogue finds the closest one it already has, and if
it has none it fetches a free model, saves it to GitHub and shows it on any
phone or computer.

## 2. Problem

Agents building Blank Canvas apps and games keep needing 3D models ("a
wooden barrel", "an oak tree"). Today each one searches or makes a model
from scratch, nothing is kept, the same model gets fetched again, and there
is no one place to see what exists, where it came from or what licence it
has.

## 3. Users

- **Giggles**, the owner: searches, previews and manages models, on his
  phone or his Mac. The only person who can sign in for now.
- **Agents** (Dave HQ, the build runner, Blender on the Mac): ask for models
  through the find and request tools (MCP).

## 4. Goals

1. A model asked for once is never fetched again: the next search finds it.
2. Search understands meaning: "a wooden barrel" finds "Barrel 01".
3. Every model has its source, licence and credit written down beside it.
4. Everything works from a phone once it runs in the cloud.
5. It costs nothing to run in step 1a apart from hosting.

## 5. Non-goals

1. No paid model generation in step 1a (step 2, after Giggles chooses a
   generator and a monthly cap).
2. No sources other than Poly Haven in step 1a (Poly Pizza and Sketchfab are
   later, if ever).
3. No uploading your own models yet.
4. No image search (searching by picture) yet.
5. No editing of models; the catalogue keeps and shows them as they are.

## 6. User stories

- As an agent, I want to describe a model and get the closest one with its
  file, licence and size, so that I don't fetch or make it again. (R6, R8, R15)
- As an agent, when nothing is close, I want to ask for it and get it once it
  is ready, so that the catalogue fills itself. (R8–R13)
- As Giggles, I want to search the catalogue on my phone and see thumbnails,
  so that I know what we have. (R16, R17, R21, R22)
- As Giggles, I want to turn a model round, see where it came from and
  download it, so that I can judge and use it. (R18, R20)
- As Giggles, when a search shows close matches, I want to pick one or ask
  for a new one, so that search gets better each time. (R7, R17)
- As Giggles, I want to archive a model without losing it, so that the
  catalogue stays tidy and nothing is gone for good. (R19)

## 7. Screens

Mockups are approved by Giggles before any screen is built (golden rule 22).
Designed at 390 wide first, then 700, 1024 and 1440.

### Sign in

Giggles signs in with GitHub. Anyone else sees "This catalogue is private"
and nothing else. (R16)

### Catalogue

Giggles searches with one box ("Describe the model…"). Results show as a grid
of thumbnails (2 across on a phone, 4–6 on a computer) with the title and a
licence badge. One "Filter" button opens a sheet with source, licence and
tag. Close matches show under "Close matches" with "Use this" and "Make a new
one". When nothing is close, "Find it" opens a request and shows its
progress. The footer says "Models from Poly Haven". (R17, R21, R22)

### Asset

The 3D preview (drag to turn, pinch to zoom), title, tags, size in metres,
triangle count, licence and credit, source, versions, "Download model",
"Copy link", and "Archive" or "Restore". (R18, R19, R20, R22)

## 8. Data

- **The models repository** (`ask-q-ai/3d-assets` on GitHub, private) owns
  every model version: `assets/<name>/v<n>/` holds `model.glb` (Git LFS),
  `thumbnail.webp` (512×512) and `asset.yaml`; `assets/<name>/aliases.yaml`
  holds accepted searches. Versions are never edited; archiving and
  restoring write a new version. Kept for good.
- **The database** (PostgreSQL with pgvector) holds copies of the repository
  for search, rebuilt from it at any time with `reindex`, plus open and
  recent requests, which only it owns. On the Mac the database holds test
  fixtures only; the real one exists only in the cloud, once approved.
- **Who can see it:** only Giggles (signed in) and agents on the Mac (phase
  1a). Models from Poly Haven are CC0, so the files themselves carry no
  personal data.

## 9. Constraints

- Development and testing on the Mac; at runtime everything runs in the cloud
  (Railway, once Giggles approves it) and nothing depends on the Mac.
- Node 22, SvelteKit, Svelte 5 runes, Tailwind 4, Babylon.js for the 3D
  preview, PostgreSQL 16+ with pgvector 0.8 or newer.
- The meaning search runs a small free model inside the service
  (`BAAI/bge-small-en-v1.5`, 384 numbers per text); no key, no per-use cost.
- Models from Poly Haven only, with 1k textures, packed into one GLB file.
- Commits go straight to `main` of the models repository, using a GitHub App
  installed only on `3d-assets` and `3d-assets-lfs-test`. The same app gives
  GitHub sign-in.
- GitHub's free Git LFS allowance: 10 GB stored, 10 GB downloaded a month,
  with the LFS budget at $0 so it can never charge.
- Settings come from environment variables; the service will not start
  without each one and names the missing one (golden rule 20). On the Mac
  the GitHub App's details live only in `~/.config/dave-hq/local.env`.
- Nothing paid. No Railway until Giggles says go.

## 10. Requirements

| ID  | Requirement                                                                                                                                                                                                                                                                          | Phase | How we test it                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | --------------------------------------- |
| R1  | The GitHub App's key can upload one file to Git LFS in `3d-assets-lfs-test` and commit it, and a fresh clone with `git lfs pull` gets back the identical file.                                                                                                                       | 1a    | Manual script, once, with the real app  |
| R2  | Every `asset.yaml` and `aliases.yaml` is read and written by one schema, and a file that does not match is refused with a message naming the wrong field.                                                                                                                            | 1a    | Unit                                    |
| R3  | The database has the tables in the plan (assets, versions, tags, accepted searches, meanings, requests, waiters), and the service refuses to start, saying why, if pgvector is older than 0.8.                                                                                       | 1a    | Integration (fixtures database)         |
| R4  | The service refuses to start if any required setting is missing, and names the missing setting.                                                                                                                                                                                      | 1a    | Unit                                    |
| R5  | The service turns text into 384 numbers with `bge-small-en-v1.5` running inside it, with no key and no outside call once the model is downloaded.                                                                                                                                    | 1a    | Unit (fake), integration                |
| R6  | Finding a model answers "match" (at or above `MATCH_THRESHOLD`, or an exact accepted search), "close matches" (up to 5, between `NEAR_THRESHOLD` and `MATCH_THRESHOLD`, with scores) or "nothing close", over active models only.                                                    | 1a    | Unit, integration                       |
| R7  | Choosing "Use this" on a close match saves the search as an accepted search on that model (in the repository and the database), so the same search is a match next time.                                                                                                             | 1a    | Unit, integration                       |
| R8  | Asking for a missing model opens one request, or, if an open request already means the same thing, adds the caller to it and returns its id.                                                                                                                                         | 1a    | Integration                             |
| R9  | The worker searches Poly Haven only, skips models already in the catalogue, and takes the best CC0 model whose title and tags score at or above `MATCH_THRESHOLD`; otherwise the request ends with "No free model found".                                                            | 1a    | Unit (fake Poly Haven)                  |
| R10 | The worker downloads the 1k glTF only from Poly Haven's own download host, packs it into one GLB, and refuses it if it is over `MAX_GLB_MB`, fails the glTF validator or links to outside files; it records the triangle count and the size in metres with the base at ground level. | 1a    | Unit                                    |
| R11 | Each model gets a 512×512 WebP thumbnail drawn by the same 3D viewer as the Asset screen, from an internal page that takes only a model version id.                                                                                                                                  | 1a    | Browser                                 |
| R12 | Each new model version is one commit to `main` of the models repository with `model.glb` in Git LFS, `thumbnail.webp` and `asset.yaml`; a file GitHub already has is not sent again; if `main` moved meanwhile the request stops as "needs checking".                                | 1a    | Unit (fake GitHub); real once R1 passes |
| R13 | Indexing a committed version re-checks for a match, adds it to the database once (the same commit twice changes nothing), marks the request done and gives every waiting caller the model.                                                                                           | 1a    | Integration                             |
| R14 | `reindex` rebuilds every model, version, tag, accepted search and meaning in the database from the repository alone.                                                                                                                                                                 | 1a    | Integration                             |
| R15 | The find and request tools (MCP) answer only on the Mac itself (localhost) in phase 1a, with no key.                                                                                                                                                                                 | 1a    | Integration                             |
| R16 | Signing in with GitHub lets in only the accounts in `ALLOWED_GITHUB_USERS` (Giggles's `ask-q-ai`); anyone else sees "This catalogue is private".                                                                                                                                     | 1a    | Unit, browser (fake GitHub)             |
| R17 | The Catalogue screen searches by meaning and shows matches as a thumbnail grid with title and licence badge, a Filter sheet (source, licence, tag), close matches with "Use this" and "Make a new one", and "Find it" when nothing is close.                                         | 1a    | Browser                                 |
| R18 | The Asset screen shows a 3D preview you can turn and zoom by touch or mouse, the title, tags, size in metres, triangles, licence and credit, source, versions, "Download model" and "Copy link".                                                                                     | 1a    | Browser                                 |
| R19 | "Archive" and "Restore" each write a new version with the new status; nothing is deleted, and archived models leave search results.                                                                                                                                                  | 1a    | Unit, browser                           |
| R20 | Model files are sent with type `model/gltf-binary` and `X-Content-Type-Options: nosniff`.                                                                                                                                                                                            | 1a    | Unit                                    |
| R21 | Every screen's footer credits Poly Haven ("Models from Poly Haven").                                                                                                                                                                                                                 | 1a    | Browser                                 |
| R22 | Every screen passes the template's checks at 1440, 1024, 700, 390 and 320 wide (text ≥ 16px, line-height 1.5, controls ≥ 44px, no sideways scrolling, no console errors).                                                                                                            | 1a    | Browser                                 |
| R23 | `MATCH_THRESHOLD` and `NEAR_THRESHOLD` are set from about 50 real searches, each marked "same thing" or "not the same thing" by Giggles.                                                                                                                                             | 1a    | Manual, recorded in Decisions           |
| R24 | Secrets (the GitHub App's key and client secret, session keys) are never logged, committed or sent to the browser.                                                                                                                                                                   | 1a    | Unit, CI secrets scan                   |

## 11. Success measures

- Step 1a is done when: a real request fetches a free model from Poly Haven,
  it appears in `3d-assets` as three files, the catalogue shows it, and the
  thresholds are set from the labelled searches (R23). The phone part of
  this check happens once the app runs on Railway.
- A repeated search for a model already fetched is a match 100% of the time.
- $0 spent on generation and on GitHub in step 1a.

## 12. Phases

- **Phase 1a — the core, free models only, on the Mac:** R1–R24. R1 comes
  first; nothing is committed to `3d-assets` until it passes, and then only
  real Poly Haven models.
- **Phase 1b — sharing it safely:** per-agent keys for the tools, checking
  on a request, the Requests screen with "Try again" and "Stop", recovery
  after a crash, a stored copy of model files so browsers never load them
  from GitHub, and tests with many requests at once. Then Railway, once
  Giggles approves it.
- **Phase 2 — paid generation:** only after Giggles chooses a generator and a
  monthly cap; adds the Spending screen.
- **Later:** Poly Pizza (best for cartoon models) once its terms are
  confirmed, image search, Sketchfab by hand, uploading your own models.

## 13. Open questions

- The generator and the monthly cap, before phase 2.
- When to set up Railway (after phase 1a works on the Mac).

## 14. Decisions

- 2026-10-28: Setup choices — Railway up to $20 a month later; paid
  generation off; no generator yet; cartoon requests may find nothing for
  now; models on Giggles's free GitHub account with the LFS budget at $0;
  commits straight to `main`; GitHub sign-in; a GitHub App as the key for
  commits. Giggles in chat (wiki Decision D-2026-10-28-30).
- 2026-10-29: Step 1a approved ("Approve step 1a"). Giggles in chat (wiki
  Decision D-2026-10-29-01).
- 2026-10-29: "GitHub now, Railway later"; models repository `3d-assets`;
  app `asset-catalogue`; built by hand on the Mac. Giggles in chat (wiki
  Decision D-2026-10-29-05).
- 2026-10-29: Only Giggles may sign in; Poly Haven models use 1k textures;
  the catalogue fills only when a model is asked for; in phase 1a the tools
  answer only on the Mac with no key. Giggles in this app's planning chat,
  picked from choices.
- 2026-10-29 (decided by Dave, small): Phone checks wait for Railway; on the
  Mac screens are checked at 390 wide in the browser tests. In phase 1a the
  service fetches model files from GitHub when they are viewed; the stored
  copy comes in phase 1b.

- 2026-10-29: PRD agreed ("Agree it"), with the plainer on-screen words
  "Find it", "Download model" and "Models from Poly Haven" in place of the
  plan's "Find or make it", "Download GLB" and "Powered by Poly Haven".
  Giggles in this app's planning chat, picked from choices.

- 2026-10-29: Mockups of the Catalogue screen (matches, close matches,
  nothing close and "Find it", the Filter sheet) and the Asset screen, at 390
  and 1440 wide, approved ("Approve them"); `docs/mockups/catalogue-and-asset.html`.
  Giggles in this app's planning chat, picked from choices.

## 15. History

- 2026-10-29: Written from the J41 plan (`dave-hq`
  `docs/plans/2026-10-28-generative-3d-asset-cache.md`, branch
  `claude/bc-3d-cache-plan-717dc7`) and Giggles's answers.
- 2026-10-29: Agreed by Giggles.
