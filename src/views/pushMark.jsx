// View component: decorative Push/Pull brand mark and round-start animation.
import "./pushMark.css";

const LEFT = "M0 0H6L12 6L6 12H0L6 6Z";
const RIGHT = "M24 0H18L12 6L18 12H24L18 6Z";

export function PushMark({ variant = "static" }) {
  return (
    <svg className={"push-mark push-mark-" + variant} viewBox="0 0 24 12" aria-hidden="true">
      <path className="push-mark-left" d={LEFT} />
      <path className="push-mark-right" d={RIGHT} />
      {variant === "entry" && <path className="push-mark-shimmer" d={LEFT + " " + RIGHT} />}
      {variant === "game-start" && (
        <>
          <path className="push-mark-trace push-mark-trace-left" d={LEFT} pathLength="1" />
          <path className="push-mark-trace push-mark-trace-right" d={RIGHT} pathLength="1" />
        </>
      )}
    </svg>
  );
}
