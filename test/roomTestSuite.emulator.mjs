// Integration check: exercise test-run permissions and reservation cleanup on the local database emulator.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { deleteApp, initializeApp } from "firebase/app";
import { connectDatabaseEmulator, get, getDatabase, goOffline, ref, set, update } from "firebase/database";
import { makeAutoObservable, when } from "mobx";
import { makeRoomModel } from "../src/model/RoomModel.js";
import { makeRoomSync } from "../src/persistence/roomSync.js";

const PROJECT = "demo-pushpull";
const NS = PROJECT + "-default-rtdb";
const apps = [];

function client(uid) {
  const app = initializeApp({ projectId: PROJECT, databaseURL: `https://${NS}.firebaseio.com` }, randomUUID());
  apps.push(app);
  const db = getDatabase(app);
  connectDatabaseEmulator(db, "127.0.0.1", 9000, { mockUserToken: { sub: uid } });
  return { db, sync: makeRoomSync(db) };
}

async function seed(path, value) {
  const response = await fetch(`http://127.0.0.1:9000/${path}.json?ns=${NS}`, {
    method: "PUT",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  assert.equal(response.ok, true, await response.text());
}

const uid = randomUUID();
const otherUid = randomUUID();
const host = client(uid);
const panel = client(uid);
const guest = client(otherUid);
const session = makeAutoObservable({ user: { uid } });
const { model, dispose } = makeRoomModel(host.sync, session);

try {
  await when(() => model.connected, { timeout: 6000 });
  await model.createRoom();
  await when(() => model.room?.hostOnline === true, { timeout: 6000 });
  const code = model.code;
  const path = `rooms/${code}`;
  const runRef = ref(panel.db, `${path}/testRun`);
  const id = randomUUID();
  const proposed = { id, expiresAt: Date.now() + 60_000, phase: "ready", live: { [id]: true } };

  await assert.rejects(panel.sync.startTestRun(code, uid), /test access/);
  await assert.rejects(set(runRef, proposed), /permission.denied/i);
  await assert.rejects(set(ref(panel.db, `roomTesters/${uid}`), true), /permission.denied/i);
  await seed(`roomTesters/${uid}`, true);
  await seed(`roomTesters/${otherUid}`, true);
  await assert.rejects(set(ref(guest.db, `${path}/testRun`), proposed), /permission.denied/i);

  await guest.sync.joinRoom(code, { uid: otherUid });
  await assert.rejects(set(runRef, proposed), /permission.denied/i);
  await guest.sync.removePlayer(code, otherUid);

  const run = await panel.sync.startTestRun(code, uid);
  await when(() => model.canStart, { timeout: 6000 });
  assert.equal(model.teams.a.length, 2);
  assert.equal(model.teams.b.length, 2);
  await assert.rejects(set(runRef, proposed), /permission.denied/i);
  await assert.rejects(update(ref(guest.db, path), {
    "seats/s1": otherUid,
    [`players/${otherUid}`]: { name: "Guest", side: "center", seat: "s1" },
  }), /permission.denied/i);
  await assert.rejects(set(ref(guest.db, `${path}/testRun/live/${run.id}`), null), /permission.denied/i);

  await panel.sync.stopTestRun(code, run.id);
  await when(() => !model.canStart, { timeout: 6000 });
  const next = await panel.sync.startTestRun(code, uid);
  await panel.sync.stopTestRun(code, run.id);
  assert.equal((await get(runRef)).val().live[next.id], true);
  goOffline(panel.db);
  await when(() => model.activeTest === null, { timeout: 6000 });
  assert.equal(model.room.code, code);

  const afterDisconnect = await host.sync.startTestRun(code, uid);
  assert.equal(await host.sync.setTestPhase(code, afterDisconnect.id, "passed"), true);
  await when(() => model.activeTest === null, { timeout: 6000 });
  await guest.sync.joinRoom(code, { uid: otherUid });
  await guest.sync.removePlayer(code, otherUid);
  await seed(`${path}/meta/expiresAt`, Date.now() - 1000);
  await assert.rejects(set(ref(host.db, `${path}/testRun`), proposed), /permission.denied/i);
  assert.equal((await get(ref(host.db, path))).exists(), true);
  await host.sync.closeRoom(code);
  console.log("Room test suite rules passed: tester and owner access, empty-room reservation, stop, disconnect, expiry and seat reuse.");
} finally {
  dispose();
  await Promise.all(apps.map(function deleteClientCB(app) { return deleteApp(app); }));
}
