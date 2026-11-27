// Model: tracks local input feedback and optionally forwards input to a room.
import { makeAutoObservable } from "mobx";

export function makeControllerModel(room) {
  return makeAutoObservable({
    stick: "idle",
    heldActions: {},

    setStick(direction) {
      this.stick = direction;
      room?.setStick(direction);
    },

    setActionHeld(action, held) {
      if (held && !this.heldActions[action]) room?.pressButton(action);
      this.heldActions[action] = held;
    },

    clearInput() {
      this.setStick("idle");
      this.heldActions = {};
    },
  }, {}, { autoBind: true });
}

export const controllerModel = makeControllerModel();
