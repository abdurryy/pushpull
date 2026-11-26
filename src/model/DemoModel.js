// Model: owns the keyboard demo state and starts the clock as a MobX side effect.
import { makeAutoObservable, reaction } from "mobx";
import { combineSticks, createRound, ROUND_SECONDS, TICK_MS, timeOutRound } from "./doubleSnakeRules.js";
import { roundWeather, weatherStep } from "./demoWeather.js";

export const keyGroups = [
  { player: "A1", keys: ["W", "A", "S", "D"], codes: ["KeyW", "KeyA", "KeyS", "KeyD"] },
  { player: "A2", keys: ["T", "F", "G", "H"], codes: ["KeyT", "KeyF", "KeyG", "KeyH"] },
  { player: "B1", keys: ["I", "J", "K", "L"], codes: ["KeyI", "KeyJ", "KeyK", "KeyL"] },
  { player: "B2", keys: ["↑", "←", "↓", "→"], codes: ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"] },
];
const directionsByKey = ["up", "left", "down", "right"];
const KEPT_EVENTS = 8;

// The teams whose snake crashed, from a round's outcome. A tie from a step means both crashed.
function crashedTeams(outcome) {
  if (outcome === "a") return ["b"];
  if (outcome === "b") return ["a"];
  return ["a", "b"];
}

// Game feel events (design.md): what one tick changed, for the board's effects and the sounds.
function eventsBetween(before, after) {
  const events = [];
  ["a", "b"].forEach(function checkTeamCB(team) {
    if (after[team].body.length > before[team].body.length) {
      events.push({ kind: "eat", team, ...after[team].body[0] });
    }
  });
  if (after.outcome && !before.outcome) {
    crashedTeams(after.outcome).forEach(function addCrashCB(team) {
      events.push({ kind: "crash", team, ...after[team].body[0] });
    });
  }
  return events;
}

// True when two teammates push opposite ways, so their snake stops.
function sticksCancel(first, second) {
  return Boolean(first && second && !combineSticks(first, second));
}

function outcomeEvent(outcome) {
  return outcome === "tie" ? { kind: "tie" } : { kind: "win", team: outcome };
}

export const demoModel = makeAutoObservable({
  round: null,
  pressed: [],
  seconds: ROUND_SECONDS,
  deadline: 0,
  roundNumber: 0,
  ticks: 0,
  weather: null,
  events: [],
  eventCount: 0,
  crashed: [],
  soundOn: true,

  get playing() {
    return Boolean(this.round && !this.round.outcome);
  },

  get inputs() {
    const latestFirst = this.pressed.slice().reverse();
    return keyGroups.map(function directionForPlayerCB(group) {
      const key = latestFirst.find(function isPlayerKeyCB(code) { return group.codes.includes(code); });
      return directionsByKey[group.codes.indexOf(key)] || null;
    });
  },

  get teamACancelled() {
    const [first, second] = this.inputs;
    return sticksCancel(first, second);
  },

  // The board's view of the round: each snake with its team, whether it crashed, where its team is
  // steering right now (its eyes look there before the next tick) and whether the teammates pull apart.
  get boardSnakes() {
    const round = this.round;
    const crashed = this.crashed;
    const inputs = this.teamInputs;
    if (!round) return [];
    return ["a", "b"].map(function snakeForTeamCB(team) {
      const snake = round[team];
      const [first, second] = inputs[team];
      return {
        team,
        ...snake,
        crashed: crashed.includes(team),
        looking: combineSticks(first, second, snake.heading) || snake.heading,
        torn: sticksCancel(first, second),
      };
    });
  },

  get boardApples() {
    return this.round?.apple ? [this.round.apple] : [];
  },

  // Each team's two sticks, so the board can show both teammates' directions.
  get teamInputs() {
    const [a1, a2, b1, b2] = this.inputs;
    return { a: [a1, a2], b: [b1, b2] };
  },

  get teamBCancelled() {
    const [, , first, second] = this.inputs;
    return sticksCancel(first, second);
  },

  startRound(weatherResult) {
    if (this.playing) return;
    this.pressed = [];
    this.seconds = ROUND_SECONDS;
    this.deadline = performance.now() + ROUND_SECONDS * 1000;
    this.ticks = 0;
    this.weather = roundWeather(weatherResult);
    this.round = createRound(this.round?.score);
    this.roundNumber += 1;
    this.crashed = [];
    this.addEvents([{ kind: "go" }]);
  },

  // Gives each event a new id (the board and the sounds play each id once) and keeps only the latest few.
  addEvents(events) {
    const firstId = this.eventCount + 1;
    const numbered = events.map(function numberEventCB(event, index) {
      return { ...event, id: firstId + index };
    });
    this.eventCount += events.length;
    this.events = [...this.events, ...numbered].slice(-KEPT_EVENTS);
  },

  toggleSound() {
    this.soundOn = !this.soundOn;
  },

  changeKey(code, down) {
    if (!this.playing) return;
    const index = this.pressed.indexOf(code);
    if (down && index === -1) this.pressed.push(code);
    if (!down && index !== -1) this.pressed.splice(index, 1);
  },

  clearKeys() {
    this.pressed = [];
  },

  leaveDemo() {
    this.clearKeys();
    this.round = null;
    this.seconds = ROUND_SECONDS;
    this.roundNumber = 0;
    this.weather = null;
  },

  tick() {
    if (!this.playing) return;
    this.seconds = Math.max(0, Math.ceil((this.deadline - performance.now()) / 1000));
    const before = this.round;
    if (this.seconds === 0) {
      this.round = timeOutRound(this.round);
    } else {
      this.ticks += 1;
      this.round = weatherStep(this.round, this.inputs, this.weather, this.ticks);
    }
    this.noteChanges(before, this.seconds === 0);
  },

  // Turns what a tick changed into Game feel events, and remembers which snakes crashed.
  noteChanges(before, timeIsUp) {
    const events = timeIsUp ? [] : eventsBetween(before, this.round);
    if (events.some(function isCrashCB(event) { return event.kind === "crash"; })) {
      this.crashed = crashedTeams(this.round.outcome);
    }
    if (this.round.outcome) events.push(outcomeEvent(this.round.outcome));
    if (events.length) this.addEvents(events);
  },
}, {}, { autoBind: true });

let clock;
reaction(
  function readPlayingACB() { return demoModel.playing; },
  function syncClockACB(playing) {
    clearInterval(clock);
    if (playing) clock = setInterval(demoModel.tick, TICK_MS);
  },
);

if (import.meta.hot) {
  import.meta.hot.dispose(function stopClockACB() { clearInterval(clock); });
}
