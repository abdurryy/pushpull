// View helper: paints the Double Snake board on a canvas, one frame at a time (used by gameBoard.jsx).
// It only decides how the board looks. Where everything is comes from the model through GameBoard's props.
// Colours and timings are read from the design tokens, so the canvas follows design.md just like the CSS does.

const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const BODY_WIDTH = 0.84;   // snake thickness in cells: 8% space on each side, like --tile-inset
const SWALLOW_MS = 600;    // how long a swallowed apple takes to travel from head to tail
const MAX_SLIDE = 2.5;     // a part that moved further than this (a new round) jumps instead of sliding
const RAIN_DROPS = 70;
const WIND_STREAKS = 14;

export function readPalette(element) {
  const style = getComputedStyle(element);
  function token(name) {
    return style.getPropertyValue(name).trim();
  }
  return {
    board: token("--color-board"),
    dot: token("--color-board-dot"),
    ink: token("--color-ink"),
    surface: token("--color-surface"),
    apple: token("--color-apple"),
    team: { a: token("--color-team-a"), b: token("--color-team-b") },
    teamSoft: { a: token("--color-team-a-soft"), b: token("--color-team-b-soft") },
    effectMs: parseFloat(token("--duration-effect")) || 0,
    shake: parseFloat(token("--shake-distance")) || 0,
    burst: (parseFloat(token("--burst-distance")) || 0) / 100,
  };
}

// --- Small helpers ---

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

// A repeatable "random" number between 0 and 1 for raindrop number i, so the weather needs no stored particles.
function hash(index, salt) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function circle(context, x, y, radius, colour) {
  context.fillStyle = colour;
  context.beginPath();
  context.arc(x, y, Math.max(radius, 0), 0, Math.PI * 2);
  context.fill();
}

function strokePath(context, points, width, colour) {
  if (points.length < 2) return;
  context.strokeStyle = colour;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(function lineToCB(point) {
    context.lineTo(point.x, point.y);
  });
  context.stroke();
}

// The centre of a cell, in canvas pixels.
function toPixels(frame, cell) {
  return { x: (cell.x + 0.5) * frame.cell, y: (cell.y + 0.5) * frame.cell };
}

// A curve from 0 to 1 that overshoots a little and settles, so new things pop in.
function popIn(progress) {
  const t = Math.min(Math.max(progress, 0), 1) - 1;
  return 1 + 2.7 * t * t * t + 1.7 * t * t;
}

// The point a fraction (0 = head, 1 = tail) of the way along the snake's body.
function pointAlong(points, fraction) {
  const lengths = points.slice(1).map(function segmentLengthCB(point, index) {
    return Math.hypot(point.x - points[index].x, point.y - points[index].y);
  });
  let remaining = lengths.reduce(function sumCB(sum, length) { return sum + length; }, 0) * fraction;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index] && lengths[index] > 0) {
      const t = remaining / lengths[index];
      return { x: lerp(points[index].x, points[index + 1].x, t), y: lerp(points[index].y, points[index + 1].y, t) };
    }
    remaining -= lengths[index];
  }
  return points[points.length - 1];
}

// --- Movement between ticks ---

function slidePoint(from, to, progress) {
  if (!from || Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > MAX_SLIDE) return to;
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress) };
}

// Each body part slides from where it was on the last tick to where it is now, so the snake glides instead of jumping.
// A new tail part (after eating) starts where the old tail was.
function slideBody(before, now, progress) {
  if (!before) return now.body;
  const oldTail = before.body[before.body.length - 1];
  return now.body.map(function slideCB(cell, index) {
    return slidePoint(before.body[index] || oldTail, cell, progress);
  });
}

// --- Effects (design.md, Game feel) ---

// Effects that are still playing, each with its age in milliseconds. With reduced motion there are none.
function runningEffects(memory, now, palette, calm) {
  if (calm || !palette.effectMs) return [];
  return memory.board.effects
    .map(function addAgeCB(effect) {
      return { ...effect, age: now - (memory.effectStarts.get(effect.id) ?? now) };
    })
    .filter(function isRunningCB(effect) {
      const length = effect.kind === "eat" ? Math.max(SWALLOW_MS, palette.effectMs) : palette.effectMs;
      return effect.age >= 0 && effect.age < length;
    });
}

