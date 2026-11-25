# Agent guide

This is a group project (4 developers) for KTH DH2642/ID2216 HT26 *Developing Mobile Applications*. We're building an interactive app on top of an existing API, using Model-View-Presenter (MVP), reactive application state and per-user persistence (Firebase).

**Status:** idea not chosen yet, no design direction and no code yet. `src/` gets created when we scaffold (React + Vite, see `docs/course/project/minimal-react-web-setup.md`).

## Where things are

```
├── README.md            ← what the app is, team, setup, structure, status
├── CONTRIBUTING.md      ← team workflow: git, PRs, CodeRabbit, ownership, code rules
├── .coderabbit.yaml     ← CodeRabbit review rules
├── .github/rulesets/    ← GitHub branch protection for main (import in repo settings)
├── .github/ISSUE_TEMPLATE/, pull_request_template.md  ← issue and PR templates
├── src/                 ← app code (not yet created; layout in README.md)
└── docs/
    ├── INDEX.md         ← START HERE: map of all docs + deadlines + gaps
    ├── design.md        ← design guidelines (template; filled in after the idea + mock-ups)
    ├── proposal.md      ← idea brainstorm + our proposal
    ├── user-testing/    ← one file per user test session
    └── course/          ← Canvas material (reference, never edit by hand)
        ├── project/       ← brief, advice, MVP rules, setup, examples
        └── deliverables/  ← 01-… to 04-…, numbered by due date
```

## Finding information

1. Read `docs/INDEX.md` first. It is short.
2. Every file in `docs/course/` has YAML frontmatter you can grep: `grep -r "^summary:" docs/course` (catalogue), `grep -rl "tags:.*persistence" docs/course` (by topic), `grep -r "^due:" docs/course` (deadlines).
3. A link that still points at `canvas.kth.se` goes to a page we haven't saved yet. Say so, don't guess its content.
4. Canvas is the authority. `source:` is the original page and `saved:` is the snapshot date.
5. **Grading:** `docs/course/project/grading-criteria.md` is the grading matrix. Check it when you plan features or judge whether something is "good enough", and quote it rather than guessing what a grade needs.

## Write code a student can explain

The course allows GenAI, but **every developer must understand and be able to explain the code they commit**. Teachers question individuals about the project code. So the code you write must be easy to read and easy to explain:

- Choose the **simplest solution that works**, and follow the patterns from the course lab over anything clever.
- **Small functions with one job** and descriptive names. No clever one-liners, no deep nesting, and no abstractions or helpers "for later".
- **No new libraries** unless the task needs one. If it does, say why.
- Comments explain *why*, not *what*. Put one line at the top of each file saying its role (model, presenter, view, API, persistence).
- After writing code, give the developer a **short plain-language explanation** they could repeat to a teacher: what each part does, and why it belongs in that layer.
- If you can't explain a piece of code in 2–3 sentences, simplify it.

## Architecture rules (graded, from the course)

Full detail is in `docs/course/project/keeping-presenter-simple.md`.

- **Model (application state):** holds all data and the logic that changes it. One user action = one model method. For an A, use a **state manager with actions** (e.g. MobX actions), and do all side effects (persistence) through it.
- **Side effects on the model** do persistence (and can do fetching). Presenters and views know nothing about persistence.
- **Presenters** read the model, pass props to views and handle the views' custom events by calling *one* model method. No fetch, no persistence, no component state, no `useEffect` for data logic, no HTML/CSS beyond a single wrapping `<div>` or `<>`. Suspense is the one exception: a single loading image is OK.
- **Views** are UI only. They render props and fire custom events named `onXxx` (e.g. `onSearchClick`). All JSX markup and CSS live here.
- **API module** (`src/api/`): plain functions that return promises, like the lab's `dishSource.js`. Use the course proxy if the API blocks browsers (CORS).
- **Auth:** the login presenter only talks to the auth service. Other parts react via `onAuthStateChanged`.
- **One module (file) per View, each with one clear role.** Views get data through props, never from global imports.
- **While an API request is pending, show its status and keep the rest of the app usable** (required for C and above).

## Design and UI

**The design direction is not decided yet.** `docs/design.md` is a template the team fills in after picking the idea and testing mock-ups. Until it's filled in:

- **Don't invent a visual style.** No colour schemes, fonts, themes or decorative CSS. Keep styling to the minimum layout a screen needs to work.
- Don't add a UI component library, icon set or font without the team agreeing. If one is added, list it under Third-party components in `README.md`. (Grades B and A need at least one user-visible component written by others. Router and suspense don't count.)

These rules don't depend on the look, so they apply now:

- Use real elements: `<button>` for actions, `<a>` for navigation, `<label>` + `<input>` for forms. Never a clickable `<div>`.
- Every View that shows data handles **loading, empty and error** as well as content.
- Every input has a visible label, every image has `alt`, and keyboard focus stays visible.

## Code conventions

- File names follow the lab: `searchPresenter.jsx` and `searchResultsView.jsx` in camelCase. The model is in PascalCase, like `DinnerModel.js`.
- Callback names follow the lab: `...ACB` for event handlers, promise callbacks and side-effect callbacks (`searchNowACB`, `gotDataACB`), and `...CB` for array callbacks (`map`, `filter`, `find`).
- 2-space indent, LF line endings (`.editorconfig`).
- Code copied from the course lab gets a comment saying so.

