import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bed, BedroomRoom, Nightstand} from './BedroomBackground';

export interface BedroomSetProps {
  /** 0 = midnight, 1 = morning. */
  morning?: number;
  time?: string;
  /** 0..1 mound in the blanket over a hidden sleeper. */
  lump?: number;
  lumpX?: number;
  /** Drawn between the mattress and the blanket (whoever is in bed). */
  sleeper?: React.ReactNode;
  /** Drawn in front of everything (props on the blanket, visitors). */
  front?: React.ReactNode;
}

/** The whole bedroom, layered so a puppet can lie between mattress and blanket. */
export const BedroomSet: React.FC<BedroomSetProps> = ({morning = 0, time = '12:00', lump = 0, lumpX, sleeper, front}) => (
  <AbsoluteFill>
    <BedroomRoom morning={morning} />
    <Bed layer="back" morning={morning} />
    {sleeper}
    <Bed layer="front" morning={morning} lump={lump} lumpX={lumpX} />
    <Nightstand morning={morning} time={time} />
    {front}
  </AbsoluteFill>
);
