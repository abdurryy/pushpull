// View component: the TV's sound on/off button with an icon and a label (design.md, Sound). Fires onToggle.
import "./soundToggle.css";

export function SoundToggle(props) {
  function toggleClickACB() {
    props.onToggle();
  }

  return (
    <button className="sound-toggle" type="button" onClick={toggleClickACB}>
      <span className="icon" aria-hidden="true">{props.muted ? "volume_off" : "volume_up"}</span>
      {props.muted ? "Sound off" : "Sound on"}
    </button>
  );
}
