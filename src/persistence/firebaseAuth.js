// Persistence: the auth service. The login presenter calls signInWithGoogle/signOutUser;
// the rest of the app only finds out about sign-ins through connectAuthToModel (onAuthStateChanged).
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

function missingConfigError() {
  const error = new Error("Sign-in configuration is missing.");
  error.code = "auth/missing-config";
  return error;
}

// The service tracks progress; only the auth listener changes the signed-in user.
export function signInWithGoogle(model) {
  const request = auth
    ? signInWithPopup(auth, new GoogleAuthProvider())
    : Promise.reject(missingConfigError());
  model.trackAuthRequest(request);
}

// Track a nonempty result: signOut resolves to nothing, which the promise state would read as "still loading".
export function signOutUser(model) {
  function signedOutACB() {
    return { signedOut: true };
  }
  const request = auth
    ? signOut(auth).then(signedOutACB)
    : Promise.reject(missingConfigError());
  model.trackAuthRequest(request);
}

// Firebase calls this on start-up and whenever someone signs in or out. The model only gets plain data.
export function connectAuthToModel(model) {
  if (!auth) {
    model.setUser(null);
    return;
  }
  function authChangedACB(firebaseUser) {
    if (!firebaseUser) {
      model.setUser(null);
      return;
    }
    model.setUser({
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
    });
  }
  onAuthStateChanged(auth, authChangedACB);
}
