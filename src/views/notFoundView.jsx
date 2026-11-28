// View: explains an unknown route and gives players a way back home.
import { Link } from "react-router-dom";
import { RecoveryMessage } from "./recoveryMessage.jsx";
import "./notFoundView.css";

export function NotFoundView() {
  return (
    <main className="not-found">
      <div className="not-found-code" aria-hidden="true">
        <span>4</span>
        <span>0</span>
        <span>4</span>
      </div>
      <RecoveryMessage as="h1" title="Page not found" reason="Looks like this link took a wrong turn.">
        <Link className="button" to="/">Back to home</Link>
      </RecoveryMessage>
    </main>
  );
}
