// Design reference (issue #133), not app code: four annotated screens that set the look for the full-screen revamp.
// Built from the real shared View components with sample data, so the references look exactly like the app will.
// Open http://localhost:8080/docs/visual-direction/ while `npm run dev` runs. docs/visual-direction/README.md explains it.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles/tokens.css";
import "../../src/styles/buttons.css";
import { PushMark } from "../../src/views/pushMark.jsx";
import { TeamChip } from "../../src/views/teamChip.jsx";
import { TeamRoster } from "../../src/views/teamRoster.jsx";
import { RoomCode } from "../../src/views/roomCode.jsx";
import { RoomCodeInput } from "../../src/views/roomCodeInput.jsx";
import { ScoreBar } from "../../src/views/scoreBar.jsx";
import { Countdown } from "../../src/views/countdown.jsx";
import { GameBoard } from "../../src/views/gameBoard.jsx";
import { StatusMessage } from "../../src/views/statusMessage.jsx";
import { SoundToggle } from "../../src/views/soundToggle.jsx";
import "./references.css";

// Sample data. The long name checks that every screen handles names that don't fit.
const LONG_NAME = "Maximiliana Oxenstierna";
const TEAM_A = [{ id: "ada", name: "Ada" }, { id: "max", name: LONG_NAME }];
const TEAM_B = [{ id: "bo", name: "Bo" }, { id: "kim", name: "Kim" }];
const SNAKES = [
  { team: "a", heading: "right", looking: "right", body: [{ x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 }] },
  { team: "b", heading: "left", looking: "left", body: [{ x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 }] },
];
const APPLES = [{ x: 10, y: 3 }, { x: 9, y: 9 }];
const NO_WEATHER = { wet: false, wind: false, night: false };
const ROUNDS = [
  { number: 1, mode: "Double Snake", winner: "a" },
  { number: 2, mode: "Orchard Sprint", winner: "b" },
  { number: 3, mode: "Wraparound", winner: "a" },
  { number: 4, mode: "Checkpoint Chase", winner: null },
  { number: 5, mode: "Hot Apple", winner: null },
];

function ignoreACB() {}

// An annotation number. README.md explains each number. Hidden on the comparison sheet.
function Note(props) {
  return <span className="ref-note" aria-hidden="true">{props.n}</span>;
}

// The top row every TV screen shares: logo on the left, where we are in the match, sound on the right.
function TvRail(props) {
  return (
    <header className="ref-tv-rail">
      <Note n={1} />
      <span className="ref-brand"><PushMark /> PUSH/PULL</span>
      <span className="ref-tv-context">{props.context}</span>
      <SoundToggle muted={false} onToggle={ignoreACB} />
    </header>
  );
}

// The bottom row every TV screen shares: what is happening in words, and the one next step on the right.
function TvNextStep(props) {
  return (
    <footer className="ref-tv-next">
      <Note n={props.note} />
      {props.kind
        ? <StatusMessage kind={props.kind}>{props.status}</StatusMessage>
        : <p className="ref-tv-next-text">{props.status}</p>}
      {props.children}
    </footer>
  );
}

function LobbyReference(props) {
  const ready = props.state === "ready";
  const teamB = ready ? TEAM_B : TEAM_B.slice(0, 1);
  return (
    <main className="ref-tv">
      <TvRail context="Best of 3 · Light rain in Stockholm" />
      <div className="ref-stage ref-lobby">
        <section className="ref-join-card" aria-labelledby="lobby-join">
          <Note n={2} />
          <div className="ref-join-text">
            <h2 id="lobby-join" className="ref-tv-title">Join on your phone</h2>
            <p className="ref-muted">Scan the QR code, or type this code at pushpull.live.</p>
          </div>
          <div className="ref-hero-code"><RoomCode code="K7M4" /></div>
          {/* Placeholder: issue #24 draws the real code with react-qr-code. */}
          <div className="ref-qr" role="img" aria-label="QR code that opens the join screen with this room code">
            <span className="icon" aria-hidden="true">qr_code_2</span>
          </div>
        </section>
        <div className="ref-lobby-teams">
          <Note n={3} />
          <TeamRoster team="a" players={TEAM_A} />
          <TeamRoster team="b" players={teamB} />
        </div>
      </div>
      {ready ? (
        <TvNextStep note={4} kind="success" status="Everyone's in. Start when you're ready.">
          <button className="button ref-focus" type="button">Start match</button>
        </TvNextStep>
      ) : (
        <TvNextStep note={4} kind="waiting" status="Waiting for 1 more player on Team B…">
          <button className="button" type="button" disabled>Start match</button>
        </TvNextStep>
      )}
    </main>
  );
}

