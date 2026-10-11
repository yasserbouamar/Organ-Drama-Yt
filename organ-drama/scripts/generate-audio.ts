/**
 * Generates every sound "Organ Drama: Midnight Pizza" uses.
 *
 *   npm run audio                               # voiceover + SFX + music (skips what exists)
 *   npm run audio -- --force                    # redo everything
 *   npm run audio -- --only s2-pizza-hi --force # re-voice one line
 *   npm run audio -- --provider kokoro          # elevenlabs | edge | kokoro | procedural | auto
 *   npm run audio -- --skip-vo --skip-sfx --skip-bgm
 *   npm run audio -- --dry-run                  # print the plan, write nothing
 *   npm run audio -- --script remake            # voice the reference-remake test instead of the pilot
 *
 * Voiceover providers, tried in order (`auto`), per line:
 *   1. ElevenLabs, when ELEVENLABS_API_KEY is set (shell or .env).
 *   2. edge-tts (Microsoft Edge's free online voices): the `edge-tts` CLI from
 *      `pip install edge-tts` if it's on PATH, else `npx node-edge-tts`.
 *   3. Kokoro-82M, offline on the CPU, after `npm run audio:kokoro-setup`.
 *   4. Procedural babble: synthesized speech-like tones. Always works.
 *
 * Each take is trimmed, its long pauses tightened, pitched/coloured for the
 * character, fitted inside its script window (re-synthesized faster when the
 * provider supports it, then time-stretched), loudness-normalised and written
 * to `public/audio/vo/<line-id>.mp3`. The finished audio is analysed into a
 * per-frame viseme track and word timings for `src/data/voiceover.generated.ts`.
 *
 * Sound effects and the pizzicato loop are rendered from the same procedural
 * recipes the video uses as live fallbacks, into `public/audio/sfx/<id>.wav`
 * and `public/audio/bgm/bgm.wav` (the remake's music-box loop goes to
 * `public/audio/remake/bgm.wav`). Existing files are never overwritten without
 * --force, so a real recording dropped in their place wins.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {encodeWav, filter} from '../src/audio/dsp';
import {NIGHT_BPM, synthesizeNightLoop} from '../src/audio/nightMusic';
import {BGM_BPM, synthesizeBgmLoop} from '../src/audio/proceduralMusic';
import {synthesizeBabble} from '../src/audio/proceduralVoice';
import {synthesizeSfx} from '../src/audio/ProceduralSFX';
import {DIALOGUE, FPS, lineLength, SFX_CUES} from '../src/data/scriptData';
import {VOICE_CAST} from '../src/data/voiceCast';
import {VOICEOVER} from '../src/data/voiceover.generated';
import {REMAKE_CAST, REMAKE_DIALOGUE} from '../src/remake/remakeScript';
import {VOICEOVER as REMAKE_VOICEOVER} from '../src/remake/voiceover.generated';
import type {SfxId, VoiceoverClip, VoiceoverManifest, VoicePersona, VoiceProvider} from '../src/types/audio';
import type {DialogueLine, SpeakerId, WordTiming} from '../src/types/dialogue';
import {babblePlan} from '../src/utils/lipSync';
import {planSyllables} from '../src/utils/syllables';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const KOKORO_HELPER = path.join(ROOT, 'scripts', 'kokoro_tts.py');

const SR = 44100;
/** Frames of breathing room left at the end of every line window. */
const WINDOW_MARGIN = 2;
const TARGET_RMS_DB = -18;
const PEAK_DB = -1;
/** Pauses inside a take longer than this (s) are tightened, like trimming breaths in an edit. */
const MAX_PAUSE = 0.22;
/** Time-stretching beyond this starts to sound rushed; the script prints a warning. */
const TEMPO_WARNING = 1.3;

// ── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const option = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (existsSync(path.join(ROOT, '.env'))) {
  process.loadEnvFile(path.join(ROOT, '.env'));
}

const force = flag('force');
const dryRun = flag('dry-run');
const only = option('only')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const requested = (option('provider') ?? 'auto') as VoiceProvider | 'auto';

