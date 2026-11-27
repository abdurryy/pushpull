// Root component: navigation. Maps each route to its presenter. Hash routes (#/tv) work on any static host, like Firebase Hosting.
import { createHashRouter, RouterProvider } from "react-router-dom";
import { HomePresenter } from "./presenters/homePresenter.jsx";
import { LobbyPresenter } from "./presenters/lobbyPresenter.jsx";
import { LoginPresenter } from "./presenters/loginPresenter.jsx";
import { JoinPresenter } from "./presenters/joinPresenter.jsx";
import { RoomPresenter } from "./presenters/roomPresenter.jsx";
import { DemoPresenter } from "./presenters/demoPresenter.jsx";
import { ControllerPresenter } from "./presenters/controllerPresenter.jsx";
import { GalleryPresenter } from "./presenters/galleryPresenter.jsx";
import { ProfilePresenter } from "./presenters/profilePresenter.jsx";

function makeRouter({ model, roomModel, roomController }) {
  function loadJoinCodeACB({ request }) {
    const code = new URL(request.url).searchParams.get("code");
    if (code !== null) roomModel.setCodeInput(code);
    return null;
  }

  const join = <JoinPresenter app={model} room={roomModel} />;

  return createHashRouter([
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
