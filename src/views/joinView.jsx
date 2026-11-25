// View (phone): the destination after login, until room joining is implemented.
import "./loginView.css";
import { PushMark } from "./pushMark.jsx";

export function JoinView(props) {
  function renderContent() {
    if (!props.authChecked) {
      return (
        <p className="login-checking" role="status">
          <PushMark variant="waiting" />
          Checking if you're signed in…
        </p>
      );
    }
    if (!props.user) return <a href="#/play/login">Sign in to join a room</a>;
    return (
      <div className="login-card">
        <p className="login-text">You're signed in as {props.user.name || "a player"}.</p>
        <p className="login-hint">Room joining isn't available yet. Your account is ready for when it opens.</p>
        <a href="#/play/login">Back to your account</a>
      </div>
    );
  }

  return (
    <main className="login">
      <h1 className="login-logo">Join a room</h1>
      {renderContent()}
    </main>
  );
}
