// View: shows the local Double Snake board, keyboard controls, and round results.
import { useEffect, useRef } from "react";
import { PushMark } from "./pushMark.jsx";
import "./demoView.css";

function tilePosition({ x, y }) {
  return { gridColumn: x + 1, gridRow: y + 1 };
}

function renderSnake(snake, team) {
  return snake.body.map(function renderTileCB(cell, index) {
    const head = index === 0 ? " demo-head demo-head-" + snake.heading : "";
    return <span key={cell.x + ":" + cell.y} className={"demo-tile demo-" + team + head} style={tilePosition(cell)} />;
  });
}

function outcomeText(outcome) {
  if (outcome === "tie") return "Round tied.";
  if (outcome === "a") return "Team A wins the round!";
  return "Team B wins the round!";
}

export function DemoView(props) {
  const arena = useRef(null);
  const { onClearKeys, onExit, playing } = props;

  useEffect(function watchFocusACB() {
    function pageHiddenACB() {
      if (document.hidden) onClearKeys();
    }
    window.addEventListener("blur", onClearKeys);
    document.addEventListener("visibilitychange", pageHiddenACB);
    return function cleanUpACB() {
      window.removeEventListener("blur", onClearKeys);
      document.removeEventListener("visibilitychange", pageHiddenACB);
      onExit();
    };
  }, [onClearKeys, onExit]);

  const start = useRef(null);
  useEffect(function focusRoundACB() {
    if (playing) arena.current?.focus();
    if (props.round?.outcome) start.current?.focus();
  }, [playing, props.round?.outcome]);

  function handleKeyACB(event, down) {
    const isGameKey = props.keyGroups.some(function hasKeyCB(group) { return group.codes.includes(event.code); });
    if (!playing || !isGameKey) return;
    if (down && (event.altKey || event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    props.onKeyChange(event.code, down);
  }

  function keyDownACB(event) { handleKeyACB(event, true); }
  function keyUpACB(event) { handleKeyACB(event, false); }

  const { round, roundNumber, seconds } = props;
  const score = round?.score || { a: 0, b: 0 };

  return (
    <main className="demo">
      <header className="demo-header">
        <a href="#/">Back to home</a>
        <h1>Double Snake demo</h1>
        <p>Four players, one keyboard. Hold a direction to move. Teammates who push in opposite directions stop the snake.</p>
      </header>
      <div className="demo-score">
        <strong className="demo-team demo-a">Team A <span className="numbers">{score.a}</span></strong>
        <strong className="numbers" aria-label={seconds + " seconds left"}>{seconds}s</strong>
        <strong className="demo-team demo-b">Team B <span className="numbers">{score.b}</span></strong>
      </div>
      <div className="demo-arena" ref={arena} tabIndex={playing ? 0 : -1} aria-label="Game board keyboard controls"
        onKeyDown={keyDownACB} onKeyUp={keyUpACB} onBlur={onClearKeys}>
        <div className="demo-board" aria-hidden="true" style={{ "--demo-columns": props.columns, "--demo-rows": props.rows }}>
          {round && renderSnake(round.a, "a")}
          {round && renderSnake(round.b, "b")}
          {round?.apple && <span className="demo-tile demo-apple" style={tilePosition(round.apple)} />}
        </div>
        {!round && <p className="demo-overlay">Start a round to place both snakes on the board.</p>}
        {round?.outcome && <p className="demo-overlay" role="status">{outcomeText(round.outcome)}</p>}
      </div>
      <div className="demo-actions">
        {playing ? (
          <p key={roundNumber} className="demo-round" role="status">
            <PushMark variant="game-start" /> Round {roundNumber}
          </p>
        ) : (
          <button ref={start} className="demo-start" type="button" onClick={props.onStart}>
            {round ? "Play another round" : "Start round"}
          </button>
        )}
        {playing && (props.teamACancelled || props.teamBCancelled) && (
          <span>{props.teamACancelled && "Team A stopped. "}{props.teamBCancelled && "Team B stopped."}</span>
        )}
      </div>
      <section className="demo-keys" aria-labelledby="demo-keys-title">
        <h2 id="demo-keys-title">Keyboard controls</h2>
        <p>Each row lists up, left, down, right.</p>
        <ul>
          {props.keyGroups.map(function renderKeysCB(group) {
            return (
              <li key={group.player}>
                <strong>Player {group.player}</strong>
                <span>{group.keys.map(function keyCB(key) { return <kbd key={key}>{key}</kbd>; })}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
