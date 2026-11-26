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

  goOffline(phone.db);
  await eventually(() => !phone.model.connected && !host.model.room?.inputs?.phone);
  assert.equal(phone.model.stick, "idle");
  goOnline(phone.db);
  await eventually(() => phone.model.connected && phone.model.inputReady);
  phone.model.setStick("up");
  await eventually(() => host.model.room?.inputs?.phone?.stick === "up");

  phone.model.leaveRoom();
  await eventually(() => !host.model.room?.inputs?.phone);
  await other.model.joinRoom("INVALID");
  assert.match(other.model.error, /four-character/);
  assert.equal(other.model.room, null);
  console.log("Room sync passed: host, join, sides, input, denied cross-user writes, disconnect and reconnect.");
}

try {
  await check();
} finally {
  for (const room of models) room.dispose();
  await Promise.all(apps.map(app => deleteApp(app)));
}
