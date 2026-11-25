// View: a landscape controller with a floating stick and four independent touch zones.
import { useEffect, useRef, useState } from "react";
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

export function ControllerView({ onClear, onStick, onAction, direction, ...heldActions }) {
  const screen = useRef(null);
  const stickPointer = useRef(null);
  const buttonPointers = useRef(new Map());
  const [mode, setMode] = useState("setup");
  const [stick, setStick] = useState(null);

  useEffect(function watchScreenACB() {
    function clearACB() {
      stickPointer.current = null;
      buttonPointers.current.clear();
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
    return function cleanUpACB() {
      window.removeEventListener("blur", clearACB);
      document.removeEventListener("visibilitychange", visibilityACB);
      document.removeEventListener("fullscreenchange", fullscreenChangeACB);
      landscape.removeEventListener("change", clearACB);
      onClear();
    };
  }, [onClear]);

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
    if (stickPointer.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
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
    const ratio = distance > pointer.radius ? pointer.radius / distance : 1;
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
    onAction(name, false);
  }

  function actionKeyDownACB(event) {
    if (event.repeat || (event.key !== " " && event.key !== "Enter")) return;
    event.preventDefault();
    onAction(event.currentTarget.value, true);
  }

  function actionKeyUpACB(event) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    onAction(event.currentTarget.value, false);
  }

  function actionBlurACB(event) {
    const name = event.currentTarget.value;
    if (!buttonPointers.current.has(name)) onAction(name, false);
  }

  function contextMenuACB(event) { event.preventDefault(); }
  function continueACB() { setMode("active"); }
  const active = mode === "active" || mode === "fullscreen";

  return (
    <main ref={screen} className="controller" aria-label="Push/Pull controller preview">
      <p className="controller-portrait">Turn your phone sideways</p>
      {!active ? (
        <div className="controller-landscape controller-setup">
          <a href="#/">Back to home</a>
          <h1>Controller preview</h1>
          <p>Try the stick and buttons on this phone.</p>
          {mode === "fallback" ? (
            <>
              <p role="status">Fullscreen is unavailable here. Open Push/Pull from your Home Screen for a view without the browser address bar.</p>
              <button type="button" onClick={continueACB}>Continue in browser</button>
            </>
          ) : <button type="button" onClick={enterACB}>Enter controller</button>}
        </div>
      ) : (
        <div className="controller-landscape controller-inputs" onContextMenu={contextMenuACB}>
          <div className="controller-stick" role="group" aria-label={"Joystick: " + direction}
            onPointerDown={stickDownACB} onPointerMove={stickMoveACB} onPointerUp={stickReleaseACB}
            onPointerCancel={stickReleaseACB} onLostPointerCapture={stickReleaseACB}>
            <span className="controller-stick-ring" aria-hidden="true"
              style={stick ? { left: stick.x, top: stick.y } : undefined}>
              <span className="controller-stick-thumb"
                style={stick ? { transform: "translate(" + stick.dx + "px, " + stick.dy + "px)" } : undefined} />
            </span>
          </div>
          <div className="controller-actions" role="group" aria-label="Actions">
            {buttons.map(function actionButtonCB(button) {
              return (
                <button key={button.id} type="button" value={button.id}
                  className="controller-action" data-held={Boolean(heldActions[button.heldProp])}
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
