// Browser smoke test: one TV and four phones play a local room round and check the score.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { createServer } from "vite";

const LOGIN_RUN_ID = randomUUID();
const AUTH_EMULATOR = "http://127.0.0.1:9099";
const PLAYERS = [
  { name: "Ada", team: "A" },
  { name: "Max", team: "A" },
  { name: "Bo", team: "B" },
  { name: "Kim", team: "B" },
];

async function step(description, runACB) {
  console.log(description);
  try {
    return await runACB();
  } catch (cause) {
    throw new Error(description, { cause });
  }
}

async function signIn(page, baseUrl, route, name) {
  await page.goto(baseUrl + route);
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

async function joinTeam(browser, baseUrl, invite, player) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  context.setDefaultTimeout(15_000);
  const phone = await context.newPage();
  await signIn(phone, baseUrl, "#/play/login", player.name);
  await phone.goto(new URL(invite, baseUrl).href);
  await phone.getByRole("button", { name: "Join room" }).tap();
  await phone.getByRole("button", { name: `Team ${player.team}`, exact: true }).tap();
  await phone.getByText(`You're on Team ${player.team}.`, { exact: true }).waitFor();
  return phone;
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

async function holdStick(phone, direction, dx, dy) {
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

function waitForHostSticks(host, expected) {
  // Wait for Firebase to deliver every input before the next round can tick.
  return host.waitForFunction(function sticksArrivedACB(directions) {
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
    await signIn(host, baseUrl, "#/room/login", "Host");
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
      phones.push(await joinTeam(browser, baseUrl, invite, player));
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
    await holdStick(phones[0], "left", -40, 0);
    await holdStick(phones[1], "right", 40, 0);
    await holdStick(phones[2], "up", 0, -40);
    await holdStick(phones[3], "down", 0, 40);
    await waitForHostSticks(host, ["left", "right", "up", "down"]);
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
    await waitForHostSticks(host, [null, null, null, null]);
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

await step("Check that the local Firebase emulators are running", async function checkEmulatorsACB() {
  const response = await fetch("http://127.0.0.1:4400/emulators", { signal: AbortSignal.timeout(3000) });
  assert.equal(response.ok, true);
  const { auth, database } = await response.json();
  assert.equal(auth?.port, 9099, "Start the Firebase Auth emulator on port 9099");
  assert.equal(database?.port, 9000, "Start the Realtime Database emulator on port 9000");
});

process.env.VITE_USE_FIREBASE_EMULATORS = "true";
const server = await createServer({
  envDir: false,
  server: { host: "127.0.0.1", port: 0, open: false },
});
try {
  await server.listen();
  const browser = await chromium.launch();
  try {
    await playRoom(browser, server.resolvedUrls.local[0]);
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
