// Presenter for the TV lobby: reads the app and room models, passes props to the view, and turns each view event into one model method.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { LobbyView } from "../views/lobbyView.jsx";

export const LobbyPresenter = observer(function LobbyPresenter(props) {
  const roomModel = props.roomModel;
  const weatherState = props.model.weatherPromiseState;
  // Only show a room this screen hosts. A room joined as a player belongs to the phone screens.
  const hosting = roomModel.role === "host";

  function createRoomACB() {
    roomModel.createRoom();
  }

  function cityChangedACB(text) {
    props.model.setCityQuery(text);
  }

  function searchWeatherACB() {
    props.model.findWeather();
  }

  function startRoundACB() {
    roomModel.startRound();
  }

  return (
    <LobbyView
      authChecked={props.model.authChecked}
      signedIn={Boolean(props.model.user)}
      roomsAvailable={roomModel.available}
      code={hosting ? roomModel.code : null}
      hasRoom={hosting && Boolean(roomModel.room)}
      creating={roomModel.loading}
      roomError={roomModel.error}
      teams={roomModel.teams}
      startBlockedReason={roomModel.startBlockedReason}
      roundStarting={roomModel.roundStarting}
      city={props.model.cityQuery}
      weatherStatus={promiseStatus(weatherState)}
      weatherResult={weatherState.data}
      weatherError={weatherState.error}
      onCreateRoom={createRoomACB}
      onCityChange={cityChangedACB}
      onSearchWeather={searchWeatherACB}
      onStartRound={startRoundACB}
    />
  );
});
