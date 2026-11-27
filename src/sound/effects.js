// Sound (output layer): one sound effect per event in design.md's Game feel table.
// Each effect gets an output node, a start time, a pitch (1 is normal, soundPlayer varies it a little) and the team.
import { instruments, noteFrequency, pitchFor } from "./instruments.js";
import { luckyBoxEffects } from "./luckyBoxEffects.js";

// Plays notes one after another: [[note, delay in seconds], ...].
function melody(instrument, output, time, pitch, volume, notes) {
  notes.forEach(function playNoteCB([note, delay]) {
    instrument(output, time + delay, noteFrequency(note) * pitch, volume);
  });
}

export const soundEffects = {
  // Apple eaten: two quick rising wooden notes.
  eat(output, time, pitch, team) {
    melody(instruments.marimba, output, time, pitchFor(team, pitch), 0.5, [["E5", 0], ["A5", 0.07]]);
  },

  ...luckyBoxEffects,

  // Snake crashed: a low thud and a falling tone.
  crash(output, time, pitch) {
    instruments.kick(output, time, 0, 0.9);
    instruments.thud(output, time, 0, 0.6);
    instruments.drop(output, time, noteFrequency("E4") * pitch, 0.3);
  },

  // Score went up: three rising notes.
  point(output, time, pitch, team) {
    melody(instruments.marimba, output, time, pitchFor(team, pitch), 0.45, [["C5", 0], ["E5", 0.08], ["G5", 0.16]]);
  },

  // The arrows meet: one pitched strike with two short bursts of electrical noise.
  roundClash(output, time, pitch) {
    instruments.woodblock(output, time, noteFrequency("C5") * pitch, 0.59);
    instruments.pluck(output, time, noteFrequency("G5") * pitch, 0.45);
    instruments.clap(output, time, 0, 0.74);
    instruments.snip(output, time + 0.035, 0, 0.7);
    instruments.snip(output, time + 0.075, 0, 0.48);
  },

  // "3", "2", "1": a woodblock tick with a short pitched tail.
  count(output, time, pitch) {
    const frequency = noteFrequency("A5") * pitch;
    instruments.woodblock(output, time, frequency, 0.9);
    instruments.pluck(output, time + 0.014, frequency, 0.38);
  },

  // "Go!": the marimba jumps from G to C and lands on a bright major chord.
  go(output, time, pitch) {
    melody(instruments.marimba, output, time, pitch, 0.31, [["G5", 0], ["C6", 0.075]]);
    ["C5", "E5", "G5"].forEach(function playChordNoteCB(note) {
      instruments.pluck(output, time + 0.075, noteFrequency(note) * pitch, 0.16);
    });
  },

  // Each of the last 10 seconds: a small, quiet tick.
  tick(output, time, pitch) {
    instruments.woodblock(output, time, noteFrequency("E6") * pitch, 1.2);
  },

  // Round won: a rising run that lands on a full chord with bass.
  win(output, time, pitch) {
    melody(instruments.marimba, output, time, pitch, 0.32, [["C5", 0], ["E5", 0.1], ["G5", 0.2], ["C6", 0.3]]);
    ["C5", "E5", "G5"].forEach(function playChordNoteCB(note) {
      instruments.pluck(output, time + 0.45, noteFrequency(note) * pitch, 0.18);
    });
    instruments.marimba(output, time + 0.45, noteFrequency("E6") * pitch, 0.3);
    instruments.bass(output, time + 0.45, noteFrequency("C3") * pitch, 0.35);
  },

  // Round tied: two calm notes that step down, neither happy nor sad.
  tie(output, time, pitch) {
    melody(instruments.marimba, output, time, pitch, 0.45, [["E5", 0], ["C5", 0.18]]);
  },

  // A player took a seat: a rising fifth.
  join(output, time, pitch, team) {
    melody(instruments.marimba, output, time, pitchFor(team, pitch), 0.45, [["G5", 0], ["D6", 0.09]]);
  },

  // A player left: the same notes falling, a little quieter.
  leave(output, time, pitch, team) {
    melody(instruments.marimba, output, time, pitchFor(team, pitch), 0.35, [["D6", 0], ["G5", 0.09]]);
  },

  // The four action buttons on the controller.
  dash(output, time) {
    // Noise through a narrow filter loses most of its energy, so the whoosh needs a big volume to match the others.
    instruments.swoosh(output, time, 0, 5);
  },

  ping(output, time, pitch) {
    // A bloop with two quieter echoes, like a radar.
    instruments.blip(output, time, noteFrequency("A5") * pitch, 0.9);
    instruments.blip(output, time + 0.16, noteFrequency("A5") * pitch, 0.35);
    instruments.blip(output, time + 0.32, noteFrequency("A5") * pitch, 0.14);
  },

  shed(output, time) {
    instruments.snip(output, time, 0, 1);
    instruments.snip(output, time + 0.06, 0, 1);
  },

  hold(output, time, pitch) {
    instruments.woodblock(output, time, noteFrequency("C4") * pitch, 1);
    instruments.kick(output, time, 0, 0.5);
  },
};

export const SOUND_NAMES = Object.keys(soundEffects);
