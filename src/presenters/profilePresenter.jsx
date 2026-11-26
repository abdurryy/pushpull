// Presenter for the profile: connects its account controls to the shared login presenter.
import { LoginPresenter } from "./loginPresenter.jsx";
import { ProfileView } from "../views/profileView.jsx";

export function ProfilePresenter({ model }) {
  return <LoginPresenter model={model} view={ProfileView} />;
}
