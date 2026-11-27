// View: shares the host's room code and lets players join and choose teams.
import { RoomCode } from "./roomCode.jsx";
import { RoomCodeInput } from "./roomCodeInput.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamRoster } from "./teamRoster.jsx";
import "./roomView.css";

const teams = ["a", "b"];

export function RoomView(props) {
  function joinACB(event) {
    event.preventDefault();
    props.onJoin();
  }

  function pickTeamACB(event) {
    props.onPick(event.currentTarget.value);
  }

  function renderTeamCB(team) {
    const selected = props.side === team;
    const players = props.teams[team];
    return (
      <div className="room-team" key={team}>
        <TeamRoster team={team} players={players} youId={props.userId} />
        {!props.host && (
          <button type="button" className="button button-secondary" value={team} aria-pressed={selected}
            disabled={!props.connected || props.loading || (!selected && players.length >= 2)} onClick={pickTeamACB}>
            {selected ? "Your team" : "Join Team " + team.toUpperCase()}
          </button>
        )}
      </div>
    );
  }

  function renderLobby() {
    return (
      <>
        <div className="room-share">
          <RoomCode code={props.code} />
          {props.host && <p>On each phone, choose <strong>Use phone</strong> from the home page and enter this code.</p>}
        </div>
        {!props.host && (props.side === "a" || props.side === "b") && (
          <a className="button" href="#/play/room-controller">Open controller</a>
        )}
        <div className="room-teams">{teams.map(renderTeamCB)}</div>
        <div className="room-actions">
          {props.host && (props.ready
            ? <a className="button" href="#/room/game">Open game board</a>
            : <StatusMessage kind="empty">Two players on each team can start the round.</StatusMessage>)}
          <button type="button" className="button button-text" disabled={props.loading || !props.connected} onClick={props.onLeave}>
            {props.host ? "Close room" : "Leave room"}
          </button>
        </div>
      </>
    );
  }

  function renderContent() {
    if (!props.authChecked) return <StatusMessage>Checking sign-in…</StatusMessage>;
    if (!props.userId) {
      return <a className="button" href={props.host ? "#/room/login" : "#/play/login"}>Sign in with Google</a>;
    }
    if (!props.available) return <StatusMessage kind="error">Room sync is unavailable.</StatusMessage>;
    if (props.code) return renderLobby();
    const busy = props.loading || !props.connected;
    if (props.host) {
      return <button className="button" type="button" disabled={busy} aria-busy={props.loading} onClick={props.onCreate}>Create room</button>;
    }
    return (
      <form className="room-form" onSubmit={joinACB}>
        <RoomCodeInput value={props.codeInput} onCodeChange={props.onCodeChange} invalid={Boolean(props.error)} />
        <button className="button" type="submit" disabled={busy || props.codeInput.length !== 4} aria-busy={props.loading}>Join room</button>
      </form>
    );
  }

  return (
    <main className={props.host ? "room room-host" : "room"}>
      <a className="button button-text" href="#/">Back to home</a>
      <h1>{props.host ? "Host a room" : "Join a room"}</h1>
      {props.available && props.userId && !props.connected && <StatusMessage kind="waiting">Reconnecting…</StatusMessage>}
      {props.loading && <StatusMessage>{props.code ? "Leaving room…" : "Opening room…"}</StatusMessage>}
      {props.code && props.connected && !props.hostOnline && <StatusMessage kind="waiting">Waiting for the host to connect…</StatusMessage>}
      {props.error && <StatusMessage kind="error">{props.error}</StatusMessage>}
      {renderContent()}
    </main>
  );
}
