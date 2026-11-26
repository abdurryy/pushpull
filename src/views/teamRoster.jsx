// View component: one team's seats in the lobby or on the join screen, with player names or "Open seat".
import { TeamChip } from "./teamChip.jsx";
import "./teamRoster.css";

export function TeamRoster(props) {
  const players = props.players || [];
  const seats = props.seats || 2;
  const openSeats = Math.max(0, seats - players.length);

  function renderPlayerCB(player) {
    return (
      <li key={player.id} className="team-roster-seat team-roster-filled">
        <span className="team-roster-avatar" aria-hidden="true">{(player.name || "?").charAt(0)}</span>
        <span className="team-roster-name">{player.name || "Player"}</span>
        {player.id === props.youId && <span className="team-roster-you">You</span>}
      </li>
    );
  }

  function renderOpenSeatCB(unused, index) {
    return (
      <li key={"open-" + index} className="team-roster-seat team-roster-open">
        <span className="icon" aria-hidden="true">person_add</span>
        Open seat
      </li>
    );
  }

  return (
    <section className={"team-roster team-roster-" + props.team} aria-label={"Team " + props.team.toUpperCase()}>
      <div className="team-roster-header">
        <TeamChip team={props.team}>{props.name}</TeamChip>
        <span className="team-roster-count numbers">{players.length} of {seats}</span>
      </div>
      <ul className="team-roster-seats">
        {players.map(renderPlayerCB)}
        {Array.from({ length: openSeats }, renderOpenSeatCB)}
      </ul>
    </section>
  );
}
