// Model: tracks an active room and routes room operations through the persistence service.
import { makeAutoObservable, reaction, runInAction } from "mobx";
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
    codeInput: "",
    code: null,
    room: null,
    role: null,
    connected: false,
    inputReady: false,
    loading: false,
    pendingSide: null,
    error: null,
    closedRoomCode: null,
    stick: "idle",
    requestId: 0,
    // Set when the host starts a round. The game board (#28) takes over from here.
    roundStarting: false,

    get user() { return appModel.user; },

    get side() { return this.room?.players?.[this.user?.uid]?.side; },

    get joined() { return this.role === "player" && Boolean(this.side); },

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

    get openTeamSeats() {
      return {
        a: Math.max(0, TEAM_SIZE - this.teams.a.length),
        b: Math.max(0, TEAM_SIZE - this.teams.b.length),
      };
    },

    get canStart() {
      return this.role === "host" && !this.startBlockedReason;
    },

    get steering() {
      if (!this.connected || this.room?.hostOnline !== true) return [null, null, null, null];
      const { a, b } = this.teams;
      const inputs = this.room.inputs;
      function stickFor(player) {
        const stick = inputs?.[player?.id]?.stick;
        return stick !== "idle" && STICKS.includes(stick) ? stick : null;
      }
      return [stickFor(a[0]), stickFor(a[1]), stickFor(b[0]), stickFor(b[1])];
    },

    // Why the host can't start a round yet, in words for the TV, or null when everything is ready.
    // canStart, the Start button and startRound() all read this, so they can never disagree.
    get startBlockedReason() {
      if (!this.room) return "Create a room first.";
      if (this.loading) return "Closing room…";
      if (!this.connected) return "Reconnecting… Players can join again once the TV is back online.";
      // hostOnline is the room's own record of the host screen being present. Without it the
      // roster on screen may already be stale, so a round must not start from it.
      if (this.room.hostOnline !== true) return "Reconnecting this screen to the room… Start works again once it is back.";
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

    setCodeInput(code) {
      this.codeInput = normalizeRoomCode(code).replace(/[^A-Z0-9]/g, "").slice(0, 4);
      this.error = null;
    },

    async createRoom() {
      await openRoom("host");
    },

    async joinRoom(rawCode = this.codeInput) {
      if (this.loading) return;
      const code = normalizeRoomCode(rawCode);
      if (!validRoomCode(code)) {
        this.setError(new Error("Enter a valid four-character room code."));
        return;
      }
      await openRoom("player", code);
    },

    beginRequest() {
      this.loading = true;
      this.pendingSide = null;
      this.error = null;
      this.closedRoomCode = null;
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
      if (!room) {
        // Firebase echoes the host's removal locally before the server accepts it.
        if (this.role === "host" && this.loading && this.room) return;
        const closedCode = this.role === "player" ? this.code : null;
        this.leaveRoom();
        this.closedRoomCode = closedCode;
        if (closedCode) {
          if (this.codeInput === closedCode) this.codeInput = "";
        } else {
          this.error = "This room is no longer available.";
        }
        return;
      }
      if (!this.room) this.loading = false;
      this.room = room;
    },

    setError(error) {
      this.error = !error.code && error.message ? error.message : "Room sync failed. Try again.";
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

    async pickSide(side) {
      if (!this.connected || !this.joined || this.loading || this.pendingSide || !SIDES.includes(side)) return;
      if (side === this.side || this.openTeamSeats[side] === 0) return;
      this.error = null;
      this.pendingSide = side;
      const { requestId } = this;
      try {
        await sync.setSide(this.code, this.user.uid, side);
      } catch (error) {
        if (this.requestId === requestId && this.joined) this.setError(error);
      } finally {
        runInAction(function clearPendingSideACB() {
          if (model.requestId === requestId) model.pendingSide = null;
        });
      }
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
      this.pendingSide = null;
      this.inputReady = false;
      this.stick = "idle";
      this.error = null;
      this.closedRoomCode = null;
      this.roundStarting = false;
    },

    async departRoom() {
      if (!this.room || !this.user) {
        this.leaveRoom();
        return;
      }
      if (!this.connected || this.loading || this.pendingSide) return;
      const { role, code, user } = this;
      const request = this.beginRequest();
      try {
        if (role === "host") await sync.closeRoom(code);
        else await sync.removePlayer(code, user.uid);
        if (this.requestId === request) this.leaveRoom();
      } catch (error) {
        if (this.requestId === request) this.setError(error);
      }
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
      stopRoom = code ? sync.watchRoom(code, model.receiveRoom, reportRoomError()) : null;
    },
  );
  const stopInput = reaction(
    function connectionAndRoomACB() { return [model.code, model.role, model.connected, model.user?.uid]; },
    async function registerPresenceACB([code, role, connected, uid]) {
      const registration = ++inputRegistration;
      // Keep the last connected input location in case a queued write replays after reconnecting.
      if (!connected) return;
      const next = code && role === "player" && uid ? { code, uid } : null;
      // The host's delete already removed the old input record.
      if (previousInput && previousInput.code !== model.closedRoomCode
        && (previousInput.code !== next?.code || previousInput.uid !== next?.uid)
        && previousInput.uid === uid) {
        sync.clearInput(previousInput.code, uid).catch(reportRoomError());
      }
      previousInput = next;
      try {
        if (code && role === "host") {
          await sync.trackHostConnection(code);
          return;
        }
        if (!next) return;
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
