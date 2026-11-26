// View component: shows a room code as four boxes. The parent sets the size with its font size.
import "./roomCode.css";

const CODE_LENGTH = 4;

export function RoomCode(props) {
  const code = props.code || "";

  function renderBoxCB(unused, index) {
    return <span key={index} className="room-code-box" aria-hidden="true">{code.charAt(index) || "·"}</span>;
  }

  // Screen readers get the code spelled out ("K 7 M 4"), so the letters aren't read as one word.
  const spoken = code ? "Room code " + code.split("").join(" ") : "Room code not ready yet";

  return (
    <p className={"room-code numbers" + (code ? "" : " room-code-empty")}>
      <span className="visually-hidden">{spoken}</span>
      {Array.from({ length: CODE_LENGTH }, renderBoxCB)}
    </p>
  );
}
