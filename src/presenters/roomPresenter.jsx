// Presenter: reads the room and passes the lobby actions to the host view.
import { observer } from "mobx-react-lite";
import { RoomView } from "../views/roomView.jsx";
import { DemoPresenter } from "./demoPresenter.jsx";
import { demoModel } from "../model/DemoModel.js";

export const RoomPresenter = observer(function RoomPresenter({ app, room, board }) {
  const active = room.role === "host" && Boolean(room.room);

  if (board && active) return <DemoPresenter model={app} room={room} />;

  return (
    <RoomView
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
