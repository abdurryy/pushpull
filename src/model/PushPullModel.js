// Model (application state): all the data the app needs, and one method per user action.
// index.jsx makes it reactive with MobX, which turns every method below into a MobX action.
import { resolvePromise } from "./resolvePromise.js";
import { getWeatherForCity } from "../api/weatherSource.js";

export const model = {
  // Signed-in player as plain data ({ uid, name, photoUrl }), or null when signed out.
  user: null,
  // False until Firebase has told us whether someone is signed in, so views don't flash "signed out".
  authChecked: false,
  // Progress of the latest sign-in or sign-out attempt, so the login view can show "Signing in…" and errors.
  authPromiseState: {},

  cityQuery: "",
  weatherPromiseState: {},

  // Called by the auth listener (src/persistence/firebaseAuth.js) whenever someone signs in or out.
  setUser(user) {
    this.user = user;
    this.authChecked = true;
  },

  // The login presenter starts a sign-in or sign-out with the auth service and hands the model the promise.
  // The model only tracks its progress; it doesn't know which service is behind it.
  trackAuthRequest(promise) {
    resolvePromise(promise, this.authPromiseState);
  },

  // The TV host types the city the group is playing in.
  setCityQuery(text) {
    this.cityQuery = text;
  },

  // The TV host asks for that city's live weather, which will change how the next round plays.
  findWeather() {
    resolvePromise(getWeatherForCity(this.cityQuery.trim()), this.weatherPromiseState);
  },
};
