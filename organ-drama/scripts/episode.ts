/**
 * The episode pipeline, one command per step:
 *
 *   npm run episode -- new <slug>            scaffold episodes/<slug>/episode.ts
 *   npm run episode -- check <slug>          typecheck + validate + print the timeline
 *   npm run episode -- voice <slug> [--force] [--only id,id]   Kokoro voices (re-times the video)
 *   npm run episode -- stills <slug> [frame ...]   review frames + a contact sheet
 *   npm run episode -- render <slug>         out/episodes/<slug>.mp4
 *   npm run episode -- sync                  re-register every episode with the Studio
 *   npm run episode -- doctor                check the toolchain (node deps, ffmpeg, Kokoro, browser)
 *
 * Episodes are registered as compositions under "Episodes" in the Studio
 * (`npm run dev`), with the slug as the composition id.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {buildTimeline, checkEpisode, type EpisodeTimeline} from '../src/engine/timeline';
import type {Episode} from '../src/engine/types';
import type {VoiceoverManifest} from '../src/types/audio';

const ROOT = process.cwd();
const EPISODES_DIR = path.join(ROOT, 'episodes');
const OUT = path.join(ROOT, 'out', 'episodes');
const REGISTRY = path.join(ROOT, 'src', 'engine', 'episodes.generated.ts');

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1] === '--only'));
const optionValue = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

const fail = (msg: string): never => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const episodeDir = (slug: string) => path.join(EPISODES_DIR, slug);

const loadEpisode = (slug: string): {episode: Episode; voiceover: VoiceoverManifest} => {
  const file = path.join(episodeDir(slug), 'episode.ts');
  if (!existsSync(file)) {
    fail(`No episode at ${path.relative(ROOT, file)} (run: npm run episode -- new ${slug})`);
  }
  const vo = path.join(episodeDir(slug), 'voiceover.generated.ts');
  const episode = (require(file) as {default: Episode}).default;
  const voiceover = existsSync(vo) ? ((require(vo) as {VOICEOVER: VoiceoverManifest}).VOICEOVER ?? {}) : {};
  return {episode, voiceover};
};

const emptyManifest = (dir: string) =>
  [
    '// This file is overwritten by `npm run episode -- voice`. Do not edit by hand.',
    '// While a line is missing, the video voices it with the procedural babble synth.',
    `import type {VoiceoverManifest} from '${path.relative(dir, path.join(ROOT, 'src', 'types', 'audio')).split(path.sep).join('/')}';`,
    '',
    'export const VOICEOVER: VoiceoverManifest = {};',
    '',
  ].join('\n');

/** Rewrites the registry the Studio and renderer read. */
const sync = (): string[] => {
  mkdirSync(EPISODES_DIR, {recursive: true});
  const slugs = readdirSync(EPISODES_DIR, {withFileTypes: true})
    .filter((d) => d.isDirectory() && existsSync(path.join(EPISODES_DIR, d.name, 'episode.ts')))
    .map((d) => d.name)
    .sort();
  for (const slug of slugs) {
    const vo = path.join(episodeDir(slug), 'voiceover.generated.ts');
    if (!existsSync(vo)) {
      writeFileSync(vo, emptyManifest(episodeDir(slug)));
    }
  }
  const lines = [
    '// Written by `npm run episode -- sync`. Do not edit by hand.',
    "import type {EpisodeEntry} from './EpisodeVideo';",
    ...slugs.flatMap((slug, i) => [
      `import ep${i} from '../../episodes/${slug}/episode';`,
      `import {VOICEOVER as vo${i}} from '../../episodes/${slug}/voiceover.generated';`,
    ]),
    '',
    `export const EPISODES: readonly EpisodeEntry[] = [${slugs.map((slug, i) => `\n  {slug: '${slug}', episode: ep${i}, voiceover: vo${i}},`).join('')}${slugs.length ? '\n' : ''}];`,
    '',
  ];
  writeFileSync(REGISTRY, lines.join('\n'));
  return slugs;
};

const TEMPLATE = (slug: string) => `import {defineEpisode} from '../../src/engine/types';

/**
 * ${slug}: replace everything below. See .claude/skills/make-video/SKILL.md
 * for the format, the cast library, voices and the style rules.
 */
export default defineEpisode({
  slug: '${slug}',
  title: 'Working title',
  topic: 'What the video explains',
  logline: 'The joke and the lesson in one sentence.',
  targetSeconds: 45,
  facts: [{claim: 'The fact the video teaches.', source: 'Where it comes from'}],
  narrator: {voice: 'bm_george', speed: 1.05},
  music: 'pizzicato',
  cast: {
    BRAIN: {
      name: 'Brain',
      personality: 'Excitable schemer.',
      puppet: {kind: 'brain'},
      voice: {voice: 'am_puck', speed: 1.1, semitones: 2},
    },
  },
  scenes: [
    {
      set: {name: 'bedroom', time: 'night'},
      cast: [{id: 'BRAIN', x: 760, enter: 'pop'}],
      beats: [
        {id: 'intro', speaker: 'NARRATOR', line: 'It is midnight, and the brain has an idea.'},
        {id: 'brain-idea', speaker: 'BRAIN', line: 'I have the best idea!', act: {BRAIN: {expression: 'excited', gesture: 'cheer'}}},
      ],
    },
  ],
});
`;

