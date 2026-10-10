import type {CSSProperties} from 'react';
import type {Viseme} from './dialogue';

export interface Point {
  x: number;
  y: number;
}

/**
 * Mouths a puppet can make: the five lip-sync visemes plus held "acting"
 * shapes that never come out of the lip-sync cycle.
 */
export type MouthShape = Viseme | 'frown' | 'yawn' | 'chew' | 'wobbly' | 'grin';

/** Facial expression presets. Each puppet maps these to brows, lids and pupils. */
export type Expression =
  | 'neutral'
  | 'sneaky'
  | 'excited'
  | 'chewing'
  | 'sleeping'
  | 'sleepy'
  | 'happy'
  | 'smug'
  | 'worried'
  | 'shocked'
  | 'grumpy'
  | 'irritated'
  | 'crying'
  | 'cool';

/** Where and how a puppet sits in a shot (see `Place`). */
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

/** A noodle limb: degrees from straight down (positive swings outward), plus elbow bend. */
export interface LimbPose {
  angle: number;
  bend?: number;
}

/** Props every puppet understands. */
export interface CharacterBaseProps {
  /** Rendered width in px. Height follows the puppet's aspect ratio. */
  size?: number;
  expression?: Expression;
  mouth?: MouthShape;
  /** Pupil direction, each axis in -1..1. */
  look?: Point;
  /** 0 = eyes open, 1 = closed. Omit for automatic spring-driven blinking. */
  blink?: number;
  style?: CSSProperties;
}
