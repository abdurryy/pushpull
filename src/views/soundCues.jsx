// View component: plays each new event's sound once. It renders nothing.
// Give it the same event list as GameBoard ([{ id, kind, team }]); kind is a sound name from src/sound/effects.js.
import { useEffect, useRef } from "react";
import { playSound } from "../sound/soundPlayer.js";

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
      playSound(cue.kind, cue.team);
    });
  }, [cues]);

  return null;
}
