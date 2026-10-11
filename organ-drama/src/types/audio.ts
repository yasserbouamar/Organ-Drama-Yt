import type {WordTiming} from './dialogue';

/** Every sound effect in the pilot. Each has a procedural recipe in `ProceduralSFX.ts`. */
export type SfxId =
  | 'clock_tick'
  | 'whoosh_soft'
  | 'box_creak'
  | 'chime_sparkle'
  | 'lock_click'
  | 'heavy_knock'
  | 'liquid_splash'
  | 'bubble_pop'
  | 'cartoon_gulp'
  | 'stopwatch_tick'
  | 'bell_ding'
  | 'horn_beep'
  | 'flomp_bounce'
  | 'liquid_slosh'
  | 'acid_sizzle'
  | 'cartoon_alarm'
  | 'morning_chime'
  | 'gear_ratchet'
  | 'boing_jump'
  | 'comic_rimshot';

/** A sound effect fired at an absolute frame. */
export interface SFXTrigger {
  id: SfxId;
  frame: number;
  /** Scene number (the pilot's 1–5, or an episode's scene index). */
  scene: number;
  /** How long the effect plays (loops like `stopwatch_tick` are synthesized to fit). */
  durationInFrames: number;
  /** Gain, 0..1, relative to dialogue at 1. */
  volume: number;
  /** What the cue is for, as written in the shooting script. */
  label: string;
}

export type AudioTrackKind = 'vo' | 'sfx' | 'bgm';

/** One clip on the audio timeline, resolved to a playable source. */
export interface AudioTrack {
  id: string;
  kind: AudioTrackKind;
  /** `staticFile()` URL or a synthesized `data:` URL. */
  src: string;
  startFrame: number;
  durationInFrames: number;
  /** Constant gain, or a gain curve over the clip's own frames. */
  volume: number | ((frame: number) => number);
}

export type VoiceProvider = 'elevenlabs' | 'edge' | 'kokoro' | 'procedural';

/**
 * A rendered voiceover clip for one line (written by `npm run audio`).
 * `visemes` holds one character per frame of the clip, analysed from the
 * audio itself: `-` idle, `A` open, `O` o, `T` teeth, `E` smile.
 */
export interface VoiceoverClip {
  /** Path inside `public/`, passed to `staticFile()`. */
  file: string;
  provider: VoiceProvider;
  durationInFrames: number;
  visemes: string;
  /** Word timings derived from the clip's voiced frames, relative to its start. */
  words: WordTiming[];
}

export type VoiceoverManifest = Partial<Record<string, VoiceoverClip>>;

/** Parameters for the procedural "babble" voice used when no TTS clip exists. */
export interface BabbleVoice {
  /** Base pitch in Hz. */
  pitch: number;
  /** Pitch swing over a phrase, in semitones. */
  range: number;
  /** Vibrato depth in semitones (dramatic speakers wobble). */
  vibrato: number;
  /** Formant scale: >1 sounds smaller/brighter, <1 bigger/darker. */
  formant: number;
  /** Breathiness, 0..1. */
  breath: number;
}

/** Voice casting for one speaker across every TTS provider. */
export interface VoicePersona {
  speaker: string;
  direction: string;
  elevenlabs: {
    voiceName: string;
    /** Default library voice ID; override with ELEVENLABS_VOICE_<SPEAKER>. */
    voiceId: string;
    settings: {stability: number; similarity_boost: number; style: number; speed: number};
  };
  edge: {voice: string; rate: string; pitch: string};
  kokoro: {
    voice: string;
    lang: 'en-us' | 'en-gb';
    speed: number;
    /** Pitch shift after synthesis (formants move too: cartoon-style). */
    semitones: number;
    /** Extra ffmpeg audio filters for the character. */
    effects?: string;
  };
  babble: BabbleVoice;
}
