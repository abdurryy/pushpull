// View (TV): the lobby. Shows the room code and QR code, both teams filling up live, the weather search and Start round.
// Layout from docs/visual-direction (lobby reference): rail on top, join strip, teams, and the next step at the bottom.
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";
import { CloseRoomButton } from "./closeRoomButton.jsx";
import { PushMark } from "./pushMark.jsx";
import { RoomCode } from "./roomCode.jsx";
import { TeamRoster } from "./teamRoster.jsx";
import { StatusMessage } from "./statusMessage.jsx";
import "./lobbyView.css";

// The address a phone opens after scanning: this same site, on the join screen with the code filled in.
function joinUrl(code) {
  return new URL("/play/join?code=" + code, window.location.href).href;
}

function playerNameCB(player) {
  return player.name;
}

// One short line about the weather, e.g. "Stockholm, Sweden: 4 m/s wind, rain or snow, night".
function describeWeather(result) {
  const weather = result.weather;
  const wet = weather.precipitation > 0 ? "rain or snow" : "dry";
  const light = weather.isDay ? "daytime" : "night";
  return result.city.name + ", " + result.city.country + ": " + weather.windSpeed + " m/s wind, " + wet + ", " + light;
}

export function LobbyView(props) {
  function createRoomACB() {
    props.onCreateRoom();
  }

  function startRoundACB() {
    props.onStartRound();
  }

  function cityInputACB(event) {
    props.onCityChange(event.target.value);
  }

  function weatherSubmitACB(event) {
    event.preventDefault();
    props.onSearchWeather();
  }

  function retryWeatherACB() {
    props.onSearchWeather();
  }

  function renderJoinStrip() {
    return (
      <section className="lobby-join" aria-labelledby="lobby-join-title">
        <div className="lobby-join-text">
          <h1 id="lobby-join-title" className="lobby-title">Join on your phone</h1>
          <p className="lobby-muted">
            {props.hasRoom
              ? "Scan the QR code, or type this code at " + window.location.host + "."
              : "Create a room and its code appears here."}
          </p>
        </div>
        <div className="lobby-code"><RoomCode code={props.hasRoom ? props.code : ""} /></div>
        <div className="lobby-qr">
          {props.hasRoom
            ? <QRCode value={joinUrl(props.code)} title={"QR code that opens the join screen for room " + props.code}
                fgColor="var(--color-ink)" bgColor="var(--color-surface)" viewBox="0 0 256 256" />
            : <span className="icon lobby-qr-empty" aria-hidden="true">qr_code_2</span>}
        </div>
      </section>
    );
  }

  function renderUndecided() {
    const undecided = props.teams.center;
    if (!props.hasRoom || undecided.length === 0) return null;
    return <p className="lobby-muted lobby-undecided">Still picking a side: {undecided.map(playerNameCB).join(", ")}</p>;
  }

  function renderWeatherStatus() {
    if (props.weatherStatus === "idle") {
      return <p className="lobby-muted">The weather changes how rounds play.</p>;
    }
    if (props.weatherStatus === "loading") {
      return <StatusMessage kind="searching">Checking the weather in {props.city}…</StatusMessage>;
    }
    if (props.weatherStatus === "error") {
      return (
        <StatusMessage kind="error" onRetry={retryWeatherACB}>
          Couldn't get the weather: {props.weatherError.message}.
        </StatusMessage>
      );
    }
    if (!props.weatherResult.city) {
      return <StatusMessage kind="empty">No city with that name. Check the spelling and try again.</StatusMessage>;
    }
    return <p className="lobby-weather-result">{describeWeather(props.weatherResult)}</p>;
  }

  // The weather search works in every state, so the host can pick a city while players join.
  function renderWeather() {
    const searching = props.weatherStatus === "loading";
    return (
      <section className="lobby-weather" aria-label="Weather">
        <form className="lobby-weather-form" onSubmit={weatherSubmitACB}>
          <label className="lobby-weather-label" htmlFor="lobby-city">City</label>
          <input id="lobby-city" className="lobby-weather-input" value={props.city} onChange={cityInputACB}
            placeholder="Stockholm" autoComplete="address-level2" />
          <button className="button button-secondary" type="submit"
            disabled={props.city.trim() === "" || searching} aria-busy={searching}>
            Check weather
          </button>
        </form>
        <div className="lobby-weather-status" aria-live="polite">{renderWeatherStatus()}</div>
      </section>
    );
  }

  // Before a room exists: what to do first, with Create room (or Sign in) as the one button.
  function renderSetupStep() {
    if (!props.authChecked) {
      return <StatusMessage kind="loading">Checking if you're signed in…</StatusMessage>;
    }
    if (!props.signedIn) {
      // The sign-in control comes from the login presenter and signs in here, so the host never leaves the TV.
      return (
        <>
          <StatusMessage kind="empty">Sign in to host a room on this screen.</StatusMessage>
          <div className="lobby-signin">{props.signIn}</div>
        </>
      );
    }
    if (!props.roomsAvailable) {
      return <StatusMessage kind="error">Rooms aren't set up on this copy of Push/Pull.</StatusMessage>;
    }
    let status = <StatusMessage kind="empty">Create a room, then everyone joins on their phone.</StatusMessage>;
    if (props.creating) status = <StatusMessage kind="loading">Creating your room…</StatusMessage>;
    else if (props.roomError) status = <StatusMessage kind="error">{props.roomError}</StatusMessage>;
    return (
      <>
        {status}
        <button className="button" type="button" onClick={createRoomACB} disabled={props.creating} aria-busy={props.creating}>
          {props.roomError ? "Try again" : "Create room"}
        </button>
      </>
    );
  }

  // With a room: why Start round is still disabled, or that everyone's in.
  function renderStartStep() {
    let status = <StatusMessage kind="success">Everyone's in. Start when you're ready.</StatusMessage>;
    if (props.closing) status = <StatusMessage kind="loading">Closing room…</StatusMessage>;
    else if (props.roomError) status = <StatusMessage kind="error">{props.roomError}</StatusMessage>;
    else if (props.roundStarting) status = <StatusMessage kind="loading">Starting the round…</StatusMessage>;
    else if (props.startBlockedReason) status = <StatusMessage kind="waiting">{props.startBlockedReason}</StatusMessage>;
    return (
      <>
        {status}
        <CloseRoomButton disabled={props.closing || !props.connected} onCloseRoom={props.onCloseRoom} />
        <button className="button" type="button" onClick={startRoundACB}
          disabled={Boolean(props.startBlockedReason) || props.roundStarting} aria-busy={props.roundStarting}>
          Start round
        </button>
      </>
    );
  }

  return (
    <main className="lobby">
      <header className="lobby-rail">
        <Link className="lobby-brand" to="/"><PushMark /> PUSH/PULL</Link>
        {renderWeather()}
      </header>
      <div className="lobby-stage">
        {renderJoinStrip()}
        <div className="lobby-teams">
          <TeamRoster team="a" players={props.teams.a} />
          <TeamRoster team="b" players={props.teams.b} />
        </div>
        {renderUndecided()}
      </div>
      <footer className="lobby-next">
        {props.hasRoom ? renderStartStep() : renderSetupStep()}
      </footer>
    </main>
  );
}
