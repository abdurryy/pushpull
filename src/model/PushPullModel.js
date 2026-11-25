// Model (application state): all the data the app needs, and one method per user action.
// index.jsx makes it reactive with MobX, which turns every method below into a MobX action.
import { resolvePromise } from "./resolvePromise.js";
import { getWeatherForCity } from "../api/weatherSource.js";

export const model = {
  cityQuery: "",
  weatherPromiseState: {},

  // The TV host types the city the group is playing in.
  setCityQuery(text) {
    this.cityQuery = text;
  },

  // The TV host asks for that city's live weather, which will change how the next round plays.
  findWeather() {
    resolvePromise(getWeatherForCity(this.cityQuery.trim()), this.weatherPromiseState);
  },
};
