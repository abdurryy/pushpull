// View: shares the host's room code and tracks the live team rosters.
import { Link } from "react-router-dom";
import { CloseRoomButton } from "./closeRoomButton.jsx";
import { RecoveryMessage } from "./recoveryMessage.jsx";
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
            : <StatusMessage kind="empty">
              {props.clearingSteering ? "Waiting for the phones to clear their steering…" : "Two players on each team can start the round."}
            </StatusMessage>)}
          <CloseRoomButton disabled={props.loading || !props.connected} onCloseRoom={props.onCloseRoom} />
        </div>
      </>
    );
  }

  function renderContent() {
    if (!props.authChecked) return <StatusMessage>Checking sign-in…</StatusMessage>;
    if (!props.userId) return <Link className="button" to="/room/login">Sign in with Google</Link>;
    if (!props.available) {
      return <RecoveryMessage title="Rooms unavailable" reason="This copy of Push/Pull can't connect to rooms." />;
    }
    if (props.code) return renderLobby();
    return (
      <button className="button" type="button" disabled={props.loading || !props.connected}
        aria-busy={props.loading} onClick={props.onCreate}>
        {props.error ? "Try again" : "Create room"}
      </button>
    );
  }

  if (props.modeUnavailable || props.gameUnavailable) {
    return (
      <main className="room room-host room-game-recovery">
        <RecoveryMessage as="h1" panel title={props.modeUnavailable ? "Mode unavailable" : "Game unavailable"}
          reason={props.modeUnavailable ? "This link points to an unknown mode." : "There's no active room on this screen."}>
          <Link className="button" to="/room">Open lobby</Link>
        </RecoveryMessage>
      </main>
    );
  }

  return (
    <main className="room room-host">
      <Link className="button button-text" to="/">Back to home</Link>
      <h1>Host a room</h1>
      {props.available && props.userId && !props.connected && <StatusMessage kind="waiting">Reconnecting…</StatusMessage>}
      {props.loading && <StatusMessage>{props.code ? "Closing room…" : "Opening room…"}</StatusMessage>}
      {props.code && props.connected && !props.hostOnline && <StatusMessage kind="waiting">Waiting for the host to connect…</StatusMessage>}
      {props.error && <RecoveryMessage title={props.code ? "Room problem" : "Couldn't open room"} reason={props.error} />}
      {props.interrupted && <StatusMessage kind="empty">The interrupted round ended without a point. Play again from the lobby.</StatusMessage>}
      {renderContent()}
    </main>
  );
}
