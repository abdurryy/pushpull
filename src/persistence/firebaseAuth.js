// Persistence: the auth service. The login presenter calls signInWithGoogle/signOutUser;
// the rest of the app only finds out about sign-ins through connectAuthToModel (onAuthStateChanged).
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

// Opens Google's sign-in popup. Resolves when the player is signed in, rejects if they close it or it fails.
export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

// Resolves to { signedOut: true } (signOut itself resolves to nothing, which a promise state would read as "still loading").
export function signOutUser() {
  function signedOutACB() {
    return { signedOut: true };
  }
  return signOut(auth).then(signedOutACB);
}

// Firebase calls this on start-up and whenever someone signs in or out. The model only gets plain data.
export function connectAuthToModel(model) {
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
