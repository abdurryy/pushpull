// Sound (output layer): plays effects and music on the TV. Views call it the way they call navigator.vibrate;
// the model never does. It owns the one AudioContext, the mix, mute and the music clock (design.md, Sound).
import { soundEffects } from "./effects.js";
import { scheduleStep, stepSeconds, trackSteps, tracks } from "./music.js";

const MASTER_VOLUME = 0.8;
const MUSIC_VOLUME = 0.22;     // music sits about 6 dB under the effects (measured with render-audio.mjs)
const PITCH_VARIATION = 0.03;  // each effect plays up to 3% higher or lower, so repeats don't sound robotic
const MIN_GAP_SECONDS = 0.05;  // the same effect never starts twice within 50ms
const LOOKAHEAD_SECONDS = 0.12; // the music clock books notes this far ahead...
const CLOCK_MS = 25;            // ...and wakes up this often, so a slow frame never makes the music stumble

let context = null;
let mixer = null;
let muted = false;
let music = null;
const lastStarted = {};

// Effects and music get their own volume, then share a limiter so loud moments never clip.
// Exported so a dev script can render sounds offline with the same mix.
export function createMixer(audioContext) {
  const effects = audioContext.createGain();
  const musicBus = audioContext.createGain();
  const limiter = audioContext.createDynamicsCompressor();
  const master = audioContext.createGain();
  musicBus.gain.value = MUSIC_VOLUME;
  limiter.threshold.value = -10;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.gain.value = MASTER_VOLUME;
  effects.connect(limiter);
  musicBus.connect(limiter);
  limiter.connect(master).connect(audioContext.destination);
  return { effects, music: musicBus, master };
}

// The AudioContext is made the first time sound is needed, not on page load.
function audio() {
  if (!context) {
    context = new AudioContext();
    mixer = createMixer(context);
    applyMute();
  }
  return context;
}

// Browsers keep sound off until the user presses something, so every press tries to switch it on.
function unlockAudioACB() {
  if (context && context.state !== "running") context.resume();
}
window.addEventListener("pointerdown", unlockAudioACB);
window.addEventListener("keydown", unlockAudioACB);

function applyMute() {
  if (mixer) mixer.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, context.currentTime, 0.02);
}

export function setMuted(value) {
  muted = value;
  applyMute();
}

// Plays one effect from effects.js right away. team ("a" or "b") changes the pitch of team sounds.
export function playSound(name, team) {
  const effect = soundEffects[name];
  if (!effect || muted) return;
  const now = audio().currentTime;
  if (now - (lastStarted[name] ?? -1) < MIN_GAP_SECONDS) return;
  lastStarted[name] = now;
  const pitch = 1 + (Math.random() * 2 - 1) * PITCH_VARIATION;
  effect(mixer.effects, now + 0.01, pitch, team);
}

// The music clock: book every step that starts within the look-ahead window on the audio clock.
// The audio clock is exact; setInterval is not, which is why notes are booked ahead instead of played on time.
function musicClockACB() {
  const bookUntil = context.currentTime + LOOKAHEAD_SECONDS;
  while (music.nextTime < bookUntil) {
    scheduleStep(mixer.music, music.track, music.step, music.nextTime, music.intensity);
    music.nextTime += stepSeconds(music.track);
    music.step = (music.step + 1) % trackSteps(music.track);
  }
}

// Starts a track from music.js ("lobby", "round", "trivia" or "results"). Starting the one already playing does nothing.
export function startMusic(name) {
  if (music && music.name === name) return;
  stopMusic();
  const track = tracks[name];
  if (!track) return;
  const startTime = audio().currentTime + 0.1;
  music = { name, track, step: 0, nextTime: startTime, intensity: 0, timer: setInterval(musicClockACB, CLOCK_MS) };
}

export function stopMusic() {
  if (music) clearInterval(music.timer);
  music = null;
}

// 0 is normal, 1 adds the last-10-seconds layers.
export function setMusicIntensity(level) {
  if (music) music.intensity = level;
}

if (import.meta.hot) import.meta.hot.dispose(stopMusic);
