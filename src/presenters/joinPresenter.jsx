// Presenter: connects the phone join view to the room model.
import { observer } from "mobx-react-lite";
import { JoinView } from "../views/joinView.jsx";

export const JoinPresenter = observer(function JoinPresenter({ app, room }) {
  return (
    <JoinView
      authChecked={app.authChecked}
      user={app.user}
      available={room.available}
      connected={room.connected}
      hostOnline={room.room?.hostOnline === true}
      code={room.joined ? room.code : null}
      codeInput={room.codeInput}
      closedRoomCode={room.closedRoomCode}
      side={room.side}
      openSeats={room.openTeamSeats}
      changingSide={room.pendingSide}
      loading={room.loading}
      error={room.error}
      onCodeChange={room.setCodeInput}
      onJoin={room.joinRoom}
      onPickSide={room.pickSide}
      onLeave={room.departRoom}
    />
  );
});
