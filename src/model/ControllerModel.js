// Model: local phone input state, ready to be connected to a room.
import { makeAutoObservable } from "mobx";

export const controllerModel = makeAutoObservable({
  stick: "idle",
  heldActions: {},

  setStick(direction) {
    this.stick = direction;
  },

  setActionHeld(action, held) {
    this.heldActions[action] = held;
  },

  clearInput() {
    this.stick = "idle";
    this.heldActions = {};
  },
}, {}, { autoBind: true });
