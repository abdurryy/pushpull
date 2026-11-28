// Browser QA: run a local scoreboard regression or drive four phones in an operator's room.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { createServer } from "vite";
import { normalizeRoomCode, validRoomCode } from "../src/persistence/roomSync.js";

const LOGIN_RUN_ID = randomUUID();
const AUTH_EMULATOR = "http://127.0.0.1:9099";
const PLAYERS = [
  { name: "Ada", team: "A" },
  { name: "Max", team: "A" },
  { name: "Bo", team: "B" },
  { name: "Kim", team: "B" },
];
const STICK_OFFSETS = { left: [-40, 0], right: [40, 0], up: [0, -40], down: [0, 40] };
const ACTIONS = { Dash: "dash", Ping: "ping", Shed: "shed", "Hold up": "hold" };
const USAGE = `Usage:
  npm run test:room
  npm run test:room -- --room CODE [--headed]
  npm run test:room -- --room CODE --preview-url https://YOUR_PREVIEW.web.app`;

async function step(description, runACB) {
  console.log(description);
  try {
    return await runACB();
  } catch (cause) {
    throw new Error(description, { cause });
  }
}

async function signInEmulator(page, baseUrl, route, name) {
  await page.goto(new URL(route, baseUrl).href);
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Continue with Google" }).click(),
  ]);
  await popup.waitForURL(AUTH_EMULATOR + "/**");
  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup.locator("#email-input").fill(`${name.toLowerCase()}-${LOGIN_RUN_ID}@example.test`);
  await popup.locator("#display-name-input").fill(name);
  await popup.getByRole("button", { name: "Sign in with Google" }).click();
  await page.getByText(`Signed in as ${name}`, { exact: true }).waitFor();
}

async function openPhone(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  context.setDefaultTimeout(15_000);
  return context.newPage();
}

async function expectRoomResult(phone, success) {
  const error = phone.getByRole("alert");
  await success.or(error).first().waitFor();
  if (await error.isVisible()) throw new Error(await error.innerText());
}

async function joinTeam(phone, baseUrl, invite, player) {
  await phone.goto(new URL(invite, baseUrl).href);
  await phone.getByRole("button", { name: "Join room" }).tap();
  await expectRoomResult(phone, phone.getByRole("heading", { name: "Pick a side" }));
  const team = phone.getByRole("button", { name: `Team ${player.team}`, exact: true });
  // The last seat can fill between reading the roster and tapping the button.
  const fullTeam = team.and(phone.locator('[data-full="true"]'));
  const availableTeam = team.and(phone.locator(":enabled"));
  await expectRoomResult(phone, availableTeam.or(fullTeam));
  if (await fullTeam.isVisible()) throw new Error(`Team ${player.team} is full.`);
  try {
    await team.tap({ timeout: 3_000 });
  } catch (error) {
    if (await fullTeam.isVisible()) throw new Error(`Team ${player.team} is full.`);
    throw error;
  }
  await expectRoomResult(phone, phone.getByText(`You're on Team ${player.team}.`, { exact: true }));
}

async function openController(phone, player, code) {
  await phone.getByRole("link", { name: "Open controller" }).tap();
  await phone.setViewportSize({ width: 844, height: 390 });
  await phone.getByRole("button", { name: "Enter controller" }).tap();
  const fallback = phone.getByRole("button", { name: "Continue in browser" });
  const stick = phone.getByRole("group", { name: "Joystick: idle" });
  await stick.or(fallback).first().waitFor();
  if (await fallback.isVisible()) await fallback.tap();
  await stick.waitFor();
  await phone.getByRole("status").getByText(`Team ${player.team} · ${code}`, { exact: true }).waitFor();
}

async function holdStick(phone, direction) {
  const [dx, dy] = STICK_OFFSETS[direction];
  const stick = phone.getByRole("group", { name: "Joystick: idle" });
  const { x, y, width, height } = await stick.boundingBox();
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  await phone.mouse.move(centerX, centerY);
  await phone.mouse.down();
  await phone.mouse.move(centerX + dx, centerY + dy);
  await phone.getByRole("group", { name: `Joystick: ${direction}` }).waitFor();
}

async function expectScore(host, scoreA, scoreB) {
  await host.getByText(`Team A ${scoreA}`, { exact: true }).waitFor();
  await host.getByText(`Team B ${scoreB}`, { exact: true }).waitFor();
}

