// Persistence: starts Firebase. The config comes from .env.local (see .env.example), so no keys are committed.
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const firebaseConfig = useEmulators ? {
  apiKey: "demo",
  authDomain: "demo-pushpull.firebaseapp.com",
  projectId: "demo-pushpull",
  appId: "demo",
  databaseURL: "https://demo-pushpull-default-rtdb.firebaseio.com",
} : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Keep the public screens usable before a developer has configured sign-in.
const hasAuthConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain
  && firebaseConfig.projectId && firebaseConfig.appId);

export const app = hasAuthConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const database = app && firebaseConfig.databaseURL ? getDatabase(app) : null;

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(database, "127.0.0.1", 9000);
}
