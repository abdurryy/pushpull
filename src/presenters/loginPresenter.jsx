// Presenter for logging in on the phone. It only talks to the auth service (course rule);
// the rest of the app learns about the sign-in through onAuthStateChanged, not from here.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { signInWithGoogle, signOutUser } from "../persistence/firebaseAuth.js";
import { LoginView } from "../views/loginView.jsx";

export const LoginPresenter = observer(function LoginPresenter(props) {
  function signInRequestedACB() {
    signInWithGoogle(props.model);
  }

  function signOutRequestedACB() {
    signOutUser(props.model);
  }

  return (
    <LoginView
      user={props.model.user}
      authChecked={props.model.authChecked}
      status={promiseStatus(props.model.authPromiseState)}
      error={props.model.authPromiseState.error}
      onSignIn={signInRequestedACB}
      onSignOut={signOutRequestedACB}
    />
  );
});
