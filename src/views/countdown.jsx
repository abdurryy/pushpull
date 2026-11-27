// View component (TV): the optional round logo and countdown displayed over the board.
import { useState } from "react";
import { PushMark } from "./pushMark.jsx";
import { SoundCues } from "./soundCues.jsx";
import "./countdown.css";

const CLASH_CUES = [{ id: "clash", kind: "roundClash" }];

function RoundIntro() {
  const [hasClashed, setHasClashed] = useState(false);

  function clashACB() { setHasClashed(true); }

  return (
    <div className="countdown-intro" aria-hidden="true">
      <SoundCues cues={hasClashed ? CLASH_CUES : undefined} />
      <PushMark />
      <svg className="countdown-electricity" viewBox="-12 -6 24 12">
        <g className="countdown-trails" fill="none" strokeWidth=".4" strokeLinecap="round">
          <path stroke="var(--color-team-a)" d="M-36 -3H-23 M-32 0H-25 M-30 3H-19" />
          <path stroke="var(--color-team-b)" d="M36 3H23 M32 0H25 M30 -3H19" />
        </g>
        <g className="countdown-sparks" fill="none" strokeLinecap="round" strokeLinejoin="round"
          onAnimationStart={clashACB}>
          <ellipse rx="3.6" ry="8" stroke="var(--color-ink)" strokeWidth=".22" opacity=".33" />
          <path stroke="var(--color-team-a)" strokeWidth=".45"
            d="M-.3 -1L-2.3 -3.3L-4.2 -2.7L-6.4 -5.4L-8.3 -5.7 M-1.3 2L-3.4 3.6L-5.2 3L-7.2 6.8" />
          <path stroke="var(--color-team-b)" strokeWidth=".45"
            d="M.4 -2.1L2.8 -4.4L4.8 -3.7L6.2 -7.6 M1 1.4L3.3 3.9L5.6 3.2L8.6 6.1" />
          <path stroke="var(--color-ink)" strokeWidth=".45"
            d="M-3 -8.6l-1.2 -1.4 M3.1 -8l1.1 -1.8 M-2.5 8.1l-1.1 1.7 M2.8 7.7l1.4 1.4" />
          <path fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth=".22"
            d="M1.3 -5.4L-.7 -2L1 -2.2L-1.3 1.6L.4 1.2L-1 5.1L1.9 1.4L.4 1.8L2.7 -2.7L.9 -2.3Z" />
        </g>
      </svg>
      <span className="countdown-wordmark">PUSH/PULL</span>
    </div>
  );
}

export function Countdown({ value, introKey }) {
  const showIntro = introKey != null && (!value || value === "3");
  if (!value && !showIntro) return null;

  return (
    <div className={showIntro ? "countdown countdown-with-intro" : "countdown"} role="status">
      {showIntro && <RoundIntro key={introKey} />}
      {/* A new key for each step replays the entry animation. */}
      {value && <span key={value} className="countdown-value">{value}</span>}
    </div>
  );
}
