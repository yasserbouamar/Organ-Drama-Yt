import React from 'react';
import {useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {Point} from '../../types/characters';

export interface EsophagusProps {
  /** Where the tube meets the stomach (world px), usually the stomach's stub top. */
  bottom: Point;
  /** Where it leaves the frame (world px). */
  top: Point;
  width?: number;
  /** 0..1: acid climbing up the tube from the bottom (reflux). */
  acid?: number;
  /** 0..1: a peristaltic squeeze travelling down the tube. */
  squeeze?: number;
  /** Direction the tube leaves the stomach (unit vector); straight up by default. */
  bottomDir?: Point;
}

/** The food pipe: a muscular pink tube with ring folds, and an acid fill for reflux. */
export const Esophagus: React.FC<EsophagusProps> = ({bottom, top, width = 66, acid = 0, squeeze = 0, bottomDir = {x: 0, y: -1}}) => {
  const frame = useCurrentFrame();
  // Leave the stomach along its stub, then bend up toward the exit point.
  const c1 = {x: bottom.x + bottomDir.x * 220, y: bottom.y + bottomDir.y * 220};
  const d = `M${bottom.x},${bottom.y} C${c1.x},${c1.y} ${top.x},${top.y + 260} ${top.x},${top.y}`;
  const glow = 0.6 + 0.4 * Math.sin(frame * 0.4);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
      <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={width + INK.bold * 2} strokeLinecap="butt" />
      <path d={d} fill="none" stroke={TONES.gutHighlight} strokeWidth={width} strokeLinecap="butt" />
      <path d={d} fill="none" stroke="#F472B6" strokeWidth={width} strokeLinecap="butt" strokeDasharray="6 34" strokeDashoffset={-frame * 0.6} opacity={0.6} />
      {squeeze > 0 ? (
        <path d={d} fill="none" stroke={PALETTE.brainFold} strokeWidth={width + 14} pathLength={1} strokeDasharray="0.05 0.95" strokeDashoffset={-(1 - squeeze)} opacity={0.8} />
      ) : null}
      {acid > 0 ? (
        <>
          <path d={d} fill="none" stroke={TONES.acidGlow} strokeWidth={width * 0.9} pathLength={1} strokeDasharray={`${acid} 1`} opacity={0.5 * glow} />
          <path d={d} fill="none" stroke={PALETTE.acidGreen} strokeWidth={width * 0.62} pathLength={1} strokeDasharray={`${acid} 1`} />
          <path d={d} fill="none" stroke={TONES.acidLight} strokeWidth={8} pathLength={1} strokeDasharray={`${acid} 1`} strokeLinecap="round" opacity={0.8} transform="translate(-10 0)" />
        </>
      ) : null}
      <path d={d} fill="none" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" opacity={0.45} transform={`translate(${-width * 0.28} 0)`} />
    </svg>
  );
};
