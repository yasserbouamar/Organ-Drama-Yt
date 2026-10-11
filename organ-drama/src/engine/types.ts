/**
 * The episode format: one typed object per video, written by hand (or by
 * Claude via the make-video skill) in `episodes/<slug>/episode.ts`.
 *
 * An episode lists its cast (puppet + voice per character), then scenes made
 * of beats. A beat is usually one spoken line, plus whatever happens on screen
 * while it plays: expressions, gestures, moves, pop-ups and sound effects.
 * Frame timing is not written anywhere: it comes from the recorded voice
 * (see `timeline.ts`), so re-voicing a line re-times the whole video.
 */
import type {SfxId} from '../types/audio';
import type {Expression, Point} from '../types/characters';
import type {Delivery} from '../types/dialogue';

// ── Voices ────────────────────────────────────────────────────────────────

/**
 * Kokoro's English voices. `a` = American, `b` = British; `f` = female,
 * `m` = male. See `.claude/skills/make-video/voices.md` for what each sounds like.
 */
export const KOKORO_VOICES = [
  'af_alloy',
  'af_aoede',
  'af_bella',
  'af_heart',
  'af_jessica',
  'af_kore',
  'af_nicole',
  'af_nova',
  'af_river',
  'af_sarah',
  'af_sky',
  'am_adam',
  'am_echo',
  'am_eric',
  'am_fenrir',
  'am_liam',
  'am_michael',
  'am_onyx',
  'am_puck',
  'am_santa',
  'bf_alice',
  'bf_emma',
  'bf_isabella',
  'bf_lily',
  'bm_daniel',
  'bm_fable',
  'bm_george',
  'bm_lewis',
] as const;
export type KokoroVoice = (typeof KOKORO_VOICES)[number];

export interface VoiceSpec {
  voice: KokoroVoice;
  /** Pace multiplier, about 0.85–1.25 (default 1.05). */
  speed?: number;
  /** Cartoon pitch shift after synthesis, in semitones (default 0). */
  semitones?: number;
  /** Extra ffmpeg audio filters, e.g. `bass=g=4` or `vibrato=f=5.5:d=0.1`. */
  effects?: string;
  /** One line on how the character should sound (for the record). */
  direction?: string;
}

// ── Puppets ───────────────────────────────────────────────────────────────

/** Bodies in the shape library (`shapes.ts`). Each has a face, arms and legs rigged. */
export type ShapeName =
  | 'lungs'
  | 'liver'
  | 'kidney'
  | 'intestine'
  | 'bladder'
  | 'tooth'
  | 'bone'
  | 'redBloodCell'
  | 'whiteBloodCell'
  | 'virus'
  | 'bacteria'
  | 'neuron'
  | 'cell'
  | 'molecule'
  | 'drop'
  | 'blob'
  | 'pill'
  | 'mug'
  | 'apple'
  | 'sugarCube'
  | 'muscle'
  | 'eyeball';

export type HatType = 'nightcap' | 'tophat' | 'cap' | 'crown' | 'beanie' | 'chefHat' | 'partyHat' | 'headband' | 'bow' | 'gradCap' | 'hardhat';
export type FaceWear = 'glasses' | 'shades' | 'mustache' | 'monocle';
export type NeckWear = 'tie' | 'bowtie' | 'scarf' | 'badge';
export type AccessoryType = HatType | FaceWear | NeckWear;

export interface Accessory {
  type: AccessoryType;
  /** Main colour (defaults per accessory). */
  color?: string;
  /** Text on a badge, e.g. "ZZZ". */
  label?: string;
}

/** A path drawn on or around a custom body. Coordinates are in the shape's viewBox. */
export interface ShapeStroke {
  d: string;
  /** `body` / `light` / `dark` follow the puppet colour; anything else is a CSS colour. Omit for no fill. */
  fill?: string;
  /** Ink outline width (default: none for details, bold for parts). */
  stroke?: number;
  /** `ink`, `dark` (puppet shade) or a CSS colour (default ink). */
  strokeColor?: string;
  opacity?: number;
  /** Draw as a tube: an ink-outlined stroke `stroke` wide, coloured with `fill`. */
  tube?: boolean;
}

/** A body drawn from scratch: same rig as the library shapes. */
export interface CustomShape {
  viewBox: {width: number; height: number};
  /** One closed path: the silhouette. */
  body: string;
  /** Inner lines clipped to the body (folds, lobes, seams). */
  details?: ShapeStroke[];
  /** Parts drawn behind the body (tubes, stems, spikes, other balls). */
  behind?: ShapeStroke[];
  /** Parts drawn on top, unclipped (a leaf, a lid, a label). */
  front?: ShapeStroke[];
  face: {eyes: [Point, Point]; eyeR: number; mouth: Point; mouthScale?: number; cheeks?: boolean};
  arms: {left: Point; right: Point; length: number; width?: number} | null;
  legs: {left: Point; right: Point; length: number; width?: number} | null;
  /** Where hats sit: top-centre of the head and its width. */
  head: {x: number; y: number; width: number; tilt?: number};
  /** Where ties and bowties hang. */
  neck?: Point;
}

