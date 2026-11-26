// View helper: paints the Double Snake board on a canvas, one frame at a time (used by gameBoard.jsx).
// It only decides how the board looks. Where everything is comes from the model through GameBoard's props.
// Colours and timings are read from the design tokens, so the canvas follows design.md just like the CSS does.

const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const ANGLES = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const TURN_MS = 70;        // eyes and head turn most of the way to a new direction in about this long
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
    bodyWidth: 1 - 2 * parseFloat(token("--tile-inset")) / 100,
    team: { a: token("--color-team-a"), b: token("--color-team-b") },
    teamSoft: { a: token("--color-team-a-soft"), b: token("--color-team-b-soft") },
    effectMs: parseFloat(token("--duration-effect")) || 0,   // bursts, the swallow bulge, the crash flash and shake
    popMs: parseFloat(token("--duration")) || 0,              // a new apple popping in
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

// The gallery wraps at the edges. Draw a seam-crossing link from both sides so the canvas
// crops it at the rim, with no rounded cap or line through the middle of the board.
function strokeBody(frame, points, width, colour) {
  const { context, cell } = frame;
  if (points.length === 1) {
    circle(context, points[0].x, points[0].y, width / 2, colour);
    return;
  }
  context.strokeStyle = colour;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(function lineToCB(point, index) {
    const before = points[index];
    const dx = point.x - before.x;
    const dy = point.y - before.y;
    const x = acrossSeam(dx, frame.boardWidth, cell);
    const y = acrossSeam(dy, frame.boardHeight, cell);
    if (x || y) {
      context.lineTo(point.x - x, point.y - y);
      context.moveTo(before.x + x, before.y + y);
    } else if (Math.hypot(dx, dy) > cell * 1.5) {
      context.moveTo(point.x, point.y);
      return;
    }
    context.lineTo(point.x, point.y);
  });
  context.stroke();
}

function acrossSeam(delta, span, unit) {
  return Math.abs(delta) > span / 2 && span - Math.abs(delta) <= unit * 1.5
    ? Math.sign(delta) * span
    : 0;
}

// A moving piece can be partially visible on both edges before its centre crosses.
function atWrappedPoint(frame, point, reach, paintCB) {
  const { context, boardWidth, boardHeight } = frame;
  const x = point.x < reach ? boardWidth : point.x > boardWidth - reach ? -boardWidth : 0;
  const y = point.y < reach ? boardHeight : point.y > boardHeight - reach ? -boardHeight : 0;
  paintCB();
  if (!x && !y) return;
  context.save();
  if (x) {
    context.translate(x, 0);
    paintCB();
    context.translate(-x, 0);
  }
  if (y) {
    context.translate(0, y);
    paintCB();
    if (x) {
      context.translate(x, 0);
      paintCB();
    }
  }
  context.restore();
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

// Follow the body from head to tail, taking the short route across a seam.
function pointAlong(frame, points, fraction) {
  const position = fraction * (points.length - 1);
  const index = Math.floor(position);
  const point = points[index];
  const next = points[index + 1];
  if (!next) return point;
  const dx = next.x - point.x;
  const dy = next.y - point.y;
  const stepX = dx - acrossSeam(dx, frame.boardWidth, frame.cell);
  const stepY = dy - acrossSeam(dy, frame.boardHeight, frame.cell);
  if (Math.hypot(stepX, stepY) > frame.cell * 1.5) return point;
  return {
    x: wrap(point.x + stepX * (position - index), frame.boardWidth),
    y: wrap(point.y + stepY * (position - index), frame.boardHeight),
  };
}

// Turns an angle a share of the way towards a target angle, the short way round.
function turnTowards(angle, target, share) {
  const difference = Math.atan2(Math.sin(target - angle), Math.cos(target - angle));
  return angle + difference * share;
}

// --- Movement between ticks ---

function wrap(value, span) {
  return (value % span + span) % span;
}

function slidePoint(from, to, progress, board) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const stepX = dx - acrossSeam(dx, board.columns, 1);
  const stepY = dy - acrossSeam(dy, board.rows, 1);
  if (Math.abs(stepX) + Math.abs(stepY) > MAX_SLIDE) return to;
  // Cell positions refer to centres, which cross the rim half a cell beyond the last index.
  return {
    x: wrap(from.x + stepX * progress + 0.5, board.columns) - 0.5,
    y: wrap(from.y + stepY * progress + 0.5, board.rows) - 0.5,
  };
}

