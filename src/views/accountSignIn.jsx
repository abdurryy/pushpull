// View component: Google sign-in and its feedback, shared by the account entry points.
import { PushMark } from "./pushMark.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import "./loginView.css";

const ERROR_MESSAGES = {
  "auth/popup-closed-by-user": "The sign-in window was closed before you finished.",
  "auth/cancelled-popup-request": "The sign-in window was closed before you finished.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "No connection to the sign-in service. Check your internet and try again.",
  "auth/operation-not-allowed": "Google sign-in isn't switched on for this app yet.",
  "auth/configuration-not-found": "Sign-in isn't set up for this app yet.",
  "auth/missing-config": "Sign-in isn't set up for this app yet.",
  "auth/unauthorized-domain": "Signing in isn't allowed from this web address yet.",
};

export function AccountSignIn({ status, error, onSignIn, secondary = false, label = "Continue with Google" }) {
  const pending = status === "loading";
  const buttonClass = secondary ? "login-button login-button-secondary" : "login-button";

  function signInClickACB() {
    onSignIn();
  }

  return (
    <>
      <button className={buttonClass} type="button" onClick={signInClickACB} disabled={pending} aria-busy={pending}>
        {pending ? <PushMark variant="loading" /> : <span className="icon" aria-hidden="true">login</span>}
        {pending ? "Signing in…" : label}
      </button>
      {status === "error" && (
        <StatusMessage kind="error">
          {ERROR_MESSAGES[error?.code] || "Signing in didn't work. Try again."}
        </StatusMessage>
      )}
    </>
  );
}