/** A script the generator can voice: its lines, cast, manifest and where its clips go. */
interface ScriptProject {
  dialogue: readonly DialogueLine[];
  cast: Record<SpeakerId, VoicePersona>;
  manifest: VoiceoverManifest;
  manifestPath: string;
  /** Clip folder inside `public/`. */
  voDir: string;
  /** Whether this script owns the baked SFX library. */
  bakesSfx: boolean;
  /** Its music loop: baked to `public/audio/<dir>/<name>.wav`. */
  music: {dir: string; name: string; label: string; synth: (sampleRate: number) => Float32Array[]};
}

const PROJECTS: Record<string, ScriptProject> = {
  pilot: {
    dialogue: DIALOGUE,
    cast: VOICE_CAST,
    manifest: VOICEOVER,
    manifestPath: path.join(ROOT, 'src', 'data', 'voiceover.generated.ts'),
    voDir: 'audio/vo',
    bakesSfx: true,
    music: {dir: 'bgm', name: 'bgm', label: `8-bar pizzicato loop, ${BGM_BPM} BPM`, synth: (sr) => synthesizeBgmLoop(sr, true)},
  },
  remake: {
    dialogue: REMAKE_DIALOGUE,
    cast: REMAKE_CAST,
    manifest: REMAKE_VOICEOVER,
    manifestPath: path.join(ROOT, 'src', 'remake', 'voiceover.generated.ts'),
    voDir: 'audio/remake/vo',
    bakesSfx: false,
    music: {dir: 'remake', name: 'bgm', label: `8-bar music-box loop, ${NIGHT_BPM} BPM`, synth: (sr) => synthesizeNightLoop(sr, true)},
  },
};

const scriptId = option('script') ?? 'pilot';
const PROJECT = PROJECTS[scriptId];
if (!PROJECT) {
  throw new Error(`Unknown --script "${scriptId}" (pilot or remake)`);
}
const SCRIPT = PROJECT.dialogue;
const CAST = PROJECT.cast;
const MANIFEST = PROJECT.manifestPath;

const log = (msg: string) => console.log(msg);

// ── ffmpeg ────────────────────────────────────────────────────────────────

/** System ffmpeg if present, otherwise the one bundled with Remotion. */
const findFfmpeg = (): string[] | null => {
  if (spawnSync('ffmpeg', ['-version']).status === 0) {
    return ['ffmpeg'];
  }
  if (spawnSync('npx', ['remotion', 'ffmpeg', '-version'], {cwd: ROOT}).status === 0) {
    return ['npx', 'remotion', 'ffmpeg'];
  }
  return null;
};

const FFMPEG = findFfmpeg();

const ffmpeg = (ffArgs: string[], input?: Buffer): Buffer => {
  if (!FFMPEG) {
    throw new Error('ffmpeg is not available');
  }
  const [cmd, ...pre] = FFMPEG;
  const res = spawnSync(cmd, [...pre, '-hide_banner', '-loglevel', 'error', '-y', ...ffArgs], {
    cwd: ROOT,
    input,
    maxBuffer: 1 << 29,
  });
  if (res.status !== 0) {
    throw new Error(`ffmpeg ${ffArgs.join(' ')} failed:\n${res.stderr?.toString()}`);
  }
  return res.stdout;
};

const asBuffer = (x: Float32Array): Buffer => Buffer.from(x.buffer, x.byteOffset, x.byteLength);
const asFloats = (b: Buffer): Float32Array => {
  const copy = new Uint8Array(b.byteLength);
  copy.set(b);
  return new Float32Array(copy.buffer, 0, Math.floor(b.byteLength / 4));
};

const RAW_IN = ['-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0'];
const RAW_OUT = ['-f', 'f32le', '-ar', String(SR), '-ac', '1', 'pipe:1'];

const decode = (file: string): Float32Array => asFloats(ffmpeg(['-i', file, ...RAW_OUT]));
const applyFilters = (x: Float32Array, filters: string[]): Float32Array =>
  filters.length === 0 ? x : asFloats(ffmpeg([...RAW_IN, '-af', filters.join(','), ...RAW_OUT], asBuffer(x)));

