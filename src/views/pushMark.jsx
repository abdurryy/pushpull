// View component: decorative Push/Pull logo for a state described by nearby text.
import "./pushMark.css";

const LEFT = "M0 0H6L12 6L6 12H0L6 6Z";
const RIGHT = "M24 0H18L12 6L18 12H24L18 6Z";

export function PushMark({ variant = "static" }) {
  return (
    <svg className={"push-mark push-mark-" + variant} viewBox="0 0 24 12" aria-hidden="true">
      {variant === "success" && <circle className="push-mark-halo" cx="12" cy="6" r="4.5" />}
      <path className="push-mark-left" d={LEFT} />
      <path className="push-mark-right" d={RIGHT} />
      {variant === "entry" && <path className="push-mark-shimmer" d={LEFT + " " + RIGHT} />}
      {variant === "loading" && <circle className="push-mark-ring" cx="12" cy="6" r="2" />}
      {variant === "searching" && <rect className="push-mark-beam" x="11" y="0" width="2" height="12" />}
      {variant === "failure" && <path className="push-mark-spark" d="M12 2V10" strokeDasharray="1 1" />}
      {variant === "waiting" && (
        <g className="push-mark-dots">
          <circle cx="10" cy="6" r="0.45" />
          <circle cx="12" cy="6" r="0.45" />
          <circle cx="14" cy="6" r="0.45" />
        </g>
      )}
      {variant === "game-start" && (
        <>
          <path className="push-mark-trace push-mark-trace-left" d={LEFT} pathLength="1" />
          <path className="push-mark-trace push-mark-trace-right" d={RIGHT} pathLength="1" />
        </>
      )}
    </svg>
  );
}
