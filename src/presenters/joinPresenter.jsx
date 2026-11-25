// Presenter: passes the current authentication state to the join destination.
import { observer } from "mobx-react-lite";
import { JoinView } from "../views/joinView.jsx";

export const JoinPresenter = observer(function JoinPresenter(props) {
  return <JoinView user={props.model.user} authChecked={props.model.authChecked} />;
});
