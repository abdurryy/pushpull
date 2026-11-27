// Game model: places Lucky Boxes and applies their outcomes after a safe move.
const BOX_RESPAWN_TICKS = 50;
const FREEZE_TICKS = 5;
const MIN_LENGTH = 2;

const outcomes = [
  "growth", "shrink", "steal", "snip", "swap", "bonusApple", "freeze", "appleDelivery",
];

export function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function hasCell(cells, target) {
  return cells.some(function matchesCB(cell) { return sameCell(target, cell); });
}

export function freeCells(round, columns, rows, excluded = []) {
  const occupied = [...round.a.body, ...round.b.body, ...excluded.filter(Boolean)];
  const open = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const cell = { x, y };
      if (!hasCell(occupied, cell)) open.push(cell);
    }
  }
  return open;
}

export function pickCell(cells, random) {
  if (!cells.length) return null;
  return cells[Math.floor(random() * cells.length)];
}

function spawnBox(round, columns, rows, random) {
  const open = freeCells(round, columns, rows, [round.apple]);
  const middle = open.filter(function inMiddleCB({ x, y }) {
    return Math.abs(x + 0.5 - columns / 2) < 2 && Math.abs(y + 0.5 - rows / 2) < 3;
  });
  return pickCell(middle.length ? middle : open, random);
}

// Age these once per game tick, even when rain makes that tick move two squares.
export function advanceLuckyBox(round, columns, rows, random) {
  if (round.outcome) return round;
  const boxCooldown = Math.max(0, (round.boxCooldown ?? 0) - 1);
  const box = round.box ?? (boxCooldown ? null : spawnBox(round, columns, rows, random));
  return {
    ...round,
    a: thaw(round.a),
    b: thaw(round.b),
    box,
    boxCooldown,
  };
}

function thaw(snake) {
  if (!snake.frozenTicks) return snake;
  return { ...snake, frozenTicks: snake.frozenTicks - 1 };
}

export function snakeLength(snake) {
  return snake.body.length + (snake.growth ?? 0);
}

// Growth keeps a tail in place on future moves. Shrinking cancels queued growth before trimming the body.
function changeLength(snake, delta) {
  const growth = (snake.growth ?? 0) + delta;
  if (growth >= 0) return { ...snake, growth };
  return { ...snake, growth: 0, body: snake.body.slice(0, Math.max(MIN_LENGTH, snake.body.length + growth)) };
}

function distanceBetween(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function applyOutcome(round, team, outcome, columns, rows, random) {
  const other = team === "a" ? "b" : "a";
  const own = round[team];
  const rival = round[other];
  const available = Math.max(0, snakeLength(rival) - MIN_LENGTH);

  switch (outcome) {
    case "growth":
      return { [team]: changeLength(own, 3), amount: 3 };
    case "shrink": {
      const amount = Math.max(0, Math.min(2, snakeLength(own) - MIN_LENGTH));
      return { [team]: changeLength(own, -amount), amount, kind: "luckyLoss" };
    }
    case "steal": {
      const amount = Math.min(2, available);
      return { [team]: changeLength(own, amount), [other]: changeLength(rival, -amount), amount };
    }
    case "snip": {
      const amount = Math.min(2, available);
      return { [other]: changeLength(rival, -amount), amount };
    }
    case "swap": {
      const amount = snakeLength(rival) - snakeLength(own);
      return { [team]: changeLength(own, amount), [other]: changeLength(rival, -amount), amount, kind: "luckyTrade" };
    }
    case "bonusApple":
      return { [team]: { ...own, bonusApples: (own.bonusApples ?? 0) + 1 } };
    case "freeze":
      // The collection tick uses one count, leaving five complete ticks for the freeze.
      return { [other]: { ...rival, frozenTicks: FREEZE_TICKS + 1 } };
    case "appleDelivery": {
      const head = own.body[0];
      const currentDistance = round.apple ? distanceBetween(head, round.apple) : Infinity;
      const nearby = freeCells(round, columns, rows, [round.apple]).filter(function nearbyCB(cell) {
        const distance = distanceBetween(head, cell);
        return distance >= 2 && distance <= 3 && distance < currentDistance;
      });
      const apple = pickCell(nearby, random);
      return { apple: apple ?? round.apple, amount: Number(Boolean(apple)) };
    }
  }
}

export function openLuckyBox(round, team, columns, rows, random) {
  const outcome = outcomes[Math.floor(random() * outcomes.length)];
  const { amount, kind = "luckyGain", ...changes } = applyOutcome(round, team, outcome, columns, rows, random);
  return {
    ...round,
    ...changes,
    box: null,
    boxCooldown: BOX_RESPAWN_TICKS + 1,
    stepEvents: [...round.stepEvents, {
      ...round.box,
      kind: amount === 0 ? "luckyTrade" : kind,
      team,
      outcome,
      amount,
    }],
  };
}
