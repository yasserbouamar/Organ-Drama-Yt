import React from 'react';
import {BrainCharacter} from '../components/characters/BrainCharacter';
import {HeartCharacter} from '../components/characters/HeartCharacter';
import {LetterCharacter} from '../components/characters/LetterCharacter';
import {PizzaSlice} from '../components/characters/PizzaSlice';
import {StomachCharacter} from '../components/characters/StomachCharacter';
import type {Expression, MouthShape, Point} from '../types/characters';
import type {ArmPose} from './gestures';
import {OrganPuppet} from './OrganPuppet';
import {resolveShape} from './shapes';
import type {PuppetSpec} from './types';

/** Size and landmarks of a puppet at a given width, in px from the top of its box. */
export interface PuppetMetrics {
  width: number;
  height: number;
  /** Where the soles of the feet are. */
  feet: number;
  /** Top of the head (hats sit above this). */
  top: number;
  /** Eye line. */
  eyes: number;
}

const BUILTIN = {
  brain: {vw: 400, vh: 420, feet: 384, top: 22, eyes: 192, size: 340},
  stomach: {vw: 560, vh: 620, feet: 603, top: 60, eyes: 210, size: 400},
  heart: {vw: 380, vh: 430, feet: 419, top: 60, eyes: 208, size: 290},
  letter: {vw: 300, vh: 340, feet: 304, top: 20, eyes: 92, size: 230},
  pizza: {vw: 240, vh: 280, feet: 280, top: 10, eyes: 110, size: 190},
} as const;

export const puppetMetrics = (spec: PuppetSpec, sizeOverride?: number): PuppetMetrics => {
  if (spec.kind !== 'organ') {
    const b = BUILTIN[spec.kind];
    const width = sizeOverride ?? spec.size ?? b.size;
    const k = width / b.vw;
    return {width, height: b.vh * k, feet: b.feet * k, top: b.top * k, eyes: b.eyes * k};
  }
  const shape = resolveShape(spec.shape);
  const width = sizeOverride ?? spec.size ?? shape.size;
  const k = width / shape.viewBox.width;
  const legs = shape.legs;
  const feet = legs ? legs.left.y + legs.length * 0.99 + (legs.width ?? 14) * 0.55 : shape.viewBox.height;
  const eyeY = (shape.face.eyes[0].y + shape.face.eyes[1].y) / 2;
  return {width, height: shape.viewBox.height * k, feet: feet * k, top: shape.head.y * k, eyes: eyeY * k};
};

export interface CastPuppetProps {
  spec: PuppetSpec;
  size?: number;
  expression: Expression;
  mouth: MouthShape;
  look: Point;
  arms: ArmPose;
  holding?: React.ReactNode;
  walk: number;
  hatLift: number;
  seed: string;
}

/** Draws any cast member: one of the pilot's builtin puppets, or a library/custom body. */
export const CastPuppet: React.FC<CastPuppetProps> = ({spec, size, expression, mouth, look, arms, holding, walk, hatLift, seed}) => {
  const width = puppetMetrics(spec, size).width;
  switch (spec.kind) {
    case 'brain':
      return <BrainCharacter size={width} expression={expression} mouth={mouth} look={look} leftArm={arms.left} rightArm={arms.right} holding={holding} />;
    case 'stomach':
      return (
        <StomachCharacter
          size={width}
          expression={expression}
          mouth={mouth}
          look={look}
          leftArm={arms.left}
          rightArm={arms.right}
          armsCrossed={arms.crossed}
          holding={holding}
          slices={spec.slices ?? 0}
          acidLevel={spec.acid ?? 0.35}
          stub={false}
          capLift={hatLift}
        />
      );
    case 'heart':
      return (
        <HeartCharacter
          size={width}
          expression={expression}
          mouth={mouth}
          look={look}
          leftArm={arms.left}
          rightArm={arms.right}
          armsCrossed={arms.crossed}
          bpm={expression === 'shocked' || expression === 'worried' ? 130 : 80}
        />
      );
    case 'letter':
      return <LetterCharacter size={width} expression={expression} mouth={mouth} look={look} leftArm={arms.left} rightArm={arms.right} holding={holding} run={walk} />;
    case 'pizza':
      return <PizzaSlice size={width} mouth={mouth === 'idle' ? 'grin' : mouth} look={look} wave={arms.right.angle > 120 ? 1 : 0} />;
    case 'organ':
      return (
        <OrganPuppet
          shape={resolveShape(spec.shape)}
          size={width}
          color={spec.color}
          limbColor={spec.limbColor}
          shoeColor={spec.shoeColor}
          accessories={spec.accessories}
          face={spec.face !== false}
          expression={expression}
          mouth={mouth}
          look={look}
          leftArm={arms.left}
          rightArm={arms.right}
          crossed={arms.crossed}
          reach={arms.reach}
          holding={holding}
          walk={walk}
          hatLift={hatLift}
          seed={seed}
        />
      );
  }
};
