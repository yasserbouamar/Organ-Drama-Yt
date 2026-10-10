import type {BabbleVoice} from '../types/audio';
import type {Delivery} from '../types/dialogue';
import type {Syllable, Vowel} from '../utils/syllables';
import {filter, makeRng, normalize, samples} from './dsp';

/**
 * The procedural voice: cartoon "babble" that follows a line's syllables.
 * A glottal pulse train (saw) at the speaker's pitch runs through three
 * formant filters tuned per vowel; fricatives get a hiss and stops a puff.
 * It's the last-resort voice when no TTS clip exists, and it shares its
 * syllable plan with lip-sync, so mouths flap exactly on its syllables.
 */

/** Formant centres (Hz) for an adult voice; scaled per character. */
const FORMANTS: Record<Vowel, readonly [number, number, number]> = {
  a: [730, 1090, 2440],
  e: [530, 1840, 2480],
  i: [390, 1990, 2550],
  o: [570, 840, 2410],
  u: [440, 1020, 2240],
};

const FORMANT_GAIN = [1, 0.55, 0.28] as const;

const TAU = Math.PI * 2;

export const synthesizeBabble = (
  syllables: readonly Syllable[],
  seconds: number,
  voice: BabbleVoice,
  delivery: Delivery,
  question: boolean,
  sr: number,
  seed: string,
): Float32Array => {
  const rng = makeRng(`babble-${seed}`);
  const n = samples(seconds, sr);
  const source = new Float32Array(n);
  const hiss = new Float32Array(n);
  const f1 = new Float32Array(n);
  const f2 = new Float32Array(n);
  const f3 = new Float32Array(n);
  const total = Math.max(0.1, syllables[syllables.length - 1]?.end ?? seconds);
  const energy = delivery === 'shout' ? 1.25 : delivery === 'whisper' ? 0.55 : delivery === 'drowsy' ? 0.8 : 1;
  const breath = Math.min(0.95, voice.breath + (delivery === 'whisper' ? 0.6 : 0));

  // Per-syllable pitch targets: a falling phrase line, stressed bumps, a lift on questions.
  const targets = syllables.map((s, i) => {
    const along = s.start / total;
    let semis = voice.range * (0.5 - along) * 0.8 + (s.stress - 0.6) * voice.range * 0.6 + (rng() - 0.5) * voice.range * 0.25;
    if (question && i >= syllables.length - 2) {
      semis += voice.range * 0.9;
    }
    return voice.pitch * 2 ** (semis / 12);
  });

  let phase = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    while (k < syllables.length - 1 && t > syllables[k].end) {
      k++;
    }
    const s = syllables[k];
    if (!s) {
      break;
    }
    const len = s.end - s.start;
    const local = t - s.start;
    const attack = Math.min(0.025, len * 0.3);
    const release = Math.min(0.04, len * 0.4);
    const gate = local < 0 || local > len ? 0 : Math.min(1, local / attack, (len - local) / release);
    // Glide from the previous syllable's pitch, then hold.
    const prev = targets[Math.max(0, k - 1)];
    const g = Math.min(1, Math.max(0, local / Math.max(0.01, len * 0.4)));
    const vib = voice.vibrato ? 2 ** ((voice.vibrato * Math.sin(TAU * 5.5 * t)) / 12) : 1;
    const f0 = (prev + (targets[k] - prev) * g) * vib;

    const dt = f0 / sr;
    phase += dt;
    phase -= Math.floor(phase);
    const pulse = 2 * phase - 1;
    const onsetLen = Math.min(0.05, len * 0.35);
    const inOnset = local >= 0 && local < onsetLen;
    const voicedGate = s.onset === 'closed' && inOnset ? 0.25 : gate;
    source[i] = pulse * voicedGate * (1 - breath * 0.7) * s.stress * energy;
    const breathNoise = (rng() * 2 - 1) * gate * breath * 0.5;
    source[i] += breathNoise;
    if (inOnset && (s.onset === 'teeth' || s.onset === 'stop')) {
      const burst = s.onset === 'teeth' ? 1 - local / onsetLen : Math.max(0, 1 - local / 0.015);
      hiss[i] = (rng() * 2 - 1) * burst * 0.35 * energy;
    }
    // Formant targets for this sample, smoothed later by the filters themselves.
    const fm = FORMANTS[s.vowel];
    f1[i] = fm[0] * voice.formant;
    f2[i] = fm[1] * voice.formant;
    f3[i] = fm[2] * voice.formant;
  }

  const out = new Float32Array(n);
  [f1, f2, f3].forEach((track, j) => {
    const q = j === 0 ? 5 : j === 1 ? 7 : 9;
    const band = filter(source, sr, 'bandpass', (t) => track[Math.min(n - 1, Math.floor(t * sr))], q);
    for (let i = 0; i < n; i++) {
      out[i] += band[i] * FORMANT_GAIN[j] * 2.2;
    }
  });
  const sibilance = filter(hiss, sr, 'highpass', 3800);
  for (let i = 0; i < n; i++) {
    out[i] += sibilance[i];
  }
  // Keep the body of the voice, lose the DC and mud.
  return normalize(filter(out, sr, 'highpass', Math.max(60, voice.pitch * 0.6)), 0.85);
};
