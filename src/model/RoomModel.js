// Model: tracks an active room and routes room operations through the persistence service.
import { makeAutoObservable, reaction } from "mobx";
import { normalizeRoomCode, validRoomCode } from "../persistence/roomSync.js";

const SIDES = ["a", "b", "center"];
const STICKS = ["idle", "up", "down", "left", "right"];
const BUTTONS = ["dash", "ping", "shed", "hold"];
// Double Snake is two against two: a round can start only with exactly this many players on each team.
const TEAM_SIZE = 2;

function seatOrderCB(first, second) {
  return first.seat.localeCompare(second.seat);
}

// "1 more player" or "2 more players", for the lobby's waiting message.
function morePlayers(count) {
  return count + (count === 1 ? " more player" : " more players");
}

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
    // Set when the host starts a round. The game board (#28) takes over from here.
    roundStarting: false,

    get user() { return appModel.user; },

    // The room's players grouped by the side they picked, in seat order: { a, b, center }.
    get teams() {
      const teams = { a: [], b: [], center: [] };
      const players = this.room?.players || {};
      function toPlayerCB(uid) {
        return { id: uid, name: players[uid].name, side: players[uid].side, seat: players[uid].seat };
      }
      function addToTeamCB(player) {
        teams[player.side]?.push(player);
      }
      Object.keys(players).map(toPlayerCB).sort(seatOrderCB).forEach(addToTeamCB);
      return teams;
    },

    // Why the host can't start a round yet, in words for the TV, or null when everything is ready.
    // The Start button and startRound() both use this, so they can never disagree.
    get startBlockedReason() {
      if (!this.room) return "Create a room first.";
      if (!this.connected) return "Reconnecting… Players can join again once the TV is back online.";
      const { a, b } = this.teams;
      if (a.length > TEAM_SIZE) return "Team A has " + a.length + " players. One of them needs to switch to Team B.";
      if (b.length > TEAM_SIZE) return "Team B has " + b.length + " players. One of them needs to switch to Team A.";
      const missingA = TEAM_SIZE - a.length;
      const missingB = TEAM_SIZE - b.length;
      if (missingA > 0 && missingB > 0) return "Waiting for " + morePlayers(missingA) + " on Team A and " + missingB + " on Team B…";
      if (missingA > 0) return "Waiting for " + morePlayers(missingA) + " on Team A…";
      if (missingB > 0) return "Waiting for " + morePlayers(missingB) + " on Team B…";
      return null;
    },

    // The host starts the round once both teams are full.
    startRound() {
      if (this.role !== "host" || this.startBlockedReason) return;
      this.roundStarting = true;
    },

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
      this.roundStarting = false;
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
      this.roundStarting = false;
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
