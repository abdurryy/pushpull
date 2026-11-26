// Sound (output layer): one sound effect per event in design.md's Game feel table.
// Each effect gets an output node, a start time, a pitch (1 is normal, soundPlayer varies it a little) and the team.
import { instruments, noteFrequency } from "./instruments.js";

// Team B's sounds are a fourth (five semitones) higher, so you can hear which team it was.
// Effects use only C, D, E, G and A, which every track's key contains. A fourth up turns them into F, G, A, C and D,
// which every key contains too, so neither team's sounds ever clash with the music.
const TEAM_B_LIFT = Math.pow(2, 5 / 12);

function pitchFor(team, pitch) {
  return team === "b" ? pitch * TEAM_B_LIFT : pitch;
}

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

  // "3", "2", "1" of the countdown.
  count(output, time, pitch) {
    instruments.woodblock(output, time, noteFrequency("A5") * pitch, 1.1);
  },

  // "Go!": a bright chord with a high note on top.
  go(output, time, pitch) {
    ["C5", "E5", "G5"].forEach(function playChordNoteCB(note) {
      instruments.pluck(output, time, noteFrequency(note) * pitch, 0.25);
    });
    instruments.marimba(output, time, noteFrequency("C6") * pitch, 0.45);
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
