# How we work

Short rules so four people can work in one repo without stepping on each other. Most of them come straight from the course ([project advice](docs/course/project/project-advice.md), [project submission](docs/course/deliverables/03-project-submission.md)).

## Every time you start working

```sh
git pull
npm install      # only if package.json changed
```

## Git and pull requests

`main` is protected (see [Repo setup](#repo-setup-once-by-the-repo-owner)). You can't push to it directly, force-push it or delete it. Every change follows the same path: **issue → branch → pull request → review → auto-merge.**

1. **Open an issue** for the task: what to do and when it's done. Use the issue template.
2. **Create a branch from `main`** that starts with the issue number: `feature/<issue>-<thing>`, `fix/<issue>-<thing>` or `docs/<issue>-<thing>`, e.g. `feature/12-search-view`.
3. **Push the branch** (`git push -u origin <branch>`), then **open a pull request into `main`** and write `Closes #<issue>` in the description (the PR template has the line). The issue then closes when the PR merges. Keep PRs small: they get reviewed faster.
4. **Turn on auto-merge** right away: the "Enable auto-merge" button on the PR, or `gh pr merge <pr> --auto --merge`.
5. **CodeRabbit reviews automatically.** It requests changes when it finds problems and approves once they are fixed.
6. **Teammates are welcome to review.** If the repository plan doesn't support Automatic Approvals, a teammate must approve the pull request; otherwise, CodeRabbit's approval is sufficient.
7. **GitHub merges the PR by itself** when all of these are true:
   - the `CodeRabbit` check has passed
   - the PR has 1 approval: CodeRabbit gives it automatically when Automatic Approvals are available; otherwise, a teammate must approve
   - every review thread is resolved

   Pushing new commits removes the earlier approval, so CodeRabbit looks at the latest version.

Handling CodeRabbit comments:

- Fix the code and push. CodeRabbit re-reviews and resolves the threads it agrees are fixed.
- If you disagree, reply in the thread and explain why. You can also ask it questions by writing `@coderabbitai` in a comment.
- **Don't use `@coderabbitai approve` to skip the review.** CodeRabbit is set up so you can't do it on your own PR. Ask the group if CodeRabbit is broken.

Commits:

- **Commit your own code with your own git identity** (your KTH email). The course checks that everyone commits in reasonable proportion, and your individual reflection asks which code you wrote.
- Commit messages are short and imperative: `Add search view`, `Fix crash when API returns empty list`.
- Never commit `node_modules/`, `dist/`, `.env*` or API keys. `.gitignore` already covers these.

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
- **The visual design comes later.** We write [docs/design.md](docs/design.md) after the idea and mock-ups, so keep styling minimal until then. Even now, every data View needs loading, empty and error states, inputs need labels, and images need `alt`.
- **Keep code simple enough to explain.** Teachers question individuals about the code, so prefer clear, boring code over clever code.
- **DRY**, meaningful names, consistent formatting. `.editorconfig` sets 2-space indent and LF line endings.
- Code copied from the lab gets a comment saying so.

## AI tools

The course allows GenAI for code, **but you must understand everything you commit.** AI agents read [AGENTS.md](AGENTS.md) for the project rules.

When you let an agent commit, push, open PRs or merge for you:

- It commits with **your** git identity.
- **No co-author lines for AI tools**, and no "Generated with/Made with <tool>" lines in commits, PR titles, PR descriptions or comments. Check before you push and remove them.
- **Never add an AI tool or bot account as a collaborator.**

## Deploying

Deploy early and often (the course suggests Firebase Hosting). Don't deploy minified code: keep `minify: false` in `vite.config.js`.

## User testing

Every time you test with users (paper mock-up or deployed app), add a file in [docs/user-testing/](docs/user-testing/README.md). The final submission requires it.

## Repo setup (once, by the repo owner)

Use a **GitHub.com** repo. CodeRabbit Cloud doesn't connect to KTH's own GitHub server. The course accepts a public GitHub repo that the TAs can access.

1. **Install CodeRabbit** on the repo (coderabbit.ai → sign in with GitHub → add the repo). It reads [.coderabbit.yaml](.coderabbit.yaml).
   - Automatic Approvals requires CodeRabbit's **Essentials plan or higher**. Check that your plan, or a student/open-source offer, includes it. Without it, CodeRabbit still reviews but can't approve, so a teammate has to approve instead.
2. **Protect `main`:** in the repo go to Settings → Rules → Rulesets → New ruleset → **Import a ruleset**, and pick [.github/rulesets/protect-main.json](.github/rulesets/protect-main.json). It sets:
   - no deletion and no force-push
   - PRs required, with 1 approval (CodeRabbit's or a teammate's) and stale approvals dismissed on new commits
   - all review threads resolved
   - the `CodeRabbit` status check must pass
   - enforcement **Active** with an **empty bypass list**, so admins can't skip it either
3. **Allow auto-merge:** Settings → General → Pull Requests → tick **Allow auto-merge** and **Automatically delete head branches**.
4. After CodeRabbit has run once, open the ruleset and set the `CodeRabbit` check's source to the CodeRabbit app. Then nobody can fake the check.
5. Add your 3 teammates as collaborators with **Write** access. Write access is enough for reviews; don't give out Admin.

Rulesets on a **private** repo need GitHub Pro or Team. Pro is free with the GitHub Student Developer Pack. On a public repo they're free.
