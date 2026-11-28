// Presenter: passes test-run state and actions to the room test panel.
import { observer } from "mobx-react-lite";
import { TestSuiteView } from "../views/testSuiteView.jsx";

export const TestSuitePresenter = observer(function TestSuitePresenter({ app, testSuite }) {
  return (
    <TestSuiteView
      authChecked={app.authChecked}
      signedIn={Boolean(app.user)}
      available={testSuite.available}
      connected={testSuite.connected}
      code={testSuite.code}
      pending={testSuite.pending}
      running={Boolean(testSuite.run)}
      status={testSuite.status}
      steps={testSuite.steps.slice()}
      error={testSuite.error}
      onCodeChange={testSuite.setCode}
      onRun={testSuite.start}
      onStop={testSuite.stop}
    />
  );
});
