// Game model rules: each tick returns a new board from the same pair of team inputs.
import { advanceLuckyBox, freeCells, hasCell, openLuckyBox, pickCell, sameCell, snakeLength } from "./luckyBoxRules.js";

export const COLUMNS = 20;
export const ROWS = 12;
export const TICK_MS = 240;
export const ROUND_SECONDS = 60;

export const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function combineSticks(first, second, heading) {
  if (!first) return second || null;
  if (!second || first === second) return first;
  const a = directions[first];
  const b = directions[second];
  if (a.x + b.x === 0 && a.y + b.y === 0) return null;
  if (heading === second) return second;
  return first;
}

function spawnApple(round, random) {
  return pickCell(freeCells(round, COLUMNS, ROWS, [round.box]), random);
}

export function createRound(score = { a: 0, b: 0 }, random = Math.random) {
  const a = { heading: "right", body: [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }] };
  const b = { heading: "left", body: [{ x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }] };
  const round = { a, b, score, apple: spawnApple({ a, b }, random), outcome: null, stepEvents: [] };
  return advanceLuckyBox(round, COLUMNS, ROWS, random);
}

function moveSnake(snake, heading, apple) {
  if (!heading || snake.frozenTicks) return { snake, ate: false, moved: false };
  const step = directions[heading];
  const current = snake.body[0];
  // Reversing into the neck is a collision, just like entering any other occupied cell.
  const head = { x: current.x + step.x, y: current.y + step.y };
  const ate = Boolean(apple && sameCell(head, apple));
  const body = [head, ...snake.body];
  let growth = snake.growth ?? 0;
  let bonusApples = snake.bonusApples ?? 0;
  if (ate) {
    if (bonusApples) {
      growth += 2;
      bonusApples -= 1;
    }
  } else if (growth) {
    growth -= 1;
  } else {
    body.pop();
  }
  return { snake: { ...snake, heading, body, growth, bonusApples }, ate, moved: true };
}

function outside({ x, y }) {
  return x < 0 || x >= COLUMNS || y < 0 || y >= ROWS;
}

function crashesMove(move, opponent) {
  if (!move.moved) return false;
  const [head, ...body] = move.snake.body;
  return outside(head) || hasCell(body, head) || hasCell(opponent.snake.body, head);
}

function finishRound(round, outcome) {
  return {
    ...round,
    outcome,
    stepEvents: [],
    score: {
      a: round.score.a + Number(outcome === "a"),
      b: round.score.b + Number(outcome === "b"),
    },
  };
}

function finishCrash(round, crashed) {
  let outcome = "tie";
  if (crashed.length === 1) outcome = crashed[0] === "a" ? "b" : "a";
  return {
    ...finishRound(round, outcome),
    stepEvents: crashed.map(function crashEventCB(team) {
      return { kind: "crash", team, ...round[team].body[0] };
    }),
  };
}

export function timeOutRound(round) {
  if (round.outcome) return round;
  const aLength = snakeLength(round.a);
  const bLength = snakeLength(round.b);
  if (aLength > bLength) return finishRound(round, "a");
  if (bLength > aLength) return finishRound(round, "b");
  return finishRound(round, "tie");
}

function moveRound(round, inputs, random) {
  const aDirection = combineSticks(inputs[0], inputs[1], round.a.heading);
  const bDirection = combineSticks(inputs[2], inputs[3], round.b.heading);
  const a = moveSnake(round.a, aDirection, round.apple);
  const b = moveSnake(round.b, bDirection, round.apple);

  // Check both proposed positions before either team can collect a pickup.
  const sameHead = sameCell(a.snake.body[0], b.snake.body[0]);
  const swappedHeads = sameCell(a.snake.body[0], round.b.body[0])
    && sameCell(b.snake.body[0], round.a.body[0]);
  if (a.moved && b.moved && (sameHead || swappedHeads)) return finishCrash(round, ["a", "b"]);
  const crashed = [];
  if (crashesMove(a, b)) crashed.push("a");
  if (crashesMove(b, a)) crashed.push("b");
  if (crashed.length) return finishCrash(round, crashed);

  let next = { ...round, a: a.snake, b: b.snake, stepEvents: [] };
  if (a.ate || b.ate) {
    const team = a.ate ? "a" : "b";
    next.apple = spawnApple(next, random);
    next.stepEvents.push({ kind: "eat", team, ...next[team].body[0] });
  }

  if (next.box) {
    if (a.moved && sameCell(a.snake.body[0], next.box)) {
      next = openLuckyBox(next, "a", COLUMNS, ROWS, random);
    } else if (b.moved && sameCell(b.snake.body[0], next.box)) {
      next = openLuckyBox(next, "b", COLUMNS, ROWS, random);
    }
  }
  if (!next.apple) next.apple = spawnApple(next, random);
  return next.apple || next.box ? next : { ...timeOutRound(next), stepEvents: next.stepEvents };
}

export function stepRound(round, inputs, random = Math.random, { slide = false } = {}) {
  if (round.outcome) return round;
  let next = moveRound(round, inputs, random);
  // Rain checks the intermediate square and keeps the events from both moves.
  if (slide && !next.outcome) {
    const second = moveRound(next, inputs, random);
    next = { ...second, stepEvents: [...next.stepEvents, ...second.stepEvents] };
  }
  return advanceLuckyBox(next, COLUMNS, ROWS, random);
}
