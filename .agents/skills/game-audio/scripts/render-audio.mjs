// Dev tool (not app code): renders every sound effect and music track to WAV files and prints how loud each one is.
// Agents can't listen, so these numbers are their ears. People can open the WAV files and listen.
// Usage:  npm run sounds -- [names...]   e.g. "eat" "round"
// Needs:  the dev server running (npm run dev) and Playwright's browser (see the ui-design skill, step 5).
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080/";
const FOLDER = join(tmpdir(), "pushpull-audio");
const SAMPLE_RATE = 44100;
const CLIP_DB = -1;        // the skill's ceiling: no peak above -1 dBFS
const SPREAD_DB = 6;       // effects further than this from the median loudness stand out too much

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    console.error("Playwright is missing. Run: npm install && npx playwright install chromium");
    process.exit(1);
  }
}

// Runs inside the page, so it uses the app's own sound modules and mixer with an offline (faster than real time) context.
async function renderInPageCB(job) {
  const { createMixer } = await import("/src/sound/soundPlayer.js");
  const { soundEffects } = await import("/src/sound/effects.js");
  const { tracks, scheduleStep, stepSeconds, trackSteps, STEPS_PER_BAR } = await import("/src/sound/music.js");
  const problems = [];
  let seconds = 1.6;
  const track = tracks[job.name];
  if (job.kind === "music") {
    seconds = trackSteps(track) * stepSeconds(track) * job.loops + 0.8;
    track.layers.forEach(function checkLayerCB(layer, layerIndex) {
      layer.bars.forEach(function checkBarCB(bar, barIndex) {
        const steps = bar.trim().split(/\s+/).length;
        if (steps !== STEPS_PER_BAR) problems.push("layer " + layerIndex + ", bar " + barIndex + " has " + steps + " steps, not " + STEPS_PER_BAR);
      });
    });
  }
  const context = new OfflineAudioContext(1, Math.ceil(seconds * job.sampleRate), job.sampleRate);
  const mixer = createMixer(context);
  if (job.kind === "effect") {
    soundEffects[job.name](mixer.effects, 0.02, 1, job.team);
  } else {
    const steps = trackSteps(track) * job.loops;
    for (let step = 0; step < steps; step += 1) {
      scheduleStep(mixer.music, track, step % trackSteps(track), 0.02 + step * stepSeconds(track), job.intensity);
    }
  }
  const buffer = await context.startRendering();
  return { samples: Array.from(buffer.getChannelData(0)), problems };
}

function decibels(value) {
  return 20 * Math.log10(Math.max(value, 1e-9));
}

// Peak: the loudest single sample. Loudness: the loudest 50ms stretch (RMS), close to how loud it feels.
function measure(samples) {
  const windowSize = Math.round(SAMPLE_RATE * 0.05);
  let peak = 0;
  let loudest = 0;
  // The peak checks every sample, including the last few that don't fill a whole window.
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  for (let start = 0; start + windowSize <= samples.length; start += Math.round(windowSize / 4)) {
    let sum = 0;
    for (let i = start; i < start + windowSize; i += 1) {
      sum += samples[i] * samples[i];
    }
    loudest = Math.max(loudest, Math.sqrt(sum / windowSize));
  }
  return { peak: decibels(peak), loudness: decibels(loudest) };
}

// 16-bit mono WAV: a 44-byte header followed by the samples.
function wavFile(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach(function writeSampleCB(sample, index) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2);
  });
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// The dev server reloads the page right after a file is saved. If that happens mid-run, wait and try once more.
async function evaluateWithRetry(page, callback, argument) {
  try {
    return await page.evaluate(callback, argument);
  } catch (error) {
    if (!error.message.includes("Execution context was destroyed")) throw error;
    await page.waitForLoadState("load");
    return page.evaluate(callback, argument);
  }
}

async function listJobs(page, wanted) {
  const names = await evaluateWithRetry(page, async function readNamesCB() {
    const { SOUND_NAMES } = await import("/src/sound/effects.js");
    const { tracks } = await import("/src/sound/music.js");
    return { effects: SOUND_NAMES, tracks: Object.keys(tracks) };
  });
  const jobs = [];
  names.effects.forEach(function addEffectCB(name) {
    jobs.push({ kind: "effect", name, team: "a", file: name });
    if (["eat", "point", "join", "leave"].includes(name)) jobs.push({ kind: "effect", name, team: "b", file: name + "-team-b" });
  });
  names.tracks.forEach(function addTrackCB(name) {
    jobs.push({ kind: "music", name, loops: 2, intensity: 0, file: "music-" + name });
    jobs.push({ kind: "music", name, loops: 1, intensity: 1, file: "music-" + name + "-last-10-seconds" });
  });
  if (wanted.length === 0) return jobs;
  return jobs.filter(function isWantedCB(job) { return wanted.includes(job.name); });
}

function median(values) {
  const sorted = [...values].sort(function byNumberCB(a, b) { return a - b; });
  return sorted[Math.floor(sorted.length / 2)];
}

async function main() {
  const { chromium } = loadPlaywright();
  mkdirSync(FOLDER, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const effectLoudness = [];
  try {
    await page.goto(BASE_URL, { waitUntil: "load" });
    const jobs = await listJobs(page, process.argv.slice(2));
    console.log("name".padEnd(34) + "peak dB".padStart(9) + "loudness dB".padStart(13));
    for (const job of jobs) {
      const result = await evaluateWithRetry(page, renderInPageCB, { ...job, sampleRate: SAMPLE_RATE });
      const levels = measure(result.samples);
      writeFileSync(join(FOLDER, job.file + ".wav"), wavFile(result.samples));
      console.log(job.file.padEnd(34) + levels.peak.toFixed(1).padStart(9) + levels.loudness.toFixed(1).padStart(13));
      if (levels.peak > CLIP_DB) console.log("  warning: peak is above " + CLIP_DB + " dBFS, too close to clipping");
      result.problems.forEach(function printProblemCB(problem) { console.log("  problem: " + problem); });
      if (job.kind === "effect") effectLoudness.push({ file: job.file, loudness: levels.loudness });
    }
  } catch (error) {
    const offline = error.message.includes("ERR_CONNECTION_REFUSED");
    console.error(offline ? "Can't reach " + BASE_URL + ". Start the dev server with: npm run dev" : error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
  if (effectLoudness.length > 1) {
    const middle = median(effectLoudness.map(function loudnessCB(effect) { return effect.loudness; }));
    effectLoudness.forEach(function checkSpreadCB(effect) {
      const difference = effect.loudness - middle;
      if (Math.abs(difference) > SPREAD_DB) {
        console.log("warning: " + effect.file + " is " + difference.toFixed(1) + " dB from the other effects (median " + middle.toFixed(1) + " dB)");
      }
    });
  }
  console.log("WAV files: " + FOLDER);
}

main();