function waitForRoomSticks(page, expected) {
  // The room's Firebase subscription receives every player's stick on the TV and phones.
  return page.waitForFunction(function sticksArrivedACB(directions) {
    return window.roomModel.steering.every(function matchesCB(stick, index) {
      return stick === directions[index];
    });
  }, expected);
}

async function playRoom(browser, baseUrl) {
  const host = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  host.setDefaultTimeout(15_000);
  const rosterA = host.getByRole("region", { name: "Team A" });
  const rosterB = host.getByRole("region", { name: "Team B" });
  const boardLink = host.getByRole("link", { name: "Open game board" });

  const invite = await step("Create a fresh room with both teams empty", async function createRoomACB() {
    await signInEmulator(host, baseUrl, "/room/login", "Host");
    await host.getByRole("link", { name: "Continue to host a room" }).click();
    await host.getByRole("button", { name: "Create room" }).click();
    await rosterA.getByText("0 of 2").waitFor();
    await rosterB.getByText("0 of 2").waitFor();
    assert.equal(await boardLink.count(), 0, "The board opened before any players joined");
    const href = await host.getByRole("link", { name: "Open phone invite" }).getAttribute("href");
    assert.match(href, /^\/play\/join\?code=[A-Z2-9]{4}$/);
    return href;
  });
  const code = invite.slice(-4);

  const phones = [];
  for (const player of PLAYERS) {
    await step(`Join ${player.name} on Team ${player.team}`, async function joinACB() {
      const phone = await openPhone(browser);
      await signInEmulator(phone, baseUrl, "/play/login", player.name);
      await joinTeam(phone, baseUrl, invite, player);
      phones.push(phone);
      const roster = player.team === "A" ? rosterA : rosterB;
      await roster.getByText(player.name, { exact: true }).waitFor();
      if (phones.length < PLAYERS.length) {
        assert.equal(await boardLink.count(), 0, `The board opened with only ${phones.length} players`);
      }
    });
  }

  await step("Open the game board and all four controllers", async function openBoardACB() {
    await rosterA.getByText("2 of 2").waitFor();
    await rosterB.getByText("2 of 2").waitFor();
    await boardLink.click();
    await host.getByRole("img", { name: "Empty game board" }).waitFor();
    for (const [index, phone] of phones.entries()) {
      await openController(phone, PLAYERS[index], code);
    }
  });

  await step("Start at 0–0 and verify that opposite inputs cancel on both teams", async function startRoundACB() {
    await holdStick(phones[0], "left");
    await holdStick(phones[1], "right");
    await holdStick(phones[2], "up");
    await holdStick(phones[3], "down");
    await waitForRoomSticks(host, ["left", "right", "up", "down"]);
    await host.getByRole("button", { name: "Start round" }).click();
    await host.getByText("Round 1", { exact: true }).waitFor();
    await expectScore(host, 0, 0);
    await host.getByText("Team A stopped. Team B stopped.", { exact: true }).waitFor();
  });

  await step("Crash Team A and check that Team B wins 0–1", async function finishRoundACB() {
    // Releasing Team A's right stick lets its partner steer left into the snake's neck.
    await phones[1].mouse.up();
    await host.getByText("Team B wins the round!", { exact: true }).waitFor();
    await expectScore(host, 0, 1);
  });

  await step("Replay and check that the 0–1 score carries into Round 2", async function replayACB() {
    await Promise.all([phones[0].mouse.up(), phones[2].mouse.up(), phones[3].mouse.up()]);
    await waitForRoomSticks(host, [null, null, null, null]);
    await host.getByRole("button", { name: "Play another round" }).click();
    await host.getByText("Round 2", { exact: true }).waitFor();
    await expectScore(host, 0, 1);
  });

  await step("Close the test room", async function closeRoomACB() {
    await host.getByRole("link", { name: "Back to room" }).click();
    await host.getByRole("button", { name: "Close room" }).click();
    await host.getByRole("dialog", { name: "Close this room?" }).getByRole("button", { name: "Close room" }).click();
    await host.getByRole("button", { name: "Create room" }).waitFor();
  });
  console.log(`Room ${code} passed. Team B won 0–1 and the score carried into Round 2.`);
}

