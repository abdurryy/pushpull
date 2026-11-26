---
name: Task
about: Something to build, fix or document. Every branch and pull request starts from one of these.
---

## Priority
<!-- One of: P0 (blocks other work), P1 (needed for the next milestone), P2 (if there's time before the deadline).
     Copied to the project board automatically. -->
P1

## Target date
<!-- YYYY-MM-DD. Leave empty to use the milestone's due date. Set a milestone on the right as well. -->

## View/presenter
<!-- The pair this touches, e.g. "lobbyPresenter / lobbyView", or "none: model" / "none: persistence". -->

## Difficulty
<!-- easy: one View, one doc or a clear small fix. The agent's default model is enough.
     hard: game rules, Firebase sync, several layers at once, or visual design taste. Step up to the strong model
     (see CONTRIBUTING.md, AI tools). -->
easy

## Files to touch
<!-- The files to open first, one per line, e.g. src/views/lobbyView.jsx. Saves the agent searching the repo. -->
- 

## Brief
<!-- One or two sentences: what should change and why it matters to the player or the team. -->

## Description
<!-- The context. What exists today, what's missing or broken, which screen or flow it touches.
     Link mock-ups, course pages (docs/course/...) or related issues (#12). -->

## Approach
<!-- How to tackle it. Name the MVP layer for each part and the files you expect to touch:
     - Model (src/model/): which data and which action (one user action = one model method)
     - Presenter (src/presenters/): which props and which custom events
     - View (src/views/): what it renders, plus its loading, empty and error states
     - API (src/api/) or persistence (src/persistence/): which calls or which data is saved
     Keep it simple enough to explain to a teacher. -->

## Acceptance criteria
<!-- Checkable statements. The PR must meet every one. -->
- [ ] 
- [ ] 

## How to test
<!-- Steps someone can follow to see it work, including the loading, empty and error cases. -->
1. 
2. 

## Out of scope
<!-- What this issue deliberately does NOT do, so the PR stays small. -->
- 