const fmtTime = (frames: number, fps: number) => `${Math.floor(frames / fps / 60)}:${(frames / fps % 60).toFixed(1).padStart(4, '0')}`;

const printTimeline = (tl: EpisodeTimeline, episode: Episode, voiceover: VoiceoverManifest) => {
  for (const scene of tl.scenes) {
    console.log(`\nScene ${scene.index + 1} · ${scene.scene.set.name}${scene.scene.set.time ? ` (${scene.scene.set.time})` : ''}  ${fmtTime(scene.start, tl.fps)}–${fmtTime(scene.end + 1, tl.fps)}`);
    for (const b of scene.beats) {
      const who = b.line ? b.line.speakers.join('+') : '—';
      const voiced = b.line ? (voiceover[b.line.id] ? '🔊' : '··') : '  ';
      const what = b.line ? `"${b.line.text}"` : `(${b.beat.hold ?? 30}f silent beat${b.beat.note ? `: ${b.beat.note}` : ''})`;
      console.log(`  ${fmtTime(b.start, tl.fps)}  ${voiced} ${String(b.end - b.start + 1).padStart(4)}f  ${(b.line?.id ?? '').padEnd(18)} ${who.padEnd(12)} ${what}`);
    }
  }
  const seconds = tl.total / tl.fps;
  const target = episode.targetSeconds;
  const off = Math.abs(seconds - target) / target;
  console.log(`\nTotal ${seconds.toFixed(1)} s (${tl.total} frames) · target ${target} s${off > 0.15 ? `  ⚠ ${seconds > target ? 'long' : 'short'} by ${Math.round(off * 100)}%` : '  ✓'}`);
  const unvoiced = tl.lines.filter((l) => !voiceover[l.id]).length;
  if (unvoiced > 0) {
    console.log(`${unvoiced} line(s) not voiced yet: timing is estimated (run: npm run episode -- voice ${episode.slug}).`);
  }
};

const BROWSER_CANDIDATES = () => {
  const base = '/opt/pw-browsers';
  if (!existsSync(base)) {
    return [];
  }
  return readdirSync(base)
    .filter((d) => d.startsWith('chromium_headless_shell'))
    .map((d) => path.join(base, d, 'chrome-linux', 'headless_shell'))
    .filter(existsSync);
};
const browserExecutable = process.env.REMOTION_BROWSER ?? BROWSER_CANDIDATES()[0] ?? null;

const ffmpegCommand = (): string[] => (spawnSync('ffmpeg', ['-version']).status === 0 ? ['ffmpeg'] : ['npx', 'remotion', 'ffmpeg']);

const makeBundle = async () => {
  console.log('Bundling…');
  return bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
};

