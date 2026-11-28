// View component: explains a recovery state and leaves room for its next action.
import { StatusMessage } from "./statusMessage.jsx";
import "./recoveryMessage.css";

export function RecoveryMessage({ as: Heading = "h2", title, reason, kind = "error", children }) {
  return (
    <div className="recovery-message">
      <Heading className="recovery-title">{title}</Heading>
      <StatusMessage kind={kind}>{reason}</StatusMessage>
      {children}
    </div>
  );
}
