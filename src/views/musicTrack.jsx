// View component: plays a music track while it is on screen and applies the sound setting. It renders nothing.
// Render one per screen: <MusicTrack name="round" intensity={lastTenSeconds ? 1 : 0} muted={!soundOn} />
import { useEffect } from "react";
import { setMuted, setMusicIntensity, startMusic, stopMusic } from "../sound/soundPlayer.js";

export function MusicTrack(props) {
  useEffect(function playTrackACB() {
    if (props.name) startMusic(props.name);
    return stopMusic;
  }, [props.name]);

  useEffect(function applySettingsACB() {
    setMuted(Boolean(props.muted));
    setMusicIntensity(props.intensity || 0);
  }, [props.muted, props.intensity]);

  return null;
}