const stills = async (slug: string, frames: number[]) => {
  const {episode, voiceover} = loadEpisode(slug);
  const tl = buildTimeline(episode, voiceover);
  const picks = frames.length
    ? frames
    : tl.scenes.flatMap((s) => s.beats.map((b) => Math.min(b.end, b.start + Math.min(24, Math.floor((b.end - b.start) / 2)))));
  const dir = path.join(OUT, slug, 'stills');
  rmSync(dir, {recursive: true, force: true});
  mkdirSync(dir, {recursive: true});
  const serveUrl = await makeBundle();
  const browser = await openBrowser('chrome', {browserExecutable, logLevel: 'error'});
  const composition = await selectComposition({serveUrl, id: slug, inputProps: {slug}, puppeteerInstance: browser, browserExecutable, logLevel: 'error'});
  for (const [i, frame] of picks.entries()) {
    const output = path.join(dir, `${String(i).padStart(3, '0')}.png`);
    await renderStill({composition, serveUrl, output, frame, inputProps: {slug}, puppeteerInstance: browser, scale: 0.5, browserExecutable, logLevel: 'error'});
    console.log(`  ✓ frame ${frame} (${fmtTime(frame, tl.fps)}) → ${path.relative(ROOT, output)}`);
  }
  await browser.close({silent: true});
  const cols = 4;
  const rows = Math.ceil(picks.length / cols);
  const [ff, ...ffArgs] = ffmpegCommand();
  const sheet = path.join(OUT, slug, 'contact-sheet.png');
  const res = spawnSync(
    ff,
    [...ffArgs, '-y', '-loglevel', 'error', '-i', path.join(dir, '%03d.png'), '-vf', `scale=480:270,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', sheet],
    {stdio: 'inherit'},
  );
  console.log(res.status === 0 ? `Contact sheet → ${path.relative(ROOT, sheet)}` : 'Contact sheet skipped (ffmpeg failed).');
};

const render = async (slug: string) => {
  loadEpisode(slug);
  mkdirSync(OUT, {recursive: true});
  const serveUrl = await makeBundle();
  const composition = await selectComposition({serveUrl, id: slug, inputProps: {slug}, browserExecutable, logLevel: 'error'});
  const outputLocation = path.join(OUT, `${slug}.mp4`);
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 18,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    outputLocation,
    inputProps: {slug},
    browserExecutable,
    concurrency: Math.max(1, cpus().length),
    logLevel: 'error',
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(`  ${pct}%`);
      }
    },
  });
  console.log(`\n✓ ${path.relative(ROOT, outputLocation)} (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
};

const doctor = () => {
  const ok = (good: boolean, label: string, fix: string) => console.log(`${good ? '✓' : '✗'} ${label}${good ? '' : `  → ${fix}`}`);
  ok(existsSync(path.join(ROOT, 'node_modules', 'remotion')), 'node modules', 'npm ci');
  ok(spawnSync('ffmpeg', ['-version']).status === 0, 'ffmpeg on PATH (voice processing)', 'install ffmpeg (or rely on `npx remotion ffmpeg` for contact sheets)');
  const py = existsSync(path.join(ROOT, '.venv', 'bin', 'python')) ? path.join(ROOT, '.venv', 'bin', 'python') : 'python3';
  ok(spawnSync(py, [path.join(ROOT, 'scripts', 'kokoro_tts.py'), '--probe']).status === 0, 'Kokoro TTS (kokoro-onnx)', 'npm run audio:kokoro-setup');
  ok(existsSync(path.join(ROOT, '.cache', 'kokoro', 'kokoro-v1.0.onnx')), 'Kokoro model cached', 'downloads automatically (~330 MB) on the first `voice` run');
  console.log(`${browserExecutable ? '✓' : '·'} browser: ${browserExecutable ?? 'Remotion will download Chrome Headless Shell on first render'}`);
};

const main = async () => {
  const slug = positional[0];
  const needSlug = () => slug ?? fail(`usage: npm run episode -- ${command} <slug>`);
  switch (command) {
    case 'new': {
      const s = needSlug();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) {
        fail('slug must be kebab-case, e.g. coffee-vs-sleep');
      }
      const file = path.join(episodeDir(s), 'episode.ts');
      if (existsSync(file)) {
        fail(`${path.relative(ROOT, file)} already exists`);
      }
      mkdirSync(episodeDir(s), {recursive: true});
      writeFileSync(file, TEMPLATE(s));
      sync();
      console.log(`✓ ${path.relative(ROOT, file)} (registered as composition "${s}")`);
      break;
    }
    case 'sync':
      console.log(`✓ ${sync().length} episode(s) registered`);
      break;
    case 'check': {
      const s = needSlug();
      sync();
      const tsc = spawnSync('npx', ['tsc', '--noEmit', '-p', '.'], {cwd: ROOT, encoding: 'utf8'});
      if (tsc.status !== 0) {
        console.log(tsc.stdout);
        fail('typecheck failed (fix the errors above)');
      }
      console.log('✓ typecheck');
      const {episode, voiceover} = loadEpisode(s);
      const problems = checkEpisode(episode);
      if (problems.length > 0) {
        console.log(problems.map((p) => `  ✗ ${p}`).join('\n'));
        fail(`${problems.length} problem(s)`);
      }
      console.log('✓ episode is consistent');
      printTimeline(buildTimeline(episode, voiceover), episode, voiceover);
      break;
    }
    case 'voice': {
      const s = needSlug();
      sync();
      const args = ['tsx', 'scripts/generate-audio.ts', '--episode', s, '--provider', optionValue('provider') ?? 'kokoro'];
      if (flags.has('--force')) {
        args.push('--force');
      }
      const only = optionValue('only');
      if (only) {
        args.push('--only', only);
      }
      const res = spawnSync('npx', args, {cwd: ROOT, stdio: 'inherit'});
      if (res.status !== 0) {
        fail('voicing failed');
      }
      const {episode, voiceover} = loadEpisode(s);
      printTimeline(buildTimeline(episode, voiceover), episode, voiceover);
      break;
    }
    case 'stills': {
      const s = needSlug();
      sync();
      await stills(s, positional.slice(1).map(Number).filter((n) => Number.isFinite(n)));
      break;
    }
    case 'render': {
      const s = needSlug();
      sync();
      await render(s);
      break;
    }
    case 'doctor':
      doctor();
      break;
    default:
      console.log('usage: npm run episode -- <new|check|voice|stills|render|sync|doctor> [slug]');
      process.exit(command ? 1 : 0);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
