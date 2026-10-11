export type SceneId = 1 | 2 | 3 | 4 | 5;

/** Puppets that exist as on-screen SVG characters. */
export type CharacterType = 'BRAIN' | 'STOMACH' | 'LETTER' | 'HEART' | 'PIZZA';

/** Everyone who can speak a line. NARRATOR is the off-screen explainer. */
export type SpeakerId = CharacterType | 'NARRATOR';

/**
 * Mouth shapes used for lip-sync: closed (`idle`), "ah" (`open`), "oo/oh"
 * (`o`), "s/t/ee" with clenched teeth (`teeth`) and a wide grin (`smile`).
 */
export type Viseme = 'idle' | 'open' | 'o' | 'teeth' | 'smile';

/** How a line is performed: drives the voice, mouth energy and caption motion. */
export type Delivery = 'normal' | 'shout' | 'whisper' | 'drowsy';

/**
 * One spoken line. Frame numbers are absolute composition frames and
 * inclusive at both ends, exactly as the shooting script writes them
 * ("F76 - F180" → `startFrame: 76, endFrame: 180`).
 */
export interface DialogueLine {
  id: string;
  scene: SceneId;
  /** Usually one speaker; a chorus line can have several. */
  speakers: readonly SpeakerId[];
  text: string;
  startFrame: number;
  endFrame: number;
  delivery: Delivery;
  /** Words (case-insensitive, punctuation ignored) to colour in the captions. */
  emphasis?: readonly string[];
  /** Spelling handed to text-to-speech when it differs from the caption. */
  sayAs?: string;
  /** What the picture shows while the line plays. */
  direction: string;
}

export interface SceneDefinition {
  id: SceneId;
  title: string;
  /** Inclusive, like dialogue lines. */
  startFrame: number;
  endFrame: number;
  environment: 'bedroom' | 'gut';
}

/** A word in a line, timed in frames relative to the line's start. */
export interface WordTiming {
  text: string;
  startFrame: number;
  endFrame: number;
}
