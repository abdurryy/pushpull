// Presenter for the start screen: connects its account controls to the shared login presenter.
import { LoginPresenter } from "./loginPresenter.jsx";
import { HomeView } from "../views/homeView.jsx";

export function HomePresenter({ model }) {
  return <LoginPresenter model={model} view={HomeView} />;
}
