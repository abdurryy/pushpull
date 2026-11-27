// View (phone): sign in with Google. Shows checking, signed-out, signing-in, error and signed-in states.
import { Link } from "react-router-dom";
import "./loginView.css";
import { AccountAvatar } from "./accountAvatar.jsx";
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
          <AccountAvatar name={props.user.name} photoUrl={props.user.photoUrl} />
          <p className="login-text">Signed in as <strong>{props.user.name}</strong></p>
        </div>
        {props.host
          ? <Link className="button" to="/room">Continue to host a room</Link>
          : <Link className="button" to="/play/join">Continue to join a room</Link>}
        <button className="button button-secondary" type="button" onClick={signOutClickACB} disabled={props.status === "loading"} aria-busy={props.status === "loading"}>
          {props.status === "loading" && <PushMark variant="loading" />}
          {props.status === "loading" ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  function renderSignedOut() {
    return (
      <div className="login-card">
        <p className="login-text">{props.host ? "Sign in to host the room playtest." : "Log in to keep your name, settings and stats."}</p>
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
      <Link className="login-home-link" to="/">Back to home</Link>
      <h1 className="login-logo">
        <PushMark variant={props.user && props.status === "done" ? "success" : "static"} />
        PUSH/PULL
      </h1>
      {renderContent()}
      {props.user && props.status === "error" && <StatusMessage kind="error">Signing out didn't work. Try again.</StatusMessage>}
    </main>
  );
}
