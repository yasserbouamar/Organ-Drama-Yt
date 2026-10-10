import React from 'react';
import {INK, PALETTE, TONES} from '../../../theme';
import type {LimbPose, Point} from '../../../types/characters';

export interface LimbProps extends LimbPose {
  from: Point;
  length: number;
  /** -1 = the limb on screen left, 1 = screen right. Positive `angle` swings it outward. */
  side: -1 | 1;
  width: number;
  color: string;
  end?: 'glove' | 'fist' | 'shoe' | 'none';
  endColor?: string;
  endSize?: number;
  /** Rendered at the hand, rotated with the limb (a held prop). */
  holding?: React.ReactNode;
}

/** Where a limb's hand ends up, for placing props or chaining animation. */
export const limbEnd = (from: Point, length: number, side: -1 | 1, angle: number): Point => {
  const a = (angle * Math.PI) / 180;
  return {x: from.x + side * Math.sin(a) * length, y: from.y + Math.cos(a) * length};
};

/**
 * A rubber-hose noodle limb with an ink outline, ending in a white cartoon
 * glove, a fist or a sneaker. `angle` is degrees from straight down; `bend`
 * bows the noodle (positive bows outward).
 */
export const Limb: React.FC<LimbProps> = ({
  from,
  length,
  side,
  angle,
  bend = 0,
  width,
  color,
  end = 'glove',
  endColor = TONES.glove,
  endSize,
  holding,
}) => {
  const tip = limbEnd(from, length, side, angle);
  const mid = {x: (from.x + tip.x) / 2, y: (from.y + tip.y) / 2};
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular, pointing away from the body for positive bend.
  const nx = (-dy / len) * side;
  const ny = (dx / len) * side;
  const ctrl = {x: mid.x + nx * bend * length * 0.01, y: mid.y + ny * bend * length * 0.01};
  const d = `M${from.x},${from.y} Q${ctrl.x},${ctrl.y} ${tip.x},${tip.y}`;
  const size = endSize ?? width * 1.25;
  const dir = (Math.atan2(dy, dx) * 180) / Math.PI;

  let cap: React.ReactNode = null;
  if (end === 'glove' || end === 'fist') {
    cap = (
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${dir - 90})`}>
        <circle cx={0} cy={size * 0.2} r={size} fill={endColor} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        {end === 'glove' ? (
          <ellipse cx={side * size * 0.9} cy={-size * 0.05} rx={size * 0.42} ry={size * 0.3} fill={endColor} stroke={PALETTE.ink} strokeWidth={INK.fine} />
        ) : (
          <path d={`M${-size * 0.5},${size * 0.1} Q0,${size * 0.5} ${size * 0.5},${size * 0.1}`} fill="none" stroke={PALETTE.ink} strokeWidth={INK.fine} />
        )}
        <rect x={-size * 0.75} y={-size * 0.95} width={size * 1.5} height={size * 0.42} rx={size * 0.2} fill={endColor} stroke={PALETTE.ink} strokeWidth={INK.fine} />
      </g>
    );
  } else if (end === 'shoe') {
    cap = (
      <g transform={`translate(${tip.x} ${tip.y})`}>
        <path
          d={`M${-size * 0.7 * side},${-size * 0.35} Q${-size * 0.7 * side},${-size * 0.9} ${size * 0.15 * side},${-size * 0.75} Q${size * 1.5 * side},${-size * 0.5} ${size * 1.45 * side},${size * 0.25} L${-size * 0.75 * side},${size * 0.25} Z`}
          fill={endColor}
          stroke={PALETTE.ink}
          strokeWidth={INK.medium}
          strokeLinejoin="round"
        />
        <rect x={Math.min(-size * 0.8 * side, size * 1.5 * side)} y={size * 0.1} width={size * 2.3} height={size * 0.38} rx={size * 0.18} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.fine} />
        <path d={`M${0},${-size * 0.62} l${size * 0.28 * side},${size * 0.22} M${size * 0.32 * side},${-size * 0.6} l${size * 0.28 * side},${size * 0.22}`} stroke={PALETTE.white} strokeWidth={INK.fine} strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={width + INK.medium * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      {holding ? <g transform={`translate(${tip.x} ${tip.y})`}>{holding}</g> : null}
      {cap}
    </g>
  );
};