// Each body part slides from where it was on the last tick to where it is now, so the snake glides instead of jumping.
// A new tail part (after eating) starts where the old tail was.
function slideBody(before, now, progress, board) {
  if (!before || progress === 1) return now.body;
  const oldTail = before.body[before.body.length - 1];
  return now.body.map(function slideCB(cell, index) {
    return slidePoint(before.body[index] || oldTail, cell, progress, board);
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
      return effect.age >= 0 && effect.age < palette.effectMs;
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
  const crash = effect.kind === "crash";
  const colour = crash ? palette.ink : palette.team[effect.team];
  const dots = crash ? 8 : 6;
  // The crash starts outside the face so the crossed eyes stay visible at impact.
  const ringStart = crash ? 0.52 : 0.25;
  const dotStart = crash ? 0.52 : 0.3;
  context.globalAlpha = progress < 0.5 ? 1 : 2 - progress * 2;
  context.strokeStyle = colour;
  context.lineWidth = cell * 0.1;
  context.beginPath();
  context.arc(centre.x, centre.y, cell * lerp(ringStart, 0.85, progress), 0, Math.PI * 2);
  context.stroke();
  for (let index = 0; index < dots; index += 1) {
    const angle = (index / dots) * Math.PI * 2;
    const distance = cell * lerp(dotStart, 0.3 + palette.burst, progress);
    circle(context, centre.x + Math.cos(angle) * distance, centre.y + Math.sin(angle) * distance, cell * 0.09 * (1 - progress * 0.5), colour);
  }
  context.globalAlpha = 1;
}

// --- The board, apples and snakes ---

function paintFloor(frame, board) {
  const { context, cell, palette } = frame;
  context.fillStyle = palette.board;
  context.fillRect(-cell, -cell, (board.columns + 2) * cell, (board.rows + 2) * cell);
  // Faint seams place the dots in square cells without darkening the snakes' backdrop.
  context.beginPath();
  for (let x = 1; x < board.columns; x += 1) {
    context.moveTo(x * cell, 0);
    context.lineTo(x * cell, frame.boardHeight);
  }
  for (let y = 1; y < board.rows; y += 1) {
    context.moveTo(0, y * cell);
    context.lineTo(frame.boardWidth, y * cell);
  }
  context.strokeStyle = palette.dot;
  context.lineWidth = cell * 0.025;
  context.globalAlpha = 0.32;
  context.stroke();

  const dotRadius = cell * 0.045;
  context.beginPath();
  for (let y = 0; y < board.rows; y += 1) {
    for (let x = 0; x < board.columns; x += 1) {
      const centreX = (x + 0.5) * cell;
      const centreY = (y + 0.5) * cell;
      context.moveTo(centreX + dotRadius, centreY);
      context.arc(centreX, centreY, dotRadius, 0, Math.PI * 2);
    }
  }
  context.fillStyle = palette.dot;
  context.globalAlpha = 1;
  context.fill();
}

// An ink apple with a stalk, a leaf and a small shine. It pops in when it appears and bobs gently.
function paintApple(frame, apple, bornAt) {
  const { context, cell, palette, now, calm } = frame;
  const size = calm || !palette.popMs ? 1 : Math.max(0, popIn((now - bornAt) / palette.popMs));
  if (!size) return;
  const bob = calm ? 0 : Math.sin(now / 450 + apple.x) * cell * 0.04;
  const centre = toPixels(frame, apple);
  // Draw the apple around its own centre so the fruit and leaf pop in together.
  const scale = cell * size;
  context.save();
  context.translate(centre.x, centre.y + bob);
  context.scale(scale, scale);
  context.fillStyle = palette.apple;
  context.beginPath();
  context.moveTo(0, -0.13);
  context.bezierCurveTo(0.38, -0.32, 0.43, 0.24, 0.15, 0.33);
  context.quadraticCurveTo(0.07, 0.35, 0, 0.31);
  context.quadraticCurveTo(-0.07, 0.35, -0.15, 0.33);
  context.bezierCurveTo(-0.43, 0.24, -0.38, -0.32, 0, -0.13);
  context.fill();
  context.strokeStyle = palette.apple;
  context.lineWidth = 0.055;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, -0.12);
  context.quadraticCurveTo(0, -0.25, -0.08, -0.33);
  context.stroke();
  context.beginPath();
  context.moveTo(0, -0.21);
  context.quadraticCurveTo(0.07, -0.41, 0.26, -0.37);
  context.quadraticCurveTo(0.2, -0.19, 0, -0.21);
  context.fill();
  circle(context, -0.14, -0.04, 0.052, palette.surface);
  context.restore();
}

// Everything about one snake that this frame needs: where its parts are, swallowed apples, and whether it flashes.
function prepareSnake(frame, memory, snake, progress, effects) {
  const before = memory.previousBoard && memory.previousBoard.snakes.find(function sameTeamCB(other) {
    return other.team === snake.team;
  });
  const points = slideBody(before, snake, progress, memory.board).map(function pixelsCB(cell) {
    return toPixels(frame, cell);
  });
  const ownEffects = effects.filter(function isOwnCB(effect) { return effect.team === snake.team; });
  const swallows = ownEffects
    .filter(function isEatCB(effect) { return effect.kind === "eat"; })
    .map(function progressCB(effect) { return effect.age / frame.palette.effectMs; })
    .filter(function isTravellingCB(fraction) { return fraction < 1; });
  const crash = ownEffects.find(function isCrashCB(effect) { return effect.kind === "crash"; });
  // Two flashes during the crash effect, well under three a second (design.md, Game feel rule 5).
  const flashing = Boolean(crash) && Math.floor(crash.age / (frame.palette.effectMs / 4)) % 2 === 0;
  return { ...snake, points, swallows, flashing, face: turnFace(frame, memory, snake) };
}

// The head faces where the snake travels, and the pupils look where its team is steering. Both turn smoothly
// instead of snapping, and remember their angle between frames (memory.faces).
function turnFace(frame, memory, snake) {
  const facing = ANGLES[snake.heading] ?? 0;
  const looking = ANGLES[snake.looking] ?? facing;
  const face = memory.faces[snake.team] || { facing, looking };
  face.facing = turnTowards(face.facing, facing, frame.turnShare);
  face.looking = turnTowards(face.looking, looking, frame.turnShare);
  memory.faces[snake.team] = face;
  return face;
}

function paintEyes(frame, snake) {
  const { context, cell, palette, now, calm } = frame;
  const head = snake.points[0];
  const ahead = { x: Math.cos(snake.face.facing), y: Math.sin(snake.face.facing) };
  const side = { x: -ahead.y, y: ahead.x };
  const gaze = { x: Math.cos(snake.face.looking), y: Math.sin(snake.face.looking) };
  // Each team blinks at its own moment, for an eighth of a second every few seconds.
  const blinking = !calm && !snake.crashed && (now + (snake.team === "a" ? 0 : 1700)) % 3600 < 130;
  [-1, 1].forEach(function paintEyeCB(sideSign) {
    const x = head.x + ahead.x * cell * 0.18 + side.x * cell * 0.18 * sideSign;
    const y = head.y + ahead.y * cell * 0.18 + side.y * cell * 0.18 * sideSign;
    context.fillStyle = palette.surface;
    context.beginPath();
    context.ellipse(x, y, cell * 0.145, blinking ? cell * 0.02 : cell * 0.145, 0, 0, Math.PI * 2);
    context.fill();
    if (snake.crashed) {
      const size = cell * 0.072;
      context.strokeStyle = palette.ink;
      context.lineWidth = cell * 0.045;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x - size, y - size);
      context.lineTo(x + size, y + size);
      context.moveTo(x + size, y - size);
      context.lineTo(x - size, y + size);
      context.stroke();
      return;
    }
    if (blinking) return;
    // Pupils look where the team steers. When teammates pull apart, each eye looks inwards: the snake goes cross-eyed.
    const look = snake.torn ? { x: -side.x * sideSign, y: -side.y * sideSign } : gaze;
    circle(context, x + look.x * cell * 0.06, y + look.y * cell * 0.06, cell * 0.075, palette.ink);
  });
}