## Git, PRs and CodeRabbit

`main` is protected. Every change goes through a pull request that needs the `CodeRabbit` check to pass and one approval. Open review threads don't block it. CodeRabbit gives that approval automatically if the repository plan supports Automatic Approvals; otherwise, a teammate must approve. A teammate's approval also counts when Automatic Approvals are available.

Every task follows the same steps, in this order:

1. **Issue.** Reuse the issue for the task if there is one (`gh issue list`). Otherwise create one as a full brief (see "Writing an issue" below): `gh issue create --title "<what>" --body-file <brief.md>`. If an existing issue is thin, fill in the missing sections before you start.
2. **Branch** from an up-to-date `main`, named after the issue: `feature/<issue>-<thing>`, `fix/<issue>-<thing>` or `docs/<issue>-<thing>`.
3. **Push the branch, then open a pull request** into `main` with `Closes #<issue>` in the description: `git push -u origin <branch>`, then `gh pr create --base main --title "<what changed>" --body "Closes #<issue> ..."`.
4. **Auto-merge** on that PR right after creating it: `gh pr merge <pr> --auto --merge`. GitHub merges it by itself once CodeRabbit's check has passed, the PR has an approval (normally CodeRabbit's) and nobody has requested changes.

Rules for that flow:

- **Never push to `main`, never force-push, never use `--no-verify`.** Don't try to work around branch protection.
- **Never merge by hand** and never ask an admin to bypass the rules. Auto-merge is the only way a PR lands.
- **Major or critical** CodeRabbit findings block the merge: fix them in code and push. **Minor** findings and nitpicks are advice: fix them only if it's a one-line change in the files you're already touching, otherwise leave them. Don't open follow-up commits just to please a nitpick.
- If you disagree with a finding, reply in the thread with the reason and let the developer decide. **Never post `@coderabbitai approve` or `@coderabbitai resolve`**.
- Never use one-click bot fixes (CodeRabbit "Fix comments", Copilot autofix). Make fixes yourself on the branch, and check the diff doesn't undo other work.
- One issue, one branch, one PR. If the work grows, open a new issue rather than piling it into the same PR.

### Writing an issue

CodeRabbit reads the linked issue and checks the PR against it, so the issue is the spec. Use the sections of `.github/ISSUE_TEMPLATE/task.md`, all filled in:

- **Brief:** one or two sentences on what changes and why.
- **Description:** what exists today, what's missing, which screen or flow it touches. Link mock-ups, `docs/course/` pages and related issues.
- **Approach:** the MVP layer of each part and the files you expect to touch: the model action, the presenter's props and events, the view with its loading, empty and error states, and any API call or saved data. Follow the architecture rules above.
- **Acceptance criteria:** checkable statements (`- [ ]`). Include the states a View must handle, and accessibility where it applies (labels, `alt`, real buttons).
- **How to test:** numbered steps someone can follow, covering the loading, empty and error cases.
- **Out of scope:** what this issue won't do, so the PR stays small.

If the task is too big for one small PR, split it into several issues and link them.

### Writing the PR

Fill in `.github/pull_request_template.md`: `Closes #<issue>`, what changed per layer, each acceptance criterion with how it's met, and the test steps you actually ran with what you saw. Don't tick a criterion you didn't verify; say what's left instead.

## No AI attribution, ever

Nothing on GitHub may show that an AI agent was involved:

- Commit with the **developer's own git identity**. Never change `git config user.name` or `user.email`.
- **No co-author trailers** for any AI tool or agent, and no "Generated with…", "Made with…", "Assisted by…" or similar lines in commit messages, PR titles, PR descriptions or review replies.
- No mentions of AI tools in code comments, `README.md`, credits or docs.
- **Never add an AI tool or bot account as a collaborator**, reviewer, assignee or contributor.
- Before every commit or push, check the commit message and the staged diff for these, and remove any hit.

## Team rules that affect your edits

- Stay inside the files of the task you were given. Each presenter/view pair, the model, the API module and persistence have one owner (Team table in `README.md`).
- If a change needs new model data or methods, say so explicitly. The model owner coordinates model changes.
- Never commit `node_modules/`, `dist/`, `.env*` or API keys.
- Keep `minify: false` in `vite.config.js`. The course forbids deploying minified code.
- Update the Status and Third-party components sections of `README.md` when relevant. Both are graded.

## Adding course material

When someone provides saved Canvas pages (`.mhtml`/`.html`), convert each one to clean Markdown:

1. **Folder and name:** project pages go in `docs/course/project/<topic>.md`. Project assignments go in `docs/course/deliverables/NN-name.md`, numbered by due date. Use lowercase kebab-case and drop the Canvas course-name suffix.
2. **Content:** keep only the page body (no Canvas menus or buttons). Start with YAML frontmatter: `title`, `type` (page/assignment), `source` (Canvas URL), `saved` (date), `tags`, a one-line `summary`, and for assignments `due` (Stockholm time), `grading` and `submission`. Turn links to pages already in `docs/course/` into relative links.
3. **Update `docs/INDEX.md`:** add a row, update the deadlines for assignments, and remove the page from Gaps if it was listed.
4. Keep raw `.mhtml`/`.html`/`.pdf` files out of the repo.
