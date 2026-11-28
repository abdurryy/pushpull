// View (phone): sign in with Google. Shows checking, signed-out, signing-in, error and signed-in states.
import { Link } from "react-router-dom";
import "./loginView.css";
import { AccountAvatar } from "./accountAvatar.jsx";
import { AccountSignIn } from "./accountSignIn.jsx";
import { PushMark } from "./pushMark.jsx";
import { StatusMessage } from "./statusMessage.jsx";

export function LoginView(props) {
  const busy = props.status === "loading";
  const joinTo = { pathname: "/play/join", search: props.joinSearch };
  let title = props.user ? "Ready to join" : "Sign in to play";
  if (props.joinSearch && !props.user) title = "Sign in to join";
  if (props.host) title = props.user ? "Ready to host" : "Sign in to host";

  function signOutClickACB() {
    props.onSignOut();
  }

  function renderSignedIn() {
    return (
      <>
        <div className="login-user">
          <AccountAvatar name={props.user.name} photoUrl={props.user.photoUrl} />
          <p className="login-text">Signed in as <strong>{props.user.name}</strong></p>
        </div>
        {props.status === "error" && <StatusMessage kind="error">Signing out didn't work. Try again.</StatusMessage>}
        {props.host ? (
          <Link className="button" to="/room">Continue to host a room</Link>
        ) : (
          <Link className="button" to={joinTo}>
            {props.joinSearch ? "Continue to your room" : "Continue to join a room"}
          </Link>
        )}
        <button className="button button-text login-sign-out" type="button" onClick={signOutClickACB} disabled={busy} aria-busy={busy}>
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </>
    );
  }

  function renderSignedOut() {
    return (
      <>
        {props.joinSearch && <p className="login-hint">Your room code will be filled in after sign-in.</p>}
        <p className="login-hint">
          {props.host ? "Sign in to create a room for your players." : "Your team can see your name, and your settings are saved to your account."}
        </p>
        <AccountSignIn
          status={props.status}
          error={props.error}
          onSignIn={props.onSignIn}
          label={props.status === "error" ? "Try Google sign-in again" : undefined}
        />
        {busy && <StatusMessage kind="empty">Use the Google window to finish signing in.</StatusMessage>}
      </>
    );
  }

  function renderContent() {
    if (!props.authChecked) {
      return <StatusMessage>Checking if you're signed in…</StatusMessage>;
    }
    return props.user ? renderSignedIn() : renderSignedOut();
  }

  return (
    <main className="login login-entry">
      <header>
        <Link className="button button-text login-brand" to="/" aria-label="Push/Pull home"><PushMark /> PUSH/PULL</Link>
      </header>
      <div className="login-content">
        <h1>{title}</h1>
        {renderContent()}
      </div>
    </main>
  );
}
