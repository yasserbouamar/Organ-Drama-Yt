import React from 'react';
import {INK, PALETTE} from '../../../theme';
import type {Point} from '../../../types/characters';
import {clamp} from '../../../utils/animation';
import {useSvgId} from '../../../utils/useSvgId';

export type EyeStyle = 'round' | 'happy' | 'closed' | 'squeeze';

export interface EyeProps {
  cx: number;
  cy: number;
  r: number;
  look?: Point;
  /** Pupil radius as a fraction of the eye radius. */
  pupil?: number;
  /** Upper-lid closure 0..1 (blinks add to it). */
  lid?: number;
  /** Lower-lid lift 0..1 (smiling cheeks push it up). */
  lower?: number;
  /** Lid edge tilt in degrees (positive slopes down toward the nose on the right eye). */
  lidTilt?: number;
  /** -1 for the puppet's right eye (screen left), 1 for its left. Mirrors the tilt. */
  side: -1 | 1;
  lidColor: string;
  style?: EyeStyle;
  /** Extra star-shaped highlight for "excited". */
  sparkle?: boolean;
}

/**
 * A big cartoon eye: white ball, ink pupil with two glossy highlights, and
 * skin-coloured lids that slide over it. Fully closed lids become an arc.
 */
export const Eye: React.FC<EyeProps> = ({
  cx,
  cy,
  r,
  look = {x: 0, y: 0},
  pupil = 0.45,
  lid = 0,
  lower = 0,
  lidTilt = 0,
  side,
  lidColor,
  style = 'round',
  sparkle = false,
}) => {
  const clipId = useSvgId('eye');
  const gradId = useSvgId('eye-grad');
  const stroke = {fill: 'none', stroke: PALETTE.ink, strokeWidth: INK.bold, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const closedArc = <path d={`M${cx - r * 0.85},${cy + r * 0.05} Q${cx},${cy + r * 0.55} ${cx + r * 0.85},${cy + r * 0.05}`} {...stroke} />;

  if (style === 'happy') {
    return <path d={`M${cx - r * 0.8},${cy + r * 0.25} Q${cx},${cy - r * 0.75} ${cx + r * 0.8},${cy + r * 0.25}`} {...stroke} />;
  }
  if (style === 'squeeze') {
    const d =
      side < 0
        ? `M${cx - r * 0.7},${cy - r * 0.5} L${cx + r * 0.5},${cy} L${cx - r * 0.7},${cy + r * 0.5}`
        : `M${cx + r * 0.7},${cy - r * 0.5} L${cx - r * 0.5},${cy} L${cx + r * 0.7},${cy + r * 0.5}`;
    return <path d={d} {...stroke} />;
  }
  const closure = clamp(lid);
  if (style === 'closed' || closure > 0.93) {
    return closedArc;
  }

  const pr = r * pupil;
  const travel = Math.max(0, r - pr - INK.bold * 0.6);
  const px = cx + clamp(look.x, -1, 1) * travel;
  const py = cy + clamp(look.y, -1, 1) * travel * 0.85;
  const lidY = cy - r + closure * 2 * r;
  const lowY = cy + r - clamp(lower) * r * 0.9;
  const tilt = lidTilt * side;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={gradId} cx="40%" cy="35%" r="75%">
          <stop offset="0.6" stopColor={PALETTE.white} />
          <stop offset="1" stopColor="#DCE3F5" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={px} cy={py} r={pr} fill={PALETTE.ink} />
        <circle cx={px - pr * 0.38} cy={py - pr * 0.4} r={Math.max(2.5, pr * 0.36)} fill={PALETTE.white} />
        <circle cx={px + pr * 0.35} cy={py + pr * 0.38} r={Math.max(1.5, pr * 0.16)} fill={PALETTE.white} opacity={0.9} />
        {sparkle ? (
          <path
            d={`M${px + pr * 0.1},${py - pr * 0.95} l${pr * 0.12},${pr * 0.32} ${pr * 0.32},${pr * 0.12} -${pr * 0.32},${pr * 0.12} -${pr * 0.12},${pr * 0.32} -${pr * 0.12},-${pr * 0.32} -${pr * 0.32},-${pr * 0.12} ${pr * 0.32},-${pr * 0.12} Z`}
            fill={PALETTE.white}
          />
        ) : null}
        {closure > 0.01 || tilt !== 0 ? (
          <g transform={`rotate(${tilt} ${cx} ${cy})`}>
            <path
              d={`M${cx - r * 1.6},${cy - r * 1.6} L${cx + r * 1.6},${cy - r * 1.6} L${cx + r * 1.6},${lidY} Q${cx},${lidY + r * 0.22} ${cx - r * 1.6},${lidY} Z`}
              fill={lidColor}
            />
            <path d={`M${cx - r * 1.6},${lidY} Q${cx},${lidY + r * 0.22} ${cx + r * 1.6},${lidY}`} {...stroke} strokeWidth={INK.medium} />
          </g>
        ) : null}
        {lower > 0.01 ? (
          <>
            <path d={`M${cx - r * 1.5},${cy + r * 1.5} L${cx - r * 1.5},${lowY} Q${cx},${lowY - r * 0.25} ${cx + r * 1.5},${lowY} L${cx + r * 1.5},${cy + r * 1.5} Z`} fill={lidColor} />
            <path d={`M${cx - r * 1.5},${lowY} Q${cx},${lowY - r * 0.25} ${cx + r * 1.5},${lowY}`} {...stroke} strokeWidth={INK.medium} />
          </>
        ) : null}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
    </g>
  );
};
