// View (phone): sign in with Google. Shows checking, signed-out, signing-in, error and signed-in states.
import "./loginView.css";

// Firebase error codes turned into sentences a player understands.
const ERROR_MESSAGES = {
  "auth/popup-closed-by-user": "The sign-in window was closed before you finished.",
  "auth/cancelled-popup-request": "The sign-in window was closed before you finished.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "No connection to the sign-in service. Check your internet and try again.",
  "auth/operation-not-allowed": "Google sign-in isn't switched on for this app yet.",
  "auth/configuration-not-found": "Sign-in isn't set up for this app yet.",
  "auth/unauthorized-domain": "Signing in isn't allowed from this web address yet.",
};

function errorMessage(error) {
  return ERROR_MESSAGES[error.code] || "Signing in didn't work. Try again.";
}

export function LoginView(props) {
  function signInClickACB() {
    props.onSignIn();
  }

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
        <p className="login-hint">Joining a room comes next.</p>
        <button className="login-button login-button-secondary" type="button" onClick={signOutClickACB} disabled={props.status === "loading"}>
          {props.status === "loading" ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  function renderSignedOut() {
    return (
      <div className="login-card">
        <p className="login-text">Log in to keep your name, settings and stats.</p>
        <button className="login-button" type="button" onClick={signInClickACB} disabled={props.status === "loading"}>
          <span className="icon" aria-hidden="true">login</span>
          {props.status === "loading" ? "Signing in…" : "Continue with Google"}
        </button>
        {props.status === "error" && <p className="login-error" role="alert">{errorMessage(props.error)}</p>}
      </div>
    );
  }

  function renderContent() {
    if (!props.authChecked) {
      return (
        <p className="login-text login-checking" role="status">
          <span className="login-spinner" aria-hidden="true"></span>
          Checking if you're signed in…
        </p>
      );
    }
    return props.user ? renderSignedIn() : renderSignedOut();
  }

  return (
    <main className="login">
      <h1 className="login-logo">
        <svg className="login-mark" viewBox="0 0 24 12" aria-hidden="true">
          <path className="login-mark-a" d="M0 0H6L12 6L6 12H0L6 6Z" />
          <path className="login-mark-b" d="M24 0H18L12 6L18 12H24L18 6Z" />
        </svg>
        PUSH/PULL
      </h1>
      {renderContent()}
    </main>
  );
}
