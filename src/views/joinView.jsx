// View: code entry and a three-column side picker for phones.
import { useRef } from "react";
import { Link } from "react-router-dom";
import { PushMark } from "./pushMark.jsx";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamChip } from "./teamChip.jsx";
import "./joinView.css";

const SIDES = [
  { value: "a", label: "Team A" },
  { value: "center", label: "Center" },
  { value: "b", label: "Team B" },
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
    let detail = seats === 1 ? "1 open seat" : seats + " open seats";
    if (full) detail = "Team full";
    if (center) detail = "No team";

    return (
      <div className="join-side" key={value}>
        <button
          className="button button-secondary join-side-button"
          type="button"
          value={value}
          aria-pressed={selected}
          data-full={full && !selected}
          aria-describedby={"join-side-" + value}
          disabled={!props.connected || props.loading || Boolean(props.changingSide) || (full && !selected)}
          onClick={pickACB}
        >
          {center ? label : <TeamChip team={value}>{label}</TeamChip>}
        </button>
        <span id={"join-side-" + value} className="join-side-detail">{detail}</span>
      </div>
    );
  }

  function renderSides() {
    return (
      <>
        <p className="join-context">Room <strong className="numbers">{props.code}</strong></p>
        <h1 id="join-title">Pick a side</h1>
        <p className="join-instructions">Tap or slide across the choices.</p>
        <div
          className="join-sides"
          role="group"
          aria-labelledby="join-title"
          aria-busy={Boolean(props.changingSide)}
          onPointerDown={startSlideACB}
          onPointerUp={finishSlideACB}
          onPointerCancel={cancelSlideACB}
        >
          {SIDES.map(renderSideCB)}
        </div>
        {props.loading && <StatusMessage>Leaving room…</StatusMessage>}
        {props.changingSide && !props.loading && props.connected && <StatusMessage>Picking side…</StatusMessage>}
        {props.connected && !props.loading && !props.hostOnline && <StatusMessage kind="waiting">Waiting for the host to reconnect…</StatusMessage>}
        {props.connected && !props.loading && props.hostOnline && (
          <StatusMessage kind="empty">
            {props.side === "center" ? "You're in the center." : "You're on Team " + props.side.toUpperCase() + "."}
          </StatusMessage>
        )}
        <div className="join-actions">
          {props.side !== "center" && <Link className="button" to="/play/room-controller">Open controller</Link>}
          <button className="button button-text" type="button" disabled={!props.connected || props.loading || Boolean(props.changingSide)} onClick={props.onLeave}>
            Leave room
          </button>
        </div>
      </>
    );
  }

  function renderCode() {
    return (
      <>
        <h1>Join a room</h1>
        <p className="join-instructions">Enter the four characters shown on the TV.</p>
        <form className="join-form" onSubmit={joinACB}>
          <RoomCodeInput value={props.codeInput} onCodeChange={props.onCodeChange} />
          <button
            className="button"
            type="submit"
            disabled={!props.connected || props.loading || props.codeInput.length !== 4}
            aria-busy={props.loading}
          >
            {props.error ? "Try again" : "Join room"}
          </button>
        </form>
        {props.loading && props.connected && <StatusMessage>Joining room…</StatusMessage>}
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
          <Link className="button" to="/play/login">Sign in with Google</Link>
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

    return (
      <>
        {props.code ? renderSides() : renderCode()}
        {!props.connected && <StatusMessage kind="waiting">Connection lost. Reconnecting…</StatusMessage>}
        {props.error && <StatusMessage kind="error">{props.error}</StatusMessage>}
      </>
    );
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
