// Model: reserves a test run and follows its progress in the host room.
import { makeAutoObservable, reaction } from "mobx";
import { normalizeRoomCode, validRoomCode } from "../persistence/roomSync.js";

const STEPS = {
  ready: "Four test players are seated. Keep the host room open on the TV.",
  cancelling: "Both teams push opposite ways.",
  moving: "Both teams steer together.",
  finishing: "Team A turns into its own body.",
  passed: "Passed. Team B won 0–1.",
  failed: "The TV reported an unexpected result. Check the game board.",
};

function testError(error) {
  return error.code ? "Could not update the test. Check your connection and try again." : error.message;
}

export function makeTestSuiteModel(sync, app) {
  let connectionVersion = 0;
  const model = makeAutoObservable({
    available: sync.available,
    connected: false,
    code: "",
    pending: false,
    run: null,
    steps: [],
    status: "idle",
    error: null,

    setCode(text) {
      this.code = normalizeRoomCode(text).replace(/[^A-Z0-9]/g, "").slice(0, 4);
      this.error = null;
    },

    setConnected(connected) {
      if (this.connected && !connected) connectionVersion += 1;
      this.connected = connected;
    },

    finish(status, error = null) {
      this.status = status;
      this.error = error;
      this.run = null;
    },

    receiveRoom(room) {
      if (!this.run) return;
      const test = room?.testRun;
      if (test?.id !== this.run.id || !test.live?.[test.id]) {
        if (this.pending) return;
        this.finish("failed", "The connection to the test room ended. Open a room and try again.");
        return;
      }
      if (this.status === test.phase) return;
      this.steps.push(STEPS[test.phase]);
      if (test.phase === "passed" || test.phase === "failed") {
        this.finish(test.phase);
      } else {
        this.status = test.phase;
      }
    },

    async start() {
      if (!this.connected || this.pending || this.run || !app.user) return;
      if (!validRoomCode(this.code)) {
        this.error = "Enter the four characters shown on the TV.";
        return;
      }
      const uid = app.user.uid;
      const version = connectionVersion;
      this.pending = true;
      this.steps = [];
      this.error = null;
      this.status = "starting";
      try {
        const run = await sync.startTestRun(this.code, uid);
        if (version !== connectionVersion || uid !== app.user?.uid) {
          await sync.stopTestRun(run.code, run.id);
          throw new Error("The connection changed. Start the test again.");
        }
        this.trackRun(run);
      } catch (error) {
        this.finish("failed", testError(error));
      } finally {
        this.setPending(false);
      }
    },

    setPending(pending) { this.pending = pending; },
    trackRun(run) { this.run = run; },

    async stop() {
      if (!this.run || this.pending || !this.connected) return;
      const { code, id } = this.run;
      this.pending = true;
      try {
        await sync.stopTestRun(code, id);
        this.finish("stopped");
      } catch (error) {
        this.setStopError(error);
      } finally {
        this.setPending(false);
      }
    },

    setStopError(error) { this.error = testError(error); },
  }, {}, { autoBind: true });

  const stopConnection = sync.watchConnection(model.setConnected);
  let stopRoom;
  let expiry;
  const stopRunWatch = reaction(function runACB() { return model.run; }, function watchACB(run) {
    stopRoom?.();
    clearTimeout(expiry);
    if (!run) return;
    stopRoom = sync.watchRoom(run.code, model.receiveRoom, function roomErrorACB(error) {
      model.finish("failed", testError(error));
    });
    expiry = setTimeout(function expireACB() {
      model.finish("failed", "The test expired. Start a new run when the TV is ready.");
    }, Math.max(0, run.expiresAt - Date.now()));
  });

  return {
    model,
    dispose() {
      stopConnection();
      stopRunWatch();
      stopRoom?.();
      clearTimeout(expiry);
    },
  };
}
