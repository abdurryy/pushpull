// Root component: navigation. Maps each route to its presenter. Plain paths (/tv) work because Firebase Hosting serves index.html for every route.
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomePresenter } from "./presenters/homePresenter.jsx";
import { LobbyPresenter } from "./presenters/lobbyPresenter.jsx";
import { LoginPresenter } from "./presenters/loginPresenter.jsx";
import { JoinPresenter } from "./presenters/joinPresenter.jsx";
import { RoomPresenter } from "./presenters/roomPresenter.jsx";
import { DemoPresenter } from "./presenters/demoPresenter.jsx";
import { ControllerPresenter } from "./presenters/controllerPresenter.jsx";
import { GalleryPresenter } from "./presenters/galleryPresenter.jsx";
import { ProfilePresenter } from "./presenters/profilePresenter.jsx";

// "#/play/join?code=K7M4" becomes "/play/join?code=K7M4". An old invite carried its room code inside the
// fragment, so the query comes along to the new path.
function hashAsPath() {
  const target = new URL(window.location.hash.slice(1), window.location.origin);
  return target.pathname + target.search;
}

// Links we shared before put the route in the fragment (/#/tv). Old bookmarks and invites keep working because
// we turn them into a path (/tv). index.jsx calls this before the router reads the address.
export function keepOldHashLinksWorking() {
  if (window.location.hash.startsWith("#/")) {
    window.history.replaceState(null, "", hashAsPath());
  }
  // An old link can also be opened while the app is already running. That only changes the fragment,
  // which this router ignores, so load the path instead.
  window.addEventListener("hashchange", function hashChangedACB() {
    if (window.location.hash.startsWith("#/")) window.location.replace(hashAsPath());
  });
}

function makeRouter({ model, roomModel, roomController }) {
  function loadJoinCodeACB({ request }) {
    const code = new URL(request.url).searchParams.get("code");
    if (code !== null) roomModel.setCodeInput(code);
    return null;
  }

  const join = <JoinPresenter app={model} room={roomModel} />;

  return createBrowserRouter([
    { path: "/", element: <HomePresenter model={model} /> },
    { path: "/profile", element: <ProfilePresenter model={model} /> },
    { path: "/demo", element: <DemoPresenter model={model} /> },
    { path: "/room", element: <RoomPresenter key="host" app={model} room={roomModel} /> },
    { path: "/room/login", element: <LoginPresenter model={model} host /> },
    { path: "/room/game", element: <RoomPresenter key="board" app={model} room={roomModel} board /> },
    // The shared screen: the lobby, where phones join a room and the host checks the weather. The game board comes later.
    { path: "/tv", element: <LobbyPresenter model={model} roomModel={roomModel} /> },
    // The phone flow starts with logging in: Log in -> Join a room -> Controller.
    { path: "/play/login", element: <LoginPresenter model={model} /> },
    { path: "/play/join", loader: loadJoinCodeACB, element: join, hydrateFallbackElement: join },
    { path: "/play/controller", element: <ControllerPresenter /> },
    { path: "/play/room-controller", element: <ControllerPresenter key="live" room={roomModel} controller={roomController} /> },
    // Dev page: every shared component in every state.
    { path: "/components", element: <GalleryPresenter /> },
    // Unknown routes go back to the start screen.
    { path: "*", element: <HomePresenter model={model} /> },
  ]);
}

export function ReactRoot(props) {
  return <RouterProvider router={makeRouter(props)} />;
}
