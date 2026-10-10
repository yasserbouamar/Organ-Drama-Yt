/**
 * A tiny, dependency-free DSP kit. Everything works on plain `Float32Array`s,
 * so the same synth code runs in Node (where `npm run audio` bakes WAV files)
 * and in the browser (where a missing file is synthesized on the fly and
 * handed to Web Audio as an `AudioBuffer`). Output is deterministic: noise
 * comes from a seeded PRNG, never `Math.random()`.
 */

const TAU = Math.PI * 2;

export type Rng = () => number;

/** Seeded PRNG (mulberry32), uniform in [0, 1). */
export const makeRng = (seed: string): Rng => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const samples = (seconds: number, sr: number): number => Math.max(1, Math.round(seconds * sr));

export const midiToHz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

// ── Envelopes (t in seconds from the start of the sound) ─────────────────

export type Env = (t: number) => number;

/** Linear attack, exponential decay with time constant `decay`. */
export const perc =
  (attack: number, decay: number, peak = 1): Env =>
  (t) => {
    if (t < 0) {
      return 0;
    }
    return peak * (t < attack ? t / attack : Math.exp(-(t - attack) / decay));
  };

/** Piecewise-linear envelope through `[time, value]` points. */
export const ramp =
  (points: readonly (readonly [number, number])[]): Env =>
  (t) => {
    if (t <= points[0][0]) {
      return points[0][1];
    }
    for (let i = 1; i < points.length; i++) {
      const [t1, v1] = points[i];
      const [t0, v0] = points[i - 1];
      if (t <= t1) {
        return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-9, t1 - t0);
      }
    }
    return points[points.length - 1][1];
  };

/** A smooth hump: 0 → 1 → 0 over `length` seconds (sin²). */
export const hump =
  (length: number): Env =>
  (t) =>
    t < 0 || t > length ? 0 : Math.sin((Math.PI * t) / length) ** 2;

/** Exponential glide from `a` to `b` Hz over `time` seconds, then hold. */
export const glide =
  (a: number, b: number, time: number): Env =>
  (t) =>
    a * (b / a) ** Math.min(1, Math.max(0, t / time));

// ── Generators ────────────────────────────────────────────────────────────

export type Wave = 'sine' | 'triangle' | 'square' | 'saw';

/** PolyBLEP residual: rounds off the discontinuities of saw/square to tame aliasing. */
const polyBlep = (p: number, dt: number): number => {
  if (p < dt) {
    const x = p / dt;
    return x + x - x * x - 1;
  }
  if (p > 1 - dt) {
    const x = (p - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
};

/** An oscillator with a (possibly moving) frequency and an amplitude envelope. */
export const tone = (sr: number, seconds: number, freq: number | Env, wave: Wave, amp: Env): Float32Array => {
  const n = samples(seconds, sr);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const f = typeof freq === 'number' ? freq : freq(t);
    const dt = Math.min(0.5, f / sr);
    let v: number;
    switch (wave) {
      case 'sine':
        v = Math.sin(TAU * phase);
        break;
      case 'triangle':
        v = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'saw':
        v = 2 * phase - 1 - polyBlep(phase, dt);
        break;
      case 'square':
        v = (phase < 0.5 ? 1 : -1) + polyBlep(phase, dt) - polyBlep((phase + 0.5) % 1, dt);
        break;
    }
    out[i] = v * amp(t);
    phase += dt;
    phase -= Math.floor(phase);
  }
  return out;
};

/** Sum of sine partials `[ratio, gain, decay]` over a fundamental: bells, chimes, marimbas. */
export const partials = (
  sr: number,
  seconds: number,
  fundamental: number,
  spec: readonly (readonly [number, number, number])[],
  attack = 0.002,
): Float32Array => {
  const out = new Float32Array(samples(seconds, sr));
  for (const [ratio, gain, decay] of spec) {
    const f = fundamental * ratio;
    if (f >= sr / 2) {
      continue;
    }
    mix(out, tone(sr, seconds, f, 'sine', perc(attack, decay, gain)), sr, 0);
  }
  return out;
};

export type NoiseColor = 'white' | 'pink' | 'brown';

export const noise = (sr: number, seconds: number, rng: Rng, color: NoiseColor = 'white', amp: Env = () => 1): Float32Array => {
  const n = samples(seconds, sr);
  const out = new Float32Array(n);
  // Paul Kellet's economy pink filter; brown is leaky-integrated white.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const w = rng() * 2 - 1;
    let v = w;
    if (color === 'pink') {
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      v = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    } else if (color === 'brown') {
      brown = (brown + 0.02 * w) / 1.02;
      v = brown * 3.5;
    }
    out[i] = v * amp(i / sr);
  }
  return out;
};

