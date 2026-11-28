// Model: owns the keyboard demo state and starts the clock as a MobX side effect.
import { makeAutoObservable, reaction } from "mobx";
import { combineSticks, createRound, ROUND_SECONDS, TICK_MS, timeOutRound } from "./doubleSnakeRules.js";
import { roundWeather, weatherStep } from "./demoWeather.js";
import { checkTestRound, testSticks } from "./roomTestScenario.js";

export const keyGroups = [
  { player: "A1", keys: ["W", "A", "S", "D"], codes: ["KeyW", "KeyA", "KeyS", "KeyD"] },
  { player: "A2", keys: ["T", "F", "G", "H"], codes: ["KeyT", "KeyF", "KeyG", "KeyH"] },
  { player: "B1", keys: ["I", "J", "K", "L"], codes: ["KeyI", "KeyJ", "KeyK", "KeyL"] },
  { player: "B2", keys: ["↑", "←", "↓", "→"], codes: ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"] },
];
const directionsByKey = ["up", "left", "down", "right"];
const KEPT_EVENTS = 8;
const LUCKY_NOTICE_TICKS = 18;

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
  remoteRoom: null,
  interruptedRoomRound: null,
  testId: null,
  regularScore: undefined,
  ticks: 0,
  weather: null,
  events: [],
  eventCount: 0,
  luckyResult: null,
  crashed: [],
  soundOn: true,

  get playing() {
    return Boolean(this.round && !this.round.outcome);
  },

  get inputs() {
    if (this.testId && this.playing) return testSticks(this.ticks);
    if (this.remoteRoom) return this.remoteRoom.steering;
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
        looking: snake.frozenTicks ? snake.heading : combineSticks(first, second, snake.heading) || snake.heading,
        torn: !snake.frozenTicks && sticksCancel(first, second),
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

  startRound(weatherResult, remoteRoom = null) {
    if (this.playing) return;
    if (remoteRoom && !remoteRoom.canStart) return;
    const test = remoteRoom?.activeTest;
    if (test && test.phase !== "ready") return;
    const savedRound = remoteRoom && this.interruptedRoomRound?.code === remoteRoom.code
      ? this.interruptedRoomRound : null;
    if (remoteRoom && !test) this.interruptedRoomRound = null;
    this.remoteRoom = remoteRoom;
    this.testId = test?.id ?? null;
    this.pressed = [];
    this.seconds = ROUND_SECONDS;
    this.deadline = performance.now() + ROUND_SECONDS * 1000;
    this.ticks = 0;
    this.weather = test ? null : roundWeather(weatherResult);
    this.round = test ? createRound(undefined, () => 0) : createRound(savedRound?.score ?? this.regularScore);
    this.roundNumber = (savedRound?.roundNumber ?? this.roundNumber) + 1;
    this.crashed = [];
    this.luckyResult = null;
    this.addEvents([{ kind: "go" }]);
    if (test) remoteRoom.reportTestPhase(test.id, "cancelling");
  },

  startRoomTest(room, id) {
    if (!room.canStart || room.activeTest?.id !== id || room.activeTest.phase !== "ready") return;
    // A test reserves an empty room. A round left running after the last player left can end here.
    if (this.playing) this.stopTestRound();
    this.startRound(null, room);
  },

  // Gives each event a new id (the board and the sounds play each id once) and keeps only the latest few.
  addEvents(events) {
    const firstId = this.eventCount + 1;
    const numbered = events.map(function numberEventCB(event, index) {
      return { ...event, id: firstId + index };
    });
    this.eventCount += events.length;
    this.events = [...this.events, ...numbered].slice(-KEPT_EVENTS);
    const lucky = numbered.findLast(function isLuckyCB(event) { return event.outcome; });
    if (lucky) this.luckyResult = { ...lucky, until: this.ticks + LUCKY_NOTICE_TICKS };
  },

  toggleSound() {
    this.soundOn = !this.soundOn;
  },

  changeKey(code, down) {
    if (!this.playing || this.remoteRoom) return;
    const index = this.pressed.indexOf(code);
    if (down && index === -1) this.pressed.push(code);
    if (!down && index !== -1) this.pressed.splice(index, 1);
  },

  clearKeys() {
    this.pressed = [];
  },

  interruptRound() {
    if (!this.playing || !this.remoteRoom?.code) return;
    // Preserve the completed rounds when the board returns to the lobby.
    if (!this.testId || this.interruptedRoomRound?.code !== this.remoteRoom.code) {
      this.interruptedRoomRound = {
        code: this.remoteRoom.code,
        score: this.testId ? this.regularScore ?? { a: 0, b: 0 } : this.round.score,
        roundNumber: this.roundNumber - 1,
      };
    }
    this.round = null;
    this.events = [];
    this.luckyResult = null;
    this.crashed = [];
  },

  leaveDemo() {
    this.clearKeys();
    this.remoteRoom = null;
    this.testId = null;
    this.regularScore = undefined;
    this.round = null;
    this.seconds = ROUND_SECONDS;
    this.roundNumber = 0;
    this.weather = null;
    this.luckyResult = null;
  },

  tick() {
    if (!this.playing) return;
    if (this.testId && (!this.remoteRoom.connected || this.remoteRoom.room?.hostOnline !== true
      || this.remoteRoom.activeTest?.id !== this.testId)) {
      this.stopTestRound();
      return;
    }
    this.seconds = Math.max(0, Math.ceil((this.deadline - performance.now()) / 1000));
    if (this.seconds === 0) {
      this.round = timeOutRound(this.round);
    } else {
      const inputs = this.inputs;
      this.ticks += 1;
      if (this.luckyResult?.until <= this.ticks) this.luckyResult = null;
      this.round = weatherStep(this.round, inputs, this.weather, this.ticks);
    }
    if (this.testId) {
      const phase = checkTestRound(this.round, this.ticks);
      if (phase) this.remoteRoom.reportTestPhase(this.testId, phase);
      if (phase === "failed" && this.playing) {
        this.stopTestRound();
        return;
      }
    } else if (this.round.outcome) {
      this.regularScore = this.round.score;
    }
    const events = [...this.round.stepEvents];
    this.crashed = events.filter(function isCrashCB(event) { return event.kind === "crash"; })
      .map(function teamCB(event) { return event.team; });
    if (this.round.outcome) events.push(outcomeEvent(this.round.outcome));
    if (events.length) this.addEvents(events);
  },

  stopTestRound() {
    this.round = null;
    this.testId = null;
    this.seconds = ROUND_SECONDS;
    this.crashed = [];
  },
}, {}, { autoBind: true });

let clock;
const stopHostRecovery = reaction(
  function readHostRecoveryACB() {
    return demoModel.playing && Boolean(demoModel.remoteRoom?.code) && demoModel.remoteRoom.reconnectingHost;
  },
  function interruptOnHostLossACB(reconnecting) {
    if (reconnecting) demoModel.interruptRound();
  },
);
reaction(
  function readPlayingACB() { return demoModel.playing; },
  function syncClockACB(playing) {
    clearInterval(clock);
    if (playing) clock = setInterval(demoModel.tick, TICK_MS);
  },
);

if (import.meta.hot) {
  import.meta.hot.dispose(function stopClockACB() {
    clearInterval(clock);
    stopHostRecovery();
  });
}
