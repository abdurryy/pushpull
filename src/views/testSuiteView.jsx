// View: room-code entry, run controls and results for the four-player test.
import { Link } from "react-router-dom";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import "./testSuiteView.css";

export function TestSuiteView(props) {
  function runACB(event) {
    event.preventDefault();
    props.onRun();
  }

  function renderStatus() {
    if (props.error) return <StatusMessage kind="error">{props.error}</StatusMessage>;
    if (!props.connected) return <StatusMessage kind="waiting">Connecting to room sync…</StatusMessage>;
    if (props.pending) {
      return <StatusMessage>{props.running ? "Stopping the test…" : "Reserving four test seats…"}</StatusMessage>;
    }
    if (props.status === "stopped") return <StatusMessage kind="empty">Test stopped. The TV room is still open.</StatusMessage>;
    if (!props.steps.length) return <StatusMessage kind="empty">Open an empty TV room and enter its code.</StatusMessage>;
    const kind = props.status === "passed" ? "success" : props.status === "failed" ? "error" : "waiting";
    return <StatusMessage kind={kind}>{props.steps.at(-1)}</StatusMessage>;
  }

  function renderContent() {
    if (!props.authChecked) return <StatusMessage>Checking sign-in…</StatusMessage>;
    if (!props.signedIn) {
      return (
        <>
          <StatusMessage kind="empty">Sign in with the same account you use on the TV.</StatusMessage>
          <Link className="button" to="/room/login">Sign in with Google</Link>
        </>
      );
    }
    if (!props.available) return <StatusMessage kind="error">Room sync is unavailable.</StatusMessage>;
    return (
      <>
        <form className="test-suite-form" onSubmit={runACB}>
          <RoomCodeInput value={props.code} onCodeChange={props.onCodeChange} disabled={props.pending || props.running} />
          {props.running ? (
            <button className="button button-secondary" type="button" disabled={props.pending || !props.connected} onClick={props.onStop}>
              Stop test
            </button>
          ) : (
            <button className="button" type="submit" disabled={props.pending || !props.connected || props.code.length !== 4}
              aria-busy={props.pending}>Run test</button>
          )}
        </form>
        {renderStatus()}
        {props.steps.length > 1 && (
          <ol className="test-suite-steps" aria-label="Test progress">
            {props.steps.slice(0, -1).map(function stepCB(step) { return <li key={step}>{step}</li>; })}
          </ol>
        )}
      </>
    );
  }

  return (
    <main className="test-suite">
      <Link className="button button-text" to="/">Back to home</Link>
      <h1>Room test suite</h1>
      <p>Run four scripted players on your Double Snake TV board.</p>
      {renderContent()}
    </main>
  );
}
