// Sound (output layer): the Toy box instruments every effect and song is built from, made with the Web Audio API.
// Each instrument schedules one note on an output node at an exact time, so music stays in time.
// They all take (output, time, frequency, volume); drums ignore the frequency.

const NOTE_NUMBERS = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };

// "A4" is 440 Hz. Each semitone up multiplies the frequency by the twelfth root of 2, so twelve make an octave (double).
export function noteFrequency(note) {
  const name = note.slice(0, -1);
  const octave = Number(note.slice(-1));
  const semitonesFromA4 = NOTE_NUMBERS[name] - 9 + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// Rise to the volume in 5ms, then fade out exponentially, the way struck wood dies away.
// Starting and ending near zero (never at zero, which an exponential fade can't reach) avoids clicks.
function strike(param, time, volume, decay) {
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(volume, time + 0.005);
  param.exponentialRampToValueAtTime(0.0001, time + decay);
}

// One oscillator through a fading volume. slideTo bends the pitch during the first slideTime seconds.
function tone(output, time, options) {
  const context = output.context;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, time);
  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, time + options.slideTime);
  }
  strike(gain.gain, time, options.volume, options.decay);
  oscillator.connect(gain).connect(output);
  oscillator.start(time);
  oscillator.stop(time + options.decay + 0.05);
}

// One second of white noise per audio context, reused by every drum and swoosh.
const noiseBuffers = new WeakMap();

function noiseBuffer(context) {
  if (!noiseBuffers.has(context)) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(context, buffer);
  }
  return noiseBuffers.get(context);
}

// Noise through a filter. The filter decides the colour: lowpass is a thud, bandpass a clap, highpass a shaker.
function noise(output, time, options) {
  const context = output.context;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = noiseBuffer(context);
  filter.type = options.filter;
  filter.frequency.setValueAtTime(options.frequency, time);
  if (options.sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(options.sweepTo, time + options.decay);
  }
  strike(gain.gain, time, options.volume, options.decay);
  source.connect(filter).connect(gain).connect(output);
  source.start(time);
  source.stop(time + options.decay + 0.05);
}

export const instruments = {
  // Wooden bar: a pure tone plus a short overtone four times higher gives the marimba's knock.
  marimba(output, time, frequency, volume) {
    tone(output, time, { type: "sine", frequency, volume, decay: 0.6 });
    tone(output, time, { type: "sine", frequency: frequency * 4, volume: volume * 0.3, decay: 0.08 });
  },

  // Kalimba-like pluck for chords: softer and shorter than the marimba.
  pluck(output, time, frequency, volume) {
    tone(output, time, { type: "triangle", frequency, volume, decay: 0.3 });
    tone(output, time, { type: "sine", frequency: frequency * 2, volume: volume * 0.25, decay: 0.12 });
  },

  // Round, soft bass.
  bass(output, time, frequency, volume) {
    tone(output, time, { type: "triangle", frequency, volume, decay: 0.4 });
    tone(output, time, { type: "sine", frequency, volume: volume * 0.8, decay: 0.5 });
  },

  // Felt kick drum: a low tone that drops quickly in pitch.
  kick(output, time, frequency, volume) {
    tone(output, time, { type: "sine", frequency: 150, slideTo: 45, slideTime: 0.1, volume, decay: 0.3 });
  },

  clap(output, time, frequency, volume) {
    noise(output, time, { filter: "bandpass", frequency: 1500, volume, decay: 0.14 });
  },

  shaker(output, time, frequency, volume) {
    noise(output, time, { filter: "highpass", frequency: 6000, volume, decay: 0.05 });
  },

  hat(output, time, frequency, volume) {
    noise(output, time, { filter: "highpass", frequency: 9000, volume, decay: 0.03 });
  },

  // Wood block: a very short tone with a bright overtone. Used for ticks and the countdown.
  woodblock(output, time, frequency, volume) {
    tone(output, time, { type: "sine", frequency, volume, decay: 0.08 });
    tone(output, time, { type: "triangle", frequency: frequency * 2.5, volume: volume * 0.2, decay: 0.03 });
  },

  // Effect voices, used by effects.js.
  thud(output, time, frequency, volume) {
    noise(output, time, { filter: "lowpass", frequency: 400, volume, decay: 0.3 });
  },

  // A tone that falls two octaves: something going wrong.
  drop(output, time, frequency, volume) {
    tone(output, time, { type: "triangle", frequency, slideTo: frequency / 4, slideTime: 0.35, volume, decay: 0.4 });
  },

  // A tone that jumps up an octave: a bubbly "bloop".
  blip(output, time, frequency, volume) {
    tone(output, time, { type: "sine", frequency, slideTo: frequency * 2, slideTime: 0.06, volume, decay: 0.25 });
  },

  // Noise sweeping upwards: a quick whoosh.
  swoosh(output, time, frequency, volume) {
    noise(output, time, { filter: "bandpass", frequency: 600, sweepTo: 5000, volume, decay: 0.22 });
  },

  snip(output, time, frequency, volume) {
    noise(output, time, { filter: "highpass", frequency: 5000, volume, decay: 0.06 });
  },
};
