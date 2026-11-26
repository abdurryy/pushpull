// View (dev page, #/components): every shared component in every state, with sample props to copy.
// The buttons only change what this page shows, so their state stays in the View (UI-only state,
// see docs/course/project/keeping-presenter-simple.md). Real screens get their data from the model.
import { useState } from "react";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamChip } from "./teamChip.jsx";
import { TeamRoster } from "./teamRoster.jsx";
import { RoomCode } from "./roomCode.jsx";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { ScoreBar } from "./scoreBar.jsx";
import { Countdown } from "./countdown.jsx";
import { GameBoard } from "./gameBoard.jsx";
import { SoundToggle } from "./soundToggle.jsx";
import { MusicTrack } from "./musicTrack.jsx";
import { SoundCues } from "./soundCues.jsx";
import { SOUND_NAMES } from "../sound/effects.js";
import "./galleryView.css";

// Team A's teammates both steer down, so its eyes already look down. Team B's pull apart, so it goes cross-eyed.
const SAMPLE_SNAKES = [
  { team: "a", heading: "right", looking: "down", body: [{ x: 7, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }] },
  { team: "b", heading: "left", torn: true, body: [{ x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 5 }] },
];
const SAMPLE_APPLES = [{ x: 10, y: 5 }, { x: 11, y: 9 }];
// Team A's teammates push the same way (a double chevron), Team B's push apart (they cancel out).
const SAMPLE_INPUTS = { a: ["down", "down"], b: ["up", "down"] };
const SAMPLE_WEATHER = {
  clear: null,
  rain: { wet: true, wind: "right" },
  wind: { wind: "left" },
  night: { night: true },
};
const STEPS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Moves a sample snake one cell forward, wrapping at the edges, so the gallery can show the glide between ticks.
function stepSnakeCB(snake) {
  const [dx, dy] = STEPS[snake.heading];
  const head = snake.body[0];
  const next = { x: (head.x + dx + 20) % 20, y: (head.y + dy + 12) % 12 };
  return { ...snake, body: [next, ...snake.body.slice(0, -1)] };
}
const COUNTDOWN_STEPS = ["3", "2", "1", "Go!", null];
const TRACKS = ["lobby", "round", "trivia", "results"];

const AYA = { id: "u1", name: "Aya" };
const BO = { id: "u2", name: "Bo" };
const LONG_NAME = { id: "u3", name: "Maximiliana Oxenstierna" };

