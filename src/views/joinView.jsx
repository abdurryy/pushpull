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
    if (!props.user) {
      return (
        <div className="login-card">
          <p className="login-text">Sign in to get ready to join a room.</p>
          <a className="login-button" href="#/play/login">Go to sign-in</a>
        </div>
      );
    }
    return (
      <div className="login-card">
        <p className="login-text">You're signed in as {props.user.name || "a player"}.</p>
        <p className="login-hint">Room joining isn't available yet. Your account is ready for when it opens.</p>
        <a className="login-button" href="#/play/login">Back to your account</a>
      </div>
    );
  }

  return (
    <main className="login">
      <a className="login-home-link" href="#/">Back to home</a>
      <h1 className="login-logo">Join a room</h1>
      {renderContent()}
    </main>
  );
}
