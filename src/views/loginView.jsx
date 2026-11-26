// View (phone): sign in with Google. Shows checking, signed-out, signing-in, error and signed-in states.
import "./loginView.css";
import { AccountSignIn } from "./accountSignIn.jsx";
import { PushMark } from "./pushMark.jsx";
import { StatusMessage } from "./statusMessage.jsx";

export function LoginView(props) {
  function signOutClickACB() {
    props.onSignOut();
  }

  function renderSignedIn() {
    return (
      <div className="login-card">
        <div className="login-user">
          {props.user.photoUrl
            ? <img className="login-avatar" src={props.user.photoUrl} alt="" referrerPolicy="no-referrer" />
            : <span className="login-avatar login-avatar-letter" aria-hidden="true">{(props.user.name || "?").charAt(0)}</span>}
          <p className="login-text">Signed in as <strong>{props.user.name}</strong></p>
        </div>
        <a className="login-button" href="#/play/join">Continue to join a room</a>
        <button className="login-button login-button-secondary" type="button" onClick={signOutClickACB} disabled={props.status === "loading"}>
          {props.status === "loading" && <PushMark variant="loading" />}
          {props.status === "loading" ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  function renderSignedOut() {
    return (
      <div className="login-card">
        <p className="login-text">Log in to keep your name, settings and stats.</p>
        <AccountSignIn status={props.status} error={props.error} onSignIn={props.onSignIn} />
      </div>
    );
  }

  function renderContent() {
    if (!props.authChecked) {
      return (
        <p className="login-text login-checking" role="status">
          <PushMark variant="loading" />
          Checking if you're signed in…
        </p>
      );
    }
    return props.user ? renderSignedIn() : renderSignedOut();
  }

  return (
    <main className="login">
      <a className="login-home-link" href="#/">Back to home</a>
      <h1 className="login-logo">
        <PushMark variant={props.user && props.status === "done" ? "success" : "static"} />
        PUSH/PULL
      </h1>
      {renderContent()}
      {props.user && props.status === "error" && <StatusMessage kind="error">Signing out didn't work. Try again.</StatusMessage>}
    </main>
  );
}
