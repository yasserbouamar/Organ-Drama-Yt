import {audioBufferToDataUrl} from '@remotion/media-utils';
import type {SfxId} from '../types/audio';
import {
  fadeEdges,
  filter,
  glide,
  hump,
  makeRng,
  mix,
  noise,
  normalize,
  partials,
  perc,
  ramp,
  type Rng,
  samples,
  saturate,
  tone,
} from './dsp';

/**
 * Procedural sound effects: every cue in the script has a recipe here, built
 * from oscillators, noise and filters (no samples). `npm run audio` bakes
 * them to `public/audio/sfx/<id>.wav`; when a file is missing, `SFXPlayer`
 * synthesizes the same recipe in the browser and plays it through a Web
 * Audio `AudioBuffer`. Remotion only renders sound that comes from `<Audio>`
 * sources, so the buffer is converted to a `data:` URL instead of being
 * played live — that way it reaches the rendered MP4 too.
 */

interface RecipeContext {
  sr: number;
  seconds: number;
  rng: Rng;
}

type Recipe = (ctx: RecipeContext) => Float32Array;

const buffer = (ctx: RecipeContext): Float32Array => new Float32Array(samples(ctx.seconds, ctx.sr));

/** A click: a few ms of bright noise plus a resonant ping. */
const click = (ctx: RecipeContext, ping: number, decay = 0.02, gain = 1): Float32Array => {
  const {sr, rng} = ctx;
  const out = new Float32Array(samples(decay * 6, sr));
  mix(out, filter(noise(sr, 0.008, rng, 'white', perc(0.0005, 0.002)), sr, 'highpass', 1800), sr, 0, 0.9 * gain);
  mix(out, partials(sr, decay * 6, ping, [[1, 0.6, decay], [1.53, 0.35, decay * 0.7], [2.21, 0.2, decay * 0.5]], 0.0005), sr, 0, gain);
  return out;
};

/** A short rising "bloop", the building block of bubbles and drips. */
const bloop = (ctx: RecipeContext, from: number, to: number, length: number, gain = 1): Float32Array =>
  tone(ctx.sr, length * 2.5, glide(from, to, length), 'sine', perc(0.002, length * 0.6, gain));

