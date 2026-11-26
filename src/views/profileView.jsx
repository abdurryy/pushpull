// View: shows the current Google account and offers sign-in or sign-out.
import { AccountSignIn } from "./accountSignIn.jsx";
import { PushMark } from "./pushMark.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import "./loginView.css";

export function ProfileView(props) {
  function signOutClickACB() {
    props.onSignOut();
  }

  function renderContent() {
    if (!props.authChecked) {
      return <StatusMessage>Checking your account…</StatusMessage>;
    }
    if (!props.user) {
      return (
        <div className="login-card">
          <p className="login-hint">Sign in to see your profile.</p>
          <AccountSignIn status={props.status} error={props.error} onSignIn={props.onSignIn} />
        </div>
      );
    }

    const name = props.user.name?.trim() || "Google player";
    const pending = props.status === "loading";
    return (
      <div className="login-card">
        <div className="login-user">
          {props.user.photoUrl
            ? <img className="login-avatar" src={props.user.photoUrl} alt="" referrerPolicy="no-referrer" />
            : <span className="login-avatar login-avatar-letter" aria-hidden="true">{name.charAt(0)}</span>}
          <div>
            <p className="login-text"><strong>{name}</strong></p>
            <p className="login-hint">Signed in with Google</p>
          </div>
        </div>
        <button className="login-button login-button-secondary" type="button" onClick={signOutClickACB} disabled={pending} aria-busy={pending}>
          {pending && <PushMark variant="loading" />}
          {pending ? "Signing out…" : "Sign out"}
        </button>
        {props.status === "error" && <StatusMessage kind="error">Signing out didn't work. Try again.</StatusMessage>}
      </div>
    );
  }

  return (
    <main className="login">
      <a className="login-home-link" href="#/">Back to home</a>
      <h1 className="login-logo"><PushMark />Your profile</h1>
      {renderContent()}
    </main>
  );
}