// Leave the tail tip plain to keep Team B's paired spots distinct from its eyes.
function paintMarkings(frame, snake) {
  const { context, cell, palette, boardWidth, boardHeight } = frame;
  const colour = palette.teamSoft[snake.team];
  snake.points.slice(1, -1).forEach(function paintMarkCB(point, index) {
    const before = snake.points[index];
    const dx = before.x - point.x;
    const dy = before.y - point.y;
    const angle = Math.atan2(dy - acrossSeam(dy, boardHeight, cell), dx - acrossSeam(dx, boardWidth, cell));
    atWrappedPoint(frame, point, cell * 0.22, function paintMarkAtEdgeCB() {
      if (snake.team === "a") {
        context.fillStyle = colour;
        context.beginPath();
        context.ellipse(point.x, point.y, cell * 0.085, cell * 0.21, angle, 0, Math.PI * 2);
        context.fill();
        return;
      }
      const sideX = -Math.sin(angle) * cell * 0.12;
      const sideY = Math.cos(angle) * cell * 0.12;
      circle(context, point.x - sideX, point.y - sideY, cell * 0.083, colour);
      circle(context, point.x + sideX, point.y + sideY, cell * 0.083, colour);
    });
  });
}

// A rounded toy-piece head leans toward its heading while the pupils follow the team's input.
function paintHead(frame, snake, colour) {
  const { context, cell } = frame;
  const head = snake.points[0];
  const angle = snake.face.facing;
  atWrappedPoint(frame, head, cell * 0.5, function paintHeadAtEdgeCB() {
    const x = head.x + Math.cos(angle) * cell * 0.04;
    const y = head.y + Math.sin(angle) * cell * 0.04;
    context.fillStyle = colour;
    context.beginPath();
    context.ellipse(x, y, cell * 0.46, cell * 0.445, angle, 0, Math.PI * 2);
    context.fill();
    paintEyes(frame, snake);
  });
}

