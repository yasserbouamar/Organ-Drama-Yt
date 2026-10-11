/**
 * Lays an episode out in frames. Spoken beats last as long as their recorded
 * clip (or, before voicing, a natural-pace estimate), separated by short
 * gaps; silent beats last `hold` frames. Pure, so the CLI, the audio
 * generator and the renderer all agree on the same timing.
 */
import {SFX_DEFAULT_SECONDS} from '../audio/ProceduralSFX';
import type {SFXTrigger, VoiceoverManifest} from '../types/audio';
import type {AnyDialogueLine} from '../types/dialogue';
import {babblePlan} from '../utils/lipSync';
import type {Beat, Episode, Scene} from './types';

export const EPISODE_FPS = 30;
/** Frames before the first beat of each scene. */
const LEAD_IN = 8;
/** Default silence between beats. */
const DEFAULT_GAP = 6;
/** Default hold after a scene's last beat, before the cut. */
const SCENE_HOLD = 14;
/** Silent beats with no `hold` last this long. */
const DEFAULT_SILENT_HOLD = 30;
/** Held after the final scene so the music can fade. */
const TAIL = 20;

export interface BeatTiming {
  scene: number;
  index: number;
  beat: Beat;
  /** First frame of the beat (absolute). */
  start: number;
  /** Last frame of the beat, including any `hold` after the line. */
  end: number;
  line: AnyDialogueLine | null;
}

export interface SceneTiming {
  index: number;
  scene: Scene;
  start: number;
  end: number;
  beats: BeatTiming[];
}

export interface EpisodeTimeline {
  fps: number;
  total: number;
  scenes: SceneTiming[];
  lines: AnyDialogueLine[];
  sfx: SFXTrigger[];
}

export const speakersOf = (beat: Beat): string[] => (beat.speaker === undefined ? ['NARRATOR'] : typeof beat.speaker === 'string' ? [beat.speaker] : [...beat.speaker]);

/** The id a spoken beat's voice clip is stored under. */
export const lineId = (sceneIndex: number, beatIndex: number, beat: Beat): string => beat.id ?? `s${sceneIndex + 1}-b${beatIndex + 1}`;

/** Every spoken line of an episode, untimed (for voicing). */
export const episodeLines = (episode: Episode): AnyDialogueLine[] =>
  episode.scenes.flatMap((scene, si) =>
    scene.beats.flatMap((beat, bi) =>
      beat.line
        ? [
            {
              id: lineId(si, bi, beat),
              scene: si,
              speakers: speakersOf(beat),
              text: beat.line,
              sayAs: beat.sayAs,
              // Generous window: episode lines are never squeezed to fit.
              startFrame: 0,
              endFrame: EPISODE_FPS * 60,
              delivery: beat.delivery ?? 'normal',
              direction: beat.note ?? '',
            },
          ]
        : [],
    ),
  );

/** Clip length in frames, or a natural-pace estimate when the line isn't voiced yet. */
const lineFrames = (line: AnyDialogueLine, manifest: VoiceoverManifest): number => {
  const clip = manifest[line.id];
  if (clip) {
    return clip.durationInFrames;
  }
  return Math.ceil(babblePlan(line).seconds * EPISODE_FPS);
};

export const buildTimeline = (episode: Episode, manifest: VoiceoverManifest): EpisodeTimeline => {
  const untimed = new Map(episodeLines(episode).map((l) => [l.id, l]));
  const scenes: SceneTiming[] = [];
  const lines: AnyDialogueLine[] = [];
  const sfx: SFXTrigger[] = [];
  let t = 0;
  episode.scenes.forEach((scene, si) => {
    const start = t;
    t += LEAD_IN;
    const beats: BeatTiming[] = [];
    scene.beats.forEach((beat, bi) => {
      t += beat.gap ?? (bi === 0 ? 0 : DEFAULT_GAP);
      const beatStart = t;
      let line: AnyDialogueLine | null = null;
      let lineEnd = beatStart;
      if (beat.line) {
        const base = untimed.get(lineId(si, bi, beat))!;
        const frames = lineFrames(base, manifest);
        line = {...base, startFrame: beatStart, endFrame: beatStart + frames - 1};
        lines.push(line);
        lineEnd = line.endFrame;
        t = lineEnd + 1 + (beat.hold ?? 0);
      } else {
        t = beatStart + (beat.hold ?? DEFAULT_SILENT_HOLD);
      }
      const end = t - 1;
      beats.push({scene: si, index: bi, beat, start: beatStart, end, line});
      for (const cue of beat.sfx ?? []) {
        const frame = Math.max(0, cue.at === 'end' ? lineEnd : beatStart + (cue.at ?? 0));
        sfx.push({
          id: cue.id,
          frame,
          scene: si,
          durationInFrames: Math.ceil(SFX_DEFAULT_SECONDS[cue.id] * EPISODE_FPS),
          volume: cue.volume ?? 0.7,
          label: `${lineId(si, bi, beat)} ${cue.id}`,
        });
      }
    });
    t += scene.holdAfter ?? SCENE_HOLD;
    scenes.push({index: si, scene, start, end: t - 1, beats});
  });
  const total = t + TAIL;
  // The last scene holds through the tail so the video never ends on black.
  if (scenes.length > 0) {
    scenes[scenes.length - 1].end = total - 1;
  }
  // Cues can't run past the end.
  for (const cue of sfx) {
    cue.durationInFrames = Math.max(1, Math.min(cue.durationInFrames, total - cue.frame));
  }
  return {fps: EPISODE_FPS, total, scenes, lines, sfx};
};

