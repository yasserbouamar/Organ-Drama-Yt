import {random} from 'remotion';
import {getActiveLine} from '../data/script60s';
import {VOICEOVER} from '../data/voiceover.generated';
import type {Speaker, Viseme} from '../types/characters';
import type {DialogueEvent, WordTiming} from '../types/dialogue';

const PAUSE_AFTER: readonly [RegExp, number][] = [
  [/(\.\.\.|…)$/, 7],
  [/[.!?]+$/, 4.5],
  [/[,;:]$/, 2.5],
];

/**
 * Estimates word timings when no voiceover alignment exists: words share the
 * line's window in proportion to their length, with pauses after punctuation.
 */
export const estimateWordTimings = (text: string, durationInFrames: number): WordTiming[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lead = Math.min(3, durationInFrames * 0.06);
  const tail = Math.min(9, durationInFrames * 0.12);
  const speech = Math.max(1, durationInFrames - lead - tail);

  const units = words.map((w) => {
    const letters = w.replace(/[^\p{L}\p{N}]/gu, '').length;
    const pause = PAUSE_AFTER.find(([re]) => re.test(w))?.[1] ?? 0;
    return {length: letters + 1.6, pause};
  });
  const total = units.reduce((acc, u, i) => acc + u.length + (i < units.length - 1 ? u.pause : 0), 0);
  const scale = speech / total;

  let cursor = lead;
  return words.map((text, i) => {
    const start = cursor;
    const end = start + units[i].length * scale;
    cursor = end + units[i].pause * scale;
    return {text, startFrame: start, endFrame: end};
  });
};

const timingCache = new Map<string, WordTiming[]>();

/** Word timings for a line, relative to its start: real alignment if a voiceover clip exists. */
export const getWordTimings = (line: DialogueEvent): WordTiming[] => {
  const cached = timingCache.get(line.id);
  if (cached) {
    return cached;
  }
  const clip = VOICEOVER[line.id];
  const words =
    clip?.words && clip.words.length > 0
      ? clip.words
      : estimateWordTimings(line.text, line.durationInFrames);
  timingCache.set(line.id, words);
  return words;
};

/** Index of the word being spoken at `localFrame` (frames since the line started), or the last one spoken. */
export const getWordIndexAt = (words: readonly WordTiming[], localFrame: number): number => {
  let index = -1;
  for (let i = 0; i < words.length; i++) {
    if (localFrame >= words[i].startFrame) {
      index = i;
    }
  }
  return index;
};

/** Whether `speaker` is mid-line at an absolute frame. */
export const isSpeaking = (speaker: Speaker, globalFrame: number): boolean =>
  getActiveLine(globalFrame)?.speaker === speaker;

/**
 * Mouth shape for `speaker` at an absolute frame. While they're talking the
 * mouth cycles through syllable shapes and closes between words; otherwise it
 * holds `rest`.
 */
export const mouthAt = (speaker: Speaker, globalFrame: number, rest: Viseme = 'idle'): Viseme => {
  const line = getActiveLine(globalFrame);
  if (!line || line.speaker !== speaker) {
    return rest;
  }
  const local = globalFrame - line.startFrame;
  const words = getWordTimings(line);
  const word = words.find((w) => local >= w.startFrame && local < w.endFrame);
  if (!word) {
    return 'idle';
  }
  const t = local - word.startFrame;
  const syllable = Math.floor(t / 3.5);
  // Briefly half-close at the end of each syllable so the cycle reads as speech.
  if (t % 3.5 > 2.8) {
    return 'talk';
  }
  const r = random(`${line.id}-${word.startFrame.toFixed(2)}-${syllable}`);
  if (line.delivery === 'shout') {
    return r < 0.3 ? 'screaming' : r < 0.65 ? 'wide' : 'open';
  }
  if (line.delivery === 'calm') {
    return r < 0.55 ? 'talk' : 'open';
  }
  return r < 0.35 ? 'talk' : r < 0.75 ? 'open' : 'wide';
};
