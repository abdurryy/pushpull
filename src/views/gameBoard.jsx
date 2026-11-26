// View component: the Double Snake board, drawn on a canvas so snakes glide between ticks and the board feels alive
// (design.md, Board). The model says where everything is. This View only remembers the last board, to slide between
// the two, and when effects and apples appeared. That is UI-only state, which the course allows in a View.
import { useEffect, useRef } from "react";
import { paintBoard, readPalette } from "./boardPainter.js";
import "./gameBoard.css";

const DEFAULT_TICK_MS = 240;

// Changes whenever a snake moves or grows, so the View knows a new tick arrived (not just a re-render).
function snakesSignature(snakes) {
  return snakes.map(function headCB(snake) {
    const head = snake.body[0];
    return snake.team + head.x + "," + head.y + "," + snake.body.length + snake.heading;
  }).join("|");
}

function appleKeyCB(apple) {
  return apple.x + ":" + apple.y;
}

// Keeps only the entries whose key is still on the board, and adds new ones with the current time.
function rememberStarts(starts, keys, now) {
  keys.forEach(function addNewCB(key) {
    if (!starts.has(key)) starts.set(key, now);
  });
  [...starts.keys()].forEach(function dropOldCB(key) {
    if (!keys.includes(key)) starts.delete(key);
  });
}

export function GameBoard(props) {
  const canvas = useRef(null);
  const memory = useRef({ board: null, previousBoard: null, changedAt: 0, effectStarts: new Map(), appleBirths: new Map(), faces: {} });

  // After every render: store the newest board. When the snakes moved, the old board becomes "previous" to slide from.
  useEffect(function rememberBoardACB() {
    const now = performance.now();
    const remembered = memory.current;
    const snakes = (props.snakes || []).filter(function hasBodyCB(snake) { return snake.body.length > 0; });
    const board = {
      columns: props.columns,
      rows: props.rows,
      snakes,
      signature: snakesSignature(snakes),
      apples: props.apples || [],
      effects: props.effects || [],
      weather: props.weather || null,
      inputs: props.inputs || {},
      tickMs: props.tickMs || DEFAULT_TICK_MS,
    };
    // Events that were already there when the board first appeared are old news: they don't play.
    const effectsStartAt = remembered.board ? now : -Infinity;
    if (!remembered.board || remembered.board.signature !== board.signature) {
      remembered.previousBoard = remembered.board;
      remembered.changedAt = now;
    }
    remembered.board = board;
    rememberStarts(remembered.effectStarts, board.effects.map(function idCB(effect) { return effect.id; }), effectsStartAt);
    rememberStarts(remembered.appleBirths, board.apples.map(appleKeyCB), now);
  });

  // Once: paint a frame on every screen refresh, and keep the canvas as sharp as the screen when it changes size.
  useEffect(function startPaintingACB() {
    const element = canvas.current;
    const context = element.getContext("2d");
    const palette = readPalette(element);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    function resizeACB() {
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.round(element.clientWidth * ratio);
      element.height = Math.round(element.clientHeight * ratio);
    }

    function paintACB(now) {
      paintBoard(context, memory.current, palette, now, reducedMotion.matches);
      frameId = requestAnimationFrame(paintACB);
    }

    const resizeObserver = new ResizeObserver(resizeACB);
    resizeObserver.observe(element);
    resizeACB();
    frameId = requestAnimationFrame(paintACB);

    return function stopPaintingACB() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="game-board" style={{ "--columns": props.columns, "--rows": props.rows }}>
      <canvas ref={canvas} className="game-board-canvas" role="img" aria-label={props.label || "Game board"} />
    </div>
  );
}
