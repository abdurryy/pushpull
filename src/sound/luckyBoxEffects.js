// Sound output: original synthesized voices for the Lucky Box abilities.
import { noteFrequency, pitchFor, tone, noise } from "./instruments.js";

function resonate(output, time, pitch, note, options) {
  tone(output, time, { frequency: noteFrequency(note) * pitch, ...options });
}

export const luckyBoxEffects = {
  // A rubbery spring kicks upward twice. The second bend lingers.
  luckyGrowth(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    resonate(output, time, tuned, "C5", { slideTo: noteFrequency("E5") * tuned, slideTime: 0.048, volume: 0.56, decay: 0.11 });
    resonate(output, time + 0.068, tuned, "G5", { slideTo: noteFrequency("C6") * tuned, slideTime: 0.085, volume: 0.58, decay: 0.23 });
    resonate(output, time + 0.07, tuned * 2.07, "G5", { volume: 0.17, decay: 0.065 });
  },

  // A zipper slides down and stops with a dry little knock.
  luckyShrink(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    noise(output, time, { filter: "bandpass", frequency: 3300 * tuned, sweepTo: 720 * tuned, volume: 0.65, decay: 0.105 });
    resonate(output, time, tuned, "E6", { slideTo: noteFrequency("C5") * tuned, slideTime: 0.095, volume: 0.65, decay: 0.22 });
    resonate(output, time + 0.105, tuned * 1.72, "C5", { volume: 0.2, decay: 0.047 });
  },

  // Two latch rattles, then a hollow flick that moves up quickly.
  luckySteal(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    noise(output, time, { filter: "bandpass", frequency: 2100 * tuned, volume: 0.82, decay: 0.055 });
    noise(output, time + 0.039, { filter: "bandpass", frequency: 1700 * tuned, volume: 0.98, decay: 0.057 });
    resonate(output, time + 0.075, tuned, "D5", { slideTo: noteFrequency("A5") * tuned, slideTime: 0.032, volume: 0.61, decay: 0.19 });
    resonate(output, time + 0.075, tuned * 2.6, "D5", { volume: 0.26, decay: 0.058 });
  },

  // A brief scrape ends in the metallic snap of two blades closing.
  luckySnip(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    noise(output, time, { filter: "bandpass", frequency: 2800 * tuned, sweepTo: 5800 * tuned, attack: 0.022, volume: 1.1, decay: 0.082 });
    resonate(output, time + 0.056, tuned * 1.47, "G5", { volume: 0.52, decay: 0.105 });
    resonate(output, time + 0.056, tuned * 2.81, "G5", { volume: 0.24, decay: 0.037 });
  },

  // Two soft whistles trade pitches. The brief overlap lets you hear them cross.
  luckySwap(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    const low = noteFrequency("E5") * tuned;
    const high = noteFrequency("D6") * tuned;
    tone(output, time, { frequency: low, slideTo: high, slideTime: 0.14, attack: 0.024, volume: 0.54, decay: 0.26 });
    tone(output, time + 0.033, { frequency: high, slideTo: low, slideTime: 0.14, attack: 0.022, volume: 0.54, decay: 0.26 });
  },

  // Three quick apple-skin crunches. The last bite has a higher, brighter snap.
  luckyBonusApple(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    ["C5", "C5", "E5"].forEach(function biteCB(note, index) {
      const biteTime = time + index * 0.06;
      const frequency = noteFrequency(note) * tuned;
      noise(output, biteTime, { filter: "bandpass", frequency: frequency * 6, sweepTo: frequency * 3, volume: 0.73, decay: 0.065 });
      resonate(output, biteTime, tuned, note, { volume: 0.45, decay: 0.105 });
    });
  },

  // Ice strikes once, with two close upper tones giving the ring a slight shimmer.
  luckyFreeze(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    resonate(output, time, tuned, "D5", { volume: 0.38, decay: 0.26 });
    resonate(output, time, tuned, "A5", { volume: 0.34, decay: 0.31 });
    resonate(output, time, tuned * 1.008, "A5", { volume: 0.19, decay: 0.27 });
    resonate(output, time, tuned * 1.67, "E6", { volume: 0.19, decay: 0.105 });
  },

  // Air rushes in, then the apple lands with a rounded drop and a light bounce.
  luckyAppleDelivery(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    noise(output, time, { filter: "bandpass", frequency: 470 * tuned, sweepTo: 2400 * tuned, attack: 0.048, volume: 1.65, decay: 0.15 });
    resonate(output, time + 0.105, tuned, "G5", { slideTo: noteFrequency("C5") * tuned, slideTime: 0.042, volume: 0.59, decay: 0.18 });
    resonate(output, time + 0.173, tuned, "E5", { volume: 0.22, decay: 0.09 });
  },

  // The empty latch gives one muted pop.
  luckyNoChange(output, time, pitch, team) {
    const tuned = pitchFor(team, pitch);
    resonate(output, time, tuned, "C5", { volume: 0.55, decay: 0.23 });
    resonate(output, time, tuned * 2.2, "C5", { volume: 0.12, decay: 0.045 });
  },
};
