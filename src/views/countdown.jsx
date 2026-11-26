// View component (TV): the "3, 2, 1, Go!" before a round, shown over the board. Shows nothing when there is no value.
import "./countdown.css";

export function Countdown(props) {
  if (!props.value) return null;
  return (
    <div className="countdown" role="status">
      {/* A new key for each step replays the entry animation. */}
      <span key={props.value} className="countdown-value">{props.value}</span>
    </div>
  );
}
