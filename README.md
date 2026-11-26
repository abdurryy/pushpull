# Push/Pull

A party game for four friends, two teams and one shared screen. Group project for DH2642/ID2216 *Developing Mobile Applications*, KTH HT26.

**Live app:** [pushpull.live](https://pushpull.live)

**Keyboard demo:** Open `#/demo` on the shared computer. Four players can try Double Snake using one keyboard.

**Phone controller preview:** Open [the controller](https://pushpull.live/#/play/controller), turn the phone sideways, and tap **Enter controller**. When browser fullscreen is unavailable, open it from the Home Screen to remove the browser address bar. The phone still controls its system bars and gestures. This preview tests touch input locally while room sync is being built.

## About

Push/Pull turns any big screen with a browser into a game console and every phone into a controller. Four players split into two teams. **Both players in a team steer the same character with their own joystick.** The app adds the two inputs together: pushing the same way moves the character, opposite ways cancel out, and an idle stick lets the partner steer. Each player also has four buttons, such as dash, that act on their own.

The first game mode is **Double Snake**: eat apples to grow and make the other team crash into you.

- **Who it's for:** friends and students who meet at home with one TV or laptop and no spare game controllers. Everyone already has a phone, so a game starts in about a minute.
- **APIs:** [Open-Meteo](https://open-meteo.com/) gives live weather for the city you play in, and it changes each round: wind drifts the apples, rain makes snakes slide, and after sunset the board goes dark. [Open Trivia DB](https://opentdb.com/) questions break ties, and both teammates steer one cursor to the answer.
- **Saved per user:** profile, settings and match history in Firebase, after login.
- **Built with:** React + Vite, MobX, Firebase Authentication and Realtime Database.

## Team

| Name | KTH/GitHub username | Project email | Owns |
|---|---|---|---|
| Casper Waller | CasperWaller | [casper@pushpull.live](mailto:casper@pushpull.live) | |
| Abdurrahman Giumale | abdurryy | [abdurrahman@pushpull.live](mailto:abdurrahman@pushpull.live) | |
| Faraz Ahmad | faraz539 | [faraz@pushpull.live](mailto:faraz@pushpull.live) | |
| Aryan Masiul | aryanmasiul007 | [aryan@pushpull.live](mailto:aryan@pushpull.live) | |

"Owns" means the presenter/view pairs, model, API module, persistence or auth that this person is responsible for. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Getting started

Needs Node.js 22.12 or newer (Vite 8 requires it).

Copy `.env.example` to `.env.local` and fill in the Firebase web config (Firebase console > Project settings > Your apps, or ask the team). `.env.local` is git-ignored; never commit the real values.

Without Firebase config, the home and weather screens still work; sign-in shows a setup message. After signing in, **Continue to join a room** opens the join destination. Room codes and team selection are being built separately in #25.

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production build in dist/ (not minified, a course rule)
```

Open http://localhost:8080 and pick **Use this screen as the TV**, or go straight to http://localhost:8080/#/tv. Type a city and press **Check weather** to see live data from Open-Meteo.

Tip: in the browser console, `myModel` shows the current application state.

Building a screen? Open http://localhost:8080/#/components first: it shows every shared component (status lines, team chips and seats, room code boxes, score bar, countdown and the game board with its effects) in every state.

## Project structure

```
├── index.html                    # page shell: loads the fonts and icons, mounts src/index.jsx
├── vite.config.js                # build config: port 8080, minify off (course rule)
├── package.json                  # dependencies and npm scripts
├── .env.example                  # names of the Firebase config values (real ones go in .env.local)
├── src/
│   ├── index.jsx                 # bootstrapping: makes the model reactive (MobX), mounts the root
│   ├── reactRoot.jsx             # navigation: maps each route (#/, #/tv) to its presenter
│   ├── model/
│   │   ├── PushPullModel.js      # application state and one action per user action
│   │   └── resolvePromise.js     # keeps a promise's data/error in the model (lab pattern)
│   ├── api/
│   │   ├── weatherSource.js      # Open-Meteo: find a city, get its wind, rain and day/night
│   │   └── triviaSource.js       # Open Trivia DB: tie-break questions
│   ├── presenters/               # one per screen: model ↔ view, one model method per event
│   │   ├── homePresenter.jsx     # start screen
│   │   ├── loginPresenter.jsx    # phone login; only talks to the auth service
│   │   ├── weatherPresenter.jsx  # weather check on the TV
│   │   └── galleryPresenter.jsx  # dev page with every shared component
│   ├── views/                    # UI only: render props, fire onXxx events, all JSX and CSS
│   │   ├── homeView.jsx/.css     # pick this device's role
│   │   ├── loginView.jsx/.css    # Continue with Google, with checking, signing-in and error states
│   │   ├── weatherView.jsx/.css  # city search with loading, empty and error states
│   │   ├── galleryView.jsx/.css  # #/components: every shared component in every state
│   │   └── statusMessage, teamChip, teamRoster, roomCode, roomCodeInput, scoreBar,
│   │       countdown, gameBoard, soundCues, musicTrack, soundToggle  # shared components, listed in docs/design.md
│   ├── styles/tokens.css         # design tokens (colours, fonts, sizes) used by every View
│   ├── sound/                    # synthesized sound effects and music, played by Views (docs/design.md, Sound)
│   └── persistence/
│       ├── firebaseConfig.js     # starts Firebase with the config from .env.local
│       └── firebaseAuth.js       # Google sign-in/out, and onAuthStateChanged -> model.setUser
├── docs/
│   ├── INDEX.md          # map of all docs, start here
│   ├── design.md         # design system: look, components, controller rules
│   ├── proposal.md       # idea brainstorm + our project proposal
│   ├── user-testing/     # one file per user test (required for submission)
│   └── course/           # course material from Canvas (reference, read-only)
├── .github/rulesets/     # branch protection for main (imported in repo settings)
├── .coderabbit.yaml      # automated code review rules
├── AGENTS.md             # instructions for AI coding agents
├── .agents/skills/       # agent skills (ui-design, game-feel, game-audio, mvp-feature, user-testing), see AGENTS.md
└── CONTRIBUTING.md       # how we work: git, PRs, reviews, code rules
```

## Status

_Required in the mid-project review._

**Done**
- Documented the design system and shared CSS tokens, including reduced motion
- Picked the idea and wrote the project proposal
- Set up the repo: automated code reviews, a protected `main` branch and CI that builds every pull request
- Design system: [docs/design.md](docs/design.md) and the CSS tokens
- App skeleton: React + Vite, MobX model with actions, hash routes, API module for Open-Meteo and Open Trivia DB
- First API data on screen: the TV shows the live weather for a city, with loading, empty and error states
- Homepage: explains Double Snake and lets visitors choose the shared screen or phone
- Local Double Snake demo: shared keyboard, two teams, apples, crashes, timer and replay
- Firebase project and Google sign-in on the phone (`#/play/login`)
- Game feel and sound designed in design.md: the picture, sound and phone buzz for every game event
- Shared View components for the next screens (status lines, team seats, room code boxes, score bar, countdown, game board), shown in every state on `#/components`
- Sound effects for every game event and music for the lobby, round, trivia and results, made in code with the Web Audio API
- Agent skills in `.agents/skills/` so everyone's coding agent follows design.md, the MVP rules and the user-testing rules

**Planned**
- MobX model with the game rules, plus per-user persistence in Firebase
- Screens on the phone: log in, join a room, controller, profile and stats
- Screens on the TV: lobby, game board, round results
- First user test with paper controllers

## Third-party components

_Required in the final submission: user-visible components written by others for the framework we use. Grades B and A need at least one (router and suspense don't count)._

Planned:
- [react-qr-code](https://www.npmjs.com/package/react-qr-code): the QR code players scan to join a room

Fonts and icons (Google Fonts):
- [Unbounded](https://fonts.google.com/specimen/Unbounded) and [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next)
- [Material Symbols Rounded](https://fonts.google.com/icons): every icon in the app

## Credits

Code reused from the course lab is marked with a comment in the file where it is used.
