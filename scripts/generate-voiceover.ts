/**
 * Generates the ElevenLabs voiceover for every line in `src/data/script60s.ts`.
 *
 *   ELEVENLABS_API_KEY=… npm run voiceover:elevenlabs
 *   npm run voiceover:elevenlabs -- --only s1-nobody-home,s2-just-a-tan
 *   npm run voiceover:elevenlabs -- --force      # re-render clips that already exist
 *   npm run voiceover:elevenlabs -- --dry-run    # print the casting plan, call nothing
 *
 * For each line it calls the `with-timestamps` endpoint, writes
 * `public/voiceover/<line-id>.mp3`, converts the character alignment into
 * word timings, and rewrites `src/data/voiceover.generated.ts`. The video then
 * plays the clips, and captions + lip-sync follow the real word timings.
 */
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {FPS, SCRIPT_60S} from '../src/data/script60s';
import {VOICE_CAST} from '../src/data/voiceCast';
import {VOICEOVER} from '../src/data/voiceover.generated';
import type {DialogueEvent, VoiceoverClip, VoiceoverManifest, WordTiming} from '../src/types/dialogue';

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface TimestampResponse {
  audio_base64: string;
  alignment: Alignment | null;
  normalized_alignment: Alignment | null;
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'voiceover');
const MANIFEST = path.join(ROOT, 'src', 'data', 'voiceover.generated.ts');
/** Silence kept after the last word when sizing the clip. */
const TAIL_SECONDS = 0.2;

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const option = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (existsSync(path.join(ROOT, '.env'))) {
  process.loadEnvFile(path.join(ROOT, '.env'));
}

const apiKey = process.env.ELEVENLABS_API_KEY;
const modelId = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';
const only = option('only')?.split(',').map((s) => s.trim());
const force = flag('force');
const dryRun = flag('dry-run');

const voiceIdFor = (line: DialogueEvent): string =>
  process.env[`ELEVENLABS_VOICE_${line.speaker}`] ?? VOICE_CAST[line.speaker].voiceId;

/** Groups ElevenLabs' per-character alignment into words, in frames from the clip start. */
const wordsFromAlignment = (line: DialogueEvent, alignment: Alignment): WordTiming[] => {
  const words: WordTiming[] = [];
  let text = '';
  let start = 0;
  let end = 0;
  alignment.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (text) {
        words.push({text, startFrame: start * FPS, endFrame: end * FPS});
        text = '';
      }
      return;
    }
    if (!text) {
      start = alignment.character_start_times_seconds[i];
    }
    text += ch;
    end = alignment.character_end_times_seconds[i];
  });
  if (text) {
    words.push({text, startFrame: start * FPS, endFrame: end * FPS});
  }
  // Prefer the script's spelling when the word counts line up.
  const scriptWords = line.text.split(/\s+/).filter(Boolean);
  if (scriptWords.length === words.length) {
    return words.map((w, i) => ({...w, text: scriptWords[i]}));
  }
  return words;
};

const synthesize = async (line: DialogueEvent): Promise<TimestampResponse> => {
  const persona = VOICE_CAST[line.speaker];
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceIdFor(line)}/with-timestamps?output_format=mp3_44100_128`;
  const body = JSON.stringify({
    text: line.text,
    model_id: modelId,
    voice_settings: {...persona.settings, use_speaker_boost: true},
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'xi-api-key': apiKey ?? '', 'Content-Type': 'application/json', Accept: 'application/json'},
      body,
    });
    if (res.ok) {
      return (await res.json()) as TimestampResponse;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 2000 * 2 ** attempt;
      console.warn(`  ${res.status} from ElevenLabs, retrying in ${wait / 1000}s…`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`ElevenLabs ${res.status} for ${line.id}: ${await res.text()}`);
  }
  throw new Error(`ElevenLabs kept failing for ${line.id}`);
};

const writeManifest = (manifest: VoiceoverManifest): void => {
  const ordered: VoiceoverManifest = {};
  for (const line of SCRIPT_60S) {
    if (manifest[line.id]) {
      ordered[line.id] = manifest[line.id];
    }
  }
  writeFileSync(
    MANIFEST,
    [
      '// This file is overwritten by `npm run voiceover`. Do not edit by hand.',
      '// While it is empty the video renders silent and captions use estimated word timings.',
      "import type {VoiceoverManifest} from '../types/dialogue';",
      '',
      `export const VOICEOVER: VoiceoverManifest = ${JSON.stringify(ordered, null, 2)};`,
      '',
    ].join('\n'),
  );
};

const main = async (): Promise<void> => {
  const lines = SCRIPT_60S.filter((l) => !only || only.includes(l.id));
  if (only && lines.length !== only.length) {
    const known = new Set(SCRIPT_60S.map((l) => l.id));
    throw new Error(`Unknown line id(s): ${only.filter((id) => !known.has(id)).join(', ')}`);
  }

  if (dryRun) {
    for (const line of lines) {
      const persona = VOICE_CAST[line.speaker];
      console.log(`${line.id.padEnd(20)} ${line.speaker.padEnd(8)} ${persona.voiceName.padEnd(7)} (${voiceIdFor(line)})  ${line.durationInFrames}f  "${line.text}"`);
    }
    return;
  }
  if (!apiKey) {
    throw new Error('Set ELEVENLABS_API_KEY (in your shell or a .env file) — see .env.example.');
  }

  mkdirSync(OUT_DIR, {recursive: true});
  const manifest: VoiceoverManifest = {...VOICEOVER};
  const overruns: string[] = [];

  for (const line of lines) {
    const file = `voiceover/${line.id}.mp3`;
    if (!force && manifest[line.id] && existsSync(path.join(ROOT, 'public', file))) {
      console.log(`✓ ${line.id} (exists, use --force to redo)`);
      continue;
    }
    console.log(`→ ${line.id}  [${line.speaker} · ${VOICE_CAST[line.speaker].voiceName}]  "${line.text}"`);
    const result = await synthesize(line);
    writeFileSync(path.join(ROOT, 'public', file), Buffer.from(result.audio_base64, 'base64'));

    const alignment = result.alignment ?? result.normalized_alignment;
    const words = alignment ? wordsFromAlignment(line, alignment) : undefined;
    const lastEnd = alignment ? Math.max(...alignment.character_end_times_seconds) : line.durationInFrames / FPS;
    const clip: VoiceoverClip = {
      file,
      durationInFrames: Math.ceil((lastEnd + TAIL_SECONDS) * FPS),
      words: words?.map((w) => ({...w, startFrame: Math.round(w.startFrame * 100) / 100, endFrame: Math.round(w.endFrame * 100) / 100})),
    };
    manifest[line.id] = clip;
    writeManifest(manifest);

    if (clip.durationInFrames > line.durationInFrames) {
      overruns.push(
        `  ${line.id}: clip is ${clip.durationInFrames}f but the window is ${line.durationInFrames}f (+${clip.durationInFrames - line.durationInFrames}f)`,
      );
    }
  }

  console.log(`\nWrote ${path.relative(ROOT, MANIFEST)}.`);
  if (overruns.length > 0) {
    console.warn(
      [
        '\nThese clips run past their line windows and will overlap the next line:',
        ...overruns,
        'Raise that speaker\'s `speed` in src/data/voiceCast.ts, or retime the lines in src/data/script60s.ts.',
      ].join('\n'),
    );
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
