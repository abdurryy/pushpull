// Presenter: connects the phone controller to preview or room input actions.
import { observer } from "mobx-react-lite";
import { controllerModel } from "../model/ControllerModel.js";
import { ControllerView } from "../views/controllerView.jsx";

export const ControllerPresenter = observer(function ControllerPresenter({ room, controller = controllerModel }) {
  const hasTeam = room?.role === "player" && (room.side === "a" || room.side === "b");
  return (
    <ControllerView
      direction={controller.stick}
      dashHeld={controller.heldActions.dash}
      pingHeld={controller.heldActions.ping}
      shedHeld={controller.heldActions.shed}
      holdHeld={controller.heldActions.hold}
      roomCode={room?.code}
      closedRoomCode={room?.closedRoomCode}
      team={hasTeam ? room.side : null}
      unavailable={Boolean(room && !hasTeam)}
      reconnecting={hasTeam && (!room.connected || !room.inputReady)}
      hostAway={hasTeam && room.room?.hostOnline !== true}
      error={hasTeam ? room.error : null}
      onStick={controller.setStick}
      onAction={controller.setActionHeld}
      onClear={controller.clearInput}
    />
  );
});
