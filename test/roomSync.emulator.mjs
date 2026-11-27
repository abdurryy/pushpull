// Integration check: run against the local Realtime Database emulator only.
import assert from "node:assert/strict";
import { deleteApp, initializeApp } from "firebase/app";
import { connectDatabaseEmulator, get, getDatabase, goOffline, goOnline, ref, set } from "firebase/database";
import { makeAutoObservable, when } from "mobx";
import { makeRoomModel } from "../src/model/RoomModel.js";
import { makeRoomSync } from "../src/persistence/roomSync.js";

const apps = [];
const models = [];

function client(uid) {
  const name = uid || "unsigned";
  const projectId = "demo-pushpull";
  const app = initializeApp({
    projectId,
    databaseURL: "https://" + projectId + "-default-rtdb.firebaseio.com",
  }, name);
  apps.push(app);
  const db = getDatabase(app);
  const options = uid ? { mockUserToken: { sub: uid } } : undefined;
  connectDatabaseEmulator(db, "127.0.0.1", 9000, options);
  const session = makeAutoObservable({ user: uid ? { uid, name } : null });
  const room = makeRoomModel(makeRoomSync(db), session);
  models.push(room);
  return { db, session, model: room.model };
}

function eventually(predicate) {
  return when(predicate, { timeout: 6000 });
}

async function check() {
  const host = client("host");
  const phone = client("phone");
  const other = client("other");
  const unsigned = client();
  await eventually(() => host.model.connected && phone.model.connected);
  await host.model.createRoom();
  assert.match(host.model.code || "", /^[A-Z2-9]{4}$/, host.model.error);
  const code = host.model.code;
  const roomPath = "rooms/" + code;
  await eventually(() => host.model.room?.code === code);
  await eventually(() => host.model.room?.hostOnline === true);
  assert.equal(host.model.canStart, false);
  await phone.model.joinRoom(" " + code.toLowerCase() + " ");
  assert.equal(phone.model.code, code, phone.model.error);
  await eventually(() => phone.model.inputReady && host.model.room?.players?.phone?.name === "phone");
  phone.model.pickSide("a");
  await eventually(() => host.model.room?.players?.phone?.side === "a");
  phone.model.setStick("right");
  await eventually(() => host.model.room?.inputs?.phone?.stick === "right");
  phone.model.pressButton("dash");
  await eventually(() => host.model.room?.inputs?.phone?.button === "dash");
  assert.equal(typeof host.model.room.inputs.phone.buttonAt, "number");

  await assert.rejects(get(ref(unsigned.db, roomPath)));
  await assert.rejects(get(ref(other.db, "rooms")));
  await assert.rejects(set(ref(other.db, roomPath + "/players/phone/side"), "b"), /permission.denied/i);
  await assert.rejects(set(ref(other.db, roomPath + "/inputs/phone/stick"), "left"), /permission.denied/i);
  await assert.rejects(set(ref(other.db, roomPath + "/inputs/other"), { stick: "left" }), /permission.denied/i);
  await assert.rejects(set(ref(phone.db, roomPath + "/inputs/phone/stick"), "diagonal"), /permission.denied/i);
  await assert.rejects(set(ref(phone.db, roomPath + "/meta/hostUid"), "phone"), /permission.denied/i);
  await assert.rejects(set(ref(phone.db, roomPath + "/hostOnline"), false), /permission.denied/i);
  await assert.rejects(set(ref(phone.db, roomPath), null), /permission.denied/i);

  goOffline(phone.db);
  await eventually(() => !phone.model.connected && !host.model.room?.inputs?.phone);
  assert.equal(phone.model.stick, "idle");
  goOnline(phone.db);
  await eventually(() => phone.model.connected && phone.model.inputReady);
  phone.model.setStick("up");
  await eventually(() => host.model.room?.inputs?.phone?.stick === "up");

  goOffline(phone.db);
  await eventually(() => !phone.model.connected && !host.model.room?.inputs?.phone);
  const queuedInput = set(ref(phone.db, roomPath + "/inputs/phone"), { stick: "left" });
  phone.model.leaveRoom();
  goOnline(phone.db);
  await queuedInput;
  await eventually(() => phone.model.connected);
  await eventually(() => !host.model.room?.inputs?.phone);
  const candidates = [other, client("third"), client("fourth"), client("fifth")];
  await eventually(() => candidates.every(candidate => candidate.model.connected));
  await Promise.all(candidates.map(candidate => candidate.model.joinRoom(code)));
  const admitted = candidates.filter(candidate => candidate.model.code === code);
  const rejected = candidates.filter(candidate => !candidate.model.code);
  assert.equal(admitted.length, 3);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].model.error, /room is full/i);
  await eventually(() => Object.keys(host.model.room.players).length === 4);

  await phone.model.joinRoom(code);
  assert.equal(phone.model.code, code);
  assert.equal(host.model.room.players.phone.side, "a");
  const leaving = admitted[0];
  await makeRoomSync(leaving.db).removePlayer(code, leaving.session.user.uid);
  leaving.model.leaveRoom();
  await rejected[0].model.joinRoom(code);
  assert.equal(rejected[0].model.code, code);
  await other.model.joinRoom("INVALID");
  assert.match(other.model.error, /four-character/);

  const players = [phone, ...admitted.slice(1), rejected[0]];
  await eventually(() => players.every(player => player.model.inputReady));
  players[1].model.pickSide("a");
  players[2].model.pickSide("b");
  players[3].model.pickSide("b");
  await eventually(() => host.model.canStart);
  assert.deepEqual(host.model.steering, [null, null, null, null]);
  players[0].model.setStick("up");
  players[1].model.setStick("down");
  players[2].model.setStick("left");
  players[3].model.setStick("left");
  await eventually(() => host.model.steering.every(Boolean));
  assert.deepEqual(host.model.steering.slice(0, 2).sort(), ["down", "up"]);
  assert.deepEqual(host.model.steering.slice(2), ["left", "left"]);

  goOffline(host.db);
  await eventually(() => phone.model.room?.hostOnline === false);
  assert.equal(host.model.canStart, false);
  assert.deepEqual(host.model.steering, [null, null, null, null]);
  goOnline(host.db);
  await eventually(() => host.model.canStart);

  await host.model.departRoom();
  assert.equal(host.model.code, null);
  await eventually(() => phone.model.room === null);
  assert.match(phone.model.error, /no longer available/);
  console.log("Room sync passed: access rules, reconnect, concurrent admission, seat reuse, team steering and closure.");
}

try {
  await check();
} finally {
  for (const room of models) room.dispose();
  await Promise.all(apps.map(app => deleteApp(app)));
}
