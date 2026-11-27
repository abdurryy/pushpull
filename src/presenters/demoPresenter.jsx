// Presenter: connects the keyboard and room board to the reactive round model.
import { observer } from "mobx-react-lite";
import { demoModel, keyGroups } from "../model/DemoModel.js";
import { COLUMNS, ROWS, TICK_MS } from "../model/doubleSnakeRules.js";
import { promiseStatus } from "../model/resolvePromise.js";
import { DemoView } from "../views/demoView.jsx";

export const DemoPresenter = observer(function DemoPresenter({ model, room = null }) {
  const weather = model.weatherPromiseState;
  const selectedWeather = model.cityQuery.trim() ? weather.data : null;
  const savedRound = room && demoModel.interruptedRoomRound?.code === room.code
    ? demoModel.interruptedRoomRound : null;

  function startRoundACB() { demoModel.startRound(selectedWeather, room); }

  return (
    <DemoView
      round={demoModel.round}
      snakes={demoModel.boardSnakes}
      apples={demoModel.boardApples}
      box={demoModel.round?.box}
      luckyResult={demoModel.luckyResult}
      inputs={demoModel.teamInputs}
      events={demoModel.events}
      tickMs={TICK_MS}
      soundOn={demoModel.soundOn}
      roundNumber={demoModel.roundNumber}
      seconds={demoModel.seconds}
      playing={demoModel.playing}
      keyGroups={keyGroups}
      roomCode={room?.code}
      teams={room?.teams}
      reconnecting={Boolean(room?.reconnectingHost)}
      interrupted={Boolean(savedRound && demoModel.remoteRoom === room)}
      interruptedScore={savedRound?.score}
      canStart={room ? room.canStart : true}
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
