// View: displays the Lucky Box pickup and illustrates each possible outcome.
import { CRATE_ART, pickupColors } from "./pickupArt.js";
import "./luckyBoxNotice.css";

export const luckyResults = {
  growth: { label: "Growth spurt", detail: "+3 length", art: "M5 22h8a4 4 0 0 0 4-4V9m-5 5 5-5 5 5m3 6v7m-3.5-3.5h7" },
  shrink: { label: "Shrink", detail: amount => amount ? "−" + amount + " length" : "Already at minimum length", art: "M5 8v15m22-15v15M8 15.5h16m-14-4 4 4-4 4m12-8-4 4 4 4" },
  steal: { label: "Length heist", detail: amount => amount ? "+" + amount + " from the other team" : "The other team is at minimum length", art: "M7 7h18v5H7Zm0 13h10v5H7Zm14-5v10m-3.5-3.5L21 25l3.5-3.5" },
  snip: { label: "Tail snip", detail: amount => amount ? "Other team −" + amount + " length" : "The other team is at minimum length", art: "m11 13 13 11m-13-5L24 8M12 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  swap: { label: "Length swap", detail: amount => amount ? (amount > 0 ? "+" : "−") + Math.abs(amount) + " length after the trade" : "Both teams had the same length", art: "M7 11h18m-5-5 5 5-5 5m5 5H7m5-5-5 5 5 5" },
  bonusApple: { label: "Triple bite", detail: "Next apple gives +3 length", art: "M14 12c-2-2-7-2-7 3s3 9 6 9l1-.5 1 .5c3 0 6-4 6-9s-5-5-7-3Zm0 0c0-2 0-4-2-5m9 2h7m-3.5-3.5v7" },
  freeze: { label: "Freeze", detail: "Other team stops for 1.2 seconds", art: "M16 5v22M6.5 10.5l19 11m0-11-19 11M13 7l3 3 3-3m-6 18 3-3 3 3M7 14l4-1-1-4m15 9-4 1 1 4M7 18l4 1-1 4m15-9-4-1 1-4" },
  appleDelivery: { label: "Apple delivery", detail: amount => amount ? "Apple moved closer" : "No closer spot for the apple", art: "M19 13c-2-2-7-2-7 3s3 8 6 8l1-.5 1 .5c3 0 6-3 6-8s-5-5-7-3Zm0 0c0-2 0-4-2-5M5 13h4m-5 5h4m-3 5h5" },
};

function paintPathCB({ d, fill, stroke, width }) {
  return <path key={d} d={d} fill={fill ? "var(" + pickupColors[fill] + ")" : "none"}
    stroke={stroke && "var(" + pickupColors[stroke] + ")"} strokeWidth={width} />;
}

export function LuckyBoxIcon({ outcome }) {
  const result = luckyResults[outcome];
  return (
    <svg className="lucky-box-icon" viewBox="0 0 32 32" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
      {result ? (
        <>
          <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="var(--color-bg)" stroke="var(--color-ink)" strokeWidth="1.5" />
          <path d={result.art} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        </>
      ) : CRATE_ART.map(paintPathCB)}
    </svg>
  );
}

export function LuckyBoxNotice({ event, box, playing }) {
  const result = luckyResults[event?.outcome];
  const detail = typeof result?.detail === "function" ? result.detail(event.amount) : result?.detail;
  let prompt = "A mystery pickup";
  if (box) prompt = "Steer into the crate";
  else if (playing) prompt = "A new crate will appear";
  return (
    <div className="lucky-box-notice" role="status" aria-live="polite" aria-atomic="true">
      <div className="lucky-box-notice-content" key={event?.id ?? "closed"}>
        <LuckyBoxIcon outcome={event?.outcome} />
        <div className="lucky-box-copy">
          {result ? (
            <>
              <strong>Team {event.team.toUpperCase()} · {result.label}</strong>
              <span>{detail}</span>
            </>
          ) : (
            <>
              <strong>Lucky Box</strong>
              <span>{prompt}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
