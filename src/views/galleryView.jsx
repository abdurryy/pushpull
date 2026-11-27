// View (dev page, #/components): every shared component in every state, with sample props to copy.
// The buttons only change what this page shows, so their state stays in the View (UI-only state,
// see docs/course/project/keeping-presenter-simple.md). Real screens get their data from the model.
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusMessage } from "./statusMessage.jsx";
import { ImageSkeleton } from "./imageSkeleton.jsx";
import { TeamChip } from "./teamChip.jsx";
import { TeamRoster } from "./teamRoster.jsx";
import { RoomCode } from "./roomCode.jsx";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { ScoreBar } from "./scoreBar.jsx";
import { Countdown } from "./countdown.jsx";
import { GameBoard } from "./gameBoard.jsx";
import { LuckyBoxIcon, LuckyBoxNotice, luckyResults } from "./luckyBoxNotice.jsx";
import { SoundToggle } from "./soundToggle.jsx";
import { MusicTrack } from "./musicTrack.jsx";
import { SoundCues } from "./soundCues.jsx";
import { SOUND_NAMES } from "../sound/effects.js";
import { prepareSound } from "../sound/soundPlayer.js";
import "./galleryView.css";

// Team A's teammates both steer down, so its eyes already look down. Team B's pull apart, so it goes cross-eyed.
const SAMPLE_SNAKES = [
  { team: "a", heading: "right", looking: "down", body: [{ x: 7, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }] },
  { team: "b", heading: "left", torn: true, body: [{ x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 5 }] },
];
const SAMPLE_APPLES = [{ x: 10, y: 5 }, { x: 11, y: 9 }];
const SAMPLE_BOX = { x: 9, y: 7 };
const LUCKY_SAMPLES = {
  growth: { amount: 3 },
  shrink: { amount: 2, kind: "luckyLoss" },
  steal: { amount: 2 },
  snip: { amount: 2 },
  swap: { amount: -2, kind: "luckyTrade" },
  bonusApple: {},
  freeze: {},
  appleDelivery: { amount: 1 },
};
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
// A crashed snake stays where it hit, as it does at the end of a real round.
function stepSnakeCB(snake) {
  if (snake.crashed) return snake;
  const [dx, dy] = STEPS[snake.heading];
  const head = snake.body[0];
  const next = { x: (head.x + dx + 20) % 20, y: (head.y + dy + 12) % 12 };
  return { ...snake, body: [next, ...snake.body.slice(0, -1)] };
}

function isTeamBCB(snake) { return snake.team === "b"; }

// The board draws a crash from the snake itself (crossed-out eyes, no arrows), not from the effect.
// In a real round the model sets this flag; here the Crash button does.
function crashTeamBCB(snake) {
  return isTeamBCB(snake) ? { ...snake, crashed: true } : snake;
}

// The board is a picture, so screen readers get the same facts in words (same wording as demoView.jsx).
function describeSnakeCB(snake) {
  return "Team " + snake.team.toUpperCase() + "'s snake is " + snake.body.length + " long" + (snake.crashed ? " and crashed" : "");
}
const COUNTDOWN_STEPS = ["3", "2", "1", "Go!", null];
const COUNTDOWN_SECOND_MS = 1000;
const TRACKS = ["lobby", "round", "trivia", "results"];

const AYA = { id: "u1", name: "Aya" };
const BO = { id: "u2", name: "Bo" };
const LONG_NAME = { id: "u3", name: "Maximiliana Oxenstierna" };
const IMAGE_PREVIEW_DELAY_MS = 1500;

