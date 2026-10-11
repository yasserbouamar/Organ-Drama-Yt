import React from 'react';
import type {Point} from '../types/characters';
import {R} from './remakeTheme';

export interface StickArmProps {
  from: Point;
  to: Point;
  /** Elbow bow as a fraction of the arm's length; the sign picks the side. */
  bend?: number;
  hand: string;
  handSize?: number;
  /** Drawn at the hand (a held prop). */
  holding?: React.ReactNode;
}

/** A thin ink-line arm ending in a small round hand, as in the reference style. */
export const StickArm: React.FC<StickArmProps> = ({from, to, bend = 0.15, hand, handSize = 11, holding}) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (from.x + to.x) / 2 - (dy / len) * len * bend;
  const cy = (from.y + to.y) / 2 + (dx / len) * len * bend;
  return (
    <g>
      <path d={`M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`} fill="none" stroke={R.ink} strokeWidth={R.line + 1} strokeLinecap="round" />
      {holding ? <g transform={`translate(${to.x} ${to.y})`}>{holding}</g> : null}
      <circle cx={to.x} cy={to.y} r={handSize} fill={hand} stroke={R.ink} strokeWidth={R.line * 0.85} />
    </g>
  );
};

export interface StickLegProps {
  from: Point;
  to: Point;
  /** Which way the toe points. */
  side: -1 | 1;
  bend?: number;
}

/** A thin ink-line leg with a small brown shoe. */
export const StickLeg: React.FC<StickLegProps> = ({from, to, side, bend = 0}) => (
  <g>
    <path
      d={`M${from.x},${from.y} Q${(from.x + to.x) / 2 + bend},${(from.y + to.y) / 2} ${to.x},${to.y}`}
      fill="none"
      stroke={R.ink}
      strokeWidth={R.line + 1}
      strokeLinecap="round"
    />
    <path
      d={`M${to.x - 14 * side},${to.y + 2} Q${to.x - 16 * side},${to.y - 14} ${to.x + 4 * side},${to.y - 12} Q${to.x + 22 * side},${to.y - 8} ${to.x + 20 * side},${to.y + 4} Z`}
      fill={R.shoe}
      stroke={R.ink}
      strokeWidth={R.line * 0.8}
      strokeLinejoin="round"
    />
  </g>
);

/** A thin eyebrow arc; `tilt` lifts the inner (+) or outer (−) end. */
export const Brow: React.FC<{x: number; y: number; side: -1 | 1; width?: number; lift: number; tilt: number}> = ({x, y, side, width = 34, lift, tilt}) => {
  const inner = {x: x - side * width * 0.45, y: y - lift + tilt};
  const outer = {x: x + side * width * 0.55, y: y - lift - tilt};
  return (
    <path
      d={`M${inner.x},${inner.y} Q${(inner.x + outer.x) / 2},${(inner.y + outer.y) / 2 - 7} ${outer.x},${outer.y}`}
      fill="none"
      stroke={R.ink}
      strokeWidth={R.line * 0.9}
      strokeLinecap="round"
    />
  );
};

/** A small blue sweat drop. */
export const SweatDrop: React.FC<{x: number; y: number; size?: number; opacity?: number}> = ({x, y, size = 18, opacity = 1}) => (
  <path
    d={`M${x},${y - size} C${x + size * 0.55},${y - size * 0.25} ${x + size * 0.6},${y + size * 0.55} ${x},${y + size * 0.55} C${x - size * 0.6},${y + size * 0.55} ${x - size * 0.55},${y - size * 0.25} ${x},${y - size} Z`}
    fill={R.sweat}
    stroke={R.ink}
    strokeWidth={R.line * 0.7}
    opacity={opacity}
  />
);
