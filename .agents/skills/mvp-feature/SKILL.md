---
name: mvp-feature
description: Build or review a Push/Pull feature the way the course grades the architecture - Model-View-Presenter with MobX actions, persistence and fetching as model side effects, API calls in src/api. Use before writing code whenever a task adds or changes app data, a model method, a presenter, an API call, Firebase persistence, a route or a new screen. Also use when reviewing a PR for MVP rule breaks.
---

# MVP features: code that gets an A and that you can explain

The architecture is graded, and teachers question each of you about the code. Agents usually break the same rules: `fetch` or `useState` in a presenter, two model calls in one event handler, Views that import the model, persistence inside a click handler. This skill gives the layer map, the steps in order, templates copied from our own code and checks you can run.

Read with it: `docs/course/project/keeping-presenter-simple.md` (the rules and which ones cost grade), `docs/course/project/grading-criteria.md` (Architecture/code) and AGENTS.md (Architecture rules, Code conventions).

## The layer map

| Layer | Folder | Does | Never |
|---|---|---|---|
| Model (application state) | `src/model/` | Holds all data and the logic that changes it. One method per user action. MobX actions | Imports React, Views, presenters or `src/sound/`. Talks to Firebase directly |
| Side effects | `src/persistence/`, `reaction` in the model | Saves and loads the model, keeps the game clock, talks to Firebase | Is called by a presenter (except the login presenter and the auth service) |
| API | `src/api/` | Plain functions that return promises | Keeps state or touches the model |
| Presenter | `src/presenters/` | Reads the model, passes props, turns each View event into **one** model method | `useState`, `useEffect`, `fetch`, persistence, routes, markup beyond one wrapper |
| View | `src/views/` | Renders props, fires `onXxx` events, all JSX and CSS | Imports the model, API or persistence |
| Navigation | `src/reactRoot.jsx` | Maps each route to its presenter | Holds data (route data goes into the model) |

## Step 1: Read before you write

1. The issue: its Approach and Acceptance criteria are the spec.
2. keeping-presenter-simple.md, all of it.
3. The nearest existing feature, as a pattern to copy:
   - Fetching data: `PushPullModel.findWeather` + `resolvePromise.js` + `weatherPresenter.jsx` + `weatherView.jsx`.
   - Auth: `persistence/firebaseAuth.js` (`connectAuthToModel`) + `loginPresenter.jsx`.
   - Live sync with Firebase: `model/RoomModel.js` + `persistence/roomSync.js`.
   - A clock as a side effect: the `reaction` at the bottom of `model/DemoModel.js`.
4. README Team table: who owns the files you'll touch. **Model changes go through the model owner.** Say so in the issue if you need new model data or methods.

## Step 2: Plan one row per user action

Before code, write a table like this in the issue or PR:

| The user... | View event | Presenter handler | Model method | Side effect |
|---|---|---|---|---|
| types a city | `onCityChange(text)` | `cityChangedACB` | `setCityQuery(text)` | none |
| presses "Check weather" | `onSearch()` | `searchRequestedACB` | `findWeather()` | fetch through `src/api/weatherSource.js` |
| changes their name | `onNameChange(text)` | `nameChangedACB` | `setDisplayName(text)` | a `reaction` saves the profile |

If a row needs two model methods, write one model method that does both.

## Step 3: Model

- Data as plain properties, derived values as getters (MobX turns them into computed values), and one method per user action.
- `index.jsx` makes the model reactive with `makeAutoObservable(model, {}, { autoBind: true })`, so every method is a MobX action and can be passed as a callback.
- Async data goes through a promise state:

```js
// In the model (pattern from the course lab, see resolvePromise.js)
weatherPromiseState: {},

findWeather() {
  resolvePromise(getWeatherForCity(this.cityQuery.trim()), this.weatherPromiseState);
},
```

- The presenter turns the promise state into one word with `promiseStatus(...)`: `"idle"`, `"loading"`, `"error"` or `"done"`.

## Step 4: Side effects (persistence, clocks, sync)

The presenter changes one thing in the model. A side effect notices and does the rest.