function playerStep(player, description, runACB) {
  const elapsed = ((performance.now() - player.startedAt) / 1000).toFixed(1);
  return step(`[${elapsed}s] ${player.name} (Team ${player.team}) · ${description}`, runACB);
}

async function runForPhones(players, descriptionCB, runACB) {
  // Let every in-flight action settle before cleanup moves any phone off its controller.
  const results = await Promise.allSettled(players.map(function runPlayerCB(player, index) {
    return playerStep(player, descriptionCB(index), function actACB() { return runACB(player.phone, index); });
  }));
  const errors = results.filter(function failedCB(result) { return result.status === "rejected"; });
  if (errors.length) throw new AggregateError(errors.map(function reasonCB(result) { return result.reason; }), "Phone actions failed.");
}

async function releaseStick(phone) {
  await phone.mouse.up();
  await phone.getByRole("group", { name: "Joystick: idle" }).waitFor();
}

function holdSticks(players, directions) {
  return runForPhones(players, function directionCB(index) { return `Hold ${directions[index]}`; },
    function holdACB(phone, index) { return holdStick(phone, directions[index]); });
}

function releaseSticks(players) {
  return runForPhones(players, function releaseCB() { return "Release to idle"; }, releaseStick);
}

async function playOnPhones(players, signal) {
  const [ada, max, bo, kim] = players;
  const first = [ada, bo];
  const second = [max, kim];
  const upOnly = ["up", null, "up", null];
  const idle = [null, null, null, null];

  // Both snakes start sideways. Apply up first and release down first so the only
  // possible solo input is up, even if Firebase delivers the two inputs on different ticks.
  signal.throwIfAborted();
  await holdSticks(first, ["up", "up"]);
  await waitForRoomSticks(max.phone, upOnly);
  signal.throwIfAborted();
  await holdSticks(second, ["down", "down"]);
  await waitForRoomSticks(ada.phone, ["up", "down", "up", "down"]);
  await delay(1_500, undefined, { signal });
  await releaseSticks(second);
  await waitForRoomSticks(ada.phone, upOnly);
  await releaseSticks(first);
  await waitForRoomSticks(max.phone, idle);

  signal.throwIfAborted();
  const matching = ["right", "right", "left", "left"];
  await holdSticks(players, matching);
  await waitForRoomSticks(ada.phone, matching);
  // Pulse the matching directions so the snakes stop before reaching one another.
  await delay(500, undefined, { signal });
  await releaseSticks(players);
  await waitForRoomSticks(ada.phone, idle);

  signal.throwIfAborted();
  const labels = Object.keys(ACTIONS);
  await runForPhones(players, function actionCB(index) { return `Tap ${labels[index]}`; }, async function tapACB(phone, index) {
    await phone.getByRole("button", { name: labels[index], exact: true }).tap();
    // Read the action on the next phone. Its snapshot only holds writes the server accepted,
    // while the tapping phone also shows its own writes before the server answers.
    const observer = players[(index + 1) % players.length].phone;
    await observer.waitForFunction(function buttonArrivedACB({ uid, button }) {
      return window.roomModel.room?.inputs?.[uid]?.button === button;
    }, { uid: players[index].uid, button: ACTIONS[labels[index]] });
  });
}

async function confirmRoundStayedActive(ask) {
  // The phones cannot see the TV's round, so the operator confirms it did not end during the taps.
  const answer = await ask("Was the round still running on the TV after the four action taps? Type y and press Enter, or n if it ended: ");
  if (answer.trim().toLowerCase() !== "y") {
    throw new Error("The operator reported that the round ended before the action taps finished.");
  }
}

async function confirmPhoneAccount(phone, uid) {
  await phone.waitForFunction(function checkedACB() { return window.myModel?.authChecked === true; });
  const currentUid = await phone.evaluate(function accountACB() { return window.roomModel.user?.uid; });
  assert.equal(currentUid, uid, "The original test account must be signed in to release its seat.");
}