function IntroReference(props) {
  if (props.state === "countdown") return <IntroCountdown />;
  return (
    <main className="ref-tv">
      <TvRail context="Round 1 of 3" />
      <div className="ref-stage ref-intro">
        <figure className="ref-intro-art">
          <Note n={2} />
          <GameBoard columns={20} rows={12} snakes={SNAKES} apples={APPLES} box={null} effects={[]}
            inputs={{ a: ["right", "right"], b: ["left", "up"] }} weather={NO_WEATHER} tickMs={240}
            label="Double Snake: two snakes and two apples on the board" />
        </figure>
        <div className="ref-intro-text">
          <Note n={3} />
          <p className="ref-muted ref-strong">Next mode</p>
          <h1 className="ref-intro-name">Double Snake</h1>
          <p className="ref-intro-goal">Make the other team's snake crash.</p>
          <ul className="ref-intro-rules">
            <li><span className="icon" aria-hidden="true">group</span> Two players steer one snake.</li>
            <li><span className="icon" aria-hidden="true">sync_alt</span> Push the same way to turn. Opposite pushes cancel.</li>
          </ul>
          <div className="ref-intro-teams">
            <Note n={4} />
            <TeamChip team="a">Ada + {LONG_NAME}</TeamChip>
            <TeamChip team="b">Bo + Kim</TeamChip>
          </div>
        </div>
      </div>
      <TvNextStep note={5} kind="waiting" status="Countdown starts when every phone is ready…" />
    </main>
  );
}

// The same intro once play is about to start: the board takes over and the goal stays visible as one line.
function IntroCountdown() {
  return (
    <main className="ref-tv ref-play">
      <div className="ref-play-top">
        <Note n={6} />
        <ScoreBar scoreA={0} scoreB={0} teamAName="Team A" teamBName="Team B"
          title="Double Snake · Round 1 of 3" secondsLeft={90} />
        <p className="ref-play-goal"><span className="icon" aria-hidden="true">flag</span> Goal: make the other snake crash</p>
      </div>
      <div className="ref-play-board">
        <Note n={7} />
        <div className="ref-play-board-box">
          <GameBoard columns={20} rows={12} snakes={SNAKES} apples={APPLES} box={null} effects={[]}
            inputs={{ a: [null, null], b: [null, null] }} weather={NO_WEATHER} tickMs={240}
            label="Double Snake board before the round starts" />
          <Countdown value="2" />
        </div>
      </div>
    </main>
  );
}

function RoundCell(props) {
  const round = props.round;
  const played = round.number <= props.played;
  const next = round.number === props.played + 1;
  let result = "Not played";
  if (played) result = "Team " + round.winner.toUpperCase() + " won";
  if (next) result = "Up next";
  return (
    <li className={"ref-round" + (next ? " ref-round-next" : "")}>
      <span className="ref-muted">Round {round.number}</span>
      <span className="ref-round-mode">{round.mode}</span>
      {played ? <TeamChip team={round.winner}>{result}</TeamChip> : <span className="ref-muted">{result}</span>}
    </li>
  );
}

function ScoreboardReference(props) {
  const deciding = props.state === "deciding";
  const played = deciding ? 4 : 3;
  const rounds = deciding ? ROUNDS.map(function lastWinnerCB(round) {
    return round.number === 4 ? { ...round, winner: "b" } : round;
  }) : ROUNDS;
  const scoreB = deciding ? 2 : 1;
  // Only the team that won the last round gets the pop, so the eye goes to the number that changed.
  const changed = rounds[played - 1].winner;
  function scoreClass(team) {
    return "ref-tally-score numbers" + (team === changed ? " ref-tally-changed" : "");
  }
  return (
    <main className="ref-tv">
      <TvRail context={"Round " + played + " of 5 done · First to 3 wins"} />
      <div className="ref-stage ref-scoreboard">
        <div className="ref-tally">
          <Note n={2} />
          <section className="ref-tally-team ref-tally-a" aria-label="Team A">
            <TeamChip team="a" />
            <p className="ref-tally-players">Ada + {LONG_NAME}</p>
            <span className={scoreClass("a")}>2</span>
          </section>
          <span className="ref-tally-dash" aria-hidden="true">–</span>
          <section className="ref-tally-team ref-tally-b" aria-label="Team B">
            <TeamChip team="b" />
            <p className="ref-tally-players">Bo + Kim</p>
            <span className={scoreClass("b")}>{scoreB}</span>
          </section>
        </div>
        <p className="ref-scoreboard-headline">
          <Note n={3} />
          {deciding ? "Deciding round: both teams need one more win." : "Match point: Team A needs one more win."}
        </p>
        <div className="ref-rounds-box">
          <Note n={4} />
          <ol className="ref-rounds">
            {rounds.map(function roundCB(round) { return <RoundCell key={round.number} round={round} played={played} />; })}
          </ol>
        </div>
      </div>
      <TvNextStep note={5} status={<><span className="ref-muted">Next up</span> {ROUNDS[played].mode}</>}>
        <button className="button ref-focus" type="button">Continue</button>
      </TvNextStep>
    </main>
  );
}

