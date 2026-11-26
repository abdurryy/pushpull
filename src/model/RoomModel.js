// Model: tracks an active room and routes room operations through the persistence service.
import { makeAutoObservable, reaction } from "mobx";
import { normalizeRoomCode, validRoomCode } from "../persistence/roomSync.js";

const SIDES = ["a", "b", "center"];
const STICKS = ["idle", "up", "down", "left", "right"];
const BUTTONS = ["dash", "ping", "shed", "hold"];

export function makeRoomModel(sync, appModel) {
  const model = makeAutoObservable({
    available: sync.available,
    code: null,
    room: null,
    role: null,
    connected: false,
    inputReady: false,
    loading: false,
    error: null,
    stick: "idle",
    requestId: 0,

    get user() { return appModel.user; },

    async createRoom() {
      await openRoom("host");
    },

    async joinRoom(rawCode) {
      const code = normalizeRoomCode(rawCode);
      if (!validRoomCode(code)) {
        this.setError(new Error("Enter a valid four-character room code."));
        return;
      }
      await openRoom("player", code);
    },

    beginRequest() {
      this.loading = true;
      this.error = null;
      this.requestId += 1;
      return this.requestId;
    },

    openRoom(code, role) {
      if (this.code === code && this.role === role) {
        this.loading = false;
        return;
      }
      this.code = code;
      this.role = role;
      this.room = null;
      this.loading = true;
      this.inputReady = false;
      this.stick = "idle";
    },

    receiveRoom(room) {
      this.room = room;
      this.loading = false;
      if (!room) this.error = "This room is no longer available.";
    },

    setError(error) {
      this.error = error.message || "Room sync failed. Try again.";
      this.loading = false;
    },

    setConnected(connected) {
      this.connected = connected;
      if (!connected) {
        this.inputReady = false;
        this.stick = "idle";
      }
    },

    setInputReady() {
      this.inputReady = true;
    },

    pickSide(side) {
      if (!this.connected || this.role !== "player" || !this.room || !SIDES.includes(side)) return;
      sync.setSide(this.code, this.user.uid, side).catch(reportRoomError());
    },

    setStick(direction) {
      if (!this.inputReady || !STICKS.includes(direction) || this.stick === direction) return;
      this.stick = direction;
      sync.setStick(this.code, this.user.uid, direction).catch(reportRoomError());
    },

    pressButton(button) {
      if (!this.inputReady || !BUTTONS.includes(button)) return;
      sync.sendButton(this.code, this.user.uid, button, this.stick).catch(reportRoomError());
    },

    leaveRoom() {
      this.requestId += 1;
      this.code = null;
      this.room = null;
      this.role = null;
      this.loading = false;
      this.inputReady = false;
      this.stick = "idle";
      this.error = null;
    },
  }, {}, { autoBind: true });

  async function openRoom(role, code) {
    if (!model.available) {
      model.setError(new Error("Room sync is not configured."));
      return;
    }
    if (!model.user) {
      model.setError(new Error("Sign in to use rooms."));
      return;
    }
    if (!model.connected) {
      model.setError(new Error("Reconnecting… Try again when you're online."));
      return;
    }
    const user = model.user;
    const request = model.beginRequest();
    try {
      const selected = role === "host" ? await sync.createRoom(user.uid) : await sync.joinRoom(code, user);
      if (model.requestId === request && model.user?.uid === user.uid) model.openRoom(selected, role);
    } catch (error) {
      if (model.requestId === request) model.setError(error);
    }
  }

  function reportRoomError() {
    const { requestId } = model;
    return function reportACB(error) {
      if (model.requestId === requestId) model.setError(error);
    };
  }

  const stopConnection = sync.watchConnection(model.setConnected);
  let stopRoom;
  let previousInput;
  let inputRegistration = 0;
  const stopAuth = reaction(
    function sessionACB() { return model.user?.uid; },
    model.leaveRoom,
  );
  const stopRoomReaction = reaction(
    function roomCodeACB() { return model.code; },
    function subscribeACB(code) {
      stopRoom?.();
      if (code) stopRoom = sync.watchRoom(code, model.receiveRoom, reportRoomError());
    },
  );
  const stopInput = reaction(
    function connectionAndRoomACB() { return [model.code, model.role, model.connected, model.user?.uid]; },
    async function registerInputACB([code, role, connected, uid]) {
      const registration = ++inputRegistration;
      // Keep the last connected input location in case a queued write replays after reconnecting.
      if (!connected) return;
      const next = code && role === "player" && uid ? { code, uid } : null;
      if (previousInput && connected && (previousInput.code !== next?.code || previousInput.uid !== next?.uid)
        && previousInput.uid === uid) {
        sync.clearInput(previousInput.code, uid).catch(reportRoomError());
      }
      previousInput = next;
      if (!next) return;
      try {
        // Schedule server cleanup before accepting movement, including after reconnecting.
        await sync.trackInputDisconnect(code, uid);
        if (registration !== inputRegistration) return;
        await sync.clearInput(code, uid);
        if (registration === inputRegistration) model.setInputReady();
      } catch (error) {
        if (registration === inputRegistration) model.setError(error);
      }
    },
  );

  return {
    model,
    dispose() {
      stopConnection();
      stopRoom?.();
      stopRoomReaction();
      stopAuth();
      stopInput();
      inputRegistration += 1;
      const uid = model.user?.uid;
      if (model.connected && model.role === "player" && model.code && uid) {
        sync.clearInput(model.code, uid).catch(reportRoomError());
      }
      model.leaveRoom();
    },
  };
}
