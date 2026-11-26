// Sound (output layer): the four music tracks from design.md (lobby, round, trivia, results) written as note patterns.
// A bar has 16 steps (sixteenth notes). In a pattern "." is a rest, "x" a drum hit, "A4" a note and "A3+C4+E4" a chord.
// Each layer repeats its own list of bars. Layers with from: 1 only play in the last 10 seconds (intensity 1).
import { instruments, noteFrequency } from "./instruments.js";

export const STEPS_PER_BAR = 16;

const FOUR_ON_THE_FLOOR = "x . . .  x . . .  x . . .  x . . .";
const BACKBEAT = ". . . .  x . . .  . . . .  x . . .";
const OFFBEAT_SHAKER = ". . x .  . . x .  . . x .  . . x .";
const KICK_ON_ONE_AND_THREE = "x . . .  . . . .  x . . .  . . . .";

// Round: A minor, Am - F - C - G. Bouncy octave bass, chord stabs on the off-beats, an eight-bar melody.
const ROUND_MELODY = [
  "A4 . C5 .  D5 . E5 .  . . D5 .  C5 . A4 .",
  "C5 . . .  A4 . G4 .  A4 . . .  . . . .",
  "E5 . G5 .  E5 . D5 .  C5 . . .  D5 . E5 .",
  "D5 . . .  C5 . A4 .  G4 . . .  A4 . . .",
  "E5 . . .  D5 . E5 .  G5 . . .  E5 . D5 .",
  "C5 . . .  . . A4 .  C5 . D5 .  . . . .",
  "E5 . D5 .  C5 . . .  A4 . C5 .  . . G4 .",
  "A4 . . .  . . . .  . . . .  . . . .",
];

// Lobby: F major, F - Dm - Bb - C. Slow kalimba arpeggios and a lazy melody.
const LOBBY_MELODY = [
  "C5 . . .  A4 . . .  G4 . A4 .  . . . .",
  "F4 . . .  . . . .  D4 . F4 .  G4 . . .",
  "A4 . . .  G4 . F4 .  D4 . . .  . . . .",
  "G4 . . .  . . A4 .  C5 . . .  . . . .",
  "A4 . . .  C5 . . .  D5 . C5 .  . . . .",
  "A4 . . .  . . . .  F4 . G4 .  A4 . . .",
  "F4 . . .  D4 . . .  F4 . . .  G4 . . .",
  "G4 . . .  . . . .  . . . .  . . . .",
];