/** atempo only takes 0.5–2 per stage in older ffmpeg builds, so chain stages. */
const tempoFilters = (ratio: number): string[] => {
  const out: string[] = [];
  let r = ratio;
  while (r > 2) {
    out.push('atempo=2');
    r /= 2;
  }
  out.push(`atempo=${r.toFixed(5)}`);
  return out;
};

const pitchFilters = (semitones: number): string[] => {
  if (!semitones) {
    return [];
  }
  const f = 2 ** (semitones / 12);
  return [`asetrate=${Math.round(SR * f)}`, `aresample=${SR}`, ...tempoFilters(1 / f)];
};

// ── Signal helpers ────────────────────────────────────────────────────────

const HOP = Math.round(SR * 0.01);

const frameDb = (x: Float32Array, hop = HOP): Float32Array => {
  const n = Math.floor(x.length / hop);
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) {
      sum += x[j] * x[j];
    }
    db[i] = 10 * Math.log10(sum / hop + 1e-12);
  }
  return db;
};

const maxOf = (a: Float32Array): number => a.reduce((m, v) => Math.max(m, v), -Infinity);

/** Cuts leading/trailing silence, keeping a little air for soft onsets and releases. */
const trimSilence = (x: Float32Array, rangeDb = 45): Float32Array => {
  const db = frameDb(x);
  const floor = maxOf(db) - rangeDb;
  const active = [...db].flatMap((v, i) => (v > floor ? [i] : []));
  if (active.length === 0) {
    return x;
  }
  return x.slice(Math.max(0, (active[0] - 3) * HOP), Math.min(x.length, (active[active.length - 1] + 5) * HOP));
};

/** Shortens internal silences longer than `maxPause`, with short crossfades. */
const compressPauses = (x: Float32Array, maxPause = MAX_PAUSE): Float32Array => {
  const db = frameDb(x);
  const floor = maxOf(db) - 40;
  const keep = Math.round(maxPause / 0.01);
  const fade = Math.round(SR * 0.005);
  const parts: Float32Array[] = [];
  let cursor = 0;
  let i = 0;
  while (i < db.length) {
    if (db[i] > floor) {
      i++;
      continue;
    }
    let j = i;
    while (j < db.length && db[j] <= floor) {
      j++;
    }
    if (j - i > keep && i > 0 && j < db.length) {
      const cutFrom = (i + Math.floor(keep / 2)) * HOP;
      const cutTo = (j - Math.ceil(keep / 2)) * HOP;
      const head = x.slice(cursor, cutFrom);
      for (let k = 0; k < fade && k < head.length; k++) {
        const r = k / fade;
        head[head.length - fade + k] = head[head.length - fade + k] * (1 - r) + x[cutTo + k] * r;
      }
      parts.push(head);
      cursor = cutTo + fade;
    }
    i = j;
  }
  parts.push(x.slice(cursor));
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

/** Loudness-normalises the voiced part to TARGET_RMS_DB with a peak ceiling. */
const normaliseVoice = (x: Float32Array): Float32Array => {
  const db = frameDb(x);
  const floor = maxOf(db) - 35;
  let sum = 0;
  let count = 0;
  db.forEach((v, i) => {
    if (v > floor) {
      for (let j = i * HOP; j < (i + 1) * HOP; j++) {
        sum += x[j] * x[j];
      }
      count += HOP;
    }
  });
  const rms = Math.sqrt(sum / Math.max(1, count));
  let gain = 10 ** (TARGET_RMS_DB / 20) / Math.max(rms, 1e-9);
  const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0) * gain;
  const ceiling = 10 ** (PEAK_DB / 20);
  if (peak > ceiling) {
    gain *= ceiling / peak;
  }
  return x.map((v) => v * gain);
};

const mixTakes = (takes: Float32Array[]): Float32Array => {
  if (takes.length === 1) {
    return takes[0];
  }
  const out = new Float32Array(Math.max(...takes.map((t) => t.length)));
  for (const t of takes) {
    t.forEach((v, i) => (out[i] += v / Math.sqrt(takes.length)));
  }
  return out;
};

