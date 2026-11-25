// Game model rules: each tick returns a new board from the same pair of team inputs.
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

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function hasCell(cells, target) {
  return cells.some(function matchesCB(cell) { return sameCell(target, cell); });
}

function spawnApple(a, b, random) {
  const open = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLUMNS; x += 1) {
      const cell = { x, y };
      if (!hasCell(a.body, cell) && !hasCell(b.body, cell)) open.push(cell);
    }
  }
  if (!open.length) return null;
  return open[Math.floor(random() * open.length)];
}

export function createRound(score = { a: 0, b: 0 }, random = Math.random) {
  const a = { heading: "right", body: [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }] };
  const b = { heading: "left", body: [{ x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }] };
  return {
    a, b, score,
    apple: spawnApple(a, b, random),
    outcome: null,
  };
}

function moveSnake(snake, heading, apple) {
  if (!heading) return { snake, ate: false, moved: false };
  const step = directions[heading];
  const current = snake.body[0];
  // Reversing into the neck is a collision, just like entering any other occupied cell.
  const head = { x: current.x + step.x, y: current.y + step.y };
  const ate = apple !== null && sameCell(head, apple);
  const body = [head, ...snake.body];
  if (!ate) body.pop();
  return { snake: { heading, body }, ate, moved: true };
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
    score: {
      a: round.score.a + Number(outcome === "a"),
      b: round.score.b + Number(outcome === "b"),
    },
  };
}

export function timeOutRound(round) {
  if (round.outcome) return round;
  if (round.a.body.length > round.b.body.length) return finishRound(round, "a");
  if (round.b.body.length > round.a.body.length) return finishRound(round, "b");
  return finishRound(round, "tie");
}

export function stepRound(round, inputs, random = Math.random) {
  if (round.outcome) return round;
  const aDirection = combineSticks(inputs[0], inputs[1], round.a.heading);
  const bDirection = combineSticks(inputs[2], inputs[3], round.b.heading);
  const a = moveSnake(round.a, aDirection, round.apple);
  const b = moveSnake(round.b, bDirection, round.apple);

  // Check both proposed positions before committing either one.
  const sameHead = sameCell(a.snake.body[0], b.snake.body[0]);
  const swappedHeads = sameCell(a.snake.body[0], round.b.body[0])
    && sameCell(b.snake.body[0], round.a.body[0]);
  if ((a.moved && b.moved) && (sameHead || swappedHeads)) return finishRound(round, "tie");
  const aCrashed = crashesMove(a, b);
  const bCrashed = crashesMove(b, a);
  if (aCrashed && bCrashed) return finishRound(round, "tie");
  if (aCrashed) return finishRound(round, "b");
  if (bCrashed) return finishRound(round, "a");

  const apple = a.ate || b.ate ? spawnApple(a.snake, b.snake, random) : round.apple;
  const next = { ...round, a: a.snake, b: b.snake, apple };
  return apple ? next : timeOutRound(next);
}
