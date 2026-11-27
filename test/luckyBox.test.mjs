// Rules regressions: deterministic Lucky Box rolls and both normal and wet ticks.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRound, stepRound, timeOutRound } from "../src/model/doubleSnakeRules.js";
import { weatherStep } from "../src/model/demoWeather.js";
import { snakeLength } from "../src/model/luckyBoxRules.js";

const RIGHT = ["right", null, null, null];
const IDLE = [null, null, null, null];

function roll(index) {
  return () => (index + 0.1) / 8;
}

function setup() {
  const round = createRound({ a: 0, b: 0 }, roll(0));
  return {
    ...round,
    b: { ...round.b, body: [...round.b.body, { x: 18, y: 6 }, { x: 19, y: 6 }] },
    apple: { x: 0, y: 0 },
    box: { x: 5, y: 6 },
  };
}

test("a growth roll adds three segments as the snake moves and does not trigger apple cues", () => {
  const next = stepRound(setup(), RIGHT, roll(0));
  assert.equal(next.stepEvents[0].outcome, "growth");
  assert.equal(snakeLength(next.a), 6);
  assert.equal(timeOutRound(next).outcome, "a");
  const moved = stepRound(next, RIGHT, roll(0));
  assert.equal(moved.a.body.length, 4);
  assert.equal(snakeLength(moved.a), 6);
  assert.deepEqual(moved.stepEvents, []);
});

test("shrink respects the two-segment minimum", () => {
  const round = setup();
  const next = stepRound(round, RIGHT, roll(1));
  assert.equal(next.stepEvents[0].outcome, "shrink");
  assert.equal(next.stepEvents[0].amount, 1);
  assert.equal(next.a.body.length, 2);
  const minimum = stepRound({ ...round, a: { ...round.a, body: round.a.body.slice(0, 2) } }, RIGHT, roll(1));
  assert.equal(minimum.stepEvents[0].amount, 0);
  assert.equal(minimum.a.body.length, 2);
});

test("a heist transfers length but a snip only removes it", () => {
  const heist = stepRound(setup(), RIGHT, roll(2));
  assert.equal(heist.stepEvents[0].outcome, "steal");
  assert.deepEqual([snakeLength(heist.a), snakeLength(heist.b)], [5, 3]);
  const snip = stepRound(setup(), RIGHT, roll(3));
  assert.equal(snip.stepEvents[0].outcome, "snip");
  assert.deepEqual([snakeLength(snip.a), snakeLength(snip.b)], [3, 3]);
});

test("Team B can open a box and swap lengths, including queued growth", () => {
  const round = setup();
  round.a = { ...round.a, growth: 1 };
  round.box = { x: 14, y: 6 };
  const next = stepRound(round, [null, null, "left", null], roll(4));
  assert.equal(next.stepEvents[0].outcome, "swap");
  assert.equal(next.stepEvents[0].team, "b");
  assert.deepEqual([snakeLength(next.a), snakeLength(next.b)], [5, 4]);
});

test("triple bite applies to one apple and preserves its eat event", () => {
  const round = setup();
  round.apple = { x: 6, y: 6 };
  const charged = stepRound(round, RIGHT, roll(5));
  assert.equal(charged.stepEvents[0].outcome, "bonusApple");
  const fed = stepRound(charged, RIGHT, roll(0));
  assert.equal(fed.a.bonusApples, 0);
  assert.equal(snakeLength(fed.a), 6);
  assert.deepEqual(fed.stepEvents, [{ kind: "eat", team: "a", x: 6, y: 6 }]);
});

test("a freeze blocks the wet slide and then five complete ticks", () => {
  const inputs = ["right", null, "up", null];
  let round = weatherStep(setup(), inputs, { wet: true }, 1, roll(6));
  assert.equal(round.stepEvents[0].outcome, "freeze");
  assert.equal(round.b.body[0].y, 5);
  assert.equal(round.b.frozenTicks, 5);
  for (let tick = 2; tick <= 6; tick += 1) {
    round = weatherStep(round, [null, null, "up", null], { wet: true }, tick, roll(0));
    assert.equal(round.b.body[0].y, 5);
  }
  round = weatherStep(round, [null, null, "up", null], { wet: true }, 7, roll(0));
  assert.equal(round.b.body[0].y, 3);
});

test("regular round steps also expire a freeze", () => {
  const up = [null, null, "up", null];
  let round = stepRound(setup(), RIGHT, roll(6));
  for (let tick = 0; tick < 5; tick += 1) {
    round = stepRound(round, up, roll(0));
    assert.equal(round.b.body[0].y, 6);
  }
  assert.equal(stepRound(round, up, roll(0)).b.body[0].y, 5);
});

test("a delivery moves the apple to a closer free square", () => {
  const next = stepRound(setup(), RIGHT, roll(7));
  assert.equal(next.stepEvents[0].outcome, "appleDelivery");
  assert.equal(next.stepEvents[0].amount, 1);
  const distance = Math.abs(next.apple.x - 5) + Math.abs(next.apple.y - 6);
  assert.ok(distance >= 2 && distance <= 3);
  assert.ok(![...next.a.body, ...next.b.body].some(cell => cell.x === next.apple.x && cell.y === next.apple.y));
  const round = setup();
  round.apple = { x: 6, y: 6 };
  assert.deepEqual(stepRound(round, RIGHT, roll(7)).apple, round.apple);
});

test("one wet tick preserves a crate opening and an apple pickup in order", () => {
  const round = setup();
  round.apple = { x: 6, y: 6 };
  const next = weatherStep(round, RIGHT, { wet: true }, 1, roll(0));
  assert.deepEqual(next.stepEvents.map(event => event.kind), ["luckyGain", "eat"]);
  assert.equal(next.box, null);
  assert.equal(next.boxCooldown, 50);
});

test("a head-on crash at the crate is a tie without a pickup", () => {
  const round = setup();
  round.b = { heading: "left", body: [{ x: 6, y: 6 }, { x: 7, y: 6 }] };
  const next = stepRound(round, ["right", null, "left", null], roll(0));
  assert.equal(next.outcome, "tie");
  assert.deepEqual(next.stepEvents.map(event => event.kind), ["crash", "crash"]);
  assert.deepEqual(next.box, round.box);
});

test("wind cannot blow an apple onto the crate and respawn waits fifty ticks", () => {
  const windy = setup();
  windy.apple = { x: 5, y: 5 };
  const windTick = weatherStep(windy, IDLE, { wind: "down" }, 5, roll(0));
  assert.deepEqual(windTick.apple, windy.apple);

  let round = weatherStep(setup(), RIGHT, null, 1, roll(0));
  for (let tick = 2; tick <= 50; tick += 1) {
    round = weatherStep(round, IDLE, null, tick, roll(0));
    assert.equal(round.box, null);
  }
  round = weatherStep(round, IDLE, null, 51, roll(0));
  assert.ok(round.box);
  assert.ok(![round.apple, ...round.a.body, ...round.b.body].some(cell => cell.x === round.box.x && cell.y === round.box.y));
});
