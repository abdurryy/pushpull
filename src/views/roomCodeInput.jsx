// View component: four boxes for typing a room code. Jumps to the next box, goes back on Backspace and accepts a pasted code.
import { useRef } from "react";
import "./roomCodeInput.css";

const CODE_LENGTH = 4;

// Keep only letters and digits, in capitals. Whether the room exists is checked by the model.
function cleanCode(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function RoomCodeInput(props) {
  const code = props.value || "";
  // The four <input> elements, so focus can move between them. This is UI-only state, not app data.
  const boxes = useRef([]);

  function focusBox(index) {
    const box = boxes.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))];
    if (box) box.focus();
  }

  function boxChangeACB(event) {
    const index = Number(event.target.dataset.index);
    const typed = cleanCode(event.target.value);
    if (!typed) {
      props.onCodeChange(code.slice(0, index) + code.slice(index + 1));
      return;
    }
    // One character when typing, several when pasting. Never leave a gap before the first empty box.
    const start = Math.min(index, code.length);
    const next = (code.slice(0, start) + typed + code.slice(start + typed.length)).slice(0, CODE_LENGTH);
    props.onCodeChange(next);
    focusBox(start + typed.length);
  }

  function boxKeyDownACB(event) {
    const index = Number(event.target.dataset.index);
    if (event.key === "Backspace" && !code.charAt(index) && index > 0) {
      event.preventDefault();
      props.onCodeChange(code.slice(0, index - 1) + code.slice(index));
      focusBox(index - 1);
    }
    if (event.key === "ArrowLeft") focusBox(index - 1);
    if (event.key === "ArrowRight") focusBox(index + 1);
  }

  function boxPasteACB(event) {
    const pasted = cleanCode(event.clipboardData.getData("text"));
    if (pasted.length !== CODE_LENGTH) return;
    event.preventDefault();
    props.onCodeChange(pasted);
    focusBox(CODE_LENGTH - 1);
  }

  // Selecting the character means typing replaces it instead of adding a second one.
  function boxFocusACB(event) {
    event.target.select();
  }

  function renderBoxCB(unused, index) {
    function keepBoxACB(element) {
      boxes.current[index] = element;
    }
    return (
      <label className="room-code-character" key={index}>
        <span className="room-code-position">{index + 1}</span>
        <input
          ref={keepBoxACB}
          className="room-code-input-box numbers"
          data-index={index}
          value={code.charAt(index)}
          onChange={boxChangeACB}
          onKeyDown={boxKeyDownACB}
          onPaste={boxPasteACB}
          onFocus={boxFocusACB}
          disabled={props.disabled}
          aria-label={"Character " + (index + 1) + " of " + CODE_LENGTH}
          aria-invalid={props.invalid || undefined}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={index === CODE_LENGTH - 1 ? "go" : "next"}
        />
      </label>
    );
  }

  return (
    <fieldset className="room-code-input">
      <legend className="room-code-input-label">{props.label || "Room code"}</legend>
      <div className="room-code-input-boxes">
        {Array.from({ length: CODE_LENGTH }, renderBoxCB)}
      </div>
    </fieldset>
  );
}