// ── Lip-sync analysis ─────────────────────────────────────────────────────

/**
 * One mouth code per video frame, from the audio itself: loudness opens the
 * mouth, a dark spectrum (energy below ~900 Hz) rounds it to "o", strong
 * 1–3 kHz energy (ee/eh) spreads it into a smile, and hiss closes it to teeth.
 */
const analyseVisemes = (x: Float32Array, frames: number): {codes: string; voiced: boolean[]} => {
  const spf = SR / FPS;
  const low = filter(x, SR, 'lowpass', 900);
  const mid = filter(filter(x, SR, 'highpass', 1000), SR, 'lowpass', 2800);
  const high = filter(x, SR, 'highpass', 3800);
  const rmsOf = (buf: Float32Array, f: number) => {
    let s = 0;
    const a = Math.floor(f * spf);
    const b = Math.min(buf.length, Math.floor((f + 1) * spf));
    for (let i = a; i < b; i++) {
      s += buf[i] * buf[i];
    }
    return Math.sqrt(s / Math.max(1, b - a));
  };
  const stats = Array.from({length: frames}, (_, f) => ({
    total: rmsOf(x, f),
    low: rmsOf(low, f),
    mid: rmsOf(mid, f),
    high: rmsOf(high, f),
  }));
  const maxTotal = Math.max(1e-9, ...stats.map((s) => s.total));
  const raw = stats.map((s) => {
    const level = 20 * Math.log10(s.total / maxTotal + 1e-9);
    if (level < -30) {
      return '-';
    }
    const hiss = s.high / (s.total + 1e-9);
    const brightness = s.mid / (s.low + 1e-9);
    if (hiss > 0.5 && level < -4) {
      return 'T';
    }
    if (level > -9) {
      return brightness < 0.22 ? 'O' : 'A';
    }
    if (level > -18) {
      return brightness > 0.6 ? 'E' : brightness < 0.2 ? 'O' : 'A';
    }
    return hiss > 0.3 ? 'T' : 'E';
  });
  // A three-frame majority filter stops single-frame flicker.
  const codes = raw.map((c, i) => {
    const a = raw[i - 1];
    const b = raw[i + 1];
    return a !== undefined && a === b && a !== c ? a : c;
  });
  return {codes: codes.join(''), voiced: codes.map((c) => c !== '-')};
};

/** Shares the voiced frames out among the words in proportion to their syllables. */
const wordTimings = (text: string, voiced: boolean[]): WordTiming[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = planSyllables(text, 1);
  const weights = words.map((_, i) => syllables.filter((s) => s.wordIndex === i).length + 0.4);
  const frames = voiced.flatMap((v, i) => (v ? [i] : []));
  if (frames.length === 0) {
    return words.map((w) => ({text: w, startFrame: 0, endFrame: 0}));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((w, i) => {
    const a = Math.min(frames.length - 1, Math.round((acc / total) * frames.length));
    acc += weights[i];
    const b = Math.max(a + 1, Math.min(frames.length, Math.round((acc / total) * frames.length)));
    return {text: w, startFrame: frames[a], endFrame: frames[b - 1] + 1};
  });
};

// ── Providers ─────────────────────────────────────────────────────────────

interface Take {
  key: string;
  line: DialogueLine;
  speaker: SpeakerId;
  /** Multiplier on the persona's own pace. */
  speed: number;
  /** Output path without extension. */
  base: string;
}

interface Provider {
  id: VoiceProvider;
  /** Highest `Take.speed` the provider can do natively (1 = no speed control). */
  maxSpeed: number;
  /** Pitch/FX from the cast sheet apply to this provider's raw voices. */
  colour: boolean;
  /** `null` when usable, otherwise why not. */
  probe: () => Promise<string | null>;
  synthesize: (takes: Take[]) => Promise<Map<string, string | Error>>;
}

const textFor = (line: DialogueLine): string => line.sayAs ?? line.text;

/** Audio synthesized in-process, so it can be used without decoding (and without ffmpeg). */
const synthesized = new Map<string, Float32Array>();

const eachTake = async (takes: Take[], run: (t: Take) => Promise<string>): Promise<Map<string, string | Error>> => {
  const out = new Map<string, string | Error>();
  for (const take of takes) {
    try {
      out.set(take.key, await run(take));
    } catch (err) {
      out.set(take.key, err instanceof Error ? err : new Error(String(err)));
    }
  }
  return out;
};

const elevenlabs: Provider = {
  id: 'elevenlabs',
  maxSpeed: 1.2,
  colour: false,
  probe: async () => (process.env.ELEVENLABS_API_KEY ? null : 'ELEVENLABS_API_KEY is not set'),
  synthesize: (takes) =>
    eachTake(takes, async (take) => {
      const persona = CAST[take.speaker].elevenlabs;
      const voiceId = process.env[`ELEVENLABS_VOICE_${take.speaker}`] ?? persona.voiceId;
      const speed = Math.min(1.2, Math.max(0.7, persona.settings.speed * take.speed));
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '', 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
        body: JSON.stringify({
          text: textFor(take.line),
          model_id: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
          voice_settings: {...persona.settings, speed, use_speaker_boost: true},
        }),
      });
      if (!res.ok) {
        throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
      }
      const file = `${take.base}.mp3`;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return file;
    }),
};

