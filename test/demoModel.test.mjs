// Model test: an interrupted hosted round preserves the score from completed rounds.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeAutoObservable, runInAction } from "mobx";
import { demoModel } from "../src/model/DemoModel.js";

test("host loss discards the round and the lobby can start it again", function () {
  const room = makeAutoObservable({
    code: "K7M4",
    canStart: true,
    reconnectingHost: false,
    steering: ["left", null, null, null],
  });

  try {
    demoModel.startRound(null, room);
    demoModel.tick();
    assert.equal(demoModel.round.outcome, "b");
    assert.deepEqual(demoModel.round.score, { a: 0, b: 1 });

    runInAction(function releaseSteeringACB() {
      room.steering = [null, null, null, null];
    });
    demoModel.startRound(null, room);
    assert.equal(demoModel.roundNumber, 2);

    runInAction(function disconnectHostACB() {
      room.reconnectingHost = true;
      room.canStart = false;
      demoModel.deadline = performance.now() - 1;
    });
    demoModel.tick();
    assert.equal(demoModel.playing, false);
    assert.equal(demoModel.round, null);
    assert.deepEqual(demoModel.events, []);
    assert.deepEqual(demoModel.interruptedRoomRound.score, { a: 0, b: 1 });

    // The view unmounts when the host returns to the lobby.
    demoModel.leaveDemo();
    runInAction(function reconnectHostACB() {
      room.reconnectingHost = false;
      room.canStart = true;
    });
    demoModel.startRound(null, room);
    assert.equal(demoModel.roundNumber, 2);
    assert.deepEqual(demoModel.round.score, { a: 0, b: 1 });
    assert.equal(demoModel.interruptedRoomRound, null);
  } finally {
    demoModel.leaveDemo();
  }
});
