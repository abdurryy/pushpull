// View component: plays each new event's sound once. It renders nothing.
// Give it the same event list as GameBoard, including the outcome for Lucky Box events.
import { useEffect, useRef } from "react";
import { playSound } from "../sound/soundPlayer.js";

const luckyBoxSounds = {
  growth: "luckyGrowth",
  shrink: "luckyShrink",
  steal: "luckySteal",
  snip: "luckySnip",
  swap: "luckySwap",
  bonusApple: "luckyBonusApple",
  freeze: "luckyFreeze",
  appleDelivery: "luckyAppleDelivery",
};

function soundName(cue) {
  const luckySound = luckyBoxSounds[cue.outcome];
  if (!luckySound) return cue.kind;
  return cue.amount === 0 ? "luckyNoChange" : luckySound;
}

function cueIdCB(cue) {
  return cue.id;
}

export function SoundCues(props) {
  const cues = props.cues || [];
  // Ids already played. Events that exist when the screen opens count as played, so old events stay quiet.
  const played = useRef(null);

  useEffect(function playNewCuesACB() {
    if (!played.current) {
      played.current = new Set(cues.map(cueIdCB));
      return;
    }
    cues.forEach(function playCueCB(cue) {
      if (played.current.has(cue.id)) return;
      played.current.add(cue.id);
      playSound(soundName(cue), cue.team);
    });
  }, [cues]);

  return null;
}
