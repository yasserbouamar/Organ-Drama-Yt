import React from 'react';
import {PALETTE, TONES} from '../../../theme';
import type {MouthShape} from '../../../types/characters';
import {useSvgId} from '../../../utils/useSvgId';

export interface MouthProps {
  shape: MouthShape;
  /** Centre of the mouth in the parent SVG's units. */
  x: number;
  y: number;
  /** 1 = a ~60-unit-wide mouth. */
  scale?: number;
  strokeWidth?: number;
  /** Outline colour (defaults to the pilot's ink). */
  ink?: string;
  /** Frame-driven wobble for `chew` and `wobbly`. */
  phase?: number;
}

/**
 * Shared mouth rig. Every shape is drawn around (0, 0) at ~60 units wide so
 * one set of visemes serves every puppet: `idle`, `open`, `o`, `teeth` and
 * `smile` for lip-sync, plus held acting shapes.
 */
export const Mouth: React.FC<MouthProps> = ({shape, x, y, scale = 1, strokeWidth = 5, ink = PALETTE.ink, phase = 0}) => {
  const clipId = useSvgId('mouth');
  const sw = strokeWidth / scale;
  const line = {fill: 'none', stroke: ink, strokeWidth: sw * 1.15, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const outline = {fill: 'none', stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const};

  // `teethTop` / `teethBottom`: y of the teeth edges inside the opening, or null for none.
  const opening = (d: string, teethTop: number | null, teethBottom: number | null, tongue: boolean) => (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={TONES.mouthDark} />
      <g clipPath={`url(#${clipId})`}>
        {tongue ? <ellipse cx={0} cy={30} rx={20} ry={14} fill={TONES.tongue} /> : null}
        {teethTop !== null ? <rect x={-40} y={-40} width={80} height={teethTop + 40} fill={PALETTE.white} /> : null}
        {teethBottom !== null ? <rect x={-40} y={teethBottom} width={80} height={40} fill={PALETTE.white} /> : null}
      </g>
      <path d={d} {...outline} />
    </>
  );

  let art: React.ReactNode;
  switch (shape) {
    case 'idle':
      art = <path d="M-19,0 Q0,8 19,0" {...line} />;
      break;
    case 'open':
      art = opening('M-24,-9 Q0,-13 24,-9 Q22,25 0,28 Q-22,25 -24,-9 Z', -3, null, true);
      break;
    case 'o':
      art = opening('M0,-16 C11,-16 15,-6 15,4 C15,15 9,21 0,21 C-9,21 -15,15 -15,4 C-15,-6 -11,-16 0,-16 Z', null, null, true);
      break;
    case 'teeth':
      art = opening('M-27,-9 Q0,-13 27,-9 Q28,8 0,11 Q-28,8 -27,-9 Z', 0, 3, false);
      break;
    case 'smile':
      art = opening('M-31,-9 Q0,-1 31,-9 Q27,24 0,27 Q-27,24 -31,-9 Z', 3, null, true);
      break;
    case 'frown':
      art = <path d="M-21,8 Q0,-8 21,8" {...line} />;
      break;
    case 'yawn':
      art = opening('M0,-24 C17,-24 23,-6 23,10 C23,30 13,40 0,40 C-13,40 -23,30 -23,10 C-23,-6 -17,-24 0,-24 Z', null, null, true);
      break;
    case 'chew': {
      const w = Math.sin(phase) * 5;
      art = <path d={`M-22,${1 + w * 0.3} Q-11,${8 - w} 0,${2 + w * 0.4} Q11,${-5 + w} 22,${2 - w * 0.3}`} {...line} />;
      break;
    }
    case 'wobbly': {
      const w = Math.sin(phase) * 2;
      art = <path d={`M-24,${5 + w} Q-16,${-4 - w} -8,${4 + w} Q0,${12 - w} 8,${4 + w} Q16,${-4 - w} 24,${5 + w}`} {...line} />;
      break;
    }
    case 'grin':
      art = (
        <>
          <path d="M-29,-5 Q0,26 29,-5 Q0,9 -29,-5 Z" fill={PALETTE.white} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round'}} />
          <path d="M-20,1 Q0,10 20,1" fill="none" stroke={ink} strokeWidth={sw * 0.5} />
        </>
      );
      break;
  }

  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{art}</g>;
};
