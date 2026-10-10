import type {CSSProperties} from 'react';

/** Everyone who can speak a line. HOST is the off-screen narrator. */
export type Speaker = 'HOST' | 'ROCKET' | 'LIL_SAT' | 'SUN' | 'GRAVITY';

/** Puppets that exist as on-screen SVG characters. */
export type CharacterId = 'ROCKET' | 'LIL_SAT' | 'SUN' | 'GRAVITY' | 'EARTH';

/** Facial expression presets. Each puppet maps these to brows, lids and pupils. */
export type Expression =
  | 'neutral'
  | 'confused'
  | 'happy'
  | 'confident'
  | 'smug'
  | 'scared'
  | 'panic'
  | 'grumpy'
  | 'crying'
  | 'awe'
  | 'calm';

/**
 * Mouth shapes. `idle`/`talk`/`open`/`wide` form the lip-sync cycle; the rest
 * are held "acting" shapes.
 */
export type Viseme =
  | 'idle'
  | 'talk'
  | 'open'
  | 'wide'
  | 'screaming'
  | 'smug'
  | 'smile'
  | 'frown';

export interface Point {
  x: number;
  y: number;
}

/**
 * Where and how a puppet sits in a shot. Scenes animate these numbers; the
 * `Place` wrapper turns them into a CSS transform.
 */
export interface Pose {
  x: number;
  y: number;
  scale?: number;
  /** Degrees, clockwise. */
  rotation?: number;
  /** Squash & stretch: >1 stretches vertically, <1 squashes. Volume is preserved. */
  squash?: number;
  flipX?: boolean;
  opacity?: number;
}

/** Acting direction attached to a dialogue line (who does what while it plays). */
export interface PoseCue {
  character: CharacterId;
  expression: Expression;
  mouth?: Viseme;
  action: string;
}

/** Props every puppet understands. */
export interface CharacterBaseProps {
  /** Rendered width in px. Height follows the puppet's aspect ratio. */
  size?: number;
  expression?: Expression;
  mouth?: Viseme;
  /** Pupil direction, each axis in -1..1. */
  look?: Point;
  /** 0 = eyes open, 1 = closed. Omit for automatic blinking. */
  blink?: number;
  /** Wrap the puppet in the white sticker border. Defaults to true. */
  sticker?: boolean;
  style?: CSSProperties;
}
