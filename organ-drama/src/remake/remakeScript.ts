import {VOICE_CAST} from '../data/voiceCast';
import type {VoicePersona} from '../types/audio';
import type {DialogueLine, SpeakerId} from '../types/dialogue';

/**
 * Internal test: a shot-for-shot recreation of a 37.5 s reference clip, to
 * check how close the pipeline can get to a target style. Lines and start
 * times were transcribed from the reference audio; each line's window runs
 * to the next line's start (inclusive frames, like the pilot's script).
 */
export const REMAKE_FPS = 30;
export const REMAKE_FRAMES = 1124;

/** The four shots, in frames. */
export const SHOTS = {
  bedroomWide: {from: 0, to: 314},
  gut: {from: 315, to: 838},
  bedroomBed: {from: 839, to: 1077},
  stomachClose: {from: 1078, to: REMAKE_FRAMES - 1},
} as const;

type LineSpec = [id: string, speaker: SpeakerId, startSeconds: number, text: string, delivery?: DialogueLine['delivery']];

const LINES: LineSpec[] = [
  ['r-n1', 'NARRATOR', 0.37, "It's midnight. The whole body is asleep. Well..."],
  ['r-n2', 'NARRATOR', 4.08, 'almost.'],
  ['r-b1', 'BRAIN', 6.0, 'Shh... a whole pizza.', 'whisper'],
  ['r-b2', 'BRAIN', 8.05, 'Nobody tells the stomach.', 'whisper'],
  ['r-s1', 'STOMACH', 10.83, 'Kitchen is closed.', 'drowsy'],
  ['r-s2', 'STOMACH', 12.56, 'The gate is locked.', 'drowsy'],
  ['r-s3', 'STOMACH', 13.84, 'Good night.', 'drowsy'],
  ['r-n3', 'NARRATOR', 15.06, "That's the gate: a ring of muscle at the top of your stomach."],
  ['r-n4', 'NARRATOR', 18.48, 'It lets food in, and keeps the acid down.'],
  ['r-p1', 'PIZZA', 23.12, 'Hi.'],
  ['r-s4', 'STOMACH', 23.98, 'A slice?', 'shout'],
  ['r-s5', 'STOMACH', 25.36, 'At midnight?', 'shout'],
  ['r-s6', 'STOMACH', 26.83, 'Brain!', 'shout'],
  ['r-b3', 'BRAIN', 28.27, 'Okay, okay.'],
  ['r-b4', 'BRAIN', 29.78, 'Just one slice.'],
  ['r-b5', 'BRAIN', 32.08, "The moment you're full, tell me, and I stop."],
  ['r-b6', 'BRAIN', 35.25, 'Deal?'],
  ['r-s7', 'STOMACH', 36.43, 'Deal.', 'drowsy'],
];

export const REMAKE_DIALOGUE: readonly DialogueLine[] = LINES.map(([id, speaker, start, text, delivery = 'normal'], i) => {
  const startFrame = Math.round(start * REMAKE_FPS);
  const next = LINES[i + 1];
  return {
    id,
    scene: 1,
    speakers: [speaker],
    text,
    startFrame,
    endFrame: next ? Math.round(next[2] * REMAKE_FPS) - 1 : REMAKE_FRAMES - 1,
    delivery,
    direction: '',
  };
});

const kokoro = (speaker: SpeakerId, voice: string, lang: 'en-us' | 'en-gb'): VoicePersona => ({
  ...VOICE_CAST[speaker],
  kokoro: {voice, lang, speed: 1, semitones: 0},
});

/**
 * Kokoro voices picked to match each reference voice's pitch, at natural
 * speed and with no pitch effects.
 */
export const REMAKE_CAST: Record<SpeakerId, VoicePersona> = {
  ...VOICE_CAST,
  NARRATOR: kokoro('NARRATOR', 'bm_george', 'en-gb'),
  BRAIN: kokoro('BRAIN', 'am_eric', 'en-us'),
  STOMACH: kokoro('STOMACH', 'am_santa', 'en-us'),
  PIZZA: kokoro('PIZZA', 'am_liam', 'en-us'),
};
