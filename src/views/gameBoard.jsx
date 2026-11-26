// View component: the Double Snake board with snakes, apples and the Game feel effects (apple burst, crash spark, board shake).
import "./gameBoard.css";

// Directions the effect dots fly in. Eating gets six team-coloured dots, a crash gets eight ink sparks (design.md: at most eight).
const BURST_ANGLES = [0, 60, 120, 180, 240, 300];
const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function cellStyle(cell) {
  return { gridColumn: cell.x + 1, gridRow: cell.y + 1 };
}

function isCrashCB(effect) {
  return effect.kind === "crash";
}

// The same event list also feeds SoundCues, so only the events the board draws are kept here.
function isBoardEffectCB(effect) {
  return effect.kind === "eat" || effect.kind === "crash";
}

function renderSnakeCB(snake) {
  return snake.body.map(function renderTileCB(cell, index) {
    const head = index === 0 ? " game-board-head game-board-head-" + snake.heading : "";
    return (
      <span
        key={snake.team + "-" + index}
        className={"game-board-tile game-board-snake-" + snake.team + head}
        style={cellStyle(cell)}
      />
    );
  });
}

function renderAppleCB(apple) {
  return <span key={apple.x + ":" + apple.y} className="game-board-apple" style={cellStyle(apple)} />;
}

function renderEffectCB(effect) {
  const angles = effect.kind === "crash" ? SPARK_ANGLES : BURST_ANGLES;
  const team = effect.kind === "eat" ? " game-board-effect-" + effect.team : "";

  function renderDotCB(angle) {
    return <span key={angle} className="game-board-dot" style={{ "--angle": angle + "deg" }} />;
  }

  // The key is the event's id, so each event animates exactly once, when it first appears.
  return (
    <span key={effect.id} className={"game-board-effect game-board-" + effect.kind + team} style={cellStyle(effect)}>
      <span className="game-board-ring" />
      {angles.map(renderDotCB)}
    </span>
  );
}

export function GameBoard(props) {
  const effects = (props.effects || []).filter(isBoardEffectCB);
  const crashes = effects.filter(isCrashCB);
  const lastCrash = crashes[crashes.length - 1];

  return (
    <div
      className="game-board"
      role="img"
      aria-label={props.label || "Game board"}
      style={{ "--columns": props.columns, "--rows": props.rows }}
    >
      {/* A new key for each crash restarts the shake. Effects live in their own layer so they don't replay. */}
      <div key={lastCrash ? lastCrash.id : "steady"} className={"game-board-layer game-board-pieces" + (lastCrash ? " game-board-shake" : "")}>
        {props.snakes.map(renderSnakeCB)}
        {(props.apples || []).map(renderAppleCB)}
      </div>
      <div className="game-board-layer game-board-effects" aria-hidden="true">
        {effects.map(renderEffectCB)}
      </div>
    </div>
  );
}
