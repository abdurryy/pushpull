// Presenter: connects the phone controller to local input actions.
import { observer } from "mobx-react-lite";
import { controllerModel } from "../model/ControllerModel.js";
import { ControllerView } from "../views/controllerView.jsx";

export const ControllerPresenter = observer(function ControllerPresenter() {
  return (
    <ControllerView
      direction={controllerModel.stick}
      dashHeld={controllerModel.heldActions.dash}
      pingHeld={controllerModel.heldActions.ping}
      shedHeld={controllerModel.heldActions.shed}
      holdHeld={controllerModel.heldActions.hold}
      onStick={controllerModel.setStick}
      onAction={controllerModel.setActionHeld}
      onClear={controllerModel.clearInput}
    />
  );
});