/** One of the pilot's hand-built puppets, with their special features. */
export interface BuiltinPuppet {
  kind: 'brain' | 'stomach' | 'heart' | 'letter' | 'pizza';
  /** Rendered width in px (each builtin has a sensible default). */
  size?: number;
  /** Stomach only: pizza slices in the belly and acid level 0..1. */
  slices?: number;
  acid?: number;
}

/** A puppet from the shape library or a custom body, in the house style. */
export interface OrganPuppet {
  kind: 'organ';
  shape: ShapeName | CustomShape;
  /** Body colour (each library shape has a default). Shading is derived from it. */
  color?: string;
  /** Limb colour (default: a darker shade of the body). */
  limbColor?: string;
  /** Sneaker colour. */
  shoeColor?: string;
  accessories?: readonly Accessory[];
  size?: number;
  /** false = an object with no face (a prop that never talks). */
  face?: boolean;
}

export type PuppetSpec = BuiltinPuppet | OrganPuppet;

// ── Cast ──────────────────────────────────────────────────────────────────

export interface CastMember {
  /** Display name, for the record (never shown on screen). */
  name: string;
  /** Who they are in one line: drives acting choices. */
  personality: string;
  puppet: PuppetSpec;
  voice: VoiceSpec;
}

// ── Acting ────────────────────────────────────────────────────────────────

/**
 * Arm poses. `point`, `present` and `stop` use the arm on the side the
 * character faces; `hold` shows `holding` in the screen-right hand.
 */
export type Gesture =
  | 'idle'
  | 'wave'
  | 'point'
  | 'present'
  | 'shrug'
  | 'cheer'
  | 'hips'
  | 'think'
  | 'panic'
  | 'stop'
  | 'hold'
  | 'crossed'
  | 'facepalm';

/** Frame-by-frame acting for one character, from this beat on (until changed). */
export interface Act {
  expression?: Expression;
  gesture?: Gesture;
  /** Who or where to look: a cast id, 'camera', 'up', 'down', 'left', 'right'. */
  look?: string;
  /** Walk/slide to a new spot (world px) over the first ~20 frames of the beat. */
  moveTo?: {x: number; y?: number};
  /** Turn to face left or right. */
  face?: 'left' | 'right';
  /** A one-off motion at the beat start. */
  motion?: 'jump' | 'shake' | 'shiver' | 'bounce' | 'spin' | 'faint';
  /** Show something in the screen-right hand (a prop puppet), or null to put it away. */
  holding?: PropSpec | null;
  /** Pick up a scene prop by its `id`: it leaves the set and goes in the hand. */
  take?: string;
  /** Hide (exit) or show (enter) the character at this beat. */
  visible?: boolean;
}

export interface PropSpec {
  /** Name it to let a character `take` it. */
  id?: string;
  puppet: PuppetSpec;
  /** Only for props placed in the scene, not held. */
  x?: number;
  y?: number;
  rotation?: number;
}

// ── Pop-ups and effects ───────────────────────────────────────────────────

/** Comic banner across the top (e.g. "20 MIN LATER", "3-HOUR RULE"). */
export interface CardOverlay {
  text: string;
  sub?: string;
  color?: string;
}

/** A speech/thought bubble with short text near a character's head. */
export interface BubbleOverlay {
  text: string;
  /** Cast id the tail points at. */
  from: string;
  variant?: 'speech' | 'thought' | 'shout' | 'whisper';
  /** Small round badge, e.g. a count. */
  badge?: string;
}

/** Starburst sound-word (POW!, CLICK!, GULP!). Position defaults near the action. */
export interface BurstOverlay {
  text: string;
  /** World position, or a cast id to sit beside. */
  at?: Point | string;
  color?: string;
  size?: number;
}

/** Label with an arrow pointing at a character or a world point. */
export interface CalloutOverlay {
  label: string;
  sub?: string;
  target: string | Point;
  color?: string;
}

/** A dial that sweeps to a value: "20 MIN", "3 HOURS", "8 GLASSES". */
export interface DialOverlay {
  value: number;
  max: number;
  unit: string;
  label?: string;
  color?: string;
}

/** A labelled bar filling or draining: energy, sugar level, hydration. */
export interface MeterOverlay {
  label: string;
  from: number;
  to: number;
  color?: string;
  /** Screen side it sits on. */
  side?: 'left' | 'right';
}

/** A short list of tips that tick in one by one (best near the end). */
export interface ListOverlay {
  title: string;
  items: readonly string[];
}

