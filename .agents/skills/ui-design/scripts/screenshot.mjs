// Dev tool (not app code): saves screenshots of app routes at phone, laptop and TV sizes, so UI work can be checked by eye.
// Usage:  node .agents/skills/ui-design/scripts/screenshot.mjs "#/tv" "#/play/login" [--js="myModel.findWeather()"]
// Needs:  the dev server running (npm run dev) and Playwright (see SKILL.md, step 5).
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
    console.error("Playwright is missing. Run: npm install --no-save playwright && npx playwright install chromium");
    process.exit(1);
  }
}

// Splits the command line into routes and an optional script to run in the page before the screenshot.
function readArguments(args) {
  const routes = [];
  let pageScript = "";
  for (const arg of args) {
    if (arg.startsWith("--js=")) {
      pageScript = arg.slice("--js=".length);
    } else {
      routes.push(arg);
    }
  }
  if (routes.length === 0) routes.push("#/");
  return { routes, pageScript };
}

function fileName(route, size) {
  const routeName = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
  return routeName + "_" + size.name + ".png";
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

async function screenshotRoute(browser, route, size, pageScript) {
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
  if (pageScript) await page.evaluate(pageScript);
  // Give React and any quick API answer a moment to show up.
  await page.waitForTimeout(800);

  const path = join(FOLDER, fileName(route, size));
  await page.screenshot({ path, fullPage: true });
  const measured = await page.evaluate(measurePageCB);
  await page.close();

  console.log(path);
  if (measured.scrollsSideways) console.log("  warning: the page scrolls sideways at " + size.name);
  // Fine for normal pages, but TV views must fit the screen.
  if (!size.phone && measured.scrollsDown) console.log("  note: the page scrolls down at " + size.name + " (a bug if this is a TV view)");
}

async function main() {
  const { routes, pageScript } = readArguments(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  mkdirSync(FOLDER, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const route of routes) {
      for (const size of SIZES) {
        await screenshotRoute(browser, route, size, pageScript);
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
