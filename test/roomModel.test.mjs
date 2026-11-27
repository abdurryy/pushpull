// Model tests: the lobby's team grouping and Start round rules, with a fake room service instead of Firebase.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeAutoObservable } from "mobx";
import { makeRoomModel } from "../src/model/RoomModel.js";

// A stand-in for roomSync.js: always online, and the test hands the model room data itself.
function fakeSync() {
  return {
    available: true,
    watchConnection(receive) { receive(true); return function stopCB() {}; },
    async createRoom() { return "K7M4"; },
    watchRoom() { return function stopCB() {}; },
    trackInputDisconnect() { return Promise.resolve(); },
    clearInput() { return Promise.resolve(); },
  };
}

async function hostWithPlayers(players) {
  const session = makeAutoObservable({ user: { uid: "host", name: "Host" } });
  const { model } = makeRoomModel(fakeSync(), session);
  await model.createRoom();
  model.receiveRoom({ code: "K7M4", meta: { hostUid: "host" }, players });
  return model;
}

function player(name, side, seat) {
  return { name, side, seat };
}

test("teams group players by side in seat order", async function () {
  const model = await hostWithPlayers({
    kim: player("Kim", "b", "s4"),
    ada: player("Ada", "a", "s1"),
    bo: player("Bo", "b", "s3"),
    max: player("Max", "center", "s2"),
  });
  assert.deepEqual(model.teams.a.map(function nameCB(p) { return p.name; }), ["Ada"]);
  assert.deepEqual(model.teams.b.map(function nameCB(p) { return p.name; }), ["Bo", "Kim"]);
  assert.deepEqual(model.teams.center.map(function nameCB(p) { return p.name; }), ["Max"]);
});

test("Start round explains what is missing", async function () {
  const empty = await hostWithPlayers({});
  assert.equal(empty.startBlockedReason, "Waiting for 2 more players on Team A and 2 on Team B…");

  const oneShort = await hostWithPlayers({
    ada: player("Ada", "a", "s1"), max: player("Max", "a", "s2"), bo: player("Bo", "b", "s3"),
  });
  assert.equal(oneShort.startBlockedReason, "Waiting for 1 more player on Team B…");

  const crowded = await hostWithPlayers({
    ada: player("Ada", "a", "s1"), max: player("Max", "a", "s2"), kim: player("Kim", "a", "s4"), bo: player("Bo", "b", "s3"),
  });
  assert.equal(crowded.startBlockedReason, "Team A has 3 players. One of them needs to switch to Team B.");
});

test("Start round works only with two full teams", async function () {
  const notReady = await hostWithPlayers({ ada: player("Ada", "a", "s1") });
  notReady.startRound();
  assert.equal(notReady.roundStarting, false);

  const ready = await hostWithPlayers({
    ada: player("Ada", "a", "s1"), max: player("Max", "a", "s2"), bo: player("Bo", "b", "s3"), kim: player("Kim", "b", "s4"),
  });
  assert.equal(ready.startBlockedReason, null);
  ready.startRound();
  assert.equal(ready.roundStarting, true);
});

test("a room that is gone blocks Start round", async function () {
  const model = await hostWithPlayers({});
  model.receiveRoom(null);
  assert.equal(model.startBlockedReason, "Create a room first.");
});
