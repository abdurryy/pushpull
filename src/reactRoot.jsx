// Root component: navigation. Maps each route to its presenter. Hash routes (#/tv) work on any static host, like Firebase Hosting.
import { createHashRouter, RouterProvider } from "react-router-dom";
import { HomePresenter } from "./presenters/homePresenter.jsx";
import { WeatherPresenter } from "./presenters/weatherPresenter.jsx";
import { LoginPresenter } from "./presenters/loginPresenter.jsx";
import { JoinPresenter } from "./presenters/joinPresenter.jsx";
import { DemoPresenter } from "./presenters/demoPresenter.jsx";
import { ControllerPresenter } from "./presenters/controllerPresenter.jsx";
import { GalleryPresenter } from "./presenters/galleryPresenter.jsx";

function makeRouter(model) {
  return createHashRouter([
    { path: "/", element: <HomePresenter /> },
    { path: "/demo", element: <DemoPresenter model={model} /> },
    // The shared screen. Shows the weather check for now; the lobby and game board come later.
    { path: "/tv", element: <WeatherPresenter model={model} /> },
    // The phone flow starts with logging in: Log in -> Join a room -> Controller.
    { path: "/play/login", element: <LoginPresenter model={model} /> },
    // The destination exists now; room codes and team selection are a separate feature.
    { path: "/play/join", element: <JoinPresenter model={model} /> },
    { path: "/play/controller", element: <ControllerPresenter /> },
    // Dev page: every shared component in every state.
    { path: "/components", element: <GalleryPresenter /> },
    // Unknown routes go back to the start screen.
    { path: "*", element: <HomePresenter /> },
  ]);
}

export function ReactRoot(props) {
  return <RouterProvider router={makeRouter(props.model)} />;
}