/** The beat playing at an absolute frame within a scene (the last one started). */
export const beatAt = (scene: SceneTiming, frame: number): BeatTiming | null => {
  let current: BeatTiming | null = null;
  for (const b of scene.beats) {
    if (b.start <= frame) {
      current = b;
    }
  }
  return current;
};

/** Problems that would make the episode render wrong. Empty = good to go. */
export const checkEpisode = (episode: Episode): string[] => {
  const problems: string[] = [];
  const cast = new Set(Object.keys(episode.cast));
  const ids = new Set<string>();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(episode.slug)) {
    problems.push(`slug "${episode.slug}" must be kebab-case (a-z, 0-9, -)`);
  }
  if (episode.scenes.length === 0) {
    problems.push('no scenes');
  }
  episode.scenes.forEach((scene, si) => {
    const where = `scene ${si + 1}`;
    const placed = new Set(scene.cast.map((p) => p.id));
    for (const p of scene.cast) {
      if (!cast.has(p.id)) {
        problems.push(`${where}: "${p.id}" is placed but not in the cast`);
      }
      if (p.x < 0 || p.x > 1920) {
        problems.push(`${where}: "${p.id}" x=${p.x} is off screen (0–1920)`);
      }
    }
    if (scene.beats.length === 0) {
      problems.push(`${where}: no beats`);
    }
    scene.beats.forEach((beat, bi) => {
      const at = `${where} beat ${bi + 1}`;
      if (beat.line) {
        const id = lineId(si, bi, beat);
        if (ids.has(id)) {
          problems.push(`${at}: duplicate line id "${id}"`);
        }
        ids.add(id);
        for (const s of speakersOf(beat)) {
          if (s !== 'NARRATOR' && !cast.has(s)) {
            problems.push(`${at}: speaker "${s}" is not in the cast`);
          } else if (s !== 'NARRATOR' && !placed.has(s)) {
            problems.push(`${at}: speaker "${s}" is not placed in this scene (use NARRATOR for off-screen voices)`);
          }
        }
        if (beat.line.split(/\s+/).length > 28) {
          problems.push(`${at}: line is ${beat.line.split(/\s+/).length} words; split it (keep lines under ~20 words)`);
        }
      } else if (beat.speaker) {
        problems.push(`${at}: has a speaker but no line`);
      }
      for (const id of Object.keys(beat.act ?? {})) {
        if (!placed.has(id)) {
          problems.push(`${at}: acts for "${id}", who is not placed in this scene`);
        }
      }
      const propIds = new Set((scene.props ?? []).flatMap((prop) => (prop.id ? [prop.id] : [])));
      for (const [who, act] of Object.entries(beat.act ?? {})) {
        if (act.take && !propIds.has(act.take)) {
          problems.push(`${at}: "${who}" takes prop "${act.take}", but no prop in this scene has that id`);
        }
      }
      for (const ref of [beat.bubble?.from, typeof beat.burst?.at === 'string' ? beat.burst.at : undefined, typeof beat.callout?.target === 'string' ? beat.callout.target : undefined, ...(beat.effects ?? []).map((e) => e.on)]) {
        if (ref && !placed.has(ref)) {
          problems.push(`${at}: refers to "${ref}", who is not placed in this scene`);
        }
      }
    });
  });
  if (!episode.narrator && episode.scenes.some((s) => s.beats.some((b) => b.line && speakersOf(b).includes('NARRATOR')))) {
    problems.push('NARRATOR speaks but the episode has no `narrator` voice');
  }
  return problems;
};
