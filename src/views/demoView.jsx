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

function renderWeatherStatus(status, city) {
  if (status === "loading") return <><PushMark variant="searching" /> Looking up weather…</>;
  if (status === "error") return "Weather is unavailable. Try again or start without it.";
  if (status === "done" && !city) return "No city found. Check the spelling or start without weather.";
  if (city) return city + " weather is ready for the next round.";
  return "Leave the city blank to play in ordinary conditions.";
}

function headPosition(snake, columns, rows) {
  const head = snake.body[0];
  return ((head.x + 0.5) / columns * 100) + "% " + ((head.y + 0.5) / rows * 100) + "%";
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
  function cityChangeACB(event) { props.onCityChange(event.target.value); }
  function searchACB(event) {
    event.preventDefault();
    props.onSearch();
  }

  const { round, roundNumber, seconds, weather } = props;
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
        {playing && weather?.night && (
          <div className="demo-night" aria-hidden="true" style={{
            "--demo-head-a": headPosition(round.a, props.columns, props.rows),
            "--demo-head-b": headPosition(round.b, props.columns, props.rows),
          }} />
        )}
        {!round && <p className="demo-overlay">Start a round to place both snakes on the board.</p>}
        {round?.outcome && <p className="demo-overlay" role="status">{outcomeText(round.outcome)}</p>}
      </div>
      {playing && weather && (
        <p className="demo-weather-summary">
          {weather.city} · {weather.night ? "Night" : "Daylight"}
          {weather.wet ? " · Wet: snakes slide one extra square" : " · Dry"}
          {weather.wind ? " · Wind: apples drift " + weather.wind : " · Calm"}
        </p>
      )}
      {!playing && (
        <form className="demo-weather" onSubmit={searchACB}>
          <label htmlFor="demo-city">Weather city (optional)</label>
          <div className="demo-weather-form">
            <input id="demo-city" value={props.cityQuery} onChange={cityChangeACB} />
            <button type="submit" disabled={!props.cityQuery.trim() || props.weatherStatus === "loading"}>Check weather</button>
          </div>
          <p role="status">{renderWeatherStatus(props.weatherStatus, props.weatherCity)}</p>
        </form>
      )}
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