export function GalleryView() {
  const [retryKind, setRetryKind] = useState("error");
  const [typedCode, setTypedCode] = useState("");
  const [score, setScore] = useState({ a: 2, b: 1 });
  const [secondsLeft, setSecondsLeft] = useState(42);
  const [countdownStep, setCountdownStep] = useState(4);
  // One list of events feeds both GameBoard (pictures) and SoundCues (sounds), like the model's event list will.
  const [events, setEvents] = useState([]);
  const [soundOff, setSoundOff] = useState(false);
  const [track, setTrack] = useState(null);
  const [lastTenLayer, setLastTenLayer] = useState(false);
  const [snakes, setSnakes] = useState(SAMPLE_SNAKES);
  const [weatherName, setWeatherName] = useState("clear");

  function retryACB() { setRetryKind("loading"); }
  function addEvent(event) {
    setEvents([...events, { ...event, id: events.length + 1 }]);
  }
  function teamAEatsACB() { addEvent({ kind: "eat", team: "a", x: 10, y: 5 }); }
  function teamBEatsACB() { addEvent({ kind: "eat", team: "b", x: 11, y: 9 }); }
  function crashACB() { addEvent({ kind: "crash", team: "b", x: 13, y: 6 }); }

  function scoreAACB() {
    setScore({ a: score.a + 1, b: score.b });
    addEvent({ kind: "point", team: "a" });
  }
  function scoreBACB() {
    setScore({ a: score.a, b: score.b + 1 });
    addEvent({ kind: "point", team: "b" });
  }
  function nextSecondACB() {
    const next = Math.max(0, secondsLeft - 1);
    setSecondsLeft(next);
    if (next <= 10) addEvent({ kind: "tick" });
  }
  function lastTenACB() { setSecondsLeft(10); }
  function countdownACB() {
    const next = (countdownStep + 1) % COUNTDOWN_STEPS.length;
    setCountdownStep(next);
    if (COUNTDOWN_STEPS[next]) addEvent({ kind: COUNTDOWN_STEPS[next] === "Go!" ? "go" : "count" });
  }

  function toggleSoundACB() { setSoundOff(!soundOff); }
  function stepSnakesACB() { setSnakes(snakes.map(stepSnakeCB)); }
  function weatherClickACB(event) { setWeatherName(event.currentTarget.dataset.weather); }

  function renderWeatherButtonCB(name) {
    return <button key={name} type="button" data-weather={name} aria-pressed={weatherName === name} onClick={weatherClickACB}>{name}</button>;
  }
  function trackClickACB(event) { setTrack(event.currentTarget.dataset.track); }
  function stopMusicACB() { setTrack(null); }
  function lastTenLayerACB() { setLastTenLayer(!lastTenLayer); }
  function soundClickACB(event) { addEvent({ kind: event.currentTarget.dataset.sound, team: "a", x: 10, y: 5 }); }

  function renderTrackButtonCB(name) {
    return <button key={name} type="button" data-track={name} aria-pressed={track === name} onClick={trackClickACB}>{name}</button>;
  }
  function renderSoundButtonCB(name) {
    return <button key={name} type="button" data-sound={name} onClick={soundClickACB}>{name}</button>;
  }

  return (
    <main className="gallery">
      <MusicTrack name={track} intensity={lastTenLayer ? 1 : 0} muted={soundOff} />
      <SoundCues cues={events} />
      <header className="gallery-header">
        <a href="#/">Back to home</a>
        <h1>Components</h1>
        <p>Every shared piece in every state. Sample props are in <code>src/views/galleryView.jsx</code>, and design.md lists what each one is for.</p>
      </header>

      <section className="gallery-section" aria-labelledby="gallery-status">
        <h2 id="gallery-status">StatusMessage</h2>
        <StatusMessage kind="loading">Joining room K7M4…</StatusMessage>
        <StatusMessage kind="waiting">Waiting for 2 more players…</StatusMessage>
        <StatusMessage kind="searching">Checking the weather in Stockholm…</StatusMessage>
        <StatusMessage kind="empty">No games yet. Join a room to play your first one.</StatusMessage>
        <StatusMessage kind="success">You're in. Pick a team.</StatusMessage>
        <StatusMessage kind={retryKind} onRetry={retryACB}>
          {retryKind === "error" ? "Couldn't reach the room. Check your connection." : "Trying again…"}
        </StatusMessage>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-teams">
        <h2 id="gallery-teams">TeamChip and TeamRoster</h2>
        <div className="gallery-row">
          <TeamChip team="a" />
          <TeamChip team="b" />
          <TeamChip team="a">Aya + Bo</TeamChip>
        </div>
        <div className="gallery-columns">
          <TeamRoster team="a" players={[]} />
          <TeamRoster team="b" players={[AYA]} youId="u1" />
          <TeamRoster team="a" players={[BO, LONG_NAME]} />
        </div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-code">
        <h2 id="gallery-code">RoomCode and RoomCodeInput</h2>
        <div className="gallery-tv">
          <RoomCode code="K7M4" />
        </div>
        <div className="gallery-row">
          <RoomCode code="" />
        </div>
        <form className="gallery-form">
          <RoomCodeInput value={typedCode} onCodeChange={setTypedCode} />
          <p className="gallery-note">The parent gets <code>onCodeChange("{typedCode}")</code>. Try pasting "k7m4".</p>
        </form>
      </section>

      <section className="gallery-section gallery-tv" aria-labelledby="gallery-score">
        <h2 id="gallery-score">ScoreBar, GameBoard and Countdown (TV)</h2>
        <ScoreBar
          scoreA={score.a}
          scoreB={score.b}
          title="Double Snake · Round 2"
          secondsLeft={secondsLeft}
        />
        <div className="gallery-board">
          <GameBoard columns={20} rows={12} snakes={snakes} apples={SAMPLE_APPLES} effects={events}
            inputs={SAMPLE_INPUTS} weather={SAMPLE_WEATHER[weatherName]} tickMs={240}
            label="Team A's snake is 5 long, Team B's is 4 long" />
          <Countdown value={COUNTDOWN_STEPS[countdownStep]} />
        </div>
        <div className="gallery-row">
          <button type="button" onClick={teamAEatsACB}>Team A eats</button>
          <button type="button" onClick={teamBEatsACB}>Team B eats</button>
          <button type="button" onClick={crashACB}>Crash</button>
          <button type="button" onClick={stepSnakesACB}>Step snakes</button>
          <button type="button" onClick={scoreAACB}>Team A scores</button>
          <button type="button" onClick={scoreBACB}>Team B scores</button>
          <button type="button" onClick={nextSecondACB}>Next second</button>
          <button type="button" onClick={lastTenACB}>Last 10 seconds</button>
          <button type="button" onClick={countdownACB}>Next countdown step</button>
        </div>
        <div className="gallery-row">
          {Object.keys(SAMPLE_WEATHER).map(renderWeatherButtonCB)}
        </div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-sound">
        <h2 id="gallery-sound">SoundToggle, MusicTrack and SoundCues</h2>
        <p className="gallery-note">Browsers only play sound after a press, so press anything first. The board buttons above play their sounds too.</p>
        <div className="gallery-row">
          <SoundToggle muted={soundOff} onToggle={toggleSoundACB} />
        </div>
        <h3>Music</h3>
        <div className="gallery-row">
          {TRACKS.map(renderTrackButtonCB)}
          <button type="button" onClick={stopMusicACB}>Stop music</button>
          <button type="button" aria-pressed={lastTenLayer} onClick={lastTenLayerACB}>Last 10 seconds layer</button>
        </div>
        <h3>Effects</h3>
        <div className="gallery-row">
          {SOUND_NAMES.map(renderSoundButtonCB)}
        </div>
      </section>
    </main>
  );
}
