import type {PoseCue, Speaker} from './characters';

export type SceneId = 1 | 2 | 3 | 4;

/**
 * One spoken line. Frame windows are half-open and absolute (composition
 * frames): the line owns `[startFrame, startFrame + durationInFrames)`.
 */
export interface DialogueEvent {
  id: string;
  scene: SceneId;
  speaker: Speaker;
  text: string;
  startFrame: number;
  durationInFrames: number;
  /** How the line is performed; drives mouth shapes and caption energy. */
  delivery: 'normal' | 'shout' | 'calm';
  /** Words (case-insensitive, punctuation ignored) to colour in the captions. */
  emphasis?: readonly string[];
  /** Puppet acting for the speaker (or the featured character for HOST lines). */
  pose?: PoseCue;
  /** What the picture shows while the line plays. */
  visual: string;
}

export interface SceneDefinition {
  id: SceneId;
  title: string;
  startFrame: number;
  durationInFrames: number;
}

/** A word in a line, timed in frames relative to the line's start. */
export interface WordTiming {
  text: string;
  startFrame: number;
  endFrame: number;
}

/** A rendered voiceover clip for one line (written by `npm run voiceover`). */
export interface VoiceoverClip {
  /** Path inside `public/`, passed to `staticFile()`. */
  file: string;
  durationInFrames: number;
  /** Word timings from ElevenLabs' character alignment, if available. */
  words?: WordTiming[];
}

export type VoiceoverManifest = Partial<Record<string, VoiceoverClip>>;

/** ElevenLabs casting for one speaker. */
export interface VoicePersona {
  speaker: Speaker;
  /** The library voice this persona was cast with. */
  voiceName: string;
  /** Alternative library voice that also fits. */
  alternateVoiceName: string;
  /** Default ElevenLabs voice ID; override with ELEVENLABS_VOICE_<SPEAKER>. */
  voiceId: string;
  direction: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
  };
}
