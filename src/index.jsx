// Bootstrapping: make the model reactive with MobX and mount the root component.
import { createRoot } from "react-dom/client";
import { makeAutoObservable } from "mobx";
import { model } from "./model/PushPullModel.js";
import { ReactRoot } from "./reactRoot.jsx";
import "./styles/tokens.css";

// makeAutoObservable turns the model's data into observables and its methods into MobX actions.
// autoBind keeps `this` pointing at the model even when a method is passed around as a callback.
const reactiveModel = makeAutoObservable(model, {}, { autoBind: true });

createRoot(document.getElementById("root")).render(<ReactRoot model={reactiveModel} />);

// Handy for debugging in the browser console: type `myModel` to see the application state.
window.myModel = reactiveModel;