export const tracks = {
  lobby: {
    tempo: 92,
    layers: [
      { instrument: "kick", volume: 0.45, bars: [KICK_ON_ONE_AND_THREE] },
      { instrument: "shaker", volume: 0.1, bars: [OFFBEAT_SHAKER] },
      { instrument: "bass", volume: 0.4, bars: [
        "F2 . . .  . . . .  F2 . . .  . . C3 .",
        "D2 . . .  . . . .  D2 . . .  . . A2 .",
        "Bb1 . . .  . . . .  Bb1 . . .  . . F2 .",
        "C2 . . .  . . . .  C2 . . .  . . G2 .",
      ] },
      { instrument: "pluck", volume: 0.2, bars: [
        "F4 . A4 .  C5 . A4 .  F4 . A4 .  C5 . A4 .",
        "D4 . F4 .  A4 . F4 .  D4 . F4 .  A4 . F4 .",
        "Bb3 . D4 .  F4 . D4 .  Bb3 . D4 .  F4 . D4 .",
        "C4 . E4 .  G4 . E4 .  C4 . E4 .  G4 . E4 .",
      ] },
      { instrument: "marimba", volume: 0.3, bars: LOBBY_MELODY },
    ],
  },

  round: {
    tempo: 124,
    layers: [
      { instrument: "kick", volume: 0.55, bars: [FOUR_ON_THE_FLOOR] },
      { instrument: "clap", volume: 0.25, bars: [BACKBEAT] },
      { instrument: "shaker", volume: 0.12, bars: [OFFBEAT_SHAKER] },
      { instrument: "bass", volume: 0.4, bars: [
        "A2 . A3 .  A2 . A3 .  A2 . A3 .  A2 . A3 .",
        "F2 . F3 .  F2 . F3 .  F2 . F3 .  F2 . F3 .",
        "C2 . C3 .  C2 . C3 .  C2 . C3 .  C2 . C3 .",
        "G2 . G3 .  G2 . G3 .  G2 . G3 .  G2 . G3 .",
      ] },
      { instrument: "pluck", volume: 0.1, bars: [
        ". . A3+C4+E4 .  . . A3+C4+E4 .  . . A3+C4+E4 .  . . A3+C4+E4 .",
        ". . F3+A3+C4 .  . . F3+A3+C4 .  . . F3+A3+C4 .  . . F3+A3+C4 .",
        ". . C4+E4+G4 .  . . C4+E4+G4 .  . . C4+E4+G4 .  . . C4+E4+G4 .",
        ". . G3+B3+D4 .  . . G3+B3+D4 .  . . G3+B3+D4 .  . . G3+B3+D4 .",
      ] },
      { instrument: "marimba", volume: 0.3, bars: ROUND_MELODY },
      // Last 10 seconds: a fast hi-hat and the melody doubled an octave higher.
      { instrument: "hat", volume: 0.08, from: 1, bars: ["x x x x  x x x x  x x x x  x x x x"] },
      { instrument: "marimba", volume: 0.18, octave: 1, from: 1, bars: ROUND_MELODY },
    ],
  },

  trivia: {
    tempo: 84,
    layers: [
      // Tick-tock on every beat, like a clock.
      { instrument: "woodblock", volume: 0.25, bars: ["G5 . . .  D5 . . .  G5 . . .  D5 . . ."] },
      { instrument: "bass", volume: 0.45, bars: [
        "D2 . . .  . . . .  . . . .  . . . .",
        "Bb1 . . .  . . . .  . . . .  . . . .",
        "G1 . . .  . . . .  . . . .  . . . .",
        "A1 . . .  . . . .  . . . .  . . . .",
      ] },
      { instrument: "pluck", volume: 0.2, bars: [
        ". . D4 .  . . F4 .  . . A4 .  . . . .",
        ". . D4 .  . . F4 .  . . Bb4 .  . . . .",
        ". . D4 .  . . G4 .  . . Bb4 .  . . . .",
        ". . C#4 .  . . E4 .  . . A4 .  . . . .",
      ] },
      { instrument: "marimba", volume: 0.28, bars: [
        "A4 . . .  . . . .  G4 . F4 .  . . . .",
        "F4 . . .  D4 . . .  . . . .  . . . .",
        "G4 . . .  A4 . C5 .  A4 . . .  . . . .",
        "A4 . . .  . . . .  . . . .  . . . .",
      ] },
      { instrument: "shaker", volume: 0.1, from: 1, bars: [OFFBEAT_SHAKER] },
    ],
  },

  results: {
    tempo: 100,
    layers: [
      { instrument: "kick", volume: 0.5, bars: [KICK_ON_ONE_AND_THREE] },
      { instrument: "clap", volume: 0.22, bars: [BACKBEAT] },
      { instrument: "shaker", volume: 0.1, bars: [OFFBEAT_SHAKER] },
      { instrument: "bass", volume: 0.4, bars: [
        "C2 . . .  C2 . . .  C3 . . .  G2 . . .",
        "G2 . . .  G2 . . .  G1 . . .  D2 . . .",
        "A2 . . .  A2 . . .  A1 . . .  E2 . . .",
        "F2 . . .  F2 . . .  F1 . . .  C2 . . .",
      ] },
      { instrument: "pluck", volume: 0.1, bars: [
        ". . C4+E4+G4 .  . . C4+E4+G4 .  . . C4+E4+G4 .  . . C4+E4+G4 .",
        ". . G3+B3+D4 .  . . G3+B3+D4 .  . . G3+B3+D4 .  . . G3+B3+D4 .",
        ". . A3+C4+E4 .  . . A3+C4+E4 .  . . A3+C4+E4 .  . . A3+C4+E4 .",
        ". . F3+A3+C4 .  . . F3+A3+C4 .  . . F3+A3+C4 .  . . F3+A3+C4 .",
      ] },
      { instrument: "marimba", volume: 0.3, bars: [
        "E5 . G5 .  . . E5 .  D5 . C5 .  . . . .",
        "D5 . . .  G4 . . .  D5 . E5 .  . . . .",
        "C5 . E5 .  . . A4 .  . . C5 .  . . . .",
        "A4 . . .  C5 . . .  D5 . . .  . . . .",
      ] },
    ],
  },
};

// How long one step lasts: a beat has four steps.
export function stepSeconds(track) {
  return 60 / track.tempo / 4;
}

function barCountCB(layer) {
  return layer.bars.length;
}

// The track loops after its longest layer has played once.
export function trackSteps(track) {
  return Math.max(...track.layers.map(barCountCB)) * STEPS_PER_BAR;
}

function playToken(output, layer, token, time) {
  const play = instruments[layer.instrument];
  if (token === "x") {
    play(output, time, 0, layer.volume);
    return;
  }
  const octaveShift = Math.pow(2, layer.octave || 0);
  token.split("+").forEach(function playNoteCB(note) {
    play(output, time, noteFrequency(note) * octaveShift, layer.volume);
  });
}

// Plays everything in the track that falls on this step. The music clock in soundPlayer.js calls it just before it is due.
export function scheduleStep(output, track, step, time, intensity) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const position = step % STEPS_PER_BAR;
  track.layers.forEach(function playLayerCB(layer) {
    if ((layer.from || 0) > intensity) return;
    const pattern = layer.bars[bar % layer.bars.length];
    const token = pattern.trim().split(/\s+/)[position];
    if (token !== ".") playToken(output, layer, token, time);
  });
}
