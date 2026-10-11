import type {LimbPose} from '../types/characters';
import type {Gesture} from './types';

export interface ArmPose {
  left: LimbPose;
  right: LimbPose;
  /** Arms folded over the chest (drawn specially). */
  crossed: boolean;
  /** One hand goes to the face (puppets with a rigged face aim it exactly). */
  reach?: {side: 'left' | 'right'; to: 'chin' | 'eyes'};
}

const IDLE: LimbPose = {angle: 22, bend: 14};

/**
 * Arm angles for a gesture. `facing` is +1 when the character faces screen
 * right: pointing and presenting use the arm on that side. Angles are degrees
 * from straight down (90 = straight out, 180 = straight up).
 */
export const armsFor = (gesture: Gesture, facing: 1 | -1, frame: number): ArmPose => {
  const sway = Math.sin(frame * 0.08) * 3;
  const idle = {angle: IDLE.angle + sway, bend: IDLE.bend};
  const pair = (active: LimbPose, other: LimbPose = idle): ArmPose =>
    facing === 1 ? {left: other, right: active, crossed: false} : {left: active, right: other, crossed: false};
  switch (gesture) {
    case 'idle':
      return {left: idle, right: {angle: IDLE.angle - sway, bend: IDLE.bend}, crossed: false};
    case 'wave':
      return pair({angle: 150 + Math.sin(frame * 0.45) * 20, bend: 24});
    case 'point':
      return pair({angle: 98, bend: -4});
    case 'present':
      return pair({angle: 68, bend: 26}, {angle: 30, bend: 10});
    case 'stop':
      return pair({angle: 104, bend: -24});
    case 'hold':
      return {left: idle, right: {angle: 62, bend: -26}, crossed: false};
    case 'shrug':
      return {left: {angle: 76, bend: 70}, right: {angle: 76, bend: 70}, crossed: false};
    case 'cheer': {
      const w = Math.sin(frame * 0.5) * 6;
      return {left: {angle: 158 + w, bend: 12}, right: {angle: 158 - w, bend: 12}, crossed: false};
    }
    case 'hips':
      return {left: {angle: 18, bend: -72}, right: {angle: 18, bend: -72}, crossed: false};
    case 'think':
      return {...pair({angle: 150, bend: -110}), reach: {side: facing === 1 ? 'right' : 'left', to: 'chin'}};
    case 'facepalm':
      return {...pair({angle: 170, bend: -120}, {angle: 30, bend: 10}), reach: {side: facing === 1 ? 'right' : 'left', to: 'eyes'}};
    case 'panic': {
      const w = (p: number) => 150 + Math.sin(frame * 0.9 + p) * 26;
      return {left: {angle: w(0), bend: 26}, right: {angle: w(Math.PI), bend: 26}, crossed: false};
    }
    case 'crossed':
      return {left: idle, right: idle, crossed: true};
  }
};

/** Blend two poses (t = 0..1) so gesture changes ease instead of popping. */
export const blendArms = (a: ArmPose, b: ArmPose, t: number): ArmPose => {
  const mix = (p: LimbPose, q: LimbPose): LimbPose => ({angle: p.angle + (q.angle - p.angle) * t, bend: (p.bend ?? 0) + ((q.bend ?? 0) - (p.bend ?? 0)) * t});
  return {left: mix(a.left, b.left), right: mix(a.right, b.right), crossed: t < 0.5 ? a.crossed : b.crossed, reach: t < 0.5 ? a.reach : b.reach};
};
