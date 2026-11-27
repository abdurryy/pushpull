// Bootstrapping: make the model reactive with MobX and mount the root component.
import { createRoot } from "react-dom/client";
import { makeAutoObservable } from "mobx";
import { model } from "./model/PushPullModel.js";
import { ReactRoot } from "./reactRoot.jsx";
import { connectAuthToModel } from "./persistence/firebaseAuth.js";
import { database } from "./persistence/firebaseConfig.js";
import { makeRoomSync } from "./persistence/roomSync.js";
import { makeRoomModel } from "./model/RoomModel.js";
import { makeControllerModel } from "./model/ControllerModel.js";
import "./styles/tokens.css";
import "./styles/buttons.css";

// makeAutoObservable turns the model's data into observables and its methods into MobX actions.
// autoBind keeps `this` pointing at the model even when a method is passed around as a callback.
const reactiveModel = makeAutoObservable(model, {}, { autoBind: true });

// The model learns about sign-ins and sign-outs only through this listener (onAuthStateChanged).
connectAuthToModel(reactiveModel);

const { model: roomModel, dispose: disposeRoom } = makeRoomModel(makeRoomSync(database), reactiveModel);
if (import.meta.hot) import.meta.hot.dispose(disposeRoom);

const roomController = makeControllerModel(roomModel);
createRoot(document.getElementById("root")).render(
  <ReactRoot model={reactiveModel} roomModel={roomModel} roomController={roomController} />,
);

// Handy for debugging in the browser console: type `myModel` to see the application state.
window.myModel = reactiveModel;
window.roomModel = roomModel;
