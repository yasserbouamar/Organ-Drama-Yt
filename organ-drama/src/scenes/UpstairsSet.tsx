import React from 'react';
import {BedroomSet} from '../components/backgrounds/BedroomSet';
import {BrainCharacter, type BrainCharacterProps} from '../components/characters/BrainCharacter';
import {PizzaSliceArt} from '../components/characters/PizzaSlice';
import {Place} from '../components/fx/Place';
import {PizzaBox} from '../components/props/PizzaBox';
import {Mailbox} from '../components/props/StageProps';

/** Where the Brain sits up in bed, in the bedroom world. */
export const BRAIN_IN_BED = {x: 1180, y: 560, size: 360} as const;

export interface UpstairsSetProps {
  brain: Omit<BrainCharacterProps, 'size' | 'torso'>;
  /** 0 = sitting up, 1 = flat on the pillow. */
  lieDown?: number;
  /** Squash on landing (FLOMP!). */
  squash?: number;
  /** Give the Brain a slice to hold (with a bite taken, 0..1). */
  slice?: {bite: number} | null;
  slicesLeft?: number;
  mailbox?: {open: number; flag: number} | null;
  morning?: number;
  time?: string;
}

/**
 * "Meanwhile, upstairs": the bedroom with the Brain in bed next to the pizza
 * box (and, when needed, a mailbox for the letter that hasn't arrived yet).
 * Used full-frame and inside the gut scenes' cut-away panels.
 */
export const UpstairsSet: React.FC<UpstairsSetProps> = ({brain, lieDown = 0, squash = 1, slice = null, slicesLeft = 6, mailbox = null, morning = 0, time = '12:00'}) => {
  // Lying down: tip back onto the pillow and sink into the mattress.
  const x = BRAIN_IN_BED.x - lieDown * 150;
  const y = BRAIN_IN_BED.y + lieDown * 60;
  const holding = slice ? (
    <g transform="rotate(62) scale(0.32) translate(-120 -60)">
      <PizzaSliceArt face={false} bite={slice.bite} />
    </g>
  ) : undefined;
  return (
    <BedroomSet
      morning={morning}
      time={time}
      lump={0.1}
      lumpX={BRAIN_IN_BED.x}
      sleeper={
        <Place x={x} y={y} rotation={-82 * lieDown} squash={squash}>
          <BrainCharacter size={BRAIN_IN_BED.size} torso={false} holding={holding} {...brain} />
        </Place>
      }
      front={
        <>
          <Place x={1450} y={650}>
            <PizzaBox size={300} open={1} glow={0.25} slicesLeft={slicesLeft} />
          </Place>
          {mailbox ? (
            <Place x={1720} y={740}>
              <Mailbox size={190} open={mailbox.open} flag={mailbox.flag} />
            </Place>
          ) : null}
        </>
      }
    />
  );
};
