# How we work

Short rules so four people can work in one repo without stepping on each other. Most of them come straight from the course ([project advice](docs/course/project/project-advice.md), [project submission](docs/course/deliverables/03-project-submission.md)).

## Every time you start working

```sh
git pull
npm install      # only if package.json changed
```

## One-time setup for the agent check scripts

The skills' check scripts drive a real browser: the ui-design screenshots, the game-feel frame captures and the game-audio sound measurements (in `.agents/skills/*/scripts/`). Playwright comes with `npm install`. Its Chromium is a separate download, once per computer:

```sh
npx playwright install chromium
```

- Playwright is a dev dependency at an exact version, so it isn't part of the app or the build, and everyone uses the same browser build. When `package.json` changes its version, run the command above again.
- The scripts also need the dev server: keep `npm run dev` running in its own terminal while they run.
- If your coding agent asks for permission to use the network for these commands, allow it.

### Capture commands

| Command | What it saves |
|---|---|
| `npm run shots -- "/tv"` | Screenshots of one or more routes at small phone, phone, phone sideways, laptop and TV size |
| `npm run shots:controller` | The controller after "Enter controller", with the stick and buttons showing |
| `npm run frames -- "/components" --click="Team A eats" --selector=".gallery-board"` | Frames of an effect over time, plus one with reduced motion |
| `npm run frames:crash` | Frames of the crash on the gallery board |
| `npm run sounds` | Every sound effect and music track as a WAV file, with loudness warnings |

- `--sizes=laptop,tv` takes only the sizes you name (`phone-small`, `phone`, `phone-sideways`, `laptop`, `tv`). Pick the ones the screen is used at: every picture costs your agent tokens to read.
- `--click="Button text"` presses a button before the picture. Repeat it to press several, in order.
- `--name=<folder>` saves the run in its own folder. Without it, screenshots go in a folder named after the route and frames in one named after the button. Each run prints where its files are (the system temp folder, under `pushpull-screenshots`, `pushpull-frames` or `pushpull-audio`).
- In Git Bash, a route like `"/tv"` turns into a Windows path before the script sees it. Start the command with `MSYS_NO_PATHCONV=1`, or use PowerShell.

### Public route smoke test

After installing Playwright's Chromium, run `npm run test:routes` before sharing a preview. It starts its own local Vite server and a fresh browser, opens the homepage, follows its links to the keyboard demo, component gallery and phone sign-in, and starts a demo round. The command prints each route as it checks it and exits with an error if a check fails.

The test runs without Firebase credentials or emulators. It leaves the demo's optional weather field blank and keeps browser requests on the local server.

### Four-player room smoke test

After `npm install` and `npx playwright install chromium`, start the local Firebase emulators in one terminal. The Realtime Database emulator needs Java.

```sh
npx firebase-tools emulators:start --project demo-pushpull --only auth,database
```

In another terminal, run `npm run test:room`. It starts its own local Vite server, uses the Auth emulator's Google accounts, and opens one TV session and four phone-sized sessions in headless Chromium. It checks when the board unlocks, what the TV shows when phone inputs cancel, and whether a win adds one point and carries it into the next round. The output names each step and prints the final score. Rerun it against the same emulators to test a fresh room.

#### Drive the phones for a TV room you host

For an emulator playtest, start the emulators as above. Set `VITE_USE_FIREBASE_EMULATORS=true` in the shell that runs `npm run dev`, then open `/room` in your own browser. Sign in with a mock account, create an empty room, and copy its code into the command below. The runner serves its own copy of the app against the same emulators. Add `--headed` to show the four phone windows.

```sh
npm run test:room -- --room YOUR_CODE
```

For a hosted playtest, use an HTTPS pull-request preview whose hostname is in Firebase Authentication's authorized domains. Open `/room` on that preview and create an empty room. Set aside four distinct Google test accounts for Ada, Max, Bo and Kim, and use a separate account for the TV. Install Google Chrome for this mode.

```sh
npm run test:room -- --room YOUR_CODE --preview-url https://YOUR_PREVIEW.web.app
```

The hosted run opens visible Chrome windows so you can sign in manually. In each fresh window, choose **Continue with Google**, sign in with the designated test account, then return to the terminal and press Enter. Have any second-factor prompts ready. The runner keeps each phone in its own disposable browser context.

When all four phones are ready, choose **Open game board** and **Start round** on your TV, then press Enter in the terminal. Watch both teams cancel opposite inputs, return to idle, and then move briefly with matching inputs. Once the sticks are idle again, Ada taps Dash, Max taps Ping, Bo taps Shed, and Kim taps Hold up. The terminal logs each player's team, action and elapsed time.

