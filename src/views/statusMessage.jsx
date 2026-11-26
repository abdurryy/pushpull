// View component: one line of system status with the push mark (loading, waiting, searching, empty, success or error).
import { PushMark } from "./pushMark.jsx";
import "./statusMessage.css";

// Which push mark animation goes with each kind of status. Empty has no mark: nothing is happening.
const MARK_FOR_KIND = {
  loading: "loading",
  waiting: "waiting",
  searching: "searching",
  success: "success",
  error: "failure",
  empty: null,
};

export function StatusMessage(props) {
  const kind = props.kind || "loading";
  const mark = MARK_FOR_KIND[kind];

  function retryClickACB() {
    props.onRetry();
  }

  return (
    <div className={"status-message status-message-" + kind}>
      <p className="status-message-text" role={kind === "error" ? "alert" : "status"}>
        {mark && <PushMark variant={mark} />}
        <span>{props.children}</span>
      </p>
      {kind === "error" && props.onRetry && (
        <button className="status-message-retry" type="button" onClick={retryClickACB}>
          {props.retryLabel || "Try again"}
        </button>
      )}
    </div>
  );
}
