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

    watchConnection(receive) {
      if (!database) return function unsubscribeACB() {};
      return onValue(ref(database, ".info/connected"), function connectionChangedACB(snapshot) {
        receive(snapshot.val() === true);
      });
    },

    async trackHostConnection(code) {
      const presence = roomRef(code, "/hostOnline");
      await onDisconnect(presence).set(false);
      await set(presence, true);
    },

    closeRoom(code) {
      return remove(roomRef(code));
    },

    setSide(code, uid, side) {
      return set(roomRef(code, "/players/" + uid + "/side"), side);
    },

    setStick(code, uid, stick) {
      return update(roomRef(code, "/inputs/" + uid), { stick });
    },

    sendButton(code, uid, button, stick) {
      return update(roomRef(code, "/inputs/" + uid), { button, stick, buttonAt: serverTimestamp() });
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
