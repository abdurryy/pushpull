// View component (TV): the score bar above the board. Scores pop when they change and the timer warns in the last 10 seconds.
import { TeamChip } from "./teamChip.jsx";
import "./scoreBar.css";

const WARNING_SECONDS = 10;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes + ":" + String(rest).padStart(2, "0");
}

export function ScoreBar(props) {
  const warning = props.secondsLeft <= WARNING_SECONDS;

  return (
    <header className="score-bar">
      <div className="score-bar-team">
        <TeamChip team="a">{props.teamAName}</TeamChip>
        {/* A new key on each score replays the pop animation (design.md, Game feel). */}
        <span key={props.scoreA} className="score-bar-score numbers">{props.scoreA}</span>
      </div>
      <div className="score-bar-middle">
        <span className="score-bar-title">{props.title}</span>
        <span
          key={warning ? props.secondsLeft : "calm"}
          className={"score-bar-timer numbers" + (warning ? " score-bar-warning" : "")}
        >
          {formatTime(props.secondsLeft)}
        </span>
      </div>
      <div className="score-bar-team score-bar-team-b">
        <span key={props.scoreB} className="score-bar-score numbers">{props.scoreB}</span>
        <TeamChip team="b">{props.teamBName}</TeamChip>
      </div>
    </header>
  );
}
