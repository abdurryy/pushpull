// View component: a team's colour with its name, so the team is never shown by colour alone.
import "./teamChip.css";

export function TeamChip(props) {
  const name = props.children || "Team " + props.team.toUpperCase();
  return <span className={"team-chip team-chip-" + props.team}>{name}</span>;
}
