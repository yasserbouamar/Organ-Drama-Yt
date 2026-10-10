import React from 'react';
import {PALETTE} from '../../../theme';
import type {Point} from '../../../types/characters';

export type GloveShape = 'fist' | 'open' | 'thumbsUp' | 'mitten';

export interface NoodleArmProps {
  from: Point;
  to: Point;
  /** Sideways bow of the arm, as a fraction of its length (+ bends clockwise). */
  bend?: number;
  color: string;
  /** Tube thickness (inner fill), in the parent's units. */
  thickness?: number;
  glove?: GloveShape;
  gloveColor?: string;
  gloveSize?: number;
  /** Rotation of the glove in degrees (0 = knuckles pointing along the arm). */
  gloveRotation?: number;
  /** A prop held in the hand, drawn between the arm and the glove, origin at the hand. */
  holding?: React.ReactNode;
}

/** Bendy rubber-hose arm with a cartoon glove at the end. */
export const NoodleArm: React.FC<NoodleArmProps> = ({
  from,
  to,
  bend = 0.18,
  color,
  thickness = 12,
  glove = 'fist',
  gloveColor = PALETTE.white,
  gloveSize = 20,
  gloveRotation,
  holding,
}) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // Control point pushed out perpendicular to the arm for the rubber-hose curve.
  const cx = (from.x + to.x) / 2 - (dy / len) * len * bend;
  const cy = (from.y + to.y) / 2 + (dx / len) * len * bend;
  const d = `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
  const angle = gloveRotation ?? (Math.atan2(to.y - cy, to.x - cx) * 180) / Math.PI;

  return (
    <g>
      <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={thickness + 10} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      {holding ? <g transform={`translate(${to.x} ${to.y})`}>{holding}</g> : null}
      <Glove x={to.x} y={to.y} shape={glove} color={gloveColor} size={gloveSize} rotation={angle} />
    </g>
  );
};

export interface GloveProps {
  x: number;
  y: number;
  shape: GloveShape;
  color: string;
  size: number;
  rotation: number;
}

export const Glove: React.FC<GloveProps> = ({x, y, shape, color, size, rotation}) => {
  const s = size / 20;
  const stroke = {stroke: PALETTE.ink, strokeWidth: 4.5 / s, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  let art: React.ReactNode;
  switch (shape) {
    case 'open':
      art = (
        <>
          <path d="M-6,-14 L10,-16 Q24,-14 26,-6 L30,-10 Q36,-6 30,0 Q36,4 30,8 Q34,14 26,14 Q18,20 4,16 L-6,14 Z" fill={color} {...stroke} />
          <path d="M-8,-12 L-8,12" {...stroke} fill="none" />
        </>
      );
      break;
    case 'thumbsUp':
      // Always drawn upright (a thumbs-up pointing sideways reads wrong).
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-10} y={12} width={22} height={10} rx={4} fill={color} {...stroke} />
          <rect x={-16} y={-14} width={32} height={28} rx={11} fill={color} {...stroke} />
          <path d="M-12,-12 Q-14,-34 -4,-36 Q4,-36 2,-12" fill={color} {...stroke} />
          <path d="M-2,-2 L14,-2 M-2,7 L14,7" fill="none" {...stroke} strokeWidth={3 / s} />
        </g>
      );
    case 'mitten':
      art = (
        <>
          <ellipse cx={10} cy={0} rx={18} ry={16} fill={color} {...stroke} />
          <ellipse cx={2} cy={-14} rx={7} ry={6} fill={color} {...stroke} />
        </>
      );
      break;
    case 'fist':
    default:
      art = (
        <>
          <rect x={-4} y={-15} width={30} height={30} rx={13} fill={color} {...stroke} />
          <path d="M10,-6 Q18,-6 18,2" fill="none" {...stroke} strokeWidth={3 / s} />
        </>
      );
      break;
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${s})`}>
      {art}
      {/* cuff */}
      <rect x={-12} y={-11} width={10} height={22} rx={4} fill={color} {...stroke} />
    </g>
  );
};
