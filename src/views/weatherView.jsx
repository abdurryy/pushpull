// View (TV): the host picks the city the group plays in and sees its live weather.
// Shows every state: nothing searched yet, loading, error, no city found, and the weather.
import "./weatherView.css";

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

// Open-Meteo gives the direction the wind comes from, in degrees (0 = north).
function compassName(degrees) {
  return COMPASS[Math.round(degrees / 45) % 8];
}

export function WeatherView(props) {
  function cityInputACB(event) {
    props.onCityChange(event.target.value);
  }

  function submitACB(event) {
    event.preventDefault();
    props.onSearch();
  }

  function retryACB() {
    props.onSearch();
  }

  function renderStatus() {
    if (props.status === "idle") {
      return <p className="weather-message">Type the city you're playing in and press Check weather.</p>;
    }
    if (props.status === "loading") {
      return (
        <p className="weather-message">
          <span className="weather-spinner" aria-hidden="true"></span>
          Checking the weather in {props.city}…
        </p>
      );
    }
    if (props.status === "error") {
      return (
        <div className="weather-error">
          <p className="weather-message">Couldn't get the weather: {props.error.message}.</p>
          <button className="weather-button weather-button-secondary" type="button" onClick={retryACB}>Try again</button>
        </div>
      );
    }
    if (!props.result.city) {
      return <p className="weather-message">No city with that name was found. Check the spelling and try again.</p>;
    }
    return renderWeather(props.result.city, props.result.weather);
  }

  function renderWeather(city, weather) {
    // The arrow points where the wind blows to, the opposite of where it comes from.
    const arrowStyle = { transform: "rotate(" + (weather.windDirection + 180) + "deg)" };
    return (
      <article className="weather-card">
        <h3 className="weather-city">{city.name}, {city.country}</h3>
        <ul className="weather-facts">
          <li className="weather-fact">
            <span className="icon weather-fact-icon" aria-hidden="true" style={arrowStyle}>navigation</span>
            <span><strong className="numbers">{weather.windSpeed} m/s</strong> wind from the {compassName(weather.windDirection)}: apples drift with it</span>
          </li>
          <li className="weather-fact">
            <span className="icon weather-fact-icon" aria-hidden="true">{weather.precipitation > 0 ? "rainy" : "sunny"}</span>
            <span>{weather.precipitation > 0
              ? <><strong className="numbers">{weather.precipitation} mm</strong> rain: snakes slide one extra square</>
              : <><strong>Dry</strong>: snakes stop where you steer them</>}
            </span>
          </li>
          <li className="weather-fact">
            <span className="icon weather-fact-icon" aria-hidden="true">{weather.isDay ? "light_mode" : "dark_mode"}</span>
            <span>{weather.isDay ? <><strong>Daytime</strong>: the whole board is lit</> : <><strong>Night</strong>: the board goes dark except around the snake heads</>}</span>
          </li>
        </ul>
      </article>
    );
  }

  return (
    <main className="weather">
      <h2 className="weather-title">Where are you playing?</h2>
      <p className="weather-lead">The live weather in your city changes every round.</p>

      <form className="weather-form" onSubmit={submitACB}>
        <label className="weather-label" htmlFor="weather-city">City</label>
        <div className="weather-row">
          <input
            id="weather-city"
            className="weather-input"
            value={props.city}
            onChange={cityInputACB}
            placeholder="Stockholm"
            autoComplete="address-level2"
          />
          <button className="weather-button" type="submit" disabled={props.city.trim() === "" || props.status === "loading"}>
            Check weather
          </button>
        </div>
      </form>

      <div className="weather-status" role="status" aria-live="polite">
        {renderStatus()}
      </div>
    </main>
  );
}
