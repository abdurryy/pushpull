// Presenter: connects the keyboard demo view to its reactive round model.
import { observer } from "mobx-react-lite";
import { demoModel, keyGroups } from "../model/DemoModel.js";
import { COLUMNS, ROWS, TICK_MS } from "../model/doubleSnakeRules.js";
import { promiseStatus } from "../model/resolvePromise.js";
import { DemoView } from "../views/demoView.jsx";

export const DemoPresenter = observer(function DemoPresenter({ model }) {
  const weather = model.weatherPromiseState;
  const selectedWeather = model.cityQuery.trim() ? weather.data : null;

  function startRoundACB() { demoModel.startRound(selectedWeather); }

  return (
    <DemoView
      round={demoModel.round}
      snakes={demoModel.boardSnakes}
      apples={demoModel.boardApples}
      inputs={demoModel.teamInputs}
      events={demoModel.events}
      tickMs={TICK_MS}
      soundOn={demoModel.soundOn}
      roundNumber={demoModel.roundNumber}
      seconds={demoModel.seconds}
      playing={demoModel.playing}
      keyGroups={keyGroups}
      columns={COLUMNS}
      rows={ROWS}
      teamACancelled={demoModel.teamACancelled}
      teamBCancelled={demoModel.teamBCancelled}
      weather={demoModel.weather}
      cityQuery={model.cityQuery}
      weatherStatus={model.cityQuery.trim() ? promiseStatus(weather) : "idle"}
      weatherCity={selectedWeather?.city?.name}
      onCityChange={model.setCityQuery}
      onSearch={model.findWeather}
      onStart={startRoundACB}
      onKeyChange={demoModel.changeKey}
      onClearKeys={demoModel.clearKeys}
      onExit={demoModel.leaveDemo}
      onToggleSound={demoModel.toggleSound}
    />
  );
});
