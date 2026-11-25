// Model helper: keeps a promise's result in a promise state object { promise, data, error } (pattern from the course lab).
import { action } from "mobx";

export function resolvePromise(prms, promiseState) {
  promiseState.promise = prms;
  promiseState.data = null;
  promiseState.error = null;
  if (!prms) return;

  // The result arrives later, outside the model action that started it, so the callbacks are MobX actions too.
  // Only the latest promise may write, so an old, slow request can't overwrite a newer one.
  const gotDataACB = action(function gotDataACB(data) {
    if (promiseState.promise === prms) promiseState.data = data;
  });
  const gotErrorACB = action(function gotErrorACB(error) {
    if (promiseState.promise === prms) promiseState.error = error;
  });
  prms.then(gotDataACB).catch(gotErrorACB);
}

// Turns a promise state into one word a presenter can pass to its view: "idle", "loading", "error" or "done".
export function promiseStatus(promiseState) {
  if (!promiseState.promise) return "idle";
  if (promiseState.error) return "error";
  if (promiseState.data) return "done";
  return "loading";
}