export function GalleryView() {
  const soundHeading = useRef(null);
  const lastEventId = useRef(0);
  const [retryKind, setRetryKind] = useState("error");
  const [typedCode, setTypedCode] = useState("");
  const [score, setScore] = useState({ a: 2, b: 1 });
  const [secondsLeft, setSecondsLeft] = useState(42);
  const [countdownStep, setCountdownStep] = useState(4);
  const [introRun, setIntroRun] = useState(0);
  // One list of events feeds both GameBoard (pictures) and SoundCues (sounds), like the model's event list will.
  const [events, setEvents] = useState([]);
  const [luckyPreview, setLuckyPreview] = useState(null);
  const [soundOff, setSoundOff] = useState(false);
  const [soundTeam, setSoundTeam] = useState("a");
  const [lastSound, setLastSound] = useState("");
  const [track, setTrack] = useState(null);
  const [lastTenLayer, setLastTenLayer] = useState(false);
  const [snakes, setSnakes] = useState(SAMPLE_SNAKES);
  const [weatherName, setWeatherName] = useState("clear");
  const [imagePreviewPending, setImagePreviewPending] = useState(false);

  const addEvent = useCallback(function addEventACB(event) {
    lastEventId.current += 1;
    const numbered = { ...event, id: lastEventId.current };
    setEvents(function appendEventCB(previous) { return [...previous, numbered]; });
    return numbered;
  }, []);

  const showCountdownStep = useCallback(function showCountdownStepACB(step) {
    setCountdownStep(step);
    const value = COUNTDOWN_STEPS[step];
    if (value) addEvent({ kind: value === "Go!" ? "go" : "count" });
  }, [addEvent]);

  useEffect(function waitForImagePreviewACB() {
    if (!imagePreviewPending) return;

    function revealImageACB() { setImagePreviewPending(false); }
    const timeout = setTimeout(revealImageACB, IMAGE_PREVIEW_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [imagePreviewPending]);

  useEffect(function playRoundIntroACB() {
    if (!introRun) return;
    const styles = getComputedStyle(document.documentElement);
    const introMs = parseFloat(styles.getPropertyValue("--duration-loading"));
    const timers = COUNTDOWN_STEPS.map(function scheduleStepCB(value, step) {
      return setTimeout(function showStepACB() {
        showCountdownStep(step);
        if (!value) setIntroRun(0);
      }, introMs + step * COUNTDOWN_SECOND_MS);
    });
    return function cancelReplayACB() { timers.forEach(timer => clearTimeout(timer)); };
  }, [introRun, showCountdownStep]);

  function replayImageLoadingACB() { setImagePreviewPending(true); }

  function retryACB() { setRetryKind("loading"); }
  function teamAEatsACB() { addEvent({ kind: "eat", team: "a", x: 10, y: 5 }); }
  function teamBEatsACB() { addEvent({ kind: "eat", team: "b", x: 11, y: 9 }); }
  // The effect goes where Team B's head is now, which moves after Step snakes.
  function crashACB() {
    const head = snakes.find(isTeamBCB).body[0];
    setSnakes(snakes.map(crashTeamBCB));
    addEvent({ kind: "crash", team: "b", x: head.x, y: head.y });
  }
  // Keep event ids increasing when the board resets so old effects and sounds don't replay.
  function resetBoardACB() {
    setSnakes(SAMPLE_SNAKES);
    setLuckyPreview(null);
  }

  function previewLuckyACB(event) {
    const outcome = event.currentTarget.dataset.outcome;
    const preview = addEvent({ ...SAMPLE_BOX, team: soundTeam, outcome, kind: "luckyGain", ...LUCKY_SAMPLES[outcome] });
    setLuckyPreview(preview);
  }

  function renderLuckyButtonCB([outcome, result]) {
    return (
      <button className="button button-secondary" key={outcome} type="button" data-outcome={outcome} onClick={previewLuckyACB}>
        <LuckyBoxIcon outcome={outcome} /> {result.label}
      </button>
    );
  }

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
  function replayRoundIntroACB() {
    prepareSound();
    setCountdownStep(COUNTDOWN_STEPS.length - 1);
    setIntroRun(introRun + 1);
  }

  function countdownACB() {
    prepareSound();
    setIntroRun(0);
    const next = (countdownStep + 1) % COUNTDOWN_STEPS.length;
    showCountdownStep(next);
  }

  function toggleSoundACB() { setSoundOff(!soundOff); }
  function stepSnakesACB() { setSnakes(snakes.map(stepSnakeCB)); }
  function weatherClickACB(event) { setWeatherName(event.currentTarget.dataset.weather); }

  function renderWeatherButtonCB(name) {
    return <button className="button button-secondary" key={name} type="button" data-weather={name} aria-pressed={weatherName === name} onClick={weatherClickACB}>{name}</button>;
  }
  function trackClickACB(event) { setTrack(event.currentTarget.dataset.track); }
  function stopMusicACB() { setTrack(null); }
  function lastTenLayerACB() { setLastTenLayer(!lastTenLayer); }
  function jumpToSoundACB() { soundHeading.current?.focus(); }
  function soundTeamChangeACB(event) { setSoundTeam(event.target.value); }
  function soundClickACB(event) {
    const kind = event.currentTarget.dataset.sound;
    addEvent({ kind, team: soundTeam });
    setLastSound(kind + " · Team " + soundTeam.toUpperCase());
  }

  function renderTrackButtonCB(name) {
    return <button className="button button-secondary" key={name} type="button" data-track={name} aria-pressed={track === name} onClick={trackClickACB}>{name}</button>;
  }
  function renderSoundButtonCB(name) {
    return <button className="button button-secondary" key={name} type="button" data-sound={name} onClick={soundClickACB} disabled={soundOff}>{name}</button>;
  }

  return (
    <main className="gallery">
      <MusicTrack name={track} intensity={lastTenLayer ? 1 : 0} muted={soundOff} />
      <SoundCues cues={events} />
      <header className="gallery-header">
        <h1>Test components and sound</h1>
        <p>Try room codes, team seats, the game board, music, and sound effects.</p>
        <nav className="gallery-row" aria-label="Gallery shortcuts">
          <button className="button" type="button" onClick={jumpToSoundACB}>Jump to sound tests</button>
          <a className="button button-secondary" href="#/demo">Play keyboard demo</a>
          <a className="button button-text" href="#/">Back to home</a>
        </nav>
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

      <section className="gallery-section" aria-labelledby="gallery-image-skeleton">
        <h2 id="gallery-image-skeleton">ImageSkeleton</h2>
        <ImageSkeleton
          className="gallery-image-sample"
          src="/pushpull-icon-512.png"
          alt="Push/Pull app icon"
          pending={imagePreviewPending}
        />
        <div className="gallery-row">
          <button className="button button-secondary" type="button" onClick={replayImageLoadingACB} disabled={imagePreviewPending} aria-busy={imagePreviewPending}>
            {imagePreviewPending ? "Loading image…" : "Replay image loading"}
          </button>
        </div>
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
        <div className="gallery-pickup-preview">
          <LuckyBoxNotice event={luckyPreview} box={!luckyPreview && SAMPLE_BOX} />
          <div className="gallery-board">
            <GameBoard columns={20} rows={12} snakes={snakes} apples={SAMPLE_APPLES}
              box={luckyPreview ? null : SAMPLE_BOX}
              effects={events.filter(function hasPositionCB(event) { return event.x !== undefined; })}
              inputs={SAMPLE_INPUTS} weather={SAMPLE_WEATHER[weatherName]} tickMs={240}
              label={snakes.map(describeSnakeCB).join(", ")} />
            <Countdown value={COUNTDOWN_STEPS[countdownStep]} introKey={introRun || null} />
          </div>
        </div>
        <div className="gallery-row" role="group" aria-label="Preview Lucky Box outcomes">
          {Object.entries(luckyResults).map(renderLuckyButtonCB)}
        </div>
        <div className="gallery-row">
          <button className="button button-secondary" type="button" onClick={teamAEatsACB}>Team A eats</button>
          <button className="button button-secondary" type="button" onClick={teamBEatsACB}>Team B eats</button>
          <button className="button button-secondary" type="button" onClick={crashACB}>Crash</button>
          <button className="button button-secondary" type="button" onClick={stepSnakesACB}>Step snakes</button>
          <button className="button button-secondary" type="button" onClick={resetBoardACB}>Reset board</button>
          <button className="button button-secondary" type="button" onClick={scoreAACB}>Team A scores</button>
          <button className="button button-secondary" type="button" onClick={scoreBACB}>Team B scores</button>
          <button className="button button-secondary" type="button" onClick={nextSecondACB}>Next second</button>
          <button className="button button-secondary" type="button" onClick={lastTenACB}>Last 10 seconds</button>
          <button className="button button-secondary" type="button" onClick={replayRoundIntroACB}>Replay round intro</button>
          <button className="button button-secondary" type="button" onClick={countdownACB}>Next countdown step</button>
        </div>
        <div className="gallery-row">
          {Object.keys(SAMPLE_WEATHER).map(renderWeatherButtonCB)}
        </div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-sound">
        <h2 id="gallery-sound" ref={soundHeading} tabIndex={-1}>Sound tests</h2>
        <p className="gallery-note">Choose a track or effect to hear it. The board tests play sounds too.</p>
        <div className="gallery-row">
          <SoundToggle muted={soundOff} onToggle={toggleSoundACB} />
        </div>
        <h3>Music</h3>
        <div className="gallery-row">
          {TRACKS.map(renderTrackButtonCB)}
          <button className="button button-secondary" type="button" onClick={stopMusicACB}>Stop music</button>
          <button className="button button-secondary" type="button" aria-pressed={lastTenLayer} onClick={lastTenLayerACB}>Round music: last 10 seconds</button>
        </div>
        <h3>Effects</h3>
        <label className="gallery-sound-team">
          <span>Team voice</span>
          <select value={soundTeam} onChange={soundTeamChangeACB}>
            <option value="a">Team A</option>
            <option value="b">Team B</option>
          </select>
        </label>
        <div className="gallery-row">
          {SOUND_NAMES.map(renderSoundButtonCB)}
        </div>
        <p className="gallery-note" role="status">
          {soundOff ? "Sound is off." : lastSound && "Last effect: " + lastSound}
        </p>
      </section>
    </main>
  );
}