// The board moves sideways a little after a crash, fading out (the shake from the Game feel table).
function shakeOffset(frame, effects) {
  const crash = effects.find(function isCrashCB(effect) { return effect.kind === "crash"; });
  if (!crash) return 0;
  const left = 1 - crash.age / frame.palette.effectMs;
  return Math.sin(crash.age / 25) * frame.palette.shake * frame.pixelRatio * left;
}

// A ring and flying dots: team colour for eating, ink for a crash. Fully visible for the first half, then fading.
function paintBurst(frame, effect) {
  const { context, palette, cell } = frame;
  const progress = effect.age / palette.effectMs;
  if (progress >= 1 || (effect.kind !== "eat" && effect.kind !== "crash")) return;
  const centre = toPixels(frame, effect);
  const colour = effect.kind === "eat" ? palette.team[effect.team] : palette.ink;
  const dots = effect.kind === "eat" ? 6 : 8;
  context.globalAlpha = progress < 0.5 ? 1 : 2 - progress * 2;
  context.strokeStyle = colour;
  context.lineWidth = cell * 0.1;
  context.beginPath();
  context.arc(centre.x, centre.y, cell * lerp(0.25, 0.85, progress), 0, Math.PI * 2);
  context.stroke();
  for (let index = 0; index < dots; index += 1) {
    const angle = (index / dots) * Math.PI * 2;
    const distance = cell * lerp(0.3, 0.3 + palette.burst, progress);
    circle(context, centre.x + Math.cos(angle) * distance, centre.y + Math.sin(angle) * distance, cell * 0.09 * (1 - progress * 0.5), colour);
  }
  context.globalAlpha = 1;
}

// --- The board, apples and snakes ---

function paintFloor(frame, board) {
  const { context, cell, palette } = frame;
  context.fillStyle = palette.board;
  context.fillRect(-cell, -cell, (board.columns + 2) * cell, (board.rows + 2) * cell);
  for (let y = 0; y < board.rows; y += 1) {
    for (let x = 0; x < board.columns; x += 1) {
      circle(context, (x + 0.5) * cell, (y + 0.5) * cell, cell * 0.05, palette.dot);
    }
  }
}

// An ink apple with a stalk, a leaf and a small shine. It pops in when it appears and bobs gently.
function paintApple(frame, apple, bornAt) {
  const { context, cell, palette, now, calm } = frame;
  const size = calm ? 1 : Math.max(0, popIn((now - bornAt) / 300));
  const bob = calm ? 0 : Math.sin(now / 450 + apple.x) * cell * 0.04;
  const centre = toPixels(frame, apple);
  const x = centre.x;
  const y = centre.y + bob + cell * 0.06;
  const radius = cell * 0.24 * size;
  circle(context, x - radius * 0.3, y, radius, palette.apple);
  circle(context, x + radius * 0.3, y, radius, palette.apple);
  context.strokeStyle = palette.apple;
  context.lineWidth = cell * 0.06 * size;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x, y - radius * 0.7);
  context.lineTo(x + radius * 0.15, y - radius * 1.35);
  context.stroke();
  context.fillStyle = palette.apple;
  context.beginPath();
  context.ellipse(x + radius * 0.55, y - radius * 1.25, radius * 0.42, radius * 0.2, -0.5, 0, Math.PI * 2);
  context.fill();
  circle(context, x - radius * 0.55, y - radius * 0.35, radius * 0.18, palette.surface);
}

// Everything about one snake that this frame needs: where its parts are, swallowed apples, and whether it flashes.
function prepareSnake(frame, memory, snake, progress, effects) {
  const before = memory.previousBoard && memory.previousBoard.snakes.find(function sameTeamCB(other) {
    return other.team === snake.team;
  });
  const points = slideBody(before, snake, progress).map(function pixelsCB(cell) {
    return toPixels(frame, cell);
  });
  const ownEffects = effects.filter(function isOwnCB(effect) { return effect.team === snake.team; });
  const swallows = ownEffects
    .filter(function isEatCB(effect) { return effect.kind === "eat"; })
    .map(function progressCB(effect) { return effect.age / SWALLOW_MS; })
    .filter(function isTravellingCB(fraction) { return fraction < 1; });
  const crash = ownEffects.find(function isCrashCB(effect) { return effect.kind === "crash"; });
  // Two flashes during the crash effect, well under three a second (design.md, Game feel rule 5).
  const flashing = Boolean(crash) && Math.floor(crash.age / (frame.palette.effectMs / 4)) % 2 === 0;
  return { ...snake, points, swallows, flashing };
}

