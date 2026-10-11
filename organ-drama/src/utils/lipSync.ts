import {DIALOGUE, FPS, lineLength} from '../data/scriptData';
import {VOICEOVER} from '../data/voiceover.generated';
import type {VoiceoverClip, VoiceoverManifest} from '../types/audio';
import type {MouthShape} from '../types/characters';
import type {DialogueLine, SpeakerId, Viseme, WordTiming} from '../types/dialogue';
import {planSyllables, visemesFromSyllables, wordsFromSyllables, type Syllable} from './syllables';
import {publicFileExists} from './staticFiles';

const CODE_TO_VISEME: Record<string, Viseme> = {'-': 'idle', A: 'open', O: 'o', T: 'teeth', E: 'smile'};

/** Syllables per second for the babble voice, by delivery. */
const BABBLE_RATE = {normal: 5.4, shout: 6, whisper: 5, drowsy: 4.2} as const;

/** What drives a line's mouths and captions: its recorded clip, or the babble plan. */
export interface LineTrack {
  recorded: boolean;
  durationInFrames: number;
  /** One mouth code per frame of the clip. */
  visemes: string;
  words: WordTiming[];
  /** Only for babble: the syllable plan the synth voices. */
  syllables?: Syllable[];
}

/**
 * Syllable plan for the babble voice: sized at a natural pace, never longer
 * than the line's window. Pure, so the Node audio generator can use it too.
 */
export const babblePlan = (line: DialogueLine): {seconds: number; syllables: Syllable[]} => {
  const probe = planSyllables(line.text, 1, line.delivery);
  const pauses = line.text.match(/[.,!?…]/g)?.length ?? 0;
  const natural = probe.length / BABBLE_RATE[line.delivery] + 0.12 * pauses + 0.2;
  const seconds = Math.min((lineLength(line) - 3) / FPS, natural);
  return {seconds, syllables: planSyllables(line.text, seconds, line.delivery)};
};

/** Lip-sync for one script: its lines plus the voiceover manifest written for them. */
export interface LipSync {
  /** The recorded clip for a line, if the manifest lists one and the file is really there. */
  recordedClip: (line: DialogueLine) => VoiceoverClip | null;
  /** Lip-sync and caption timing for a line (cached). */
  getLineTrack: (line: DialogueLine) => LineTrack;
  /**
   * Mouth shape for `speaker` at an absolute frame: the clip's analysed viseme
   * while they talk, otherwise `rest` (an acting shape chosen by the scene).
   */
  mouthAt: (speaker: SpeakerId, frame: number, rest?: MouthShape) => MouthShape;
}

export const createLipSync = (dialogue: readonly DialogueLine[], manifest: VoiceoverManifest): LipSync => {
  const recordedClip = (line: DialogueLine): VoiceoverClip | null => {
    const clip = manifest[line.id];
    if (!clip) {
      return null;
    }
    return publicFileExists(clip.file) === false ? null : clip;
  };

  const tracks = new Map<string, LineTrack>();
  const getLineTrack = (line: DialogueLine): LineTrack => {
    const cached = tracks.get(line.id);
    if (cached) {
      return cached;
    }
    const clip = recordedClip(line);
    let track: LineTrack;
    if (clip) {
      track = {recorded: true, durationInFrames: clip.durationInFrames, visemes: clip.visemes, words: clip.words};
    } else {
      const {seconds, syllables} = babblePlan(line);
      const frames = Math.ceil(seconds * FPS);
      track = {
        recorded: false,
        durationInFrames: frames,
        visemes: visemesFromSyllables(syllables, frames, FPS),
        words: wordsFromSyllables(line.text, syllables, FPS),
        syllables,
      };
    }
    tracks.set(line.id, track);
    return track;
  };

  const mouthAt = (speaker: SpeakerId, frame: number, rest: MouthShape = 'idle'): MouthShape => {
    const line = dialogue.find((l) => frame >= l.startFrame && frame <= l.endFrame && l.speakers.includes(speaker));
    if (!line) {
      return rest;
    }
    const track = getLineTrack(line);
    const local = frame - line.startFrame;
    if (local >= track.durationInFrames) {
      return rest;
    }
    return CODE_TO_VISEME[track.visemes[local] ?? '-'] ?? 'idle';
  };

  return {recordedClip, getLineTrack, mouthAt};
};

/** The pilot's lip-sync. */
export const PILOT_LIP_SYNC = createLipSync(DIALOGUE, VOICEOVER);
export const {recordedClip, getLineTrack, mouthAt} = PILOT_LIP_SYNC;