async function leavePlayer({ phone, uid }, inviteUrl, code) {
  await phone.mouse.up();
  // The controller link added a history entry. Going back keeps the joined room in memory.
  if (new URL(phone.url()).pathname === "/play/room-controller") await phone.goBack();
  const leave = phone.getByRole("button", { name: "Leave room" });
  const joinForm = phone.getByRole("button", { name: /^(Join room|Try again)$/ });
  const onJoin = new URL(phone.url()).pathname === "/play/join";
  if (onJoin) {
    await confirmPhoneAccount(phone, uid);
    await leave.or(joinForm).first().waitFor();
  }
  if (!onJoin || !(await leave.isVisible())) {
    // A reload or a failed input registration can hide the join state while Firebase still holds the seat.
    await phone.goto(inviteUrl);
    await confirmPhoneAccount(phone, uid);
    await phone.getByRole("button", { name: "Join room", exact: true }).tap();
    const error = phone.getByRole("alert");
    await leave.or(error).first().waitFor();
    if (!(await leave.isVisible())) {
      const reason = await error.innerText();
      // The server checks existing membership before rejecting a full or reserved room.
      if (reason.startsWith(`No room with code ${code}.`) || reason.startsWith("This room is full.")
        || reason.startsWith("The host is testing this room.")) return;
      throw new Error(`Could not confirm the test seat was released. ${reason}`);
    }
  }
  await leave.tap();
  await expectRoomResult(phone, joinForm.and(phone.locator(":enabled")));
}

async function saveFailure(players) {
  const recorded = players.filter(function tracedCB(player) { return player.tracing; });
  if (!recorded.length) return;
  const folder = await mkdtemp(join(tmpdir(), "pushpull-room-"));
  console.error(`Failure screenshots and traces: ${folder}`);
  await Promise.all(recorded.map(async function savePlayerCB({ name, phone }) {
    const results = await Promise.allSettled([
      phone.screenshot({ path: join(folder, `${name}.png`), timeout: 3_000 }),
      phone.context().tracing.stop({ path: join(folder, `${name}.zip`) }),
    ]);
    for (const result of results) {
      if (result.status === "rejected") console.error(`Could not save a diagnostic for ${name}: ${result.reason.message}`);
    }
  }));
}

async function signInPhones(browser, baseUrl, hosted, startedAt, ask) {
  const players = [];
  const usedAccounts = new Set();
  for (const seat of PLAYERS) {
    const phone = await openPhone(browser);
    const player = { ...seat, phone, startedAt, tracing: false };
    await playerStep(player, "Sign in", async function signInACB() {
      if (hosted) {
        await phone.goto(new URL("/play/login", baseUrl).href);
        await phone.bringToFront();
        await ask(`In the browser, sign in with the designated ${player.name} test account using Continue with Google, then press Enter. `);
        await expectRoomResult(phone, phone.getByRole("link", { name: "Continue to join a room" }));
      } else {
        await signInEmulator(phone, baseUrl, "/play/login", player.name);
      }
      const uid = await phone.evaluate(function accountACB() { return window.roomModel.user?.uid; });
      assert.ok(uid && !usedAccounts.has(uid), "Each seat needs its own signed-in test account.");
      usedAccounts.add(uid);
      player.uid = uid;
    });
    players.push(player);
  }
  return players;
}

async function playOperatorRoom(browser, baseUrl, { code, hosted, headed }, signal, ask) {
  const startedAt = performance.now();
  const invite = `/play/join?code=${code}`;
  const players = await signInPhones(browser, baseUrl, hosted, startedAt, ask);
  const attemptingJoin = [];
  let failure;
  try {
    for (const player of players) {
      signal.throwIfAborted();
      await player.phone.context().tracing.start({ screenshots: true, snapshots: true });
      player.tracing = true;
      attemptingJoin.push(player);
      await playerStep(player, `Join room ${code} and pick Team ${player.team}`,
        function joinACB() { return joinTeam(player.phone, baseUrl, invite, player); });
    }
    for (const player of players) {
      signal.throwIfAborted();
      await playerStep(player, "Open controller", async function openACB() {
        if (headed) {
          // The controller releases input on blur. Keep the four simulated phones independently focused.
          const session = await player.phone.context().newCDPSession(player.phone);
          await session.send("Emulation.setFocusEmulationEnabled", { enabled: true });
        }
        await openController(player.phone, player, code);
      });
    }
    await ask(`Start the round on your TV for room ${code}, then press Enter to send inputs. `);
    await playOnPhones(players, signal);
    await confirmRoundStayedActive(ask);
    signal.throwIfAborted();
  } catch (error) {
    failure = error;
    await Promise.allSettled(attemptingJoin.map(function releaseCB({ phone }) { return phone.mouse.up(); }));
    await saveFailure(players).catch(function reportACB(diagnosticError) { console.error(diagnosticError.message); });
  }

  try {
    const inviteUrl = new URL(invite, baseUrl).href;
    await runForPhones(attemptingJoin, function leaveCB() { return "Release input and leave room"; },
      function leaveACB(phone, index) { return leavePlayer(attemptingJoin[index], inviteUrl, code); });
  } catch (error) {
    if (!failure) await saveFailure(players).catch(function reportACB(diagnosticError) { console.error(diagnosticError.message); });
    throw new AggregateError([failure, error].filter(Boolean), `Could not confirm that every test player left room ${code}.`);
  }
  if (failure) throw failure;
  signal.throwIfAborted();
  console.log(`Room ${code} completed the controller scenario. All four test seats were released.`);
}