const percent = (s: string): number => Number.parseFloat(s) / 100;

/** `edge-tts` (pip) if installed, else `npx node-edge-tts`. */
const edgeCommand = (text: string, voice: string, rate: string, pitch: string, file: string): [string, string[]] =>
  spawnSync('edge-tts', ['--help']).status === 0
    ? ['edge-tts', ['--voice', voice, `--rate=${rate}`, `--pitch=${pitch}`, '--text', text, '--write-media', file]]
    : ['npx', ['--yes', 'node-edge-tts', '-t', text, '-f', file, '-v', voice, '-l', voice.slice(0, 5), '-r', rate, '--pitch', pitch, '--timeout', '20000']];

const edgeSynth = (text: string, voice: string, rate: string, pitch: string, file: string): void => {
  const [cmd, cmdArgs] = edgeCommand(text, voice, rate, pitch, file);
  const res = spawnSync(cmd, cmdArgs, {cwd: ROOT, timeout: 60_000});
  if (res.status !== 0 || !existsSync(file)) {
    const lines = (res.stderr?.toString() || res.error?.message || 'no output').split('\n').map((l) => l.trim());
    throw new Error(`edge-tts failed: ${lines.find((l) => /error|denied|refused|timeout/i.test(l)) ?? lines.find(Boolean)}`);
  }
};

const edge: Provider = {
  id: 'edge',
  maxSpeed: 1.6,
  colour: false,
  probe: async () => {
    const file = path.join(WORK, 'edge-probe.mp3');
    try {
      edgeSynth('Test.', 'en-US-AndrewNeural', '+0%', '+0Hz', file);
      return null;
    } catch (err) {
      return `edge-tts unavailable (${err instanceof Error ? err.message : err})`;
    }
  },
  synthesize: (takes) =>
    eachTake(takes, async (take) => {
      const persona = CAST[take.speaker].edge;
      const rate = (1 + percent(persona.rate)) * take.speed - 1;
      const file = `${take.base}.mp3`;
      edgeSynth(textFor(take.line), persona.voice, `${rate >= 0 ? '+' : ''}${Math.round(rate * 100)}%`, persona.pitch, file);
      return file;
    }),
};

const kokoroPython = (): string => {
  const venv = path.join(ROOT, '.venv', 'bin', 'python');
  return existsSync(venv) ? venv : 'python3';
};

