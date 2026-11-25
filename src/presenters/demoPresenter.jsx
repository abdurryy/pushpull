// Presenter: connects the keyboard demo view to its reactive round model.
import { observer } from "mobx-react-lite";
import { demoModel, keyGroups } from "../model/DemoModel.js";
import { COLUMNS, ROWS } from "../model/doubleSnakeRules.js";
import { DemoView } from "../views/demoView.jsx";

export const DemoPresenter = observer(function DemoPresenter() {
  return (
    <DemoView
      round={demoModel.round}
      roundNumber={demoModel.roundNumber}
      seconds={demoModel.seconds}
      playing={demoModel.playing}
      keyGroups={keyGroups}
      columns={COLUMNS}
      rows={ROWS}
      teamACancelled={demoModel.teamACancelled}
      teamBCancelled={demoModel.teamBCancelled}
      onStart={demoModel.startRound}
      onKeyChange={demoModel.changeKey}
      onClearKeys={demoModel.clearKeys}
      onExit={demoModel.leaveDemo}
    />
  );
});
