// Presenter for the weather check on the TV: reads the model, passes props to the view, and turns each view event into one model method.
import { observer } from "mobx-react-lite";
import { promiseStatus } from "../model/resolvePromise.js";
import { WeatherView } from "../views/weatherView.jsx";

export const WeatherPresenter = observer(function WeatherPresenter(props) {
  const promiseState = props.model.weatherPromiseState;

  function cityChangedACB(text) {
    props.model.setCityQuery(text);
  }

  function searchRequestedACB() {
    props.model.findWeather();
  }

  return (
    <WeatherView
      city={props.model.cityQuery}
      status={promiseStatus(promiseState)}
      result={promiseState.data}
      error={promiseState.error}
      onCityChange={cityChangedACB}
      onSearch={searchRequestedACB}
    />
  );
});
