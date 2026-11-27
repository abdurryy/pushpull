// Game model: applies the selected city's weather to a keyboard demo tick.
import { COLUMNS, directions, ROWS, stepRound } from "./doubleSnakeRules.js";
import { hasCell, sameCell } from "./luckyBoxRules.js";

const windDestinations = ["down", "left", "up", "right"];
const DRIFT_EVERY_TICKS = 5;

export function roundWeather(result) {
  if (!result?.city || !result.weather) return null;
  const { windSpeed, windDirection, precipitation, isDay } = result.weather;
  // Open-Meteo reports where the wind comes from, clockwise from north.
  const wind = windSpeed > 0 ? windDestinations[Math.round(windDirection / 90) % 4] : null;
  return {
    city: result.city.name,
    wet: precipitation > 0,
    night: isDay === false,
    wind,
  };
}

function driftApple(round, wind) {
  if (!round.apple || !wind) return round;
  const { x, y } = round.apple;
  const destination = { x: x + directions[wind].x, y: y + directions[wind].y };
  if (destination.x < 0 || destination.x >= COLUMNS || destination.y < 0 || destination.y >= ROWS) {
    return round;
  }
  if (round.box && sameCell(round.box, destination)) return round;
  if (hasCell(round.a.body, destination) || hasCell(round.b.body, destination)) return round;
  return { ...round, apple: destination };
}

export function weatherStep(round, inputs, weather, ticks, random = Math.random) {
  const next = stepRound(round, inputs, random, { slide: weather?.wet });
  if (!next.outcome && ticks % DRIFT_EVERY_TICKS === 0) return driftApple(next, weather?.wind);
  return next;
}