const RECIPES: Record<SfxId, Recipe> = {
  /** Mains hum of a digital alarm clock plus its "bip-bip" on the hour. */
  clock_tick: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    const env = ramp([[0, 0], [0.25, 1], [seconds - 0.4, 1], [seconds, 0]]);
    mix(out, tone(sr, seconds, 100, 'sine', env), sr, 0, 0.16);
    mix(out, tone(sr, seconds, 200, 'triangle', env), sr, 0, 0.05);
    mix(out, tone(sr, seconds, 300, 'sine', env), sr, 0, 0.03);
    for (const at of [0.08, 0.3, 1.08, 1.3]) {
      const beep = filter(tone(sr, 0.09, 2093, 'square', ramp([[0, 0], [0.004, 1], [0.07, 1], [0.09, 0]])), sr, 'lowpass', 4500);
      mix(out, beep, sr, at, at < 1 ? 0.22 : 0.12);
    }
    return out;
  },

  /** A blanket thrown back: a band of pink noise sweeping up and down, plus fabric crackle. */
  whoosh_soft: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    const body = noise(sr, seconds, rng, 'pink', hump(seconds));
    mix(out, filter(body, sr, 'bandpass', (t) => 500 + 2200 * Math.sin((Math.PI * t) / seconds) ** 1.5, 0.9), sr, 0, 1.4);
    const crackle = noise(sr, seconds, rng, 'white', (t) => (rng() < 0.02 ? 1 : 0.05) * hump(seconds)(t));
    mix(out, filter(crackle, sr, 'highpass', 3200), sr, 0, 0.25);
    return out;
  },

  /** Cardboard lid creak: stick-slip pulses through two woody resonances. */
  box_creak: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const pulses = new Float32Array(samples(seconds, sr));
    let t = 0.02;
    while (t < seconds - 0.08) {
      const rate = 70 + 70 * (t / seconds) + (rng() - 0.5) * 25;
      const i = Math.round(t * sr);
      pulses[i] = (0.6 + rng() * 0.4) * hump(seconds - 0.05)(t);
      t += 1 / rate;
    }
    const out = buffer(ctx);
    mix(out, filter(pulses, sr, 'bandpass', 640, 7), sr, 0, 6);
    mix(out, filter(pulses, sr, 'bandpass', 1450, 9), sr, 0, 4);
    mix(out, filter(pulses, sr, 'bandpass', 2900, 10), sr, 0, 1.5);
    return saturate(out, 1.3);
  },

  /** Magical golden chime: a rising bell arpeggio with sparkles on top. */
  chime_sparkle: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    const notes = [1568, 2093, 2637, 3136, 4186];
    notes.forEach((f, i) => {
      const bell = partials(sr, seconds - i * 0.07, f, [[1, 0.5, 0.7], [2, 0.18, 0.35], [3.01, 0.08, 0.2], [4.2, 0.05, 0.12]]);
      mix(out, bell, sr, i * 0.07, 0.7);
    });
    for (let i = 0; i < 26; i++) {
      const at = 0.05 + rng() * (seconds * 0.7);
      const f = 3500 + rng() * 4000;
      mix(out, partials(sr, 0.25, f, [[1, 0.25, 0.05]]), sr, at, 0.6 * (1 - at / seconds));
    }
    mix(out, filter(noise(sr, seconds, rng, 'white', perc(0.05, 0.5)), sr, 'highpass', 7000), sr, 0, 0.05);
    return out;
  },

  /** Padlock snapping shut: a light catch, then the main metallic snap. */
  lock_click: (ctx) => {
    const {sr} = ctx;
    const out = buffer(ctx);
    mix(out, click(ctx, 3600, 0.012, 0.4), sr, 0);
    mix(out, click(ctx, 3100, 0.03, 1), sr, 0.055);
    mix(out, tone(sr, 0.1, glide(220, 150, 0.04), 'sine', perc(0.001, 0.025)), sr, 0.055, 0.7);
    return out;
  },

  /** Three heavy knocks on a door: low thump, woody body, knuckle click. */
  heavy_knock: (ctx) => {
    const {sr, rng} = ctx;
    const out = buffer(ctx);
    [0, 0.22, 0.44].forEach((at, i) => {
      const g = i === 2 ? 1 : 0.85;
      mix(out, tone(sr, 0.35, glide(110, 62, 0.12), 'sine', perc(0.002, 0.09)), sr, at, g);
      const wood = noise(sr, 0.2, rng, 'white', perc(0.001, 0.035));
      mix(out, filter(wood, sr, 'bandpass', 190, 3), sr, at, 2.5 * g);
      mix(out, filter(wood, sr, 'bandpass', 360, 4), sr, at, 1.6 * g);
      mix(out, filter(noise(sr, 0.01, rng, 'white', perc(0.0005, 0.002)), sr, 'highpass', 1500), sr, at, 0.35 * g);
    });
    return saturate(out, 1.6);
  },

  /** Splash: a falling noise burst, a low "sploosh" and scattered droplets. */
  liquid_splash: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    const burst = noise(sr, seconds, rng, 'white', perc(0.004, 0.16));
    mix(out, filter(burst, sr, 'lowpass', glide(7000, 700, 0.35), 0.9), sr, 0, 0.8);
    mix(out, tone(sr, 0.4, glide(140, 70, 0.2), 'sine', perc(0.003, 0.1)), sr, 0, 0.6);
    for (let i = 0; i < 9; i++) {
      const at = 0.04 + rng() * 0.55;
      const f = 450 + rng() * 700;
      mix(out, bloop(ctx, f, f * (2 + rng()), 0.025 + rng() * 0.02), sr, at, 0.35 * (1 - at));
    }
    return out;
  },

  /** A bubble surfacing and popping, then a smaller one. */
  bubble_pop: (ctx) => {
    const {sr} = ctx;
    const out = buffer(ctx);
    mix(out, bloop(ctx, 380, 1400, 0.045), sr, 0, 0.9);
    mix(out, click(ctx, 2600, 0.006, 0.25), sr, 0.045);
    mix(out, bloop(ctx, 620, 1900, 0.03), sr, 0.11, 0.5);
    return out;
  },

  /** Cartoon gulp: a gurgly "gl" then a falling throaty "ulp". */
  cartoon_gulp: (ctx) => {
    const {sr} = ctx;
    const out = buffer(ctx);
    mix(out, tone(sr, 0.12, glide(820, 260, 0.06), 'sine', perc(0.003, 0.035)), sr, 0, 0.6);
    const throat = tone(sr, 0.36, glide(150, 78, 0.3), 'saw', perc(0.012, 0.11));
    mix(out, filter(throat, sr, 'lowpass', glide(1500, 320, 0.3), 2.5), sr, 0.06, 0.9);
    mix(out, filter(throat, sr, 'bandpass', 600, 3), sr, 0.06, 0.6);
    mix(out, bloop(ctx, 300, 700, 0.03, 0.6), sr, 0.3);
    return saturate(out, 1.4);
  },

  /** A stopwatch running at time-lapse speed: alternating tick/tock with a whirr under it. */
  stopwatch_tick: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    const rate = 7.5;
    for (let i = 0; i * (1 / rate) < seconds - 0.05; i++) {
      mix(out, click(ctx, i % 2 === 0 ? 3500 : 2600, 0.008, i % 2 === 0 ? 0.55 : 0.4), sr, i / rate);
    }
    const whirr = filter(tone(sr, seconds, 58, 'saw', ramp([[0, 0], [0.2, 1], [seconds - 0.2, 1], [seconds, 0]])), sr, 'lowpass', 400);
    mix(out, whirr, sr, 0, 0.05);
    return out;
  },

  /** Kitchen-timer bell: inharmonic partials with a long ring. */
  bell_ding: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    mix(
      out,
      partials(sr, seconds, 1318.5, [
        [0.5, 0.25, 0.9],
        [1, 0.6, 0.7],
        [1.19, 0.25, 0.45],
        [1.5, 0.18, 0.4],
        [2.0, 0.2, 0.3],
        [2.74, 0.1, 0.18],
        [3.76, 0.06, 0.1],
      ]),
      sr,
      0,
    );
    mix(out, click(ctx, 4200, 0.01, 0.3), sr, 0);
    return out;
  },

  /** Comic two-tone car horn: "beep beep". */
  horn_beep: (ctx) => {
    const {sr} = ctx;
    const out = buffer(ctx);
    for (const at of [0, 0.26]) {
      const env = ramp([[0, 0], [0.01, 1], [0.17, 0.9], [0.2, 0]]);
      const pitch = (f: number) => (t: number) => f * (1 + 0.01 * Math.sin(t * 40)) * (t > 0.15 ? 0.97 : 1);
      const horn = new Float32Array(samples(0.2, sr));
      mix(horn, tone(sr, 0.2, pitch(370), 'square', env), sr, 0, 0.5);
      mix(horn, tone(sr, 0.2, pitch(466), 'square', env), sr, 0, 0.5);
      const shaped = filter(filter(horn, sr, 'lowpass', 2600), sr, 'peak', 1200, 1.2, 8);
      mix(out, shaped, sr, at, 0.6);
    }
    return saturate(out, 1.8);
  },

  /** Flopping onto a mattress: a soft thud, a puff of air and creaky springs. */
  flomp_bounce: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    mix(out, tone(sr, 0.5, glide(90, 42, 0.15), 'sine', perc(0.004, 0.16)), sr, 0, 1);
    mix(out, filter(noise(sr, 0.4, rng, 'pink', perc(0.005, 0.1)), sr, 'lowpass', 700), sr, 0, 0.9);
    const springs = tone(sr, seconds - 0.05, (t) => 190 * (1 + 0.06 * Math.sin(t * 2 * Math.PI * 9) * Math.exp(-t * 4)), 'triangle', perc(0.01, 0.22));
    mix(out, filter(springs, sr, 'bandpass', 800, 1.5), sr, 0.05, 0.5);
    for (const at of [0.12, 0.3, 0.45]) {
      mix(out, filter(noise(sr, 0.08, rng, 'white', perc(0.002, 0.02)), sr, 'bandpass', 2400, 6), sr, at, 0.5);
    }
    return saturate(out, 1.5);
  },

  /** Acid sloshing in a tipped stomach: rolling low noise waves and gurgles. */
  liquid_slosh: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    const waves = noise(sr, seconds, rng, 'brown', (t) => (0.35 + 0.65 * Math.max(0, Math.sin(t * 2 * Math.PI * 2.1)) ** 2) * hump(seconds)(t));
    mix(out, filter(waves, sr, 'lowpass', (t) => 500 + 450 * Math.sin(t * 2 * Math.PI * 2.1), 1.2), sr, 0, 1.2);
    for (let i = 0; i < 12; i++) {
      const at = rng() * (seconds - 0.2);
      const f = 180 + rng() * 260;
      mix(out, bloop(ctx, f, f * 2.4, 0.05 + rng() * 0.03), sr, at, 0.3);
    }
    return out;
  },

  /** Acid sizzling: bright hiss with crackles and bubbling pops. */
  acid_sizzle: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    const swell = ramp([[0, 0], [0.15, 1], [seconds - 0.5, 0.8], [seconds, 0]]);
    mix(out, filter(noise(sr, seconds, rng, 'white', swell), sr, 'highpass', 3500), sr, 0, 0.35);
    const crackles = noise(sr, seconds, rng, 'white', (t) => (rng() < 0.004 ? 1 : 0) * swell(t));
    mix(out, filter(crackles, sr, 'bandpass', 5200, 1.2), sr, 0, 2.5);
    for (let t = 0.05; t < seconds - 0.2; t += 0.07 + rng() * 0.09) {
      const f = 260 + rng() * 300;
      mix(out, bloop(ctx, f, f * 3, 0.03), sr, t, 0.25 * swell(t));
    }
    return out;
  },

  /** Cartoon two-tone siren: "wee-woo". */
  cartoon_alarm: (ctx) => {
    const {sr, seconds} = ctx;
    const freq = (t: number) => {
      const phase = (t * 2) % 1;
      const target = phase < 0.5 ? 880 : 660;
      return target * (1 + 0.012 * Math.sin(t * 2 * Math.PI * 6));
    };
    const env = ramp([[0, 0], [0.05, 1], [seconds - 0.15, 1], [seconds, 0]]);
    const out = buffer(ctx);
    mix(out, tone(sr, seconds, freq, 'triangle', env), sr, 0, 0.6);
    mix(out, filter(tone(sr, seconds, freq, 'square', env), sr, 'lowpass', 2200), sr, 0, 0.25);
    return out;
  },

  /** Morning: a warm marimba arpeggio over a soft pad, with two bird chirps. */
  morning_chime: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      mix(out, partials(sr, seconds - i * 0.09, f, [[1, 0.55, 0.55], [3.93, 0.12, 0.08], [9.2, 0.03, 0.03]]), sr, i * 0.09, 0.7);
    });
    const pad = ramp([[0, 0], [0.4, 1], [seconds - 0.4, 0.6], [seconds, 0]]);
    for (const f of [261.63, 329.63, 392]) {
      mix(out, filter(tone(sr, seconds, f, 'triangle', pad), sr, 'lowpass', 1200), sr, 0, 0.08);
    }
    for (const at of [0.7, 0.82, 1.15]) {
      mix(out, tone(sr, 0.09, glide(2800, 4600, 0.05), 'sine', perc(0.004, 0.025)), sr, at, 0.18);
    }
    return out;
  },

  /** Ratchet: a run of quick metallic clicks that rises in pitch. */
  gear_ratchet: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    const count = 11;
    for (let i = 0; i < count; i++) {
      const at = (i / count) * (seconds - 0.08);
      mix(out, click(ctx, 1900 + i * 60, 0.012, 0.8), sr, at);
      mix(out, tone(sr, 0.04, 320, 'sine', perc(0.001, 0.01)), sr, at, 0.3);
    }
    return out;
  },

  /** "Boi-oi-oing": a spring whose pitch climbs while its wobble dies out. */
  boing_jump: (ctx) => {
    const {sr, seconds} = ctx;
    const out = buffer(ctx);
    const freq = (t: number) => (130 + 300 * Math.min(1, t / 0.3) ** 0.7) * (1 + 0.09 * Math.sin(t * 2 * Math.PI * 13) * Math.exp(-t * 3));
    mix(out, tone(sr, seconds, freq, 'sine', perc(0.004, 0.22)), sr, 0, 0.9);
    mix(out, tone(sr, seconds, (t) => freq(t) * 2, 'triangle', perc(0.004, 0.12)), sr, 0, 0.2);
    return out;
  },

  /** "Ba-dum-tss": two toms and a snare with a cymbal splash. */
  comic_rimshot: (ctx) => {
    const {sr, seconds, rng} = ctx;
    const out = buffer(ctx);
    mix(out, tone(sr, 0.3, glide(200, 120, 0.1), 'sine', perc(0.002, 0.1)), sr, 0, 0.8);
    mix(out, tone(sr, 0.3, glide(150, 90, 0.1), 'sine', perc(0.002, 0.12)), sr, 0.13, 0.85);
    const at = 0.27;
    mix(out, filter(noise(sr, 0.25, rng, 'white', perc(0.001, 0.07)), sr, 'bandpass', 1900, 0.8), sr, at, 0.9);
    mix(out, tone(sr, 0.15, 220, 'triangle', perc(0.001, 0.05)), sr, at, 0.4);
    const cymbal = noise(sr, seconds - at, rng, 'white', perc(0.002, 0.18));
    mix(out, filter(cymbal, sr, 'highpass', 6500), sr, at, 0.55);
    mix(out, filter(cymbal, sr, 'bandpass', 9000, 2), sr, at, 0.4);
    return out;
  },
};