/**
 * Karplus–Strong plucked string. `brightness` (0..1) colours the initial
 * noise burst; `sustain` (0..1) is how long the string rings.
 */
export const pluck = (sr: number, freq: number, seconds: number, rng: Rng, brightness = 0.6, sustain = 0.996): Float32Array => {
  const n = samples(seconds, sr);
  const out = new Float32Array(n);
  const period = Math.max(2, Math.round(sr / freq));
  const line = new Float32Array(period);
  let lp = 0;
  for (let i = 0; i < period; i++) {
    lp += brightness * (rng() * 2 - 1 - lp);
    line[i] = lp;
  }
  let mean = 0;
  for (let i = 0; i < period; i++) {
    mean += line[i] / period;
  }
  for (let i = 0; i < period; i++) {
    line[i] -= mean;
  }
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = line[idx];
    const b = line[(idx + 1) % period];
    out[i] = a;
    line[idx] = sustain * 0.5 * (a + b);
    idx = (idx + 1) % period;
  }
  return out;
};

// ── Filters ───────────────────────────────────────────────────────────────

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'peak';

/**
 * RBJ-cookbook biquad. `freq` may move over time (coefficients are refreshed
 * every 16 samples). Bandpass has 0 dB peak gain.
 */
export const filter = (input: Float32Array, sr: number, type: FilterType, freq: number | Env, q = 0.707, gainDb = 0): Float32Array => {
  const out = new Float32Array(input.length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let a1 = 0;
  let a2 = 0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const update = (t: number) => {
    const f = Math.min(sr * 0.45, Math.max(20, typeof freq === 'number' ? freq : freq(t)));
    const w = (TAU * f) / sr;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let a0: number;
    if (type === 'lowpass') {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else if (type === 'highpass') {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else if (type === 'bandpass') {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cos;
      a2 = 1 - alpha;
    } else {
      const A = 10 ** (gainDb / 40);
      b0 = 1 + alpha * A;
      b1 = -2 * cos;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cos;
      a2 = 1 - alpha / A;
    }
    b0 /= a0;
    b1 /= a0;
    b2 /= a0;
    a1 /= a0;
    a2 /= a0;
  };
  update(0);
  const moving = typeof freq !== 'number';
  for (let i = 0; i < input.length; i++) {
    if (moving && i % 16 === 0) {
      update(i / sr);
    }
    const x = input[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
};

// ── Mixing ────────────────────────────────────────────────────────────────

/** Adds `src` into `out` starting at `at` seconds. */
export const mix = (out: Float32Array, src: Float32Array, sr: number, at: number, gain = 1): Float32Array => {
  const offset = Math.round(at * sr);
  const end = Math.min(out.length, offset + src.length);
  for (let i = Math.max(0, offset); i < end; i++) {
    out[i] += src[i - offset] * gain;
  }
  return out;
};

/** Short fades at both ends so nothing clicks. */
export const fadeEdges = (buf: Float32Array, sr: number, fadeIn = 0.003, fadeOut = 0.04): Float32Array => {
  const a = samples(fadeIn, sr);
  const b = Math.min(buf.length, samples(fadeOut, sr));
  for (let i = 0; i < Math.min(a, buf.length); i++) {
    buf[i] *= i / a;
  }
  for (let i = 0; i < b; i++) {
    buf[buf.length - 1 - i] *= i / b;
  }
  return buf;
};

/** Gentle tanh saturation (glues layered sounds, rounds peaks). */
export const saturate = (buf: Float32Array, drive = 1.5): Float32Array => {
  const norm = Math.tanh(drive);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.tanh(buf[i] * drive) / norm;
  }
  return buf;
};

export const normalize = (buf: Float32Array, peak = 0.89): Float32Array => {
  let max = 0;
  for (let i = 0; i < buf.length; i++) {
    max = Math.max(max, Math.abs(buf[i]));
  }
  if (max > 0) {
    const g = peak / max;
    for (let i = 0; i < buf.length; i++) {
      buf[i] *= g;
    }
  }
  return buf;
};

/** 16-bit PCM WAV bytes for one or more equal-length channels. */
export const encodeWav = (channels: readonly Float32Array[], sr: number): Uint8Array => {
  const n = channels[0].length;
  const nch = channels.length;
  const dataBytes = n * nch * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, nch, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * nch * 2, true);
  view.setUint16(32, nch * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, dataBytes, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  }
  return bytes;
};
