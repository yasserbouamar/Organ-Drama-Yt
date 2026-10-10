import React from 'react';
import {PALETTE} from '../../../theme';
import type {Viseme} from '../../../types/characters';
import {useSvgId} from '../../../utils/useSvgId';

const MOUTH_DARK = '#3A0A1C';
const TONGUE = '#FF6F91';

export interface MouthProps {
  shape: Viseme;
  /** Centre of the mouth in the parent SVG's units. */
  x: number;
  y: number;
  /** 1 = a ~60-unit-wide mouth. */
  scale?: number;
  /** Flip horizontally (for smirks). */
  flip?: boolean;
  strokeWidth?: number;
}

/**
 * Shared mouth rig. Every shape is drawn around (0, 0) at ~60 units wide so
 * one set of visemes serves all puppets.
 */
export const Mouth: React.FC<MouthProps> = ({shape, x, y, scale = 1, flip = false, strokeWidth = 5}) => {
  const clipId = useSvgId('mouth');
  const sw = strokeWidth / scale;
  const line = {fill: 'none', stroke: PALETTE.ink, strokeWidth: sw * 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const filled = {stroke: PALETTE.ink, strokeWidth: sw, strokeLinejoin: 'round' as const};

  // `teethTop` / `teethBottom` are the y of the teeth edge, or null for no teeth.
  const openShape = (d: string, teethTop: number | null, teethBottom: number | null, tongue: boolean) => (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={MOUTH_DARK} />
      <g clipPath={`url(#${clipId})`}>
        {teethTop !== null ? <rect x={-40} y={-40} width={80} height={teethTop + 40} fill={PALETTE.white} /> : null}
        {teethBottom !== null ? <rect x={-40} y={teethBottom} width={80} height={40} fill={PALETTE.white} /> : null}
        {tongue ? <ellipse cx={0} cy={26} rx={20} ry={13} fill={TONGUE} /> : null}
      </g>
      <path d={d} fill="none" {...filled} />
    </>
  );

  let art: React.ReactNode;
  switch (shape) {
    case 'idle':
      art = <path d="M-20,0 Q0,9 20,0" {...line} />;
      break;
    case 'talk':
      art = openShape('M-22,-6 Q0,-9 22,-6 Q18,16 0,18 Q-18,16 -22,-6 Z', 1, null, true);
      break;
    case 'open':
      art = openShape('M-24,-10 Q0,-14 24,-10 Q22,26 0,28 Q-22,26 -24,-10 Z', -3, null, true);
      break;
    case 'wide':
      art = openShape('M-32,-10 Q0,-4 32,-10 Q24,24 0,26 Q-24,24 -32,-10 Z', 0, null, true);
      break;
    case 'screaming':
      art = openShape('M0,-22 C22,-22 28,-2 26,14 C24,34 12,40 0,40 C-12,40 -24,34 -26,14 C-28,-2 -22,-22 0,-22 Z', -13, 33, true);
      break;
    case 'smile':
      art = openShape('M-32,-8 Q0,0 32,-8 Q28,26 0,28 Q-28,26 -32,-8 Z', 5, null, true);
      break;
    case 'smug':
      art = (
        <g transform={flip ? 'scale(-1 1)' : undefined}>
          <path d="M-22,4 Q2,10 20,-6" {...line} />
          <path d="M16,-12 Q24,-6 22,2" {...line} strokeWidth={sw} />
        </g>
      );
      break;
    case 'frown':
      art = <path d="M-22,8 Q0,-8 22,8" {...line} />;
      break;
  }

  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{art}</g>;
};