const kokoro: Provider = {
  id: 'kokoro',
  maxSpeed: 1.6,
  colour: true,
  probe: async () =>
    spawnSync(kokoroPython(), [KOKORO_HELPER, '--probe']).status === 0 ? null : 'kokoro-onnx not installed (run `npm run audio:kokoro-setup`)',
  synthesize: async (takes) => {
    const jobs = takes.map((t) => {
      const persona = CAST[t.speaker].kokoro;
      return {text: textFor(t.line), voice: persona.voice, lang: persona.lang, speed: Math.min(2, persona.speed * t.speed), out: `${t.base}.wav`};
    });
    const res = spawnSync(kokoroPython(), [KOKORO_HELPER], {input: JSON.stringify(jobs), cwd: ROOT, maxBuffer: 1 << 26, stdio: ['pipe', 'pipe', 'inherit']});
    const out = new Map<string, string | Error>();
    takes.forEach((t, i) => {
      const file = jobs[i].out;
      out.set(t.key, res.status === 0 && existsSync(file) ? file : new Error(`Kokoro failed (exit ${res.status})`));
    });
    return out;
  },
};

const procedural: Provider = {
  id: 'procedural',
  maxSpeed: 1,
  colour: false,
  probe: async () => null,
  synthesize: (takes) =>
    eachTake(takes, async (take) => {
      const {seconds, syllables} = babblePlan(take.line);
      const voice = CAST[take.speaker].babble;
      const audio = synthesizeBabble(syllables, seconds, voice, take.line.delivery, /\?\W*$/.test(take.line.text), SR, `${take.line.id}-${take.speaker}`);
      const file = `${take.base}.wav`;
      writeFileSync(file, encodeWav([audio], SR));
      synthesized.set(file, audio);
      return file;
    }),
};

const ALL_PROVIDERS: Provider[] = [elevenlabs, edge, kokoro, procedural];

// ── Voiceover ─────────────────────────────────────────────────────────────

let WORK = '';

interface RenderedTake {
  take: Take;
  provider: Provider;
  audio: Float32Array;
}

/** Decode → trim → tighten pauses → character pitch/FX. */
const prepare = (file: string, take: Take, provider: Provider): Float32Array => {
  const dry = compressPauses(trimSilence(synthesized.get(file) ?? decode(file)));
  if (!provider.colour) {
    return dry;
  }
  const persona = CAST[take.speaker].kokoro;
  // Effects can leave a quiet ring-out; trim it so the clip ends with the voice.
  return trimSilence(applyFilters(dry, [...pitchFilters(persona.semitones), ...(persona.effects ? [persona.effects] : []), 'highpass=f=70']), 40);
};

const writeManifest = (manifest: VoiceoverManifest): void => {
  const ordered: VoiceoverManifest = {};
  for (const line of SCRIPT) {
    if (manifest[line.id]) {
      ordered[line.id] = manifest[line.id];
    }
  }
  writeFileSync(
    MANIFEST,
    [
      '// This file is overwritten by `npm run audio`. Do not edit by hand.',
      '// While a line is missing, the video voices it with the procedural babble synth.',
      "import type {VoiceoverManifest} from '../types/audio';",
      '',
      `export const VOICEOVER: VoiceoverManifest = ${JSON.stringify(ordered, null, 2)};`,
      '',
    ].join('\n'),
  );
};

/** Synthesizes takes down the provider chain; each take lands with the first provider that works. */
const synthesizeChain = async (takes: Take[], chain: Provider[], status: Map<Provider, string | null>): Promise<RenderedTake[]> => {
  const done: RenderedTake[] = [];
  let pending = takes;
  for (const provider of chain) {
    if (pending.length === 0) {
      break;
    }
    if (!status.has(provider)) {
      status.set(provider, await provider.probe());
      const reason = status.get(provider);
      log(reason ? `  · ${provider.id}: skipped, ${reason}` : `  · ${provider.id}: available`);
    }
    if (status.get(provider)) {
      continue;
    }
    const results = await provider.synthesize(pending);
    const failed: Take[] = [];
    for (const take of pending) {
      const result = results.get(take.key);
      if (typeof result === 'string') {
        try {
          done.push({take, provider, audio: prepare(result, take, provider)});
          continue;
        } catch (err) {
          log(`  ! ${take.key}: ${provider.id} output unusable (${err instanceof Error ? err.message : err})`);
        }
      } else if (result) {
        log(`  ! ${take.key}: ${provider.id} failed (${result.message})`);
      }
      failed.push(take);
    }
    pending = failed;
  }
  if (pending.length > 0) {
    throw new Error(`No provider could voice: ${pending.map((t) => t.key).join(', ')}`);
  }
  return done;
};

