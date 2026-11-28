// Model data: the four seats, inputs and expected board checks for the room test.
export const TEST_TEAMS = {
  a: [{ id: "test-a1", name: "Test A1" }, { id: "test-a2", name: "Test A2" }],
  b: [{ id: "test-b1", name: "Test B1" }, { id: "test-b2", name: "Test B2" }],
  center: [],
};

const CANCEL_TICKS = 8;
const MOVE_END_TICK = 12;
const FINISH_TICK = MOVE_END_TICK + 1;

export function testSticks(ticks) {
  if (ticks < CANCEL_TICKS) return ["left", "right", "left", "right"];
  if (ticks < MOVE_END_TICK) return ["up", "up", "up", "up"];
  return ["down", "down", "left", "right"];
}

function headsAt(round, row) {
  return round.a.body[0].x === 4 && round.a.body[0].y === row
    && round.b.body[0].x === 15 && round.b.body[0].y === row;
}

export function checkTestRound(round, ticks) {
  if (round.outcome || ticks >= FINISH_TICK) {
    return ticks === FINISH_TICK && round.outcome === "b" && round.score.a === 0 && round.score.b === 1
      ? "passed" : "failed";
  }
  if (ticks === CANCEL_TICKS) return headsAt(round, 6) ? "moving" : "failed";
  if (ticks === MOVE_END_TICK) return headsAt(round, 2) ? "finishing" : "failed";
  return null;
}
