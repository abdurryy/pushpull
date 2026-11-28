// Presenter: reads the room and passes the lobby actions to the host view.
import { observer } from "mobx-react-lite";
import { RoomView } from "../views/roomView.jsx";
import { DemoPresenter } from "./demoPresenter.jsx";
import { demoModel } from "../model/DemoModel.js";

export const RoomPresenter = observer(function RoomPresenter({ app, room, board, modeUnavailable }) {
  const active = room.role === "host" && Boolean(room.room);

  if (board && active && !modeUnavailable) return <DemoPresenter model={app} room={room} />;

  return (
    <RoomView
      gameUnavailable={board && app.authChecked && !active && !room.loading}
      modeUnavailable={modeUnavailable}
      authChecked={app.authChecked}
      userId={app.user?.uid}
      available={room.available}
      connected={room.connected}
      hostOnline={active && room.room.hostOnline === true}
      code={active ? room.code : null}
      teams={room.teams}
      ready={active && room.canStart}
      clearingSteering={room.hostRecovery === "clearing"}
      interrupted={active && demoModel.interruptedRoomRound?.code === room.code}
      loading={room.loading}
      error={room.error}
      onCreate={room.createRoom}
      onCloseRoom={room.departRoom}
    />
  );
});
