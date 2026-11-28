// View: a landscape controller with a floating stick and four independent touch zones.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StatusMessage } from "./statusMessage.jsx";
import { TeamChip } from "./teamChip.jsx";
import "./controllerView.css";

const buttons = [
  { id: "dash", label: "Dash", icon: "bolt", heldProp: "dashHeld" },
  { id: "ping", label: "Ping", icon: "radar", heldProp: "pingHeld" },
  { id: "shed", label: "Shed", icon: "content_cut", heldProp: "shedHeld" },
  { id: "hold", label: "Hold up", icon: "front_hand", heldProp: "holdHeld" },
];

function readToken(name) {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}

function isInstalled() {
  return navigator.standalone === true
    || window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
}

function useControllerWakeLock(enabled) {
  useEffect(function holdScreenAwakeACB() {
    if (!enabled || !navigator.wakeLock) return;

    const landscape = window.matchMedia("(orientation: landscape)");
    let lock;
    let pending = false;
    let disposed = false;

    function canHoldLock() {
      return !disposed && !document.hidden && landscape.matches;
    }

    function releaseLock() {
      const previous = lock;
      lock = null;
      if (previous && !previous.released) previous.release();
    }

    async function updateLockACB() {
      if (!canHoldLock()) {
        releaseLock();
        return;
      }
      if (pending || (lock && !lock.released)) return;

      pending = true;
      try {
        lock = await navigator.wakeLock.request("screen");
        // The player may have left or rotated the phone while the browser was deciding.
        if (!canHoldLock()) releaseLock();
      } catch {
        // The controller still works if the browser or device denies the request.
      } finally {
        pending = false;
      }
    }

    document.addEventListener("visibilitychange", updateLockACB);
    landscape.addEventListener("change", updateLockACB);
    updateLockACB();
    return function releaseLockACB() {
      disposed = true;
      document.removeEventListener("visibilitychange", updateLockACB);
      landscape.removeEventListener("change", updateLockACB);
      releaseLock();
    };
  }, [enabled]);
}