function paintEyes(frame, snake) {
  const { context, cell, palette, now, calm } = frame;
  const head = snake.points[0];
  const ahead = DIRECTIONS[snake.heading] || DIRECTIONS.right;
  const side = { x: -ahead.y, y: ahead.x };
  // Each team blinks at its own moment, for an eighth of a second every few seconds.
  const blinking = !calm && !snake.crashed && (now + (snake.team === "a" ? 0 : 1700)) % 3600 < 130;
  [-1, 1].forEach(function paintEyeCB(sideSign) {
    const x = head.x + ahead.x * cell * 0.14 + side.x * cell * 0.2 * sideSign;
    const y = head.y + ahead.y * cell * 0.14 + side.y * cell * 0.2 * sideSign;
    if (snake.crashed) {
      const size = cell * 0.09;
      context.strokeStyle = palette.ink;
      context.lineWidth = cell * 0.05;
      context.beginPath();
      context.moveTo(x - size, y - size);
      context.lineTo(x + size, y + size);
      context.moveTo(x + size, y - size);
      context.lineTo(x - size, y + size);
      context.stroke();
      return;
    }
    context.fillStyle = palette.surface;
    context.beginPath();
    context.ellipse(x, y, cell * 0.13, blinking ? cell * 0.02 : cell * 0.13, 0, 0, Math.PI * 2);
    context.fill();
    if (!blinking) circle(context, x + ahead.x * cell * 0.05, y + ahead.y * cell * 0.05, cell * 0.065, palette.ink);
  });
}

// One thick line through all parts (one creature, not loose squares), a stripe along the back, swallowed apples, head and eyes.
function paintSnake(frame, snake) {
  const { context, cell, palette } = frame;
  const colour = snake.flashing ? palette.ink : palette.team[snake.team];
  strokePath(context, snake.points, cell * BODY_WIDTH, colour);
  context.globalAlpha = 0.55;
  strokePath(context, snake.points.slice(1), cell * 0.18, palette.teamSoft[snake.team]);
  context.globalAlpha = 1;
  snake.swallows.forEach(function paintSwallowCB(fraction) {
    const point = pointAlong(snake.points, fraction);
    circle(context, point.x, point.y, cell * (0.46 + 0.08 * Math.sin(fraction * Math.PI)), colour);
  });
  circle(context, snake.points[0].x, snake.points[0].y, cell * 0.5, colour);
  paintEyes(frame, snake);
}

// A chevron next to the head for each teammate's stick. Two the same way make a double chevron; opposite ones point apart.
function paintInputs(frame, snake, directions) {
  const { context, cell, palette } = frame;
  const head = snake.points[0];
  const seen = {};
  context.strokeStyle = palette.ink;
  context.lineWidth = cell * 0.08;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalAlpha = 0.6;
  (directions || []).forEach(function paintChevronCB(direction) {
    const step = DIRECTIONS[direction];
    if (!step || snake.crashed) return;
    const repeat = seen[direction] || 0;
    seen[direction] = repeat + 1;
    const side = { x: -step.y, y: step.x };
    const reach = cell * (0.85 + repeat * 0.24);
    const tip = { x: head.x + step.x * reach, y: head.y + step.y * reach };
    const size = cell * 0.16;
    context.beginPath();
    context.moveTo(tip.x - step.x * size + side.x * size, tip.y - step.y * size + side.y * size);
    context.lineTo(tip.x, tip.y);
    context.lineTo(tip.x - step.x * size - side.x * size, tip.y - step.y * size - side.y * size);
    context.stroke();
  });
  context.globalAlpha = 1;
}

// --- Weather from Open-Meteo, made visible ---

// Slanted raindrops. They lean with the wind.
function paintRain(frame, wind) {
  const { context, cell, now, width, height, palette } = frame;
  const slant = (DIRECTIONS[wind] || { x: 0 }).x * 0.4;
  context.strokeStyle = palette.ink;
  context.globalAlpha = 0.16;
  context.lineWidth = cell * 0.045;
  context.lineCap = "round";
  for (let index = 0; index < RAIN_DROPS; index += 1) {
    const speed = (7 + hash(index, 1) * 4) * cell / 1000;
    const fall = (hash(index, 2) * height + now * speed) % (height + cell);
    const x = (((hash(index, 3) * width + fall * slant) % width) + width) % width;
    context.beginPath();
    context.moveTo(x, fall - cell * 0.5);
    context.lineTo(x - slant * cell * 0.45, fall - cell * 0.5 - cell * 0.45);
    context.stroke();
  }
  context.globalAlpha = 1;
}

