// Dev tool (not app code): saves frames of an animation so an effect can be checked by eye, like a flipbook.
// It presses a button (or runs a script), then moves time forward exactly: Playwright's fake clock drives canvas drawing
// (requestAnimationFrame, performance.now) and every CSS animation is paused and moved to the same time before each picture.
// Usage:  npm run frames -- "/components" --click="Team A eats" --selector=".gallery-board"
// Options: --js="code to run instead of a click"  --times="0,60,120,200,300,450" (milliseconds)
//          --name=crash saves this run in its own folder (default: named after the button)
// Needs:  the dev server running (npm run dev) and Playwright's browser (see the ui-design skill, step 5).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080/";
const FOLDER = join(tmpdir(), "pushpull-frames");

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    console.error("Playwright is missing. Run: npm install && npx playwright install chromium");
    process.exit(1);
  }
}

// --name=value pairs, plus the route as the one argument without "--".
function readArguments(args) {
  const options = { route: "/", click: "", js: "", selector: "", times: "0,60,120,200,300,450", name: "" };
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.*)$/);
    if (match) options[match[1]] = match[2];
    else options.route = arg;
  }
  options.times = options.times.split(",").map(Number);
  return options;
}

// "Team A eats" becomes "team-a-eats", safe as a folder name.
function safeName(text) {
  return text.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "frames";
}

// Runs in the page: hold every running animation still at the given time.
function seekAnimationsCB(milliseconds) {
  document.getAnimations().forEach(function seekCB(animation) {
    animation.pause();
    animation.currentTime = milliseconds;
  });
}

async function trigger(page, options) {
  if (options.click) await page.getByRole("button", { name: options.click, exact: true }).click();
  // ";undefined" makes the script return nothing, so a returned promise that waits for the paused clock can't hang us.
  if (options.js) await page.evaluate(options.js + ";undefined");
}

async function picture(page, options, path) {
  const target = options.selector ? page.locator(options.selector).first() : page;
  await target.screenshot({ path });
  console.log(path);
}

async function openPage(browser, options, reducedMotion) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion });
  await page.clock.install();
  await page.goto(new URL(options.route, BASE_URL).href, { waitUntil: "load" });
  await page.evaluate(async function waitForFontsCB() { await document.fonts.ready; });
  if (options.selector) await page.locator(options.selector).first().scrollIntoViewIfNeeded();
  // Stop the clock: screenshots take real time, and a running clock would make every frame late.
  const start = await page.evaluate(function nowCB() { return Date.now(); });
  await page.clock.pauseAt(start + 500);
  // Let the page draw its first frames before the effect starts.
  await page.clock.runFor(300);
  return page;
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  if (!options.click && !options.js) {
    console.error('Say what starts the effect: --click="Button name" or --js="code".');
    process.exit(1);
  }
  const { chromium } = loadPlaywright();
  // Each run gets its own folder, so the frames of two effects never mix or overwrite each other.
  const folder = join(FOLDER, safeName(options.name || options.click));
  mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch();
  try {
    // With motion: one frame per time.
    const page = await openPage(browser, options, "no-preference");
    await trigger(page, options);
    let elapsed = 0;
    for (const time of options.times) {
      await page.clock.runFor(Math.max(0, time - elapsed));
      elapsed = Math.max(elapsed, time);
      await page.evaluate(seekAnimationsCB, time);
      await picture(page, options, join(folder, "frame-" + String(time).padStart(4, "0") + "ms.png"));
    }
    // With reduced motion: the effect should add nothing on top of the normal change.
    const calmPage = await openPage(browser, options, "reduce");
    await trigger(calmPage, options);
    await calmPage.clock.runFor(100);
    await picture(calmPage, options, join(folder, "frame-reduced-motion.png"));
  } catch (error) {
    const offline = error.message.includes("ERR_CONNECTION_REFUSED");
    console.error(offline ? "Can't reach " + BASE_URL + ". Start the dev server with: npm run dev" : error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
