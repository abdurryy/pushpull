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

export const demoModel = makeAutoObservable({
  round: null,
  pressed: [],
  seconds: ROUND_SECONDS,
  deadline: 0,
  roundNumber: 0,
  ticks: 0,
  weather: null,

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
    return Boolean(first && second && !combineSticks(first, second));
  },

  get teamBCancelled() {
    const [, , first, second] = this.inputs;
    return Boolean(first && second && !combineSticks(first, second));
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
    if (this.seconds === 0) {
      this.round = timeOutRound(this.round);
    } else {
      this.ticks += 1;
      this.round = weatherStep(this.round, this.inputs, this.weather, this.ticks);
    }
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
