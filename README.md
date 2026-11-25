# Webb-prog-projekt (working name)

Group project for DH2642/ID2216 *Developing Mobile Applications*, KTH HT26. We'll rename the repo once we've picked the idea.

## About

_TBD: one paragraph on what the app does, who it is for, and which API it uses._

## Team

| Name | KTH/GitHub username | Owns |
|---|---|---|
| | | |
| | | |
| | | |
| | | |

"Owns" means the presenter/view pairs, model, API module, persistence or auth that this person is responsible for. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Getting started

_Filled in when the app is scaffolded (React + Vite, see [minimal setup](docs/course/project/minimal-react-web-setup.md))._

```sh
npm install
npm run dev      # http://localhost:8080
```

## Project structure

```
├── src/                  # (created when we scaffold)
│   ├── index.jsx         # bootstrapping: create the reactive model, mount the root
│   ├── model/            # application state + side effects (persistence hooks in here)
│   ├── presenters/       # one per screen: model ↔ view, handle custom events, no UI/CSS
│   ├── views/            # UI only: render props, fire custom events, all JSX/CSS
│   ├── api/              # talks to the external API (like the lab's dishSource)
│   └── persistence/      # Firebase config, auth, read/write of the model
├── docs/
│   ├── INDEX.md          # map of all docs, start here
│   ├── design.md         # design guidelines (filled in after we pick the idea)
│   ├── proposal.md       # idea brainstorm + our project proposal
│   ├── user-testing/     # one file per user test (required for submission)
│   └── course/           # course material from Canvas (reference, read-only)
├── .github/rulesets/     # branch protection for main (imported in repo settings)
├── .coderabbit.yaml      # automated code review rules
├── AGENTS.md             # instructions for AI coding agents
└── CONTRIBUTING.md       # how we work: git, PRs, reviews, code rules
```

## Status

_Required in the mid-project review._

**Done**
- 

**Planned**
- 

## Third-party components

_Required in the final submission: user-visible components written by others for the framework we use. Grades B and A need at least one (router and suspense don't count)._

- 

## Credits

Code reused from the course lab is marked with a comment in the file where it is used.
