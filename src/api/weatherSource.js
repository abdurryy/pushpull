// API module: talks to Open-Meteo (free, no key, allows browser requests). Plain functions that return promises, like the lab's dishSource.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function checkResponseACB(response) {
  if (!response.ok) throw new Error("the weather service answered " + response.status);
  return response.json();
}

// Finds a city by name. Resolves to the best match, or null if nothing matched.
export function findCity(name) {
  const params = new URLSearchParams({ name, count: 1, language: "en", format: "json" });

  function firstCityACB(data) {
    if (!data.results || data.results.length === 0) return null;
    const city = data.results[0];
    return { name: city.name, country: city.country, latitude: city.latitude, longitude: city.longitude };
  }

  return fetch(GEOCODING_URL + "?" + params).then(checkResponseACB).then(firstCityACB);
}

// Gets the current wind, rain and day/night for a place. Wind speed is in m/s, direction in degrees (where it blows from).
export function getCurrentWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "wind_speed_10m,wind_direction_10m,precipitation,is_day",
    wind_speed_unit: "ms",
  });

  function currentWeatherACB(data) {
    return {
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      isDay: data.current.is_day === 1,
    };
  }

  return fetch(FORECAST_URL + "?" + params).then(checkResponseACB).then(currentWeatherACB);
}

// City name in, { city, weather } out. Both are null when no city matched, so "not found" is a result, not an error.
export function getWeatherForCity(name) {
  function weatherForCityACB(city) {
    if (!city) return { city: null, weather: null };

    function cityAndWeatherACB(weather) {
      return { city, weather };
    }
    return getCurrentWeather(city.latitude, city.longitude).then(cityAndWeatherACB);
  }

  return findCity(name).then(weatherForCityACB);
}
