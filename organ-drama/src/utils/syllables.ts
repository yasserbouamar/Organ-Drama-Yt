import type {Delivery, WordTiming} from '../types/dialogue';

export type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';

/** What the lips do at the start of a syllable. */
export type Onset = 'none' | 'closed' | 'teeth' | 'stop';

export interface Syllable {
  vowel: Vowel;
  onset: Onset;
  /** Seconds from the start of the clip. */
  start: number;
  end: number;
  /** 0..1: first syllable of a word and shouted lines hit harder. */
  stress: number;
  wordIndex: number;
}

const LEAD_IN = 0.06;
const TAIL = 0.14;

const vowelOf = (group: string): Vowel => {
  const c = group[0].toLowerCase();
  if (c === 'y') {
    return 'i';
  }
  if (group.toLowerCase().startsWith('oo') || group.toLowerCase().startsWith('ou')) {
    return 'u';
  }
  return c as Vowel;
};

const onsetOf = (consonants: string): Onset => {
  const c = consonants.toLowerCase();
  if (/[mbp]$/.test(c)) {
    return 'closed';
  }
  if (/(s|z|sh|ch|j|f|v|th|c)$/.test(c)) {
    return 'teeth';
  }
  if (/[tdkgqx]$/.test(c)) {
    return 'stop';
  }
  return 'none';
};

/** Rough English syllables: one per vowel group, with the consonants that lead into it. */
const syllabify = (word: string): {vowel: Vowel; onset: Onset; weight: number}[] => {
  const clean = word.toLowerCase().replace(/[^a-z']/g, '');
  const parts = [...clean.matchAll(/([^aeiouy]*)([aeiouy]+)/g)];
  // A silent final "e" ("time", "acid-free") doesn't make its own syllable.
  if (parts.length > 1 && /[^aeiouy]e$/.test(clean) && parts[parts.length - 1][2] === 'e') {
    parts.pop();
  }
  if (parts.length === 0) {
    return [{vowel: 'a', onset: 'stop', weight: 0.7}];
  }
  return parts.map((m) => ({
    vowel: vowelOf(m[2]),
    onset: onsetOf(m[1]),
    weight: 1 + Math.min(0.4, (m[1].length + m[2].length - 2) * 0.12),
  }));
};

/** Pause after a word, in syllable units. */
const pauseAfter = (word: string): number => {
  if (/(\.\.\.|…)$/.test(word)) {
    return 2.2;
  }
  if (/[.!?]+$/.test(word)) {
    return 1.3;
  }
  if (/[,;:]$/.test(word)) {
    return 0.7;
  }
  return 0.12;
};

/**
 * Lays a line's syllables over `duration` seconds. Used by the procedural
 * babble voice and by lip-sync when no recorded clip exists, so a babbled
 * line and its mouth flaps always agree.
 */
export const planSyllables = (text: string, duration: number, delivery: Delivery = 'normal'): Syllable[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const units: {vowel: Vowel; onset: Onset; weight: number; wordIndex: number; first: boolean; pause: number}[] = [];
  words.forEach((word, wordIndex) => {
    const syl = syllabify(word);
    syl.forEach((s, i) => units.push({...s, wordIndex, first: i === 0, pause: i === syl.length - 1 ? pauseAfter(word) : 0}));
  });
  units[units.length - 1].pause = 0;
  const total = units.reduce((acc, u) => acc + u.weight + u.pause, 0);
  const scale = Math.max(0.05, duration - LEAD_IN - TAIL) / total;
  let cursor = LEAD_IN;
  return units.map((u) => {
    const start = cursor;
    const end = start + u.weight * scale;
    cursor = end + u.pause * scale;
    const stress = (u.first ? 0.85 : 0.55) + (delivery === 'shout' ? 0.15 : delivery === 'whisper' ? -0.2 : 0);
    return {vowel: u.vowel, onset: u.onset, start, end, stress, wordIndex: u.wordIndex};
  });
};

/** Word timings (in frames) from a syllable plan. */
export const wordsFromSyllables = (text: string, syllables: readonly Syllable[], fps: number): WordTiming[] => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => {
    const own = syllables.filter((s) => s.wordIndex === i);
    return {text: w, startFrame: own[0].start * fps, endFrame: own[own.length - 1].end * fps};
  });
};

/** Mouth code per frame for a syllable plan (`-` idle, `A` open, `O` o, `T` teeth, `E` smile). */
export const visemesFromSyllables = (syllables: readonly Syllable[], frames: number, fps: number): string => {
  const codes: string[] = Array.from({length: frames}, () => '-');
  for (const s of syllables) {
    const a = Math.floor(s.start * fps);
    const b = Math.max(a + 1, Math.round(s.end * fps));
    const vowelCode = s.vowel === 'a' ? 'A' : s.vowel === 'o' || s.vowel === 'u' ? 'O' : s.vowel === 'e' ? 'E' : 'T';
    const onsetCode = s.onset === 'closed' ? '-' : s.onset === 'teeth' ? 'T' : null;
    for (let f = a; f < Math.min(b, frames); f++) {
      codes[f] = onsetCode && f === a && b - a > 2 ? onsetCode : vowelCode;
    }
  }
  return codes.join('');
};