// Short streaks drifting the way the wind blows, the same way the apples drift.
function paintWind(frame, wind) {
  const { context, cell, now, width, height, palette } = frame;
  const step = DIRECTIONS[wind];
  if (!step) return;
  const along = step.x !== 0 ? width : height;
  const across = step.x !== 0 ? height : width;
  context.strokeStyle = palette.ink;
  context.globalAlpha = 0.14;
  context.lineWidth = cell * 0.06;
  context.lineCap = "round";
  for (let index = 0; index < WIND_STREAKS; index += 1) {
    const travel = (hash(index, 4) * along + now * (2.5 + hash(index, 5) * 2) * cell / 1000) % (along + cell * 2) - cell;
    const offset = hash(index, 6) * across;
    const forward = step.x + step.y > 0 ? travel : along - travel;
    const x = step.x !== 0 ? forward : offset;
    const y = step.x !== 0 ? offset : forward;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - step.x * cell * 1.2, y - step.y * cell * 1.2);
    context.stroke();
  }
  context.globalAlpha = 1;
}

// After sunset the board goes dark except for a soft light around each snake head.
// The dark layer is drawn on its own canvas, so the lights can cut holes in it without touching the board.
function paintNight(frame, memory, snakes) {
  const { context, cell, width, height, palette } = frame;
  if (!memory.nightLayer) memory.nightLayer = document.createElement("canvas");
  const layer = memory.nightLayer;
  if (layer.width !== width || layer.height !== height) {
    layer.width = width;
    layer.height = height;
  }
  const night = layer.getContext("2d");
  night.globalCompositeOperation = "source-over";
  night.clearRect(0, 0, width, height);
  night.globalAlpha = 0.85;
  night.fillStyle = palette.ink;
  night.fillRect(0, 0, width, height);
  night.globalAlpha = 1;
  night.globalCompositeOperation = "destination-out";
  snakes.forEach(function lightHeadCB(snake) {
    const head = snake.points[0];
    const light = night.createRadialGradient(head.x, head.y, cell * 1.5, head.x, head.y, cell * 3.5);
    light.addColorStop(0, "rgba(0, 0, 0, 1)");
    light.addColorStop(1, "rgba(0, 0, 0, 0)");
    night.fillStyle = light;
    night.fillRect(0, 0, width, height);
  });
  context.drawImage(layer, 0, 0);
}

// --- One frame ---

// memory comes from GameBoard: the newest board, the one before it, when it arrived, and when each effect and apple began.
export function paintBoard(context, memory, palette, now, calm) {
  const board = memory.board;
  if (!board || !context.canvas.width) return;
  const canvas = context.canvas;
  const frame = {
    context,
    palette,
    now,
    calm,
    width: canvas.width,
    height: canvas.height,
    cell: canvas.width / board.columns,
    pixelRatio: canvas.width / (canvas.clientWidth || canvas.width),
  };
  const progress = calm ? 1 : Math.min(1, (now - memory.changedAt) / board.tickMs);
  const effects = runningEffects(memory, now, palette, calm);
  const snakes = board.snakes.map(function prepareCB(snake) {
    return prepareSnake(frame, memory, snake, progress, effects);
  });

  context.save();
  context.clearRect(0, 0, frame.width, frame.height);
  context.translate(shakeOffset(frame, effects), 0);
  paintFloor(frame, board);
  board.apples.forEach(function paintAppleCB(apple) {
    paintApple(frame, apple, memory.appleBirths.get(apple.x + ":" + apple.y) ?? now);
  });
  snakes.forEach(function paintSnakeCB(snake) { paintSnake(frame, snake); });
  snakes.forEach(function paintInputsCB(snake) { paintInputs(frame, snake, board.inputs[snake.team]); });
  effects.forEach(function paintEffectCB(effect) { paintBurst(frame, effect); });
  if (!calm && board.weather?.wet) paintRain(frame, board.weather.wind);
  if (!calm && board.weather?.wind) paintWind(frame, board.weather.wind);
  if (board.weather?.night) paintNight(frame, memory, snakes);
  context.restore();
}
