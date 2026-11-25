// Root component: navigation. Maps each route to its presenter. Hash routes (#/tv) work on any static host, like Firebase Hosting.
import { createHashRouter, RouterProvider } from "react-router-dom";
import { HomePresenter } from "./presenters/homePresenter.jsx";
import { WeatherPresenter } from "./presenters/weatherPresenter.jsx";

function makeRouter(model) {
  return createHashRouter([
    { path: "/", element: <HomePresenter /> },
    // The shared screen. Shows the weather check for now; the lobby and game board come later.
    { path: "/tv", element: <WeatherPresenter model={model} /> },
    // Unknown routes go back to the start screen.
    { path: "*", element: <HomePresenter /> },
  ]);
}

export function ReactRoot(props) {
  return <RouterProvider router={makeRouter(props.model)} />;
}
