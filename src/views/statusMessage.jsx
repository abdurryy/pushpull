// View component: live status text with an optional retry action.
import "./statusMessage.css";

export function StatusMessage(props) {
  const kind = props.kind || "loading";

  function retryClickACB() {
    props.onRetry();
  }

  return (
    <div className={"status-message status-message-" + kind}>
      <p className="status-message-text" role={kind === "error" ? "alert" : "status"}>
        {props.children}
      </p>
      {kind === "error" && props.onRetry && (
        <button className="button button-text" type="button" onClick={retryClickACB}>
          {props.retryLabel || "Try again"}
        </button>
      )}
    </div>
  );
}