/** Default length of each effect when it isn't fitted to a cue. */
export const SFX_DEFAULT_SECONDS: Record<SfxId, number> = {
  clock_tick: 2,
  whoosh_soft: 0.75,
  box_creak: 0.8,
  chime_sparkle: 1.8,
  lock_click: 0.4,
  heavy_knock: 1,
  liquid_splash: 0.9,
  bubble_pop: 0.27,
  cartoon_gulp: 0.47,
  stopwatch_tick: 2.67,
  bell_ding: 1.5,
  horn_beep: 0.67,
  flomp_bounce: 0.87,
  liquid_slosh: 1.2,
  acid_sizzle: 2,
  cartoon_alarm: 2,
  morning_chime: 1.83,
  gear_ratchet: 0.67,
  boing_jump: 0.67,
  comic_rimshot: 0.67,
};

/** Renders one effect to mono samples, normalised and de-clicked. Deterministic per id. */
export const synthesizeSfx = (id: SfxId, sr: number, seconds = SFX_DEFAULT_SECONDS[id]): Float32Array => {
  const out = normalize(RECIPES[id]({sr, seconds, rng: makeRng(`sfx-${id}`)}), 0.89);
  // Match the voiceover's loudness (~-18 dBFS RMS over the audible part), so a
  // cue's `volume` reads as "relative to dialogue". Peak-normalised clicks are
  // lifted (soft saturation catches the peaks); sustained tones are pulled down.
  const win = Math.max(1, Math.round(sr * 0.01));
  const frames: number[] = [];
  for (let i = 0; i + win <= out.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) {
      e += out[j] * out[j];
    }
    frames.push(e / win);
  }
  const loudest = Math.max(...frames);
  const active = frames.filter((e) => e > loudest * 1e-4);
  const rms = Math.sqrt(active.reduce((a, b) => a + b, 0) / Math.max(1, active.length));
  const gain = Math.min(2.5, Math.max(0.2, 0.125 / Math.max(1e-6, rms)));
  for (let i = 0; i < out.length; i++) {
    out[i] *= gain;
  }
  if (gain > 1) {
    normalize(saturate(out, 1.2), 0.89);
  }
  return fadeEdges(out, sr, 0.001, Math.min(0.08, seconds * 0.15));
};

