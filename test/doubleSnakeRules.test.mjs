// Model tests: fixed boards and inputs exercise the core Double Snake rules.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COLUMNS, combineSticks, stepRound, timeOutRound } from "../src/model/doubleSnakeRules.js";

const moveRight = ["right", null, null, null];
const moveTogether = ["right", null, "left", null];

function firstFreeCell() {
  return 0;
}

function makeRound() {
  return {
    a: { heading: "right", body: [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }] },
    b: { heading: "left", body: [{ x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }] },
    apple: { x: 5, y: 5 },
    // Keep the box stationary and out of the way so it cannot affect these cases.
    box: { x: 10, y: 5 },
    score: { a: 2, b: 3 },
    outcome: null,
    stepEvents: [],
  };
}

test("matching sticks agree and opposite sticks cancel", () => {
  assert.equal(combineSticks("up", "up", "right"), "up");
  assert.equal(combineSticks("right", "left", "right"), null);
  assert.equal(combineSticks("up", "down", "left"), null);
});

test("either stick can steer alone and two idle sticks give no direction", () => {
  assert.equal(combineSticks(null, "up", "right"), "up");
  assert.equal(combineSticks("up", null, "right"), "up");
  assert.equal(combineSticks(null, null, "right"), null);
});

test("perpendicular sticks keep the current heading if offered, otherwise the first stick wins", () => {
  assert.equal(combineSticks("up", "right", "right"), "right");
  assert.equal(combineSticks("right", "up", "right"), "right");
  assert.equal(combineSticks("up", "right", "down"), "up");
});

test("cancelling sticks stop one snake while the other team can still move", () => {
  const round = makeRound();
  const next = stepRound(round, ["right", "left", null, "left"], firstFreeCell);

  assert.deepEqual(next.a.body, round.a.body);
  assert.deepEqual(next.b.body, [{ x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }]);
  assert.equal(next.outcome, null);
  assert.deepEqual(next.stepEvents, []);
});

test("hitting the wall gives the other team exactly one point", () => {
  const round = makeRound();
  round.a.body = [{ x: COLUMNS - 1, y: 6 }, { x: COLUMNS - 2, y: 6 }];
  const next = stepRound(round, moveRight, firstFreeCell);

  assert.equal(next.outcome, "b");
  assert.deepEqual(next.score, { a: 2, b: 4 });
  assert.deepEqual(next.stepEvents, [{ kind: "crash", team: "a", x: COLUMNS - 1, y: 6 }]);
});

test("reversing into your own body is a crash", () => {
  const next = stepRound(makeRound(), ["left", null, null, null], firstFreeCell);

  assert.equal(next.outcome, "b");
  assert.deepEqual(next.score, { a: 2, b: 4 });
});

test("hitting the other snake's body is a crash even if it is idle", () => {
  const round = makeRound();
  round.b = { heading: "down", body: [{ x: 5, y: 7 }, { x: 5, y: 6 }, { x: 6, y: 6 }] };
  const next = stepRound(round, moveRight, firstFreeCell);

  assert.equal(next.outcome, "b");
  assert.deepEqual(next.score, { a: 2, b: 4 });
});

test("moving into the same apple square crashes both snakes before either can eat", () => {
  const round = makeRound();
  round.b.body = [{ x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }];
  round.apple = { x: 5, y: 6 };
  const next = stepRound(round, moveTogether, firstFreeCell);

  assert.equal(next.outcome, "tie");
  assert.deepEqual(next.score, round.score);
  assert.deepEqual(next.apple, round.apple);
  assert.deepEqual(next.stepEvents.map(function teamCB(event) {
    return [event.kind, event.team];
  }), [["crash", "a"], ["crash", "b"]]);
});

test("swapping head squares in the same tick is a tie", () => {
  const round = makeRound();
  round.b.body = [{ x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }];
  const next = stepRound(round, moveTogether, firstFreeCell);

  assert.equal(next.outcome, "tie");
  assert.deepEqual(next.score, round.score);
});

test("eating an apple keeps the tail and puts a new apple on a free square", () => {
  const round = makeRound();
  round.apple = { x: 5, y: 6 };
  const original = structuredClone(round);
  const next = stepRound(round, moveRight, firstFreeCell);

  assert.deepEqual(next.a.body, [{ x: 5, y: 6 }, ...original.a.body]);
  assert.deepEqual(next.apple, { x: 0, y: 0 });
  assert.deepEqual(next.stepEvents, [{ kind: "eat", team: "a", x: 5, y: 6 }]);
  assert.deepEqual(round, original);
});

test("a timeout awards a point to the longer snake", () => {
  const round = makeRound();
  round.b.body.push({ x: 11, y: 6 });
  const next = timeOutRound(round);

  assert.equal(next.outcome, "b");
  assert.deepEqual(next.score, { a: 2, b: 4 });
  assert.equal(timeOutRound(next), next);
});

test("equal lengths at timeout tie without changing the score", () => {
  const round = makeRound();
  const next = timeOutRound(round);

  assert.equal(next.outcome, "tie");
  assert.deepEqual(next.score, round.score);
  assert.equal(stepRound(next, moveTogether, firstFreeCell), next);
});