function paintSnake(frame, snake) {
  const { context, cell, palette } = frame;
  const colour = snake.flashing ? palette.ink : palette.team[snake.team];
  strokeBody(frame, snake.points, cell * palette.bodyWidth, colour);
  snake.swallows.forEach(function paintSwallowCB(fraction) {
    const point = pointAlong(frame, snake.points, fraction);
    const radius = cell * (0.46 + 0.08 * Math.sin(fraction * Math.PI));
    atWrappedPoint(frame, point, radius, function paintSwallowAtEdgeCB() {
      circle(context, point.x, point.y, radius, colour);
    });
  });
  paintMarkings(frame, snake);
  paintHead(frame, snake, colour);
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
  const cell = canvas.width / board.columns;
  const frame = {
    context,
    palette,
    now,
    calm,
    width: canvas.width,
    height: canvas.height,
    cell,
    boardWidth: cell * board.columns,
    boardHeight: cell * board.rows,
    pixelRatio: canvas.width / (canvas.clientWidth || canvas.width),
    // How far faces turn this frame: all the way with reduced motion, otherwise a share based on the time since the last frame.
    turnShare: calm ? 1 : 1 - Math.exp(-(now - (memory.lastPaintAt ?? now)) / TURN_MS),
  };
  memory.lastPaintAt = now;
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