export function ControllerView({
  onClear, onStick, onAction, direction, roomCode, closedRoomCode, team, unavailable, reconnecting, hostAway, error, ...heldActions
}) {
  const screen = useRef(null);
  const stickPad = useRef(null);
  const stickPointer = useRef(null);
  const buttonPointers = useRef(new Map());
  const buttonKeys = useRef(new Map());
  const [mode, setMode] = useState("setup");
  const [stick, setStick] = useState(null);
  const active = mode === "active" || mode === "fullscreen";
  const inputPaused = Boolean(unavailable || reconnecting || hostAway);

  // The live controller stays open between rounds, including while the TV starts one.
  useControllerWakeLock(Boolean(active && team && !inputPaused));

  useEffect(function watchScreenACB() {
    function clearACB() {
      stickPointer.current = null;
      buttonPointers.current.clear();
      buttonKeys.current.clear();
      setStick(null);
      onClear();
    }

    function visibilityACB() {
      if (document.hidden) clearACB();
    }

    function fullscreenChangeACB() {
      clearACB();
      if (document.fullscreenElement !== screen.current) {
        setMode(function leaveFullscreenCB(previous) {
          return previous === "fullscreen" ? "setup" : previous;
        });
      }
    }

    const landscape = window.matchMedia("(orientation: landscape)");
    window.addEventListener("blur", clearACB);
    document.addEventListener("visibilitychange", visibilityACB);
    document.addEventListener("fullscreenchange", fullscreenChangeACB);
    landscape.addEventListener("change", clearACB);
    if (inputPaused) clearACB();
    return function cleanUpACB() {
      window.removeEventListener("blur", clearACB);
      document.removeEventListener("visibilitychange", visibilityACB);
      document.removeEventListener("fullscreenchange", fullscreenChangeACB);
      landscape.removeEventListener("change", clearACB);
      onClear();
    };
  }, [onClear, inputPaused]);

  async function enterACB() {
    if (isInstalled()) {
      setMode("active");
      return;
    }
    if (!document.fullscreenEnabled || !screen.current?.requestFullscreen) {
      setMode("fallback");
      return;
    }
    try {
      await screen.current.requestFullscreen({ navigationUI: "hide" });
      setMode("fullscreen");
    } catch {
      setMode("fallback");
    }
  }

  function stickDownACB(event) {
    if (inputPaused || stickPointer.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = stickPad.current.getBoundingClientRect();
    const radius = readToken("--controller-button") / 2;
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    stickPointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      point,
      radius,
      deadZone: readToken("--stick-dead-zone") * radius,
    };
    setStick({ ...point, dx: 0, dy: 0 });
    onStick("idle");
  }

  function stickMoveACB(event) {
    const pointer = stickPointer.current;
    if (pointer?.id !== event.pointerId) return;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const distance = Math.hypot(dx, dy);
    const thumbTravel = pointer.radius / 2;
    const ratio = distance > thumbTravel ? thumbTravel / distance : 1;
    setStick({ ...pointer.point, dx: dx * ratio, dy: dy * ratio });
    if (distance <= pointer.deadZone) {
      onStick("idle");
    } else if (Math.abs(dx) >= Math.abs(dy)) {
      onStick(dx > 0 ? "right" : "left");
    } else {
      onStick(dy > 0 ? "down" : "up");
    }
  }

  function stickReleaseACB(event) {
    if (stickPointer.current?.id !== event.pointerId) return;
    stickPointer.current = null;
    setStick(null);
    onStick("idle");
  }

  function actionDownACB(event) {
    const name = event.currentTarget.value;
    if (buttonPointers.current.has(name) || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    buttonPointers.current.set(name, event.pointerId);
    onAction(name, true);
    navigator.vibrate?.(readToken("--press-vibration-ms"));
  }

  function actionReleaseACB(event) {
    const name = event.currentTarget.value;
    if (buttonPointers.current.get(name) !== event.pointerId) return;
    buttonPointers.current.delete(name);
    if (!buttonKeys.current.get(name)?.size) onAction(name, false);
  }

  function actionKeyDownACB(event) {
    if (event.repeat || (event.key !== " " && event.key !== "Enter")) return;
    event.preventDefault();
    const name = event.currentTarget.value;
    const keys = buttonKeys.current.get(name) || new Set();
    keys.add(event.key);
    buttonKeys.current.set(name, keys);
    onAction(name, true);
  }

  function actionKeyUpACB(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    const name = event.currentTarget.value;
    const keys = buttonKeys.current.get(name);
    if (!keys?.delete(event.key) || keys.size) return;
    buttonKeys.current.delete(name);
    if (!buttonPointers.current.has(name)) onAction(name, false);
  }

  function actionBlurACB(event) {
    const name = event.currentTarget.value;
    if (buttonKeys.current.delete(name) && !buttonPointers.current.has(name)) {
      onAction(name, false);
    }
  }

  function actionClickACB(event) {
    // Assistive technology can activate a native button without a pointer or keyboard event.
    if (event.detail !== 0) return;
    const name = event.currentTarget.value;
    if (buttonPointers.current.has(name) || buttonKeys.current.get(name)?.size) return;
    onAction(name, true);
    onAction(name, false);
    navigator.vibrate?.(readToken("--press-vibration-ms"));
  }

  function contextMenuACB(event) { event.preventDefault(); }
  function continueACB(event) {
    if (event.type === "pointerdown" && event.button !== 0) return;
    if (event.type === "click" && event.detail !== 0) return;
    setMode("active");
  }
  if (unavailable || hostAway) {
    return (
      <main ref={screen} className="controller controller-unavailable">
        {hostAway ? (
          <StatusMessage kind="waiting">The TV lost its connection. Waiting for the host to reconnect…</StatusMessage>
        ) : (
          <p role="status">
            {closedRoomCode
              ? "The host closed room " + closedRoomCode + "."
              : "Your room is unavailable. Join a room and choose a team to use this controller."}
          </p>
        )}
        <Link className="button" to="/play/join">
          {hostAway ? "Back to room" : closedRoomCode ? "Join another room" : "Go to room setup"}
        </Link>
      </main>
    );
  }

  const roomStatus = error || (reconnecting ? "Reconnecting…" : null);
  const statusRole = error ? "alert" : "status";
  const teamAndRoom = team && <><TeamChip team={team} />{" · "}<span className="numbers">{roomCode}</span></>;

  return (
    <main ref={screen} className="controller" aria-label={team ? "Push/Pull room controller" : "Push/Pull controller preview"}>
      <p className="controller-portrait">
        <span className="icon" aria-hidden="true">screen_rotation</span>
        <span>Turn your phone sideways</span>
      </p>
      {!active ? (
        <div className="controller-landscape controller-setup">
          <Link className="button button-text" to={team ? "/play/join" : "/"}>{team ? "Back to room" : "Back to home"}</Link>
          <h1>{team ? "Room controller" : "Controller preview"}</h1>
          {team ? <p role={statusRole}>{roomStatus || teamAndRoom}</p> : <p>Try the stick and buttons on this phone.</p>}
          {mode === "fallback" ? (
            <>
              <p role="status">For fullscreen on iPhone, open this page in Safari and choose Share → Add to Home Screen.</p>
              <button className="button" type="button" onPointerDown={continueACB} onClick={continueACB}>Continue in browser</button>
            </>
          ) : <button className="button" type="button" onClick={enterACB}>Enter controller</button>}
        </div>
      ) : (
        <div className="controller-landscape controller-inputs" onContextMenu={contextMenuACB}>
          <div className="controller-stick" role="group" aria-label={"Joystick: " + direction}
            aria-disabled={inputPaused} data-dragging={Boolean(stick)}
            onPointerDown={stickDownACB} onPointerMove={stickMoveACB} onPointerUp={stickReleaseACB}
            onPointerCancel={stickReleaseACB} onLostPointerCapture={stickReleaseACB}>
            <div className="controller-stick-pad" ref={stickPad}>
              {(roomStatus || team) && <p className="controller-room-status" role={statusRole}>{roomStatus || teamAndRoom}</p>}
              <span className="controller-stick-guide" aria-hidden="true">
                <span className="icon">keyboard_arrow_up</span>
                <span className="icon">keyboard_arrow_left</span>
                <span className="icon">keyboard_arrow_right</span>
                <span className="icon">keyboard_arrow_down</span>
              </span>
              <span className="controller-stick-label">Drag to steer</span>
              <span className="controller-stick-ring" aria-hidden="true"
                style={stick ? { "--stick-x": stick.x + "px", "--stick-y": stick.y + "px" } : undefined}>
                <span className="controller-stick-thumb"
                  style={stick ? { transform: "translate(" + stick.dx + "px, " + stick.dy + "px)" } : undefined} />
              </span>
            </div>
          </div>
          <div className="controller-actions" role="group" aria-label="Actions">
            {buttons.map(function actionButtonCB(button) {
              return (
                <button key={button.id} type="button" value={button.id}
                  className="controller-action" data-held={Boolean(heldActions[button.heldProp])}
                  disabled={inputPaused} onClick={actionClickACB}
                  onPointerDown={actionDownACB} onPointerUp={actionReleaseACB}
                  onPointerCancel={actionReleaseACB} onLostPointerCapture={actionReleaseACB}
                  onKeyDown={actionKeyDownACB} onKeyUp={actionKeyUpACB} onBlur={actionBlurACB}>
                  <span className="controller-action-face">
                    <span className="icon" aria-hidden="true">{button.icon}</span>
                    <span>{button.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
