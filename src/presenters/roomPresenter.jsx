// Presenter: reads the room and passes the lobby actions to the host or phone view.
import { observer } from "mobx-react-lite";
import { RoomView } from "../views/roomView.jsx";
import { DemoPresenter } from "./demoPresenter.jsx";

export const RoomPresenter = observer(function RoomPresenter({ app, room, host, board }) {
  const active = room.role === (host ? "host" : "player") && Boolean(room.room);

  if (board && active) return <DemoPresenter model={app} room={room} />;

  return (
    <RoomView
      host={host}
      authChecked={app.authChecked}
      userId={app.user?.uid}
      available={room.available}
      connected={room.connected}
      hostOnline={active && room.room.hostOnline === true}
      code={active ? room.code : null}
      codeInput={room.codeInput}
      teams={room.teams}
      side={room.side}
      ready={active && room.canStart}
      loading={room.loading}
      error={room.error}
      onCodeChange={room.setCodeInput}
      onCreate={room.createRoom}
      onJoin={room.joinRoom}
      onPick={room.pickSide}
      onLeave={room.departRoom}
    />
  );
});
