# Push/Pull

A party game for four friends, two teams and one shared screen. Group project for DH2642/ID2216 *Developing Mobile Applications*, KTH HT26.

**Live app:** _not deployed yet_

## About

Push/Pull turns any big screen with a browser into a game console and every phone into a controller. Four players split into two teams. **Both players in a team steer the same character with their own joystick.** The app adds the two inputs together: pushing the same way moves the character, opposite ways cancel out, and an idle stick lets the partner steer. Each player also has four buttons, such as dash, that act on their own.

The first game mode is **Double Snake**: eat apples to grow and make the other team crash into you.

- **Who it's for:** friends and students who meet at home with one TV or laptop and no spare game controllers. Everyone already has a phone, so a game starts in about a minute.
- **APIs:** [Open-Meteo](https://open-meteo.com/) gives live weather for the city you play in, and it changes each round: wind drifts the apples, rain makes snakes slide, and after sunset the board goes dark. [Open Trivia DB](https://opentdb.com/) questions break ties, and both teammates steer one cursor to the answer.
- **Saved per user:** profile, settings and match history in Firebase, after login.
- **Built with:** React + Vite, MobX, Firebase Authentication and Realtime Database.

## Team

| Name | KTH/GitHub username | Owns |
|---|---|---|
| Casper Waller | | |
| Abdurrahman Giumale | abdurryy | |
| Faraz Ahmad | | |
| Aryan Masiul | | |

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
│   ├── api/              # talks to Open-Meteo and Open Trivia DB (like the lab's dishSource)
│   └── persistence/      # Firebase config, auth, read/write of the model
├── docs/
│   ├── INDEX.md          # map of all docs, start here
│   ├── design.md         # design guidelines (filled in after the mock-ups)
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
- Picked the idea and wrote the project proposal
- Set up the repo: automated CodeRabbit reviews and a protected `main` branch

**Planned**
- Scaffold React + Vite and deploy early to Firebase Hosting
- MobX model with the game rules, plus Firebase login and per-user persistence
- API module for Open-Meteo and Open Trivia DB
- Screens on the phone: log in, join a room, controller, profile and stats
- Screens on the TV: lobby, game board, round results
- First user test with paper controllers

## Third-party components

_Required in the final submission: user-visible components written by others for the framework we use. Grades B and A need at least one (router and suspense don't count)._

Planned:
- [react-qr-code](https://www.npmjs.com/package/react-qr-code): the QR code players scan to join a room
- [react-joystick-component](https://www.npmjs.com/package/react-joystick-component): the stick on the phone controller

## Credits

Code reused from the course lab is marked with a comment in the file where it is used.