```js
// src/persistence/profileSync.js (pattern for #22): Persistence: keeps users/{uid} in sync with the model.
import { reaction } from "mobx";

export function connectProfileToModel(model, database) {
  function readProfileACB() {
    return { ...model.profile };   // what to watch
  }
  function saveProfileACB(profile) {
    if (!model.user || !model.profileLoaded) return;   // never overwrite saved data with defaults
    saveProfile(database, model.user.uid, profile);   // a small function in this file that calls Firebase set()
  }
  reaction(readProfileACB, saveProfileACB);
}
```

Connect it once in `index.jsx`, next to `connectAuthToModel`. Per-user data lives under `users/{uid}`, and `database.rules.json` must only let that user read and write it.

## Step 5: API

A plain function in `src/api/` that returns a promise, like `weatherSource.js`. Throw an `Error` with a sentence a player understands when the response is bad. If the API blocks browsers (CORS), use the course proxy. No state, no model imports.

## Step 6: Presenter

```jsx
// Presenter for <screen>: reads the model, passes props to the view, and turns each view event into one model method.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { WeatherView } from "../views/weatherView.jsx";

export const WeatherPresenter = observer(function WeatherPresenter(props) {
  function searchRequestedACB() {
    props.model.findWeather();   // exactly one model method
  }

  return (
    <WeatherView
      city={props.model.cityQuery}
      status={promiseStatus(props.model.weatherPromiseState)}
      onSearch={searchRequestedACB}
    />
  );
});
```

- Wrap it in `observer`, so it re-renders when the model changes.
- Return one View, or one `<div>`/`<>` around several Views. Nothing else.
- The login presenter is the one exception: it only calls the auth service (`signInWithGoogle`), never the model.

## Step 7: View

Props in, `onXxx` events out, every state designed. Use the shared components from design.md before writing your own, and follow the ui-design skill. Effects and sound follow the game-feel and game-audio skills.

## Step 8: Route

Add the route in `src/reactRoot.jsx`. If the URL carries data (a room code in `?code=K7M4`), put it into the model through the root, not by reading the route in a presenter.

## Step 9: Check the rules (mandatory)

Run these. The comment says what a clean result looks like.

```sh
# Presenters: no state, effects, fetch, persistence, API or sound. Only loginPresenter may import firebaseAuth.
grep -nE "useState|useEffect|useRef|fetch\(|from \"\.\./(persistence|api|sound)/" src/presenters/*.jsx

# Views: never import the model, API or persistence. Should print nothing.
grep -nE "from \"\.\./(model|api|persistence)/" src/views/*.jsx

# Model: no React, Views, presenters or sound. Should print nothing.
grep -nE "from \"(react|react-dom|mobx-react-lite|\.\./views/|\.\./presenters/|\.\./sound/)" src/model/*.js

npm run build
```

Then read every presenter handler you wrote: each calls exactly one model method. Check the naming: `...ACB` for event, promise and side-effect callbacks, `...CB` for array callbacks, camelCase files, a PascalCase model file.

## Step 10: Explain it

Give the developer two or three sentences per file that they could say to a teacher. Template:

> `profileSync.js` is persistence. When someone signs in it reads their profile into the model, and a MobX reaction saves the profile whenever it changes. The presenter never knows this happens, which is the course rule that persistence is a model side effect.

If you can't explain a file in three sentences, simplify the code.

## Common mistakes and their fix

| Mistake | Fix |
|---|---|
| `fetch` in a presenter handler | A model method that resolves the promise (Step 3) |
| Saving to Firebase in a click handler | Change the model; a `reaction` saves (Step 4) |
| `useState` in a presenter to collect form input | Keep the input in the model, one setter per field |
| `useEffect` in a presenter to load data | A side effect in the model or persistence layer |
| Two model calls in one handler | One model method that does both |
| A View importing the model | Pass the data as props from the presenter |
| Reading the route in a presenter | Route data goes into the model from the root |
| Markup or CSS in a presenter | Move it into a View |
| Game logic in a View (comparing boards) | The model computes it and passes the result |
