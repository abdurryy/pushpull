// Presenter for account actions. Firebase's auth listener updates the model after sign-in or sign-out.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { signInWithGoogle, signOutUser } from "../persistence/firebaseAuth.js";
import { LoginView } from "../views/loginView.jsx";

export const LoginPresenter = observer(function LoginPresenter({ model, view: View = LoginView, host }) {
  function signInRequestedACB() {
    signInWithGoogle(model);
  }

  function signOutRequestedACB() {
    signOutUser(model);
  }

  return (
    <View
      host={host}
      user={model.user}
      authChecked={model.authChecked}
      status={promiseStatus(model.authPromiseState)}
      error={model.authPromiseState.error}
      onSignIn={signInRequestedACB}
      onSignOut={signOutRequestedACB}
    />
  );
});
