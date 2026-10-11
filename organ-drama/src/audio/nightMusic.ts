import {filter, makeRng, midiToHz, mix, normalize, partials, ramp, samples, tone} from './dsp';
import {pizz} from './proceduralMusic';

/**
 * A softer midnight score for the style test: a music-box melody up high
 * (C6–C7, where the reference's bed sits), tiptoeing pizzicato bass, light
 * offbeat plucks and a quiet pad. 8 bars at 100 BPM (19.2 s), seamless.
 */

export const NIGHT_BPM = 100;
export const NIGHT_BARS = 8;
export const NIGHT_LOOP_SECONDS = (NIGHT_BARS * 4 * 60) / NIGHT_BPM;

const BEAT = 60 / NIGHT_BPM;
const EIGHTH = BEAT / 2;

/** One chord per bar (MIDI, pad register). */
const CHORDS: readonly (readonly number[])[] = [
  [60, 64, 67], // C
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [55, 59, 62], // G
  [60, 64, 67], // C
  [52, 55, 59], // Em
  [53, 57, 60], // F
  [55, 59, 62, 65], // G7
];

/** Melody per bar as [eighth-note slot, MIDI note]: sparse, lullaby-ish. */
const MELODY: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 84], [2, 88], [4, 91], [6, 88]],
  [[0, 93], [3, 91], [4, 88]],
  [[0, 89], [2, 93], [4, 96], [6, 93]],
  [[0, 91], [2, 86], [4, 83], [6, 86]],
  [[0, 84], [2, 88], [4, 91], [5, 93], [6, 91]],
  [[0, 91], [2, 88], [4, 83]],
  [[0, 89], [2, 88], [4, 86], [6, 83]],
  [[0, 84], [4, 79]],
];

/** A music-box tine: bright attack, a few slightly stretched partials, long ring. */
const musicBox = (sr: number, midi: number, length: number): Float32Array => {
  const f = midiToHz(midi);
  const out = partials(sr, length, f, [[1, 1, 0.75], [2, 0.16, 0.28], [3.01, 0.05, 0.12], [4.16, 0.07, 0.05], [5.43, 0.03, 0.03]], 0.0015);
  // A faintly detuned twin gives the shimmer of a real comb.
  mix(out, partials(sr, length, f * 1.0035, [[1, 0.28, 0.6]], 0.0015), sr, 0);
  return out;
};

/** A soft triangle pad note, low-passed so it sits behind everything. */
const padNote = (sr: number, midi: number, length: number): Float32Array =>
  filter(tone(sr, length, midiToHz(midi), 'triangle', ramp([[0, 0], [0.6, 1], [length - 0.5, 0.8], [length, 0]])), sr, 'lowpass', 900);

interface Voice {
  pan: number;
  buf: Float32Array;
}

/** Renders the loop. Returns `[left, right]`, or one mono channel when `stereo` is false. */
export const synthesizeNightLoop = (sr: number, stereo = true): Float32Array[] => {
  const rng = makeRng('night-music-box');
  const loop = samples(NIGHT_LOOP_SECONDS, sr);
  const tail = samples(2.5, sr);
  const voices: Voice[] = [
    {pan: 0.3, buf: new Float32Array(loop + tail)}, // music box
    {pan: 0, buf: new Float32Array(loop + tail)}, // pizzicato bass
    {pan: -0.4, buf: new Float32Array(loop + tail)}, // offbeat plucks
    {pan: -0.1, buf: new Float32Array(loop + tail)}, // pad
  ];
  const [box, bass, plucks, pad] = voices;
  const swing = (slot: number) => slot * EIGHTH + (slot % 2 === 1 ? EIGHTH * 0.1 : 0);

  for (let bar = 0; bar < NIGHT_BARS; bar++) {
    const t0 = bar * 4 * BEAT;
    const chord = CHORDS[bar];
    // Tiptoe bass: root on 1, fifth on 3, both short.
    mix(bass.buf, pizz(sr, rng, chord[0] - 12, 0.7, 0.45), sr, t0, 0.8);
    mix(bass.buf, pizz(sr, rng, chord[2] - 12, 0.6, 0.45), sr, t0 + 2 * BEAT, 0.6);
    // Light offbeat plucks on the "and" of 2 and 4.
    for (const at of [BEAT + EIGHTH, 3 * BEAT + EIGHTH]) {
      chord.slice(0, 3).forEach((n, i) => mix(plucks.buf, pizz(sr, rng, n + 12, 0.3, 0.6), sr, t0 + at + i * 0.01, 0.12));
    }
    chord.forEach((n) => mix(pad.buf, padNote(sr, n, 4 * BEAT + 0.4), sr, t0, 0.05));
    for (const [slot, note] of MELODY[bar]) {
      mix(box.buf, musicBox(sr, note, 2.2), sr, t0 + swing(slot), slot % 2 === 0 ? 0.42 : 0.32);
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
