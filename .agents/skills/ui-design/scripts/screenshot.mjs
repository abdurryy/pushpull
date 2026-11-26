// Dev tool (not app code): saves screenshots of app routes at phone, laptop and TV sizes, so UI work can be checked by eye.
// Usage:  npm run shots -- "#/tv" "#/play/login" [--js="myModel.findWeather()"]
// Options: --click="Enter controller" presses a button by its text first (repeat it for more, in order)
//          --name=controller saves this run in its own folder (default: named after the first route)
// Needs:  the dev server running (npm run dev) and Playwright's browser (see SKILL.md, step 5).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080/";
const FOLDER = join(tmpdir(), "pushpull-screenshots");

// The sizes our players use: phones in both directions, a laptop as the shared screen, and a TV.
const SIZES = [
  { name: "phone-small", width: 360, height: 640, phone: true },
  { name: "phone", width: 390, height: 844, phone: true },
  { name: "phone-sideways", width: 844, height: 390, phone: true },
  { name: "laptop", width: 1280, height: 720, phone: false },
  { name: "tv", width: 1920, height: 1080, phone: false },
];

// require() also finds a Playwright that is installed globally, which import() does not.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    console.error("Playwright is missing. Run: npm install && npx playwright install chromium");
    process.exit(1);
  }
}

// Splits the command line into routes and options: a script to run in the page, buttons to press, a folder name.
function readArguments(args) {
  const options = { routes: [], pageScript: "", clicks: [], name: "" };
  for (const arg of args) {
    if (arg.startsWith("--js=")) {
      options.pageScript = arg.slice("--js=".length);
    } else if (arg.startsWith("--click=")) {
      options.clicks.push(arg.slice("--click=".length));
    } else if (arg.startsWith("--name=")) {
      options.name = arg.slice("--name=".length);
    } else {
      options.routes.push(arg);
    }
  }
  if (options.routes.length === 0) options.routes.push("#/");
  return options;
}

// "#/play/controller" becomes "play-controller", safe as a file or folder name.
function safeName(text) {
  return text.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "home";
}

function fileName(route, size) {
  return safeName(route) + "_" + size.name + ".png";
}

// Presses buttons by their visible text, in order, to reach a state a model action can't (like the fullscreen controller).
// A button that isn't shown at this size is skipped: the controller hides its setup in portrait, and that picture still helps.
async function pressButtons(page, clicks, size) {
  for (const text of clicks) {
    try {
      await page.getByRole("button", { name: text, exact: true }).first().click({ timeout: 3000 });
    } catch {
      console.log('  note: no "' + text + '" button to press at ' + size.name + ", so this picture shows the screen before it");
    }
  }
}

// Runs in the page: how far the content reaches compared with the window.
function measurePageCB() {
  return {
    scrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
    scrollsDown: document.documentElement.scrollHeight > window.innerHeight,
  };
}

async function waitForFontsCB() {
  await document.fonts.ready;
}

async function screenshotRoute(browser, route, size, options, folder) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    isMobile: size.phone,
    hasTouch: size.phone,
    // tokens.css turns every animation off for reduced motion, so the picture is never mid-animation.
    reducedMotion: "reduce",
  });

  function pageErrorACB(error) {
    console.log("  page error at " + size.name + ": " + error.message);
  }
  page.on("pageerror", pageErrorACB);

  await page.goto(new URL(route, BASE_URL).href, { waitUntil: "load" });
  await page.evaluate(waitForFontsCB);
  await pressButtons(page, options.clicks, size);
  if (options.pageScript) await page.evaluate(options.pageScript);
  // Give React and any quick API answer a moment to show up.
  await page.waitForTimeout(800);

  const path = join(folder, fileName(route, size));
  await page.screenshot({ path, fullPage: true });
  const measured = await page.evaluate(measurePageCB);
  await page.close();

  console.log(path);
  if (measured.scrollsSideways) console.log("  warning: the page scrolls sideways at " + size.name);
  // Fine for normal pages, but TV views must fit the screen.
  if (!size.phone && measured.scrollsDown) console.log("  note: the page scrolls down at " + size.name + " (a bug if this is a TV view)");
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  // Each run gets its own folder, so the pictures of two scenarios never mix or overwrite each other.
  const folder = join(FOLDER, safeName(options.name || options.routes[0]));
  mkdirSync(folder, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const route of options.routes) {
      for (const size of SIZES) {
        await screenshotRoute(browser, route, size, options, folder);
      }
    }
  } catch (error) {
    if (error.message.includes("ERR_CONNECTION_REFUSED")) {
      console.error("Can't reach " + BASE_URL + ". Start the dev server with: npm run dev");
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
