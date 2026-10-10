import type {Expression} from '../../../types/characters';
import type {EyeStyle} from './Eye';

/** How an expression drives a face: eyes, lids and brows. Every puppet reads the same table. */
export interface FaceRig {
  style: EyeStyle;
  /** Resting upper-lid closure 0..1. */
  lid: number;
  /** Lower-lid lift 0..1. */
  lower: number;
  /** Lid tilt in degrees (angry/sneaky slant). */
  tilt: number;
  /** Pupil radius as a fraction of the eye. */
  pupil: number;
  /** Eye radius multiplier. */
  eyeScale: number;
  /** Brow offsets [inner, outer] in units, negative = raised. `null` hides brows. */
  brow: readonly [number, number] | null;
  sparkle: boolean;
  tears: boolean;
}

const base: FaceRig = {style: 'round', lid: 0.12, lower: 0, tilt: 0, pupil: 0.44, eyeScale: 1, brow: [0, -2], sparkle: false, tears: false};

export const FACE_RIGS: Record<Expression, FaceRig> = {
  neutral: base,
  sneaky: {...base, lid: 0.48, tilt: 12, pupil: 0.4, brow: [9, -7]},
  excited: {...base, lid: 0, pupil: 0.58, eyeScale: 1.08, brow: [-14, -12], sparkle: true},
  chewing: {...base, lid: 0.28, lower: 0.3, pupil: 0.42, brow: [-4, -6]},
  sleeping: {...base, style: 'closed', brow: [2, 2]},
  sleepy: {...base, lid: 0.58, pupil: 0.4, brow: [4, 6]},
  happy: {...base, style: 'happy', brow: [-8, -8]},
  smug: {...base, lid: 0.45, lower: 0.15, pupil: 0.42, brow: [5, -12]},
  worried: {...base, lid: 0.04, pupil: 0.32, brow: [-13, 5]},
  shocked: {...base, lid: 0, pupil: 0.24, eyeScale: 1.12, brow: [-20, -17]},
  grumpy: {...base, lid: 0.42, tilt: 14, pupil: 0.4, brow: [12, -4]},
  irritated: {...base, lid: 0.3, tilt: 16, pupil: 0.36, brow: [14, -8]},
  crying: {...base, style: 'squeeze', brow: [-12, 6], tears: true},
  cool: {...base, lid: 0.38, pupil: 0.42, brow: [4, -6]},
};
