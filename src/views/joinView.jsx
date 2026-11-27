// View: room code entry, team selection and the handoff to the controller.
import { useRef } from "react";
import { Link } from "react-router-dom";
import { PushMark } from "./pushMark.jsx";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamChip } from "./teamChip.jsx";
import "./joinView.css";

const SIDES = [
  { value: "a", label: "Team A" },
  { value: "b", label: "Team B" },
  { value: "center", label: "Wait without a team" },
];

export function JoinView(props) {
  const drag = useRef(null);
  const ignorePointerClick = useRef(false);

  function joinACB(event) {
    event.preventDefault();
    if (props.connected && !props.loading && props.codeInput.length === 4) props.onJoin();
  }

  function startSlideACB(event) {
    ignorePointerClick.current = false;
    const start = event.target.closest("button");
    if (event.isPrimary && event.button === 0 && start) {
      drag.current = { id: event.pointerId, start };
    }
  }

  function finishSlideACB(event) {
    if (drag.current?.id !== event.pointerId) return;
    const { start } = drag.current;
    drag.current = null;
    // Touch can keep sending events to the starting button after the finger moves away.
    const end = document.elementFromPoint(event.clientX, event.clientY)?.closest("button");
    if (end === start) return;
    ignorePointerClick.current = true;
    if (end && event.currentTarget.contains(end) && !end.disabled) props.onPickSide(end.value);
  }

  function cancelSlideACB() {
    drag.current = null;
  }

  function pickACB(event) {
    if (event.detail === 0 || !ignorePointerClick.current) props.onPickSide(event.currentTarget.value);
  }

  function renderSideCB({ value, label }) {
    const selected = props.side === value;
    const center = value === "center";
    const seats = props.openSeats[value];
    const full = seats === 0;
    const detail = full ? "Team full" : seats + (seats === 1 ? " open seat" : " open seats");

    return (
      <button
        className={"button button-secondary " + (center ? "join-center-button" : "join-side-button")}
        type="button"
        key={value}
        value={value}
        aria-label={label}
        aria-pressed={selected}
        data-full={full && !selected}
        aria-describedby={center ? undefined : "join-side-" + value}
        disabled={!props.connected || props.loading || Boolean(props.changingSide) || (full && !selected)}
        onClick={pickACB}
      >
        {center ? label : (
          <>
            <TeamChip team={value}>{label}</TeamChip>
            <span id={"join-side-" + value}>{detail}</span>
          </>
        )}
      </button>
    );
  }

  function renderSides() {
    const teamsFull = props.openSeats.a === 0 && props.openSeats.b === 0;
    const busy = props.loading || Boolean(props.changingSide);

    return (
      <>
        <div className="join-heading">
          <p className="join-context">Step 2 of 2 · Room <strong className="numbers">{props.code}</strong></p>
          <h1 id="join-title">Pick a side</h1>
        </div>
        <div
          className="join-sides"
          role="group"
          aria-labelledby="join-title"
          aria-busy={Boolean(props.changingSide)}
          onPointerDown={startSlideACB}
          onPointerUp={finishSlideACB}
          onPointerCancel={cancelSlideACB}
        >
          {SIDES.filter(function availableChoiceCB({ value }) {
            return value !== "center" || props.side !== "center";
          }).map(renderSideCB)}
        </div>
        {props.loading && <StatusMessage>Leaving room…</StatusMessage>}
        {props.changingSide && !props.loading && props.connected && <StatusMessage>Picking side…</StatusMessage>}
        {!props.connected && <StatusMessage kind="waiting">Connection lost. Reconnecting…</StatusMessage>}
        {props.connected && !props.loading && !props.changingSide && (
          <>
            {!props.hostOnline && (
              <StatusMessage kind="waiting">The TV lost its connection. Waiting for the host to reconnect…</StatusMessage>
            )}
            {props.side === "center" ? (
              <p className="join-instructions">
                {teamsFull ? "Both teams are full. Wait for a seat to open." : "Choose an open seat to play."}
              </p>
            ) : (
              <>
                <StatusMessage kind="success">{"You're on Team " + props.side.toUpperCase() + "."}</StatusMessage>
                {props.hostOnline && <p className="join-instructions">The host starts the round.</p>}
              </>
            )}
          </>
        )}
        {props.error && <StatusMessage kind="error">{props.error}</StatusMessage>}
        <div className="join-actions">
          <button className="button button-text" type="button" disabled={!props.connected || busy} onClick={props.onLeave}>
            Leave room
          </button>
          {props.side !== "center" && (
            props.connected && props.hostOnline && !busy
              ? <Link className="button" to="/play/room-controller">Open controller</Link>
              : <button className="button" type="button" disabled>Open controller</button>
          )}
        </div>
      </>
    );
  }

  function renderCode() {
    return (
      <>
        <div className="join-heading">
          <p className="join-context">Step 1 of 2</p>
          <h1>Join a room</h1>
          {props.closedRoomCode ? (
            <StatusMessage kind="empty">
              The host closed room {props.closedRoomCode}. Enter a new code to join another room.
            </StatusMessage>
          ) : <p className="join-instructions">Enter the four characters shown on the TV.</p>}
        </div>
        <form className="join-form" onSubmit={joinACB}>
          <RoomCodeInput value={props.codeInput} invalid={Boolean(props.error)} onCodeChange={props.onCodeChange} />
          {!props.connected && <StatusMessage kind="waiting">Connection lost. Reconnecting…</StatusMessage>}
          {props.loading && props.connected && <StatusMessage>Joining room…</StatusMessage>}
          {props.error && (
            <StatusMessage kind="error">{props.error} Check the code on the TV or ask the host for help.</StatusMessage>
          )}
          <button
            className="button"
            type="submit"
            disabled={!props.connected || props.loading || props.codeInput.length !== 4}
            aria-busy={props.loading}
          >
            {props.error ? "Try again" : "Join room"}
          </button>
        </form>
      </>
    );
  }

  function renderContent() {
    if (!props.authChecked) return <StatusMessage>Checking sign-in…</StatusMessage>;
    if (!props.user) {
      return (
        <>
          <h1>Join a room</h1>
          <p className="join-instructions">Sign in so your team can see your name.</p>
          <Link
            className="button"
            to={{ pathname: "/play/login", search: props.codeInput ? "?" + new URLSearchParams({ code: props.codeInput }) : "" }}
          >
            Sign in with Google
          </Link>
        </>
      );
    }
    if (!props.available) {
      return (
        <>
          <h1>Join a room</h1>
          <StatusMessage kind="error">Room sync is unavailable.</StatusMessage>
        </>
      );
    }

    return props.code ? renderSides() : renderCode();
  }

  return (
    <main className="join">
      <header className="join-header">
        <Link className="button button-text" to="/" aria-label="Push/Pull home"><PushMark /> PUSH/PULL</Link>
        {props.user && <span className="join-name">{props.user.name}</span>}
      </header>
      <div className="join-content">{renderContent()}</div>
    </main>
  );
}