export type EffectName = 'zzz' | 'sweat' | 'hearts' | 'sparkle' | 'steam' | 'flash' | 'shake' | 'alarm';

export interface Effect {
  type: EffectName;
  /** Cast id it attaches to (not needed for flash/shake/alarm). */
  on?: string;
}

export interface SfxCue {
  id: SfxId;
  /** Frames after the beat starts (negative = before). `'end'` = when the beat's line ends. Default 0. */
  at?: number | 'end';
  volume?: number;
}

// ── Beats and scenes ──────────────────────────────────────────────────────

/**
 * `group` frames everyone on screen (the default between lines), `push` leans
 * in toward the speaker (the default on character lines), `close` is a
 * close-up of the speaker, `two-shot` frames the speaker and their nearest
 * neighbour, `wide` shows the whole set.
 */
export type CameraShot = 'group' | 'wide' | 'close' | 'two-shot' | 'push' | {x: number; y: number; zoom: number};

export interface Beat {
  /** Unique id (used for the voice file). Required on spoken beats. */
  id?: string;
  /** Cast id (or several for a chorus), or 'NARRATOR' (heard, not seen). */
  speaker?: string | readonly string[];
  /** What is said. Keep lines short: 3–14 words. */
  line?: string;
  /** Spelling sent to text-to-speech when it differs from `line`. */
  sayAs?: string;
  delivery?: Delivery;
  /** Frames of silence before this beat (default 6 between lines). */
  gap?: number;
  /** A beat with no line: hold for this many frames (a sight gag, a reaction). */
  hold?: number;
  /** Per-character acting, keyed by cast id. */
  act?: Readonly<Record<string, Act>>;
  camera?: CameraShot;
  card?: CardOverlay;
  bubble?: BubbleOverlay;
  burst?: BurstOverlay;
  callout?: CalloutOverlay;
  dial?: DialOverlay;
  meter?: MeterOverlay;
  list?: ListOverlay;
  effects?: readonly Effect[];
  sfx?: readonly SfxCue[];
  /** What the picture should show, for the record. */
  note?: string;
}

/** The sets in `sets.tsx`. Each lays out a 1920×1080 world with a floor. */
export type SetName = 'bedroom' | 'gut' | 'body' | 'kitchen' | 'outdoors' | 'stage' | 'plain' | 'classroom';

export interface SetSpec {
  name: SetName;
  /** bedroom: 'night' | 'morning'; outdoors: 'day' | 'sunset' | 'night'. */
  time?: 'night' | 'morning' | 'day' | 'sunset';
  /** body / plain: main colour. */
  tint?: string;
  /** body: what floats around. */
  particles?: 'cells' | 'bubbles' | 'sparks' | 'none';
  /** bedroom: the clock reads this. classroom: chalkboard text. */
  text?: string;
}

export interface Placement {
  /** Cast id. */
  id: string;
  /** World x of the puppet's centre (0–1920). */
  x: number;
  /** World y of the puppet's feet (default: the set's floor). */
  y?: number;
  /** Width override in px. */
  size?: number;
  face?: 'left' | 'right';
  /** How they arrive (default: already there). */
  enter?: 'pop' | 'walk' | 'drop' | 'none';
  /** Start hidden until a beat sets `visible: true`. */
  hidden?: boolean;
  /** Starting acting. */
  act?: Act;
}

export interface Scene {
  set: SetSpec;
  cast: readonly Placement[];
  /** Props standing in the scene (pizza box, glass of water...). */
  props?: readonly PropSpec[];
  /** 'follow' pushes in on whoever speaks (default); 'static' holds the wide shot. */
  camera?: 'follow' | 'static';
  beats: readonly Beat[];
  /** Frames to hold after the last beat before the cut (default 14). */
  holdAfter?: number;
  note?: string;
}

export interface Episode {
  /** kebab-case folder name, e.g. `coffee-vs-sleep`. */
  slug: string;
  /** Working title (never shown on screen). */
  title: string;
  topic: string;
  /** The joke and the lesson in one sentence. */
  logline: string;
  /** Length the user asked for, in seconds (checked by `npm run episode -- check`). */
  targetSeconds: number;
  /** The facts the episode teaches, with sources, so they can be checked. */
  facts: readonly {claim: string; source: string}[];
  narrator?: VoiceSpec;
  cast: Readonly<Record<string, CastMember>>;
  scenes: readonly Scene[];
  /** Background score (default 'pizzicato'). */
  music?: 'pizzicato' | 'nightbox' | 'none';
  /** Multiplier on the ducked music level (default 1). */
  musicVolume?: number;
}

/** Identity helper so episode files get full type checking and autocomplete. */
export const defineEpisode = (episode: Episode): Episode => episode;
