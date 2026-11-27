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

| Name | GitHub | Project email | Owns |
|---|---|---|---|
| Abdurrahman Giumale | [@abdurryy](https://github.com/abdurryy) | [abdurrahman@pushpull.live](mailto:abdurrahman@pushpull.live) | **Phone & match flow** · Sign-in, join, controls, voting and ready screens, round order, audio, and deployment.<br>**Modes:** In Sync, Switcheroo |
| Casper Waller | [@CasperWaller](https://github.com/CasperWaller) | [casper@pushpull.live](mailto:casper@pushpull.live) | **TV & game art** · Home, lobby and QR code, board, scores, mode picker and vote display, countdown, rematch, art, effects, and gallery.<br>**Mode:** Orchard Sprint |
| Aryan Masiul | [@aryanmasiul007](https://github.com/aryanmasiul007) | [aryan@pushpull.live](mailto:aryan@pushpull.live) | **Game rules & APIs** · Double Snake, shared mode interface, keyboard demo, weather, trivia, and round results.<br>**Modes:** Wraparound, Closing Walls |
| Faraz Ahmad | [@faraz539](https://github.com/faraz539) | [faraz@pushpull.live](mailto:faraz@pushpull.live) | **Profiles & Firebase** *(proposed)* · Player settings, data design and rules, room and vote sync.<br>**Modes:** Checkpoint Chase, Hot Apple |

Screen owners maintain both the Presenter and the View. Abdurrahman coordinates the shared app model, routes, and room Presenter, with Casper reviewing the TV flow. Aryan coordinates the game model. Faraz is the proposed owner for the room model and persistence. See [the contribution guide](CONTRIBUTING.md#who-owns-what).

## Getting started

Needs Node.js 22.12 or newer (Vite 8 requires it).

Copy `.env.example` to `.env.local` and fill in the Firebase web config (Firebase console > Project settings > Your apps, or ask the team). `.env.local` is git-ignored; never commit the real values.

Without Firebase config, the home screen and the TV weather search still work and sign-in shows a setup message. Rooms also need `VITE_FIREBASE_DATABASE_URL`. Sign in from the home page and choose **View profile** to see your account at `#/profile`.

```sh
npm install
npm run dev      # http://localhost:8080
npm run build    # production build in dist/ (not minified, a course rule)
```

Open http://localhost:8080 and pick **Use this screen as the TV**, or go straight to http://localhost:8080/#/tv. Sign in, press **Create room**, and join on phones with the room code or QR code. Type a city and press **Check weather** to see live data from Open-Meteo.

Tip: in the browser console, `myModel` shows the current application state.

Building a screen? Open http://localhost:8080/#/components first: it shows every shared component (status lines, team chips and seats, room code boxes, score bar, countdown and the game board with its effects) in every state.

### Room playtest

On the host screen, choose **Host a room playtest**, sign in with Google, and create a room. On four phones, choose **Use phone**, sign in with four separate accounts, and enter the host's code. You can also share **Open phone invite** from the host lobby to prefill the code on a phone. Put two players on each team and open their controllers. On the host, open the game board and start the round. Hold opposite directions on one team to stop its snake.

For a local run, start the Firebase Auth and Realtime Database emulators with `npx firebase-tools emulators:start --project demo-pushpull --only auth,database`. Set `VITE_USE_FIREBASE_EMULATORS=true` in your shell before starting Vite. Open the app in separate browser profiles or contexts and use the emulator's mock Google accounts. The emulator flag applies only to the dev server and uses the local demo project.

When a phone drops offline, its last direction becomes idle once Firebase detects the disconnect. A player can leave the room to free their seat. Closing the room from the host lobby gives players a link back to room setup.

For the hosted playtest, publish the matching Realtime Database rules from `main` with `npx firebase-tools deploy --only database --project pushpull-1df2e`. The Hosting workflow publishes the web build.

### Double Snake rules tests

Run `node --test test/doubleSnakeRules.test.mjs` from the project root. The tests use fixed boards and inputs to check steering, crashes, apple growth and timeouts with Node alone.

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
│   │   ├── lobbyPresenter.jsx    # TV lobby: room, teams, weather and Start round
│   │   └── galleryPresenter.jsx  # dev page with every shared component
│   ├── views/                    # UI only: render props, fire onXxx events, all JSX and CSS
│   │   ├── homeView.jsx/.css     # pick this device's role
│   │   ├── loginView.jsx/.css    # Continue with Google, with checking, signing-in and error states
│   │   ├── lobbyView.jsx/.css    # TV lobby: room code, QR code, teams, weather search
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
- Homepage: explains Double Snake, links to the shared screen and phone setup, and offers Google sign-in
- Account profile (`#/profile`): shows the current Google account and lets the player sign out
- Local Double Snake demo: shared keyboard, two teams, apples, eight Lucky Box outcomes, crashes, timer and replay. Open it from the homepage.
- Firebase project and Google sign-in on the phone (`#/play/login`)
- Phone room join by typing or pasting a code or opening an invite link, with live team selection and open seats
- Room-code playtest with four signed-in phone controllers and the shared Double Snake board
- Game feel and sound designed in design.md: the picture, sound and phone buzz for every game event
- Shared View components for the next screens (status lines, team seats, room code boxes, score bar, countdown, game board), shown in every state on `#/components`
- Sound effects for every game event and music for the lobby, round, trivia and results, made in code with the Web Audio API
- Agent skills in `.agents/skills/` so everyone's coding agent follows design.md, the MVP rules and the user-testing rules
- A living game board drawn on a canvas: snakes glide and look where their team steers, both teammates' directions show at the head, rain, wind and night are visible, and the keyboard demo has effects, sound and music
- Visual direction for the full-screen revamp: four annotated reference screens (TV lobby, mode intro, scoreboard, phone join) in [docs/visual-direction](docs/visual-direction/README.md)
- TV lobby (`#/tv`): the host creates a room and sees its code and QR code, players fill Team A and Team B live, the weather search keeps working while they join, and Start round stays disabled (and says why) until each team has two players

**Planned**
- MobX model with the game rules, plus per-user persistence in Firebase
- Screens on the phone: full room join flow, controller actions, profile settings and stats
- Screens on the TV: game board, round results
- First user test with paper controllers

## Third-party components

_Required in the final submission: user-visible components written by others for the framework we use. Grades B and A need at least one (router and suspense don't count)._

Used:
- [react-qr-code](https://www.npmjs.com/package/react-qr-code) (MIT): the QR code on the TV lobby that players scan to join a room (`src/views/lobbyView.jsx`)

Fonts and icons (Google Fonts):
- [Unbounded](https://fonts.google.com/specimen/Unbounded) and [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next)
- [Material Symbols Rounded](https://fonts.google.com/icons): every icon in the app

## Credits

Code reused from the course lab is marked with a comment in the file where it is used.
