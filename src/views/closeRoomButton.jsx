// View component: a host-only room action with a modal confirmation.
import { useId, useRef } from "react";
import "./closeRoomButton.css";

export function CloseRoomButton({ disabled, onCloseRoom }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  function openACB() {
    dialog.current.showModal();
  }

  function cancelACB() {
    dialog.current.close();
  }

  function confirmACB() {
    dialog.current.close();
    onCloseRoom();
  }

  return (
    <>
      <button className="button button-text" type="button" disabled={disabled} onClick={openACB}>Close room</button>
      <dialog ref={dialog} className="close-room-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <div className="close-room-content">
          <h2 id={titleId}>Close this room?</h2>
          <p id={descriptionId}>This ends the room for everyone.</p>
          <div className="close-room-actions">
            <button className="button button-secondary" type="button" onClick={cancelACB}>Cancel</button>
            <button className="button" type="button" disabled={disabled} onClick={confirmACB}>Close room</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
