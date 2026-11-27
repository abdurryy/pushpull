// Presenter for the TV lobby: reads the app and room models, passes props to the view, and turns each view event into one model method.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { AccountSignIn } from "../views/accountSignIn.jsx";
import { LobbyView } from "../views/lobbyView.jsx";
import { LoginPresenter } from "./loginPresenter.jsx";

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

  // The sign-in control is the login presenter's, like on the home screen, so the lobby never calls the auth service.
  // Firebase signs in with a popup, so the host stays on /tv and the auth listener updates the model here.
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
      signIn={<LoginPresenter model={props.model} view={AccountSignIn} />}
      onCreateRoom={createRoomACB}
      onCityChange={cityChangedACB}
      onSearchWeather={searchWeatherACB}
      onStartRound={startRoundACB}
    />
  );
});
