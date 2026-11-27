// View: shows the local Double Snake board, keyboard controls, and round results.
import { useEffect, useRef } from "react";
import { PushMark } from "./pushMark.jsx";
import { GameBoard } from "./gameBoard.jsx";
import { LuckyBoxNotice } from "./luckyBoxNotice.jsx";
import { SoundCues } from "./soundCues.jsx";
import { MusicTrack } from "./musicTrack.jsx";
import { SoundToggle } from "./soundToggle.jsx";
import "./demoView.css";

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

// The board is a picture, so screen readers get the same facts in words.
function boardLabel(snakes, box) {
  if (snakes.length === 0) return "Empty game board";
  const descriptions = snakes.map(function describeSnakeCB(snake) {
    const team = "Team " + snake.team.toUpperCase();
    const length = snake.body.length + (snake.growth ?? 0);
    let state = " has " + length + " length";
    if (snake.crashed) state += " and crashed";
    if (snake.frozenTicks) state += " and is frozen";
    return team + state;
  });
  if (box) descriptions.push("Lucky Box at column " + (box.x + 1) + ", row " + (box.y + 1));
  return descriptions.join(". ");
}

// Round music while playing, the results track after a round, nothing before the first one.
function musicFor(playing, round) {
  if (playing) return "round";
  return round?.outcome ? "results" : null;
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

  // Clicking the sound button takes focus away from the board. During a round, give it back so the keys keep steering.
  function toggleSoundACB() {
    props.onToggleSound();
    if (playing) arena.current?.focus();
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
      <MusicTrack name={musicFor(playing, round)} intensity={playing && seconds <= 10 ? 1 : 0} muted={!props.soundOn} />
      <SoundCues cues={props.events} />
      <div className="demo-intro">
        <header className="demo-header">
          <nav className="demo-links" aria-label="Demo navigation">
            <a href="#/">Back to home</a>
            <a href="#/components">Test components and sound</a>
          </nav>
          <h1>Double Snake demo</h1>
          <p>Four players, one keyboard. Hold a direction to move. Teammates who push in opposite directions stop the snake.</p>
        </header>
        <div className="demo-actions">
          {playing ? (
            <p key={roundNumber} className="demo-round" role="status">
              <PushMark variant="game-start" /> Round {roundNumber}
            </p>
          ) : (
            <button ref={start} className="button" type="button" onClick={props.onStart}>
              {round ? "Play another round" : "Start round"}
            </button>
          )}
          {playing && (props.teamACancelled || props.teamBCancelled) && (
            <span>{props.teamACancelled && "Team A stopped. "}{props.teamBCancelled && "Team B stopped."}</span>
          )}
          <SoundToggle muted={!props.soundOn} onToggle={toggleSoundACB} />
        </div>
      </div>
      <div className="demo-playfield">
        <div className="demo-score">
          <strong className="demo-team demo-a">Team A <span className="numbers">{score.a}</span></strong>
          <strong className="numbers" aria-label={seconds + " seconds left"}>{seconds}s</strong>
          <strong className="demo-team demo-b">Team B <span className="numbers">{score.b}</span></strong>
        </div>
        <LuckyBoxNotice event={props.luckyResult} box={playing && props.box} playing={playing} />
        <div className="demo-arena" ref={arena} tabIndex={playing ? 0 : -1} aria-label="Game board keyboard controls"
          onKeyDown={keyDownACB} onKeyUp={keyUpACB} onBlur={onClearKeys}>
          <GameBoard
            columns={props.columns}
            rows={props.rows}
            snakes={props.snakes}
            apples={props.apples}
            box={props.box}
            effects={props.events}
            inputs={playing ? props.inputs : {}}
            weather={playing ? weather : null}
            tickMs={props.tickMs}
            label={boardLabel(props.snakes, props.box)}
          />
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
      </div>
      <div className="demo-guide">
        {!playing && (
          <form className="demo-weather" onSubmit={searchACB}>
            <label htmlFor="demo-city">Weather city (optional)</label>
            <div className="demo-weather-form">
              <input id="demo-city" value={props.cityQuery} onChange={cityChangeACB} />
              <button className="button button-secondary" type="submit"
                disabled={!props.cityQuery.trim() || props.weatherStatus === "loading"} aria-busy={props.weatherStatus === "loading"}>Check weather</button>
            </div>
            <p role="status">{renderWeatherStatus(props.weatherStatus, props.weatherCity)}</p>
          </form>
        )}
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
      </div>
    </main>
  );
}
