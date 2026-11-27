# Agent guide

A 4-person KTH DH2642/ID2216 HT26 project: an interactive app on an existing API, with Model-View-Presenter (MVP), MobX state and per-user Firebase persistence (React + Vite, deployed).

These are the rules you must never get wrong. Details live in the files below: read them only when the task needs them.

## Where things are

- `docs/INDEX.md`: **start here**. Map of all docs, deadlines and gaps.
- `CONTRIBUTING.md`: team workflow (git, PRs, CodeRabbit, writing issues, capture commands, agent models, adding course material).
- `docs/design.md`: the design system. Start with "Rules at a glance". Values in `src/styles/tokens.css`. Shared components on `#/components`.
- `.agents/skills/<name>/SKILL.md`: step-by-step guides with scripts (`.claude/skills/` points to the same guides).
- `docs/course/`: Canvas material, never edited by hand. Grep its frontmatter (`grep -r "^summary:" docs/course`). A `canvas.kth.se` link is a page we haven't saved: say so, don't guess. Quote `docs/course/project/grading-criteria.md` rather than guess what a grade needs.

## Skills: read the matching one first

Read and follow every matching skill, even if your tool didn't load it. Say which you used.

| Skill | Before |
|---|---|
| `ui-design` | any View, CSS, on-screen text, layout or UI review |
| `game-feel` | any animation or effect for a game event, or a new game event |
| `game-audio` | any sound effect, music or mix change |
| `mvp-feature` | any change to the model, a presenter, the API, persistence or routes |
| `user-testing` | planning or writing up a user test, and any school text |

## Write code a student can explain

Teachers question each developer about the code they commit, so:

- The **simplest solution that works**, following the course lab's patterns. Small functions with one job and clear names. No clever one-liners, deep nesting or helpers "for later".
- **No new libraries** unless the task needs one, and then say why.
- Comments explain *why*. One line at the top of each file says its role (model, presenter, view, API, persistence).
- Afterwards, give the developer a **short plain-language explanation** they could repeat to a teacher. If a piece can't be explained in 2–3 sentences, simplify it.

## Architecture rules (graded)

Full detail: `docs/course/project/keeping-presenter-simple.md`.

- **Model:** all data and the logic that changes it. One user action = one model method, as MobX actions. Side effects on the model do persistence (and can fetch).
- **Presenters:** read the model, pass props, and handle each view event with *one* model method. No fetch, persistence, component state, `useEffect` for data, or markup beyond one wrapping `<div>`/`<>` (a single Suspense loading image is OK).
- **Views:** UI only. Render props and fire `onXxx` events. All JSX and CSS live here. One file per View. Data comes through props, never global imports.
- **API** (`src/api/`): plain functions returning promises, like the lab's `dishSource.js`.
- **Auth:** the login presenter talks only to the auth service. Others react via `onAuthStateChanged`.
- **While a request is pending,** show its status and keep the rest usable.

## Design and UI

- **Before any UI work, follow the ui-design skill:** the design.md parts to read, and screenshots you look at before you're done.
- **Tokens only:** `var(--token)` for every colour, font, size, space, radius, shadow and duration. A missing token gets its own small PR first.
- Real elements (`<button>`, `<a>`, `<label>` + `<input>`), never a clickable `<div>`. Every data View handles loading, empty and error. Visible labels, `alt` on images, visible focus.
- No new UI library, icon set or font without team agreement (then list it in `README.md`, Third-party components).

## Code conventions

- Lab file names: `searchPresenter.jsx`, `searchResultsView.jsx` (camelCase). The model in PascalCase (`DinnerModel.js`).
- Callbacks: `...ACB` for event handlers, promise and side-effect callbacks, and `...CB` for array callbacks.
- 2-space indent, LF line endings. Code copied from the lab gets a comment saying so.

## Git, PRs and CodeRabbit

Every task: **issue → branch → PR → auto-merge.** Details and how to write issues and PRs: `CONTRIBUTING.md`.

1. Reuse the task's issue (`gh issue list`), or create a full one from `.github/ISSUE_TEMPLATE/task.md` with a milestone and area label. Check its board fields.
2. **Check for blockers before branching or editing.** Read the issue's GitHub **Blocked by** list (`gh api --paginate 'repos/{owner}/{repo}/issues/<number>/dependencies/blocked_by'`) and check the issue description for explicit prerequisites. Verify the status of each prerequisite. If any are still open, tell the developer which issue they chose and name every open blocker by number, for example, “Issue #42 is blocked by #17 and #23.” Wait until the blockers are resolved before starting work.
3. Branch from an up-to-date `main`: `feature/<issue>-<thing>`, `fix/<issue>-<thing>` or `docs/<issue>-<thing>`.
4. Push, open a PR into `main` with `Closes #<issue>`, fill in the PR template, then `gh pr merge <pr> --auto --merge`.

Never:

- Push to `main`, force-push, use `--no-verify`, merge by hand, or ask an admin to bypass the rules. Auto-merge is the only way a PR lands.
- Post `@coderabbitai approve` or `@coderabbitai resolve`, or use one-click bot fixes. Fix things yourself on the branch.
- Tick an acceptance criterion you didn't verify.

**Major or critical** CodeRabbit findings must be fixed. **Minor** ones and nitpicks: fix only if it's a one-line change in files you already touch. If you disagree, reply in the thread and let the developer decide. One issue, one branch, one PR: if the work grows, open a new issue.

## No AI attribution, ever

Nothing on GitHub may show that an AI agent was involved:

- Commit with the **developer's own git identity**. Never change `git config user.name` or `user.email`.
- **No co-author trailers** for any AI tool or agent, and no "Generated with…", "Made with…", "Assisted by…" or similar lines in commit messages, PR titles, PR descriptions or review replies.
- No mentions of AI tools in code comments, `README.md`, credits or docs.
- **Never add an AI tool or bot account as a collaborator**, reviewer, assignee or contributor.
- Before every commit or push, check the commit message and the staged diff for these, and remove any hit.

## Team rules

- Stay inside your task's files. Each presenter/view pair, the model, the API module and persistence have one owner (`README.md`, Team). Say explicitly when a change needs new model data or methods.
- Never commit `node_modules/`, `dist/`, `.env*` or API keys. Keep `minify: false` in `vite.config.js`.
- Update the Status and Third-party components sections of `README.md` when relevant. Both are graded.
- **Before starting an issue, check its `## Difficulty` against your model** (`CONTRIBUTING.md`, Agent models and usage). `easy` fits the repo's default. `hard` needs the stronger model or reasoning. On a mismatch, either way, say which to switch to and wait: the developer switches, or tells you to carry on.
