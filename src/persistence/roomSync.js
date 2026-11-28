// Persistence: reads a room and writes only the current player's Firebase records.
import { get, onDisconnect, onValue, ref, remove, runTransaction, serverTimestamp, set, update } from "firebase/database";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DAY_MS = 24 * 60 * 60 * 1000;
const SEATS = ["s1", "s2", "s3", "s4"];

export function normalizeRoomCode(code) {
  return String(code).trim().toUpperCase();
}

export function validRoomCode(code) {
  return code.length === 4 && [...code].every(function isAllowedCB(char) {
    return CODE_CHARS.includes(char);
  });
}

export function activeRoomTest(room, now = Date.now()) {
  const test = room?.testRun;
  if (!test?.live?.[test.id] || test.expiresAt <= now || test.phase === "passed" || test.phase === "failed") return null;
  return test;
}

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, function toCharacterCB(byte) {
    return CODE_CHARS[byte % CODE_CHARS.length];
  }).join("");
}

export function makeRoomSync(database) {
  function roomRef(code, suffix = "") {
    if (!database) throw new Error("Room sync is not configured.");
    return ref(database, "rooms/" + code + suffix);
  }

  function serverOffset() {
    // Connection metadata is supplied by the SDK's listener, not the REST data endpoint.
    return new Promise(function readOffsetACB(resolve) {
      onValue(ref(database, ".info/serverTimeOffset"), function offsetACB(snapshot) {
        resolve(snapshot.val() || 0);
      }, { onlyOnce: true });
    });
  }

  return {
    available: Boolean(database),
    async createRoom(hostUid) {
      const offset = await serverOffset();
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const code = randomCode();
        const metadata = roomRef(code, "/meta");
        if ((await get(metadata)).exists()) continue;
        try {
          const result = await runTransaction(metadata, function reserveACB(existing) {
            if (existing !== null) return;
            return { hostUid, expiresAt: Date.now() + offset + DAY_MS - 5000 };
          }, { applyLocally: false });
          if (result.committed) return code;
        } catch (error) {
          if (!(await get(metadata)).exists()) throw error;
        }
      }
      throw new Error("Couldn't reserve a room code. Try again.");
    },

    async joinRoom(code, user) {
      const snapshot = await get(roomRef(code, "/meta"));
      const meta = snapshot.val();
      if (!meta) throw new Error("No room with code " + code + ".");
      const offset = await serverOffset();
      if (meta.expiresAt <= Date.now() + offset) throw new Error("That room has expired.");
      const room = roomRef(code);
      const name = user.name?.trim().slice(0, 80) || "Player";
      for (const seat of SEATS) {
        const current = (await get(room)).val();
        if (current?.players?.[user.uid]) return code;
        if (activeRoomTest(current, Date.now() + offset)) throw new Error("The host is testing this room. Try again when the test ends.");
        if (current?.seats?.[seat]) continue;
        try {
          // Commit the seat and the player together. The rules reject an occupied seat.
          await update(room, {
            ["seats/" + seat]: user.uid,
            ["players/" + user.uid]: { name, side: "center", seat },
          });
          return code;
        } catch (error) {
          const latest = (await get(room)).val();
          if (latest?.players?.[user.uid]) return code;
          if (activeRoomTest(latest, Date.now() + offset)) throw new Error("The host is testing this room. Try again when the test ends.");
          if (!latest?.seats?.[seat]) throw error;
        }
      }
      throw new Error("This room is full.");
    },

    watchRoom(code, receive, fail) {
      return onValue(roomRef(code), function roomChangedACB(snapshot) {
        const data = snapshot.val();
        receive(data?.meta ? { code, ...data } : null);
      }, fail);
    },

    async startTestRun(code, uid) {
      const tester = await get(ref(database, "roomTesters/" + uid));
      if (tester.val() !== true) throw new Error("This account does not have room test access.");
      const room = (await get(roomRef(code))).val();
      if (!room?.meta) throw new Error("No room with that code. Check the TV and try again.");
      if (room.meta.hostUid !== uid) throw new Error("Use the same account that opened the TV room.");
      const offset = await serverOffset();
      const now = Date.now() + offset;
      if (room.meta.expiresAt <= now || room.hostOnline !== true) throw new Error("Open an active room on the TV first.");
      if (room.players || room.seats) throw new Error("Use an empty TV room for this test.");
      if (activeRoomTest(room, now)) throw new Error("A test is already running in this room.");

      const id = crypto.randomUUID();
      const expiresAt = now + 115_000;
      // A run-specific path lets a late disconnect from an old tab leave a newer run alone.
      const disconnect = onDisconnect(roomRef(code, "/testRun/live/" + id));
      await disconnect.remove();
      try {
        await set(roomRef(code, "/testRun"), { id, expiresAt, phase: "ready", live: { [id]: true } });
      } catch (error) {
        await disconnect.cancel();
        throw error;
      }
      return { code, id, expiresAt: expiresAt - offset };
    },

    async setTestPhase(code, id, phase) {
      const result = await runTransaction(roomRef(code, "/testRun"), function setPhaseACB(test) {
        if (test?.id !== id || !test.live?.[id] || test.phase === "passed" || test.phase === "failed") return;
        return { ...test, phase };
      }, { applyLocally: false });
      return result.committed;
    },

    async stopTestRun(code, id) {
      await remove(roomRef(code, "/testRun/live/" + id));
    },

    watchConnection(receive) {
      if (!database) return function unsubscribeACB() {};
      return onValue(ref(database, ".info/connected"), function connectionChangedACB(snapshot) {
        receive(snapshot.val() === true);
      });
    },

    async trackHostConnection(code) {
      const presence = roomRef(code, "/hostOnline");
      await onDisconnect(presence).set(false);
      // Publish the new input epoch with presence so a queued write from before the outage cannot steer.
      try {
        await update(roomRef(code), { hostOnline: true, hostInputEpoch: crypto.randomUUID() });
      } catch (error) {
        if (error.message !== "permission_denied" && error.code !== "PERMISSION_DENIED") throw error;
        throw new Error("Could not confirm the TV connection. Check the Firebase room rules and reopen the room.", { cause: error });
      }
    },

    closeRoom(code) {
      return remove(roomRef(code));
    },

    async setSide(code, uid, side) {
      try {
        // Wait for the server's capacity check before showing the new side locally.
        await runTransaction(roomRef(code, "/players/" + uid + "/side"), function selectSideACB() {
          return side;
        }, { applyLocally: false });
      } catch (error) {
        if (error.message !== "permission_denied") throw error;
        const players = side === "center" ? null : (await get(roomRef(code, "/players"))).val();
        const teammates = Object.entries(players || {}).filter(function sameSideCB([id, player]) {
          return id !== uid && player.side === side;
        });
        if (teammates.length >= 2) throw new Error("Team " + side.toUpperCase() + " is full. Pick another side.");
        throw new Error("Could not pick that side. Try again.");
      }
    },

    setStick(code, uid, stick, hostInputEpoch) {
      return update(roomRef(code, "/inputs/" + uid), { stick, hostInputEpoch: hostInputEpoch ?? null });
    },

    sendButton(code, uid, button, stick, hostInputEpoch) {
      return update(roomRef(code, "/inputs/" + uid), {
        button, stick, buttonAt: serverTimestamp(), hostInputEpoch: hostInputEpoch ?? null,
      });
    },

    trackInputDisconnect(code, uid) {
      return onDisconnect(roomRef(code, "/inputs/" + uid)).remove();
    },

    clearInput(code, uid) {
      return remove(roomRef(code, "/inputs/" + uid));
    },

    async removePlayer(code, uid) {
      const player = (await get(roomRef(code, "/players/" + uid))).val();
      if (!player) return;
      await update(roomRef(code), {
        ["inputs/" + uid]: null,
        ["players/" + uid]: null,
        ["seats/" + player.seat]: null,
      });
    },
  };
}
