// View: shares the host's room code and tracks the live team rosters.
import { Link } from "react-router-dom";
import { CloseRoomButton } from "./closeRoomButton.jsx";
import { RoomCode } from "./roomCode.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamRoster } from "./teamRoster.jsx";
import "./roomView.css";

export function RoomView(props) {
  function renderLobby() {
    return (
      <>
        <div className="room-share">
          <RoomCode code={props.code} />
          <p>Enter this code on each phone, or share the phone invite.</p>
          <Link className="button button-text" to={"/play/join?code=" + props.code} target="_blank" rel="noopener">Open phone invite</Link>
        </div>
        <div className="room-teams">
          <TeamRoster team="a" players={props.teams.a} youId={props.userId} />
          <TeamRoster team="b" players={props.teams.b} youId={props.userId} />
        </div>
        <div className="room-actions">
          {!props.loading && (props.ready
            ? <Link className="button" to="/room/game">Open game board</Link>
            : <StatusMessage kind="empty">Two players on each team can start the round.</StatusMessage>)}
          <CloseRoomButton disabled={props.loading || !props.connected} onCloseRoom={props.onCloseRoom} />
        </div>
      </>
    );
  }

  function renderContent() {
    if (!props.authChecked) return <StatusMessage>Checking sign-in…</StatusMessage>;
    if (!props.userId) return <Link className="button" to="/room/login">Sign in with Google</Link>;
    if (!props.available) return <StatusMessage kind="error">Room sync is unavailable.</StatusMessage>;
    if (props.code) return renderLobby();
    return (
      <button className="button" type="button" disabled={props.loading || !props.connected}
        aria-busy={props.loading} onClick={props.onCreate}>
        Create room
      </button>
    );
  }

  return (
    <main className="room room-host">
      <Link className="button button-text" to="/">Back to home</Link>
      <h1>Host a room</h1>
      {props.available && props.userId && !props.connected && <StatusMessage kind="waiting">Reconnecting…</StatusMessage>}
      {props.loading && <StatusMessage>{props.code ? "Closing room…" : "Opening room…"}</StatusMessage>}
      {props.code && props.connected && !props.hostOnline && <StatusMessage kind="waiting">Waiting for the host to connect…</StatusMessage>}
      {props.error && <StatusMessage kind="error">{props.error}</StatusMessage>}
      {renderContent()}
    </main>
  );
}
