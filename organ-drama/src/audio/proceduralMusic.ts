import {filter, makeRng, midiToHz, mix, normalize, perc, pluck, type Rng, samples, tone} from './dsp';

/**
 * The background score: a quirky, tiptoeing pizzicato loop at 120 BPM.
 * Eight bars (16 s) of plucked bass, offbeat chord stabs, a sneaky violin
 * melody and a woodblock, all Karplus–Strong strings. The tail of the last
 * bar is folded back onto the start, so the loop repeats without a seam.
 */

export const BGM_BPM = 120;
export const BGM_BARS = 8;
export const BGM_LOOP_SECONDS = (BGM_BARS * 4 * 60) / BGM_BPM;

const BEAT = 60 / BGM_BPM;
const EIGHTH = BEAT / 2;

/** Chord per half bar (MIDI root + intervals). */
const CHORDS: readonly (readonly number[])[] = [
  [48, 52, 55], [48, 52, 55], // C
  [45, 48, 52], [45, 48, 52], // Am
  [41, 45, 48], [41, 45, 48], // F
  [43, 47, 50, 53], [43, 47, 50, 53], // G7
  [48, 52, 55], [48, 52, 55], // C
  [45, 49, 52, 55], [45, 49, 52, 55], // A7
  [50, 53, 57, 60], [43, 47, 50, 53], // Dm7 | G7
  [48, 52, 55], [43, 47, 50, 53], // C | G7 turnaround
];

/** Melody per bar as [eighth-note slot, MIDI note]. */
const MELODY: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 72], [1, 76], [2, 79], [4, 84], [6, 83], [7, 84]],
  [[0, 81], [2, 76], [3, 77], [4, 76], [6, 72]],
  [[0, 77], [1, 81], [2, 84], [4, 86], [6, 84], [7, 81]],
  [[0, 79], [2, 77], [3, 76], [4, 74], [5, 73], [6, 74], [7, 71]],
  [[0, 72], [1, 76], [2, 79], [4, 84], [5, 86], [6, 88]],
  [[0, 85], [2, 81], [3, 79], [4, 76], [6, 73]],
  [[0, 74], [1, 77], [2, 81], [3, 84], [4, 83], [5, 79], [6, 77], [7, 74]],
  [[0, 72], [2, 79], [3, 76], [4, 72], [7, 67]],
];

/** A pizzicato note: a short, bright pluck with a wooden body resonance. */
const pizz = (sr: number, rng: Rng, midi: number, length: number, brightness: number): Float32Array => {
  const f = midiToHz(midi);
  const raw = pluck(sr, f, length, rng, brightness, 0.997);
  const body = filter(raw, sr, 'peak', 420, 1.1, 4);
  const shaped = filter(body, sr, 'lowpass', Math.min(6000, f * 7));
  const env = perc(0.002, length * 0.32);
  for (let i = 0; i < shaped.length; i++) {
    shaped[i] *= env(i / sr);
  }
  return shaped;
};

const woodblock = (sr: number, pitch: number): Float32Array => {
  const out = tone(sr, 0.12, pitch, 'sine', perc(0.0008, 0.022));
  mix(out, tone(sr, 0.12, pitch * 2.6, 'sine', perc(0.0005, 0.01)), sr, 0, 0.3);
  return out;
};

interface Voice {
  pan: number;
  buf: Float32Array;
}

/**
 * Renders the loop. Returns `[left, right]`, or a single mono channel when
 * `stereo` is false (used for the lighter in-browser fallback).
 */
export const synthesizeBgmLoop = (sr: number, stereo = true): Float32Array[] => {
  const rng = makeRng('bgm-pizzicato');
  const loop = samples(BGM_LOOP_SECONDS, sr);
  const tail = samples(1.5, sr);
  const voices: Voice[] = [
    {pan: 0, buf: new Float32Array(loop + tail)}, // bass
    {pan: -0.45, buf: new Float32Array(loop + tail)}, // chords
    {pan: 0.4, buf: new Float32Array(loop + tail)}, // melody
    {pan: -0.2, buf: new Float32Array(loop + tail)}, // woodblock
  ];
  const [bass, chords, melody, blocks] = voices;
  // A hint of swing makes the tiptoeing feel cheeky.
  const swing = (slot: number) => slot * EIGHTH + (slot % 2 === 1 ? EIGHTH * 0.12 : 0);

  for (let bar = 0; bar < BGM_BARS; bar++) {
    const t0 = bar * 4 * BEAT;
    for (let half = 0; half < 2; half++) {
      const chord = CHORDS[bar * 2 + half];
      const next = CHORDS[(bar * 2 + half + 1) % CHORDS.length];
      const th = t0 + half * 2 * BEAT;
      // Bass: root on the beat, then a chromatic step toward the next root.
      mix(bass.buf, pizz(sr, rng, chord[0] - 12, 0.9, 0.55), sr, th, 1);
      const approach = next[0] - 12 + (next[0] > chord[0] ? -1 : 1);
      mix(bass.buf, pizz(sr, rng, half === 0 ? chord[2] - 12 : approach, 0.6, 0.5), sr, th + BEAT, 0.65);
      // Chords: offbeat stabs, lightly strummed.
      chord.slice(0, 3).forEach((n, i) => {
        mix(chords.buf, pizz(sr, rng, n + 12, 0.45, 0.7), sr, th + EIGHTH + i * 0.008, 0.3);
        mix(chords.buf, pizz(sr, rng, n + 12, 0.35, 0.7), sr, th + BEAT + EIGHTH + i * 0.008, 0.22);
      });
    }
    for (const [slot, note] of MELODY[bar]) {
      const accent = slot % 2 === 0 ? 1 : 0.75;
      mix(melody.buf, pizz(sr, rng, note, 0.5, 0.85), sr, t0 + swing(slot), 0.42 * accent);
    }
    for (let beat = 0; beat < 4; beat++) {
      mix(blocks.buf, woodblock(sr, beat % 2 === 1 ? 1180 : 860), sr, t0 + beat * BEAT, beat % 2 === 1 ? 0.22 : 0.1);
    }
    if (bar % 2 === 1) {
      mix(blocks.buf, woodblock(sr, 1400), sr, t0 + 3 * BEAT + EIGHTH, 0.12);
    }
  }

  const channels = stereo ? [new Float32Array(loop), new Float32Array(loop)] : [new Float32Array(loop)];
  for (const v of voices) {
    // Fold the ring-out past the loop point back onto the start for a seamless repeat.
    for (let i = loop; i < v.buf.length; i++) {
      v.buf[i - loop] += v.buf[i];
    }
    const gains = stereo ? [Math.cos(((v.pan + 1) * Math.PI) / 4), Math.sin(((v.pan + 1) * Math.PI) / 4)] : [0.7];
    channels.forEach((ch, c) => {
      for (let i = 0; i < loop; i++) {
        ch[i] += v.buf[i] * gains[c];
      }
    });
  }
  // Normalise both channels together so the stereo image is kept.
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      peak = Math.max(peak, Math.abs(ch[i]));
    }
  }
  const g = 0.8 / Math.max(1e-6, peak);
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      ch[i] *= g;
    }
  }
  return stereo ? channels : [normalize(channels[0], 0.8)];
};
