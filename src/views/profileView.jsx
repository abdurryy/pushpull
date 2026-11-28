// View: shows the current Google account and offers sign-in or sign-out.
import { Link } from "react-router-dom";
import { AccountAvatar } from "./accountAvatar.jsx";
import { AccountSignIn } from "./accountSignIn.jsx";
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
          <AccountAvatar name={name} photoUrl={props.user.photoUrl} />
          <div>
            <p className="login-text"><strong>{name}</strong></p>
            <p className="login-hint">Signed in with Google</p>
          </div>
        </div>
        <button className="button button-secondary" type="button" onClick={signOutClickACB} disabled={pending} aria-busy={pending}>
          {pending ? "Signing out…" : "Sign out"}
        </button>
        {props.status === "error" && <StatusMessage kind="error">Signing out didn't work. Try again.</StatusMessage>}
      </div>
    );
  }

  return (
    <main className="login">
      <Link className="login-home-link" to="/">Back to home</Link>
      <h1 className="profile-title">Your profile</h1>
      {renderContent()}
    </main>
  );
}