const generateVoiceover = async (): Promise<void> => {
  const manifest: VoiceoverManifest = {...PROJECT.manifest};
  const lines = SCRIPT.filter((l) => !only || only.includes(l.id)).filter(
    (l) => force || !manifest[l.id] || !existsSync(path.join(PUBLIC, manifest[l.id]!.file)),
  );
  if (lines.length === 0) {
    log('Voiceover: every line already has a clip (use --force to redo).');
    return;
  }
  let chain = requested === 'auto' ? ALL_PROVIDERS : ALL_PROVIDERS.filter((p) => p.id === requested);
  if (chain.length === 0) {
    throw new Error(`Unknown --provider "${requested}"`);
  }
  if (!FFMPEG) {
    log('ffmpeg not found: only the procedural voice can be used, written as WAV.');
    chain = [procedural];
  }

  log(`\nVoiceover: ${lines.length} line(s), providers: ${chain.map((p) => p.id).join(' → ')}`);
  if (dryRun) {
    for (const line of lines) {
      const cast = line.speakers.map((s) => `${s}(${CAST[s].kokoro.voice})`).join('+');
      log(`  ${line.id.padEnd(24)} ${String(lineLength(line)).padStart(4)}f  ${cast.padEnd(26)} "${line.text}"`);
    }
    return;
  }

  const status = new Map<Provider, string | null>();
  const takes: Take[] = lines.flatMap((line) =>
    line.speakers.map((speaker) => ({key: `${line.id}:${speaker}`, line, speaker, speed: 1, base: path.join(WORK, `${line.id}-${speaker}`)})),
  );
  const rendered = await synthesizeChain(takes, chain, status);

  // Lines that overrun their window get one faster re-take where the provider has a speed control.
  const retakes: Take[] = [];
  for (const line of lines) {
    const mine = rendered.filter((r) => r.take.line === line);
    const target = (lineLength(line) - WINDOW_MARGIN) / FPS;
    const seconds = Math.max(...mine.map((r) => r.audio.length)) / SR;
    for (const r of mine) {
      if (seconds > target * 1.02 && r.provider.maxSpeed > 1) {
        const speed = Math.min(r.provider.maxSpeed, (seconds / target) * 1.04);
        retakes.push({...r.take, speed, key: `${r.take.key}@${speed.toFixed(2)}`, base: `${r.take.base}-fast`});
      }
    }
  }
  if (retakes.length > 0) {
    log(`  ↻ re-taking ${retakes.length} overlong take(s) at a faster pace`);
    for (const provider of chain) {
      const mine = retakes.filter((t) => rendered.find((r) => r.take.line === t.line && r.take.speaker === t.speaker)?.provider === provider);
      if (mine.length === 0) {
        continue;
      }
      for (const redo of await synthesizeChain(mine, [provider], status)) {
        const i = rendered.findIndex((r) => r.take.line === redo.take.line && r.take.speaker === redo.take.speaker);
        rendered[i] = redo;
      }
    }
  }

  mkdirSync(path.join(PUBLIC, PROJECT.voDir), {recursive: true});
  const warnings: string[] = [];
  for (const line of lines) {
    const mine = rendered.filter((r) => r.take.line === line);
    let audio = mixTakes(mine.map((r) => r.audio));
    const window = lineLength(line) - WINDOW_MARGIN;
    const target = window / FPS;
    let tempo = 1;
    if (audio.length / SR > target && FFMPEG) {
      tempo = audio.length / SR / target;
      audio = applyFilters(audio, tempoFilters(tempo * 1.005));
    }
    if (tempo > TEMPO_WARNING) {
      warnings.push(`  ${line.id}: squeezed ${tempo.toFixed(2)}× to fit ${window} frames; consider trimming the line.`);
    }
    audio = normaliseVoice(audio);

    const ext = FFMPEG ? 'mp3' : 'wav';
    const file = `${PROJECT.voDir}/${line.id}.${ext}`;
    if (FFMPEG) {
      ffmpeg([...RAW_IN, '-c:a', 'libmp3lame', '-b:a', '160k', path.join(PUBLIC, file)], asBuffer(audio));
    } else {
      writeFileSync(path.join(PUBLIC, file), encodeWav([audio], SR));
    }
    const frames = Math.ceil((audio.length / SR) * FPS);
    const {codes, voiced} = analyseVisemes(audio, frames);
    // A two-voice line reports the humblest provider it used.
    const provider = ALL_PROVIDERS.filter((p) => mine.some((r) => r.provider === p)).pop()!.id;
    const clip: VoiceoverClip = {file, provider, durationInFrames: frames, visemes: codes, words: wordTimings(line.text, voiced)};
    manifest[line.id] = clip;
    writeManifest(manifest);
    const speeds = mine.map((r) => r.take.speed.toFixed(2)).join('/');
    log(
      `  ✓ ${line.id.padEnd(24)} ${provider.padEnd(10)} ${String(frames).padStart(4)}f / ${String(lineLength(line)).padStart(4)}f  pace ${speeds}  stretch ${tempo.toFixed(2)}×`,
    );
  }
  log(`Wrote ${path.relative(ROOT, MANIFEST)}.`);
  if (warnings.length > 0) {
    log(['\nHeads-up:', ...warnings].join('\n'));
  }
};