async function checkEmulators() {
  const response = await fetch("http://127.0.0.1:4400/emulators", { signal: AbortSignal.timeout(3000) });
  assert.equal(response.ok, true);
  const { auth, database } = await response.json();
  assert.equal(auth?.port, 9099, "Start the Firebase Auth emulator on port 9099");
  assert.equal(database?.port, 9000, "Start the Realtime Database emulator on port 9000");
}

async function startEmulatorSite() {
  await step("Check that the local Firebase emulators are running", checkEmulators);
  process.env.VITE_USE_FIREBASE_EMULATORS = "true";
  // Vite's standalone server exits on SIGTERM or stdin EOF. Keep it serving while phones leave.
  const vite = await createServer({
    envDir: false,
    server: { middlewareMode: true, ws: false },
  });
  const server = createHttpServer(vite.middlewares);
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
  } catch (error) {
    await vite.close();
    throw error;
  }
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    async close() {
      server.close();
      await vite.close();
    },
  };
}

async function main() {
  const { values } = parseArgs({ options: {
    room: { type: "string" },
    "preview-url": { type: "string" },
    headed: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log(USAGE);
    return;
  }
  const code = values.room === undefined ? null : normalizeRoomCode(values.room);
  if (code !== null && !validRoomCode(code)) throw new Error("Enter a valid four-character room code with --room.");
  const hosted = values["preview-url"] !== undefined;
  let previewUrl;
  if (hosted) {
    assert.ok(code, "--preview-url requires --room.");
    const url = new URL(values["preview-url"]);
    assert.ok(url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash,
      "Use the HTTPS preview URL without credentials, query parameters, or a hash route.");
    previewUrl = url.href;
  }
  const headed = hosted || values.headed;
  const server = hosted ? null : await startEmulatorSite();
  const baseUrl = previewUrl ?? server.url;
  try {
    if (!code) {
      const browser = await chromium.launch({ headless: !headed });
      try {
        await playRoom(browser, baseUrl);
      } finally {
        await browser.close();
      }
    } else {
      await runOperatorBrowser(baseUrl, { code, hosted, headed });
    }
  } finally {
    await server?.close();
  }
}

async function runOperatorBrowser(baseUrl, options) {
  const interrupt = new AbortController();
  function stopACB() { interrupt.abort(new Error("Room playtest interrupted.")); }
  const input = createInterface({ input: process.stdin, output: process.stdout });
  input.on("SIGINT", stopACB);
  input.on("close", stopACB);
  process.on("SIGINT", stopACB);
  process.on("SIGTERM", stopACB);
  process.on("SIGBREAK", stopACB);
  let browser;
  try {
    browser = await chromium.launch({
      channel: options.hosted ? "chrome" : undefined,
      headless: !options.headed,
      handleSIGINT: false,
      handleSIGTERM: false,
    });
    async function ask(question) {
      try {
        return await input.question(question, { signal: interrupt.signal });
      } finally {
        interrupt.signal.throwIfAborted();
      }
    }
    await playOperatorRoom(browser, baseUrl, options, interrupt.signal, ask);
  } finally {
    process.off("SIGINT", stopACB);
    process.off("SIGTERM", stopACB);
    process.off("SIGBREAK", stopACB);
    input.close();
    await browser?.close();
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