// ── Browser bridge ───────────────────────────────────────────────────────

/** Sample rate for sounds synthesized in the browser (smaller data URLs). */
export const LIVE_SAMPLE_RATE = 22050;

const urlCache = new Map<string, string>();

/**
 * Wraps synthesized channels in a Web Audio `AudioBuffer` and returns it as
 * a WAV `data:` URL that `<Audio>` can play and Remotion can render. Cached
 * per key, so each sound is synthesized once per browser tab.
 */
export const synthesizedDataUrl = (key: string, sr: number, render: () => readonly Float32Array[]): string => {
  const cached = urlCache.get(key);
  if (cached) {
    return cached;
  }
  const channels = render();
  const audio = new AudioBuffer({length: channels[0].length, numberOfChannels: channels.length, sampleRate: sr});
  channels.forEach((data, i) => audio.copyToChannel(Float32Array.from(data), i));
  const url = audioBufferToDataUrl(audio);
  urlCache.set(key, url);
  return url;
};

/** Live fallback for an effect whose file is missing. */
export const sfxDataUrl = (id: SfxId, seconds: number): string =>
  synthesizedDataUrl(`sfx-${id}-${seconds.toFixed(3)}`, LIVE_SAMPLE_RATE, () => [synthesizeSfx(id, LIVE_SAMPLE_RATE, seconds)]);