function JoinReference(props) {
  const team = props.state === "team";
  return (
    <main className="ref-phone">
      <header className="ref-phone-header">
        <Note n={1} />
        <span className="ref-brand"><PushMark /> PUSH/PULL</span>
        <span className="ref-muted ref-phone-account">{LONG_NAME}</span>
      </header>
      {team ? <JoinTeamStep /> : <JoinCodeStep />}
    </main>
  );
}

function JoinCodeStep() {
  return (
    <>
      <div className="ref-phone-intro">
        <Note n={2} />
        <p className="ref-muted ref-strong">Step 1 of 2</p>
        <h1 className="ref-phone-title">Join a room</h1>
        <p className="ref-muted">Type the room code from the TV.</p>
      </div>
      <form className="ref-phone-form" onSubmit={ignoreACB}>
        <Note n={3} />
        <RoomCodeInput value="K7M4" onCodeChange={ignoreACB} />
        <button className="button ref-phone-primary ref-focus" type="button">Join room</button>
      </form>
    </>
  );
}

function JoinTeamStep() {
  return (
    <>
      <div className="ref-phone-intro">
        <Note n={2} />
        <p className="ref-muted ref-strong">Step 2 of 2 · Room K7M4</p>
        <h1 className="ref-phone-title">Pick a side</h1>
      </div>
      {/* The TV lists every player, so the phone only needs one big toggle per team. */}
      <div className="ref-phone-teams">
        <Note n={4} />
        <button className="button button-secondary ref-team-choice" type="button" aria-pressed="true">
          <TeamChip team="a" />
          <span className="numbers">2 of 2</span>
          <span className="ref-team-choice-names">Ada + you</span>
        </button>
        <button className="button button-secondary ref-team-choice" type="button" aria-pressed="false">
          <TeamChip team="b" />
          <span className="numbers">1 of 2</span>
          <span className="ref-team-choice-names">Bo + open seat</span>
        </button>
      </div>
      <div className="ref-phone-form">
        <Note n={5} />
        <StatusMessage kind="waiting">Waiting for 1 more player…</StatusMessage>
        <button className="button ref-phone-primary ref-focus" type="button">I'm ready</button>
      </div>
    </>
  );
}

// The comparison sheet: every reference at quarter-size TV (the sofa test) and real phone size, side by side.
const SHEET_ROWS = [
  ["lobby/waiting", "intro/rules", "scoreboard/match-point", "join/code"],
  ["lobby/ready", "intro/countdown", "scoreboard/deciding", "join/team"],
];

function SheetFrame(props) {
  const phone = props.path.startsWith("join");
  return (
    <figure className={phone ? "ref-sheet-phone" : "ref-sheet-tv"}>
      <div className="ref-sheet-window">
        <iframe src={"#/" + props.path} title={props.path} tabIndex={-1} />
      </div>
      <figcaption><a href={"#/" + props.path + "/notes"}>{props.path}</a></figcaption>
    </figure>
  );
}

function Sheet() {
  function rowCB(row, index) {
    return <div key={index} className="ref-sheet-row">{row.map(function frameCB(path) { return <SheetFrame key={path} path={path} />; })}</div>;
  }
  return (
    <main className="ref-sheet">
      <h1 className="ref-phone-title">Push/Pull visual direction</h1>
      <p className="ref-muted">TV screens at quarter size, the phone at real size. Click a name to open it with annotations.</p>
      {SHEET_ROWS.map(rowCB)}
    </main>
  );
}

const REFERENCES = { lobby: LobbyReference, intro: IntroReference, scoreboard: ScoreboardReference, join: JoinReference };

// Reads "#/lobby/ready/notes" as reference "lobby", state "ready", with annotation numbers shown.
function readHash() {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/");
  return { reference: parts[0], state: parts[1], notes: parts[2] === "notes" };
}

function App() {
  const [route, setRoute] = useState(readHash());

  useEffect(function followHashACB() {
    function hashChangeACB() { setRoute(readHash()); }
    window.addEventListener("hashchange", hashChangeACB);
    return function stopACB() { window.removeEventListener("hashchange", hashChangeACB); };
  }, []);

  const Reference = REFERENCES[route.reference];
  if (!Reference) return <Sheet />;
  return (
    <div className={route.notes ? "ref-notes" : ""}>
      <Reference state={route.state} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