// ── SFX + music ───────────────────────────────────────────────────────────

const existingAudio = (dir: string, name: string): string | null =>
  ['mp3', 'wav', 'ogg'].map((ext) => path.join(PUBLIC, 'audio', dir, `${name}.${ext}`)).find((f) => existsSync(f)) ?? null;

const generateSfx = (): void => {
  const ids = [...new Set(SFX_CUES.map((c) => c.id))] as SfxId[];
  log(`\nSound effects: ${ids.length} procedural recipes`);
  mkdirSync(path.join(PUBLIC, 'audio', 'sfx'), {recursive: true});
  for (const id of ids) {
    const own = path.join(PUBLIC, 'audio', 'sfx', `${id}.wav`);
    const existing = existingAudio('sfx', id);
    if (existing && !(force && existing === own)) {
      log(`  ✓ ${id.padEnd(16)} exists (${path.relative(ROOT, existing)})`);
      continue;
    }
    const seconds = Math.max(...SFX_CUES.filter((c) => c.id === id).map((c) => c.durationInFrames)) / FPS;
    if (!dryRun) {
      writeFileSync(own, encodeWav([synthesizeSfx(id, SR, seconds)], SR));
    }
    log(`  ✓ ${id.padEnd(16)} ${seconds.toFixed(2)}s → ${path.relative(ROOT, own)}`);
  }
};

const generateBgm = (): void => {
  const {dir, name, label, synth} = PROJECT.music;
  const own = path.join(PUBLIC, 'audio', dir, `${name}.wav`);
  const existing = existingAudio(dir, name);
  log('\nMusic:');
  if (existing && !(force && existing === own)) {
    log(`  ✓ exists (${path.relative(ROOT, existing)})`);
    return;
  }
  if (!dryRun) {
    mkdirSync(path.dirname(own), {recursive: true});
    writeFileSync(own, encodeWav(synth(SR), SR));
  }
  log(`  ✓ ${label} → ${path.relative(ROOT, own)}`);
};

const main = async (): Promise<void> => {
  if (only) {
    const known = new Set(SCRIPT.map((l) => l.id));
    const unknown = only.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw new Error(`Unknown line id(s): ${unknown.join(', ')}`);
    }
  }
  WORK = mkdtempSync(path.join(tmpdir(), 'organ-drama-audio-'));
  try {
    if (!flag('skip-vo')) {
      await generateVoiceover();
    }
    if (!flag('skip-sfx') && !only && PROJECT.bakesSfx) {
      generateSfx();
    }
    if (!flag('skip-bgm') && !only) {
      generateBgm();
    }
  } finally {
    rmSync(WORK, {recursive: true, force: true});
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