Press Ctrl+C to stop a run early. The runner releases the sticks and uses **Leave room** on the test phones so you can reuse the seats. If a phone cannot confirm that it left, the runner reports the cleanup failure. On failures after playtest recording begins, the terminal prints a temporary folder containing per-phone PNGs and Playwright trace ZIPs. Open a trace locally with `npx playwright show-trace <path-to-zip>`. Recording starts after sign-in. Keep the files private because they can contain room and session data.

## Git and pull requests

`main` is protected (see [Repo setup](#repo-setup-once-by-the-repo-owner)). You can't push to it directly, force-push it or delete it. Every change follows the same path: **issue → branch → pull request → review → auto-merge.**

1. **Open an issue** for the task: what to do and when it's done. Use the issue template, fill in its Priority, Target date, View/presenter and Difficulty, and set a milestone and the applicable area label. Verify the values on the project board. If the workflow failed, run **Project board fields** from the Actions tab with the issue number, or run `node .github/scripts/fillProjectFields.mjs <issue-number>` with an authenticated GitHub CLI that can edit the project. Check the saved fields before starting the branch.
2. **Create a branch from `main`** that starts with the issue number: `feature/<issue>-<thing>`, `fix/<issue>-<thing>` or `docs/<issue>-<thing>`, e.g. `feature/12-search-view`.
3. **Push the branch** (`git push -u origin <branch>`), then **open a pull request into `main`** and write `Closes #<issue>` in the description (the PR template has the line). The issue then closes when the PR merges. Keep PRs small: they get reviewed faster.
4. **Turn on auto-merge** right away: the "Enable auto-merge" button on the PR, or `gh pr merge <pr> --auto --merge`.
5. **CodeRabbit reviews automatically.** It requests changes when it finds problems and approves once they are fixed.
6. **Teammates are welcome to review.** If the repository plan doesn't support Automatic Approvals, a teammate must approve the pull request; otherwise, CodeRabbit's approval is sufficient.
7. **GitHub merges the PR by itself** when all of these are true:
   - the `CodeRabbit` check has passed
   - the PR has 1 approval: CodeRabbit gives it automatically when Automatic Approvals are available; otherwise, a teammate must approve
   - nobody with write access has requested changes (CodeRabbit or a teammate). A change request keeps auto-merge waiting. CodeRabbit clears its own after your fix; a teammate's only clears when they approve the new version or dismiss their review, so ask them to look again

   Pushing new commits removes the earlier approval, so CodeRabbit looks at the latest version.

Handling CodeRabbit comments:

- **Major or critical** findings block the merge: CodeRabbit requests changes until they're fixed. Fix the code and push; CodeRabbit re-reviews and approves. (This needs Automatic Approvals. Without it, CodeRabbit only comments, and the teammate who approves must check that no major or critical finding is left open.)
- **Minor** findings and nitpicks are advice. Fix them if it's quick, otherwise leave them. They don't block the merge.
- If CodeRabbit keeps raising something the team has decided against, reply in the thread with the decision. It remembers that for later reviews.
- Fix comments yourself on your branch. Don't use one-click fix buttons from bots: they have reverted other work before.
- Still working? Open the PR as a **draft**. CodeRabbit waits until you mark it ready for review.
- If you disagree, reply in the thread and explain why. You can also ask it questions by writing `@coderabbitai` in a comment.
- **Don't use `@coderabbitai approve` to skip the review.** CodeRabbit is set up so you can't do it on your own PR. Ask the group if CodeRabbit is broken.

Commits:

- **Commit your own code with your own git identity** (your KTH email). The course checks that everyone commits in reasonable proportion, and your individual reflection asks which code you wrote.
- Commit messages are short and imperative: `Add search view`, `Fix crash when API returns empty list`.
- Never commit `node_modules/`, `dist/`, `.env*` or API keys. `.gitignore` already covers these.

## Writing issues and pull requests

CodeRabbit reads the linked issue and checks the PR against it, so **the issue is the spec**. Fill in every section of `.github/ISSUE_TEMPLATE/task.md`:

- **Priority:** `P0` (blocks other work), `P1` (needed for the next milestone) or `P2` (if there's time).
- **Target date:** `YYYY-MM-DD`, or empty to use the milestone's due date.
- **View/presenter:** the pair it touches (`lobbyPresenter / lobbyView`), or `none: model` / `none: persistence`.
- **Difficulty** and **Files to touch:** see the template's comments.
- Also set a **milestone** (`--milestone "Mid-project review"` or `"Final submission"`) and the applicable **area label** (`--label "area: controller"` etc.).
- **Brief:** one or two sentences on what changes and why.
- **Description:** what exists today, what's missing, which screen or flow it touches. Link mock-ups, `docs/course/` pages and related issues.
- **Approach:** the MVP layer of each part and the files you expect to touch: the model action, the presenter's props and events, the view with its loading, empty and error states, and any API call or saved data.
- **Acceptance criteria:** checkable statements (`- [ ]`), including the states a View must handle and accessibility where it applies (labels, `alt`, real buttons).
- **How to test:** numbered steps someone can follow, covering the loading, empty and error cases.
- **Out of scope:** what this issue won't do, so the PR stays small.

When opening a new issue on someone's behalf, ask whether they want it assigned to them unless they already gave an assignment preference. Leave the issue unassigned if they decline or have yet to reply.

With the CLI: `gh issue create --title "<what>" --body-file <brief.md>`. If an existing issue is thin, fill in the missing sections before you start. If a task is too big for one small PR, split it into several issues and link them.

**The pull request:** fill in `.github/pull_request_template.md`: `Closes #<issue>`, what changed per layer, each acceptance criterion with how it's met, the test steps you actually ran with what you saw, and the Visual work block. Don't tick a criterion you didn't verify. Say what's left instead.

**Minor CodeRabbit findings:** fix them only if it's a one-line change in files you already touch. Don't open follow-up commits just to please a nitpick.

## Who owns what

Split the work by **presenter/view pairs**. Then people work on different files and git conflicts are rare.

- Each pair, plus the API module, persistence and auth, has **one owner** (see the Team table in [README.md](README.md)).
- The **model has one owner**. Ask them before changing the model's data or methods, and tell everyone to pull afterwards.
- Want to change someone else's file? Tell them first, or open a PR and tag them.

## Code rules (from the course grading)

Full list: [keeping your presenter simple](docs/course/project/keeping-presenter-simple.md).

- **Presenters** connect model and view. No fetch, no persistence, no CSS or HTML beyond one wrapping `<div>`/`<>`, and no component state.
- **Views** only render props and fire custom events (`onSearchClick`, …). All JSX and CSS live here.
- **The model** holds the data *and* the logic. If a presenter's event handler calls more than one model method, that should be one model method.
- **Persistence** happens in model side effects, never in presenters.
- **Follow [docs/design.md](docs/design.md).** Style with the tokens in `src/styles/tokens.css` (`var(--token)`), never hard-coded colours, fonts or sizes. Run its PR checklist before opening a PR that touches UI. Every data View needs loading, empty and error states, inputs need labels, and images need `alt`.
- **Keep code simple enough to explain.** Teachers question individuals about the code, so prefer clear, boring code over clever code.
- **DRY**, meaningful names, consistent formatting. `.editorconfig` sets 2-space indent and LF line endings.
- Code copied from the lab gets a comment saying so.

## AI tools

The course allows GenAI for code, **but you must understand everything you commit.** AI agents read [AGENTS.md](AGENTS.md) for the project rules.

Agents also have **skills**: step-by-step guides with checks and scripts in [.agents/skills/](.agents/skills/). AGENTS.md tells every agent to read the matching one first, and you can also name one in your prompt ("use the game-audio skill"):

- **ui-design:** any screen or CSS. Brief first, design.md rules, then screenshots it must look at.
- **game-feel:** effects for game events. It captures an animation frame by frame so the agent can see it.
- **game-audio:** sound effects and music. It measures every sound, and asks a person to listen.
- **mvp-feature:** model, presenter, API and persistence work, with checks for the graded MVP rules.
- **user-testing:** planning and writing up user tests, plus the writing rules for school text.

### Agent models and usage

The repo sets cheaper defaults so we don't run out of usage. Your personal settings still win.

- **Claude Code** starts on `opusplan` (`.claude/settings.json`): Opus while planning, Sonnet while writing code. Override it for yourself in `.claude/settings.local.json` (ignored by git).
- **Codex** uses medium reasoning (`.codex/config.toml`). If your Codex version doesn't read project config, put `model_reasoning_effort = "medium"` in `~/.codex/config.toml`.
- **Step up only for hard issues** (`Difficulty: hard` in the issue): `/model opus` in Claude Code, or high reasoning in Codex. Switch back when the issue is done.
- **One issue per session.** Start a fresh session (or `/clear`) for each issue. A long chat costs more on every message and gives worse answers.
- If a cheap run comes out weak, step up and redo that part rather than running everything on the strongest model.

When you let an agent commit, push, open PRs or merge for you:

- It commits with **your** git identity.
- **No co-author lines for AI tools**, and no "Generated with/Made with <tool>" lines in commits, PR titles, PR descriptions or comments. Check before you push and remove them.
- **Never add an AI tool or bot account as a collaborator.**

## CI

Every pull request runs the **CI / Build** check ([.github/workflows/ci.yml](.github/workflows/ci.yml)): `npm ci`, `npm run lint` (if the script exists) and `npm run build`, plus a check that `vite.config.js` keeps `minify: false`. If it fails, open the check's log on the PR, fix it on your branch and push. Until the app is scaffolded it skips every step and passes.

## Deploying

The Firebase Hosting workflow builds and publishes the app on every push to `main`. Pull requests from branches in this repository get a temporary preview link in a comment. The production site is linked in README. Preview links can be used to try the UI, and Google sign-in on a preview requires that its hostname be added to Firebase Authentication's authorized domains.

Deploy early and often (the course suggests Firebase Hosting). Don't deploy minified code: keep `minify: false` in `vite.config.js`.

For a failed preview or a live release that needs recovery, follow the [deployment recovery runbook](docs/deployment-recovery.md).

## User testing

Every time you test with users (paper mock-up or deployed app), add a file in [docs/user-testing/](docs/user-testing/README.md). The final submission requires it.

## Adding course material

When someone provides saved Canvas pages (`.mhtml`/`.html`), convert each one to clean Markdown:

1. **Folder and name:** project pages go in `docs/course/project/<topic>.md`. Project assignments go in `docs/course/deliverables/NN-name.md`, numbered by due date. Use lowercase kebab-case and drop the Canvas course-name suffix.
2. **Content:** keep only the page body (no Canvas menus or buttons). Start with YAML frontmatter: `title`, `type` (page/assignment), `source` (Canvas URL), `saved` (date), `tags`, a one-line `summary`, and for assignments `due` (Stockholm time), `grading` and `submission`. Turn links to pages already in `docs/course/` into relative links. Canvas is the authority: `source:` is the original page and `saved:` the snapshot date.
3. **Update `docs/INDEX.md`:** add a row, update the deadlines for assignments, and remove the page from Gaps if it was listed.
4. Keep raw `.mhtml`/`.html`/`.pdf` files out of the repo.

## Repo setup (once, by the repo owner)

Use a **GitHub.com** repo. CodeRabbit Cloud doesn't connect to KTH's own GitHub server. The course accepts a public GitHub repo that the TAs can access.

1. **Install CodeRabbit** on the repo (coderabbit.ai → sign in with GitHub → add the repo). It reads [.coderabbit.yaml](.coderabbit.yaml).
   - Automatic Approvals requires CodeRabbit's **Essentials plan or higher**. Check that your plan, or a student/open-source offer, includes it. Without it, CodeRabbit still reviews but can't approve, so a teammate has to approve instead.
2. **Protect `main`:** in the repo go to Settings → Rules → Rulesets → New ruleset → **Import a ruleset**, and pick [.github/rulesets/protect-main.json](.github/rulesets/protect-main.json). It sets:
   - no deletion and no force-push
   - PRs required, with 1 approval (CodeRabbit's or a teammate's) and stale approvals dismissed on new commits
   - open review threads don't block the merge (change requests from CodeRabbit or a teammate do)
   - the `CodeRabbit` status check must pass
   - enforcement **Active** with an **empty bypass list**, so admins can't skip it either
3. **Allow auto-merge:** Settings → General → Pull Requests → tick **Allow auto-merge** and **Automatically delete head branches**.
4. After CodeRabbit has run once, open the ruleset and set the `CodeRabbit` check's source to the CodeRabbit app. Then nobody can fake the check.
5. **Project board token:** the "Project board fields" workflow copies Priority, Target date, View/presenter and Difficulty from each issue to the board. GitHub's built-in token can't edit a project owned by a personal account, so create a **classic** personal access token with the `project` and `public_repo` scopes (Settings → Developer settings → Personal access tokens → Tokens (classic)), and save it as the repository secret `PROJECT_TOKEN` (repo Settings → Secrets and variables → Actions). Without it the workflow only posts a notice.
6. Add your 3 teammates as collaborators with **Write** access. Write access is enough for reviews; don't give out Admin.

Rulesets on a **private** repo need GitHub Pro or Team. Pro is free with the GitHub Student Developer Pack. On a public repo they're free.
