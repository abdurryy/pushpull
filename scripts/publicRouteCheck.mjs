// Browser smoke test: follow the public entry links and start a local Double Snake round.
import { chromium } from "playwright";
import { createServer } from "vite";

async function openFromHome(page, baseUrl, path, linkName) {
  console.log(`Checking ${path}`);
  await page.goto(baseUrl);
  await page.getByRole("link", { name: linkName }).click();
  await page.waitForURL(new URL(path, baseUrl).href);
}

async function checkRoutes(page, baseUrl) {
  console.log("Checking /");
  await page.goto(baseUrl);
  await page.getByRole("heading", { level: 1, name: /Two friends.*One snake/ }).waitFor();

  await openFromHome(page, baseUrl, "/demo", /^Keyboard demo$/);
  await page.getByRole("img", { name: "Empty game board" }).waitFor();
  await page.getByRole("button", { name: "Start round", exact: true }).click();
  await page.getByRole("status").getByText("Round 1", { exact: true }).waitFor();

  await openFromHome(page, baseUrl, "/components", /^Component gallery$/);
  await page.getByRole("heading", { level: 1, name: "Test components and sound" }).waitFor();

  await openFromHome(page, baseUrl, "/play/login", /^Use phone\b/);
  await page.getByRole("button", { name: "Continue with Google", exact: true }).waitFor();

  console.log("All four public routes passed and the demo round started.");
}

// Ignore local .env files and inherited settings that could enable Firebase.
process.env.VITE_FIREBASE_API_KEY = "";
process.env.VITE_USE_FIREBASE_EMULATORS = "false";
const server = await createServer({
  envDir: false,
  server: { host: "127.0.0.1", port: 0, open: false },
});

try {
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0];
  const localOrigin = new URL(baseUrl).origin;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    // The public flows work with local assets and ordinary game conditions.
    await context.route("**/*", function keepRequestsLocalACB(route) {
      const origin = new URL(route.request().url()).origin;
      return origin === localOrigin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    await checkRoutes(page, baseUrl);
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
