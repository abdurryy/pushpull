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
import "./galleryView.css";

const SAMPLE_SNAKES = [
  { team: "a", heading: "right", body: [{ x: 7, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }] },
  { team: "b", heading: "left", body: [{ x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 15, y: 5 }] },
];
const SAMPLE_APPLES = [{ x: 10, y: 5 }, { x: 11, y: 9 }];
const COUNTDOWN_STEPS = ["3", "2", "1", "Go!", null];

const AYA = { id: "u1", name: "Aya" };
const BO = { id: "u2", name: "Bo" };
const LONG_NAME = { id: "u3", name: "Maximiliana Oxenstierna" };

export function GalleryView() {
  const [retryKind, setRetryKind] = useState("error");
  const [typedCode, setTypedCode] = useState("");
  const [score, setScore] = useState({ a: 2, b: 1 });
  const [secondsLeft, setSecondsLeft] = useState(42);
  const [countdownStep, setCountdownStep] = useState(4);
  const [effects, setEffects] = useState([]);

  function retryACB() { setRetryKind("loading"); }
  function scoreAACB() { setScore({ a: score.a + 1, b: score.b }); }
  function scoreBACB() { setScore({ a: score.a, b: score.b + 1 }); }
  function nextSecondACB() { setSecondsLeft(Math.max(0, secondsLeft - 1)); }
  function lastTenACB() { setSecondsLeft(10); }
  function countdownACB() { setCountdownStep((countdownStep + 1) % COUNTDOWN_STEPS.length); }

  function addEffect(effect) {
    setEffects([...effects, { ...effect, id: effects.length + 1 }]);
  }
  function teamAEatsACB() { addEffect({ kind: "eat", team: "a", x: 10, y: 5 }); }
  function teamBEatsACB() { addEffect({ kind: "eat", team: "b", x: 11, y: 9 }); }
  function crashACB() { addEffect({ kind: "crash", team: "b", x: 13, y: 6 }); }

  return (
    <main className="gallery">
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
          <GameBoard columns={20} rows={12} snakes={SAMPLE_SNAKES} apples={SAMPLE_APPLES} effects={effects}
            label="Team A's snake is 5 long, Team B's is 4 long" />
          <Countdown value={COUNTDOWN_STEPS[countdownStep]} />
        </div>
        <div className="gallery-row">
          <button type="button" onClick={teamAEatsACB}>Team A eats</button>
          <button type="button" onClick={teamBEatsACB}>Team B eats</button>
          <button type="button" onClick={crashACB}>Crash</button>
          <button type="button" onClick={scoreAACB}>Team A scores</button>
          <button type="button" onClick={scoreBACB}>Team B scores</button>
          <button type="button" onClick={nextSecondACB}>Next second</button>
          <button type="button" onClick={lastTenACB}>Last 10 seconds</button>
          <button type="button" onClick={countdownACB}>Next countdown step</button>
        </div>
      </section>
    </main>
  );
}
