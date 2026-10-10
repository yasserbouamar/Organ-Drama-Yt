import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {polar} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';

export type StopwatchTarget = '20 MIN' | '3 HOURS';

interface Dial {
  /** Units for one full turn of the needle. */
  full: number;
  target: number;
  unit: string;
  labels: readonly number[];
  /** Needle steps on the way to the target. */
  ticks: number;
}

const DIALS: Record<StopwatchTarget, Dial> = {
  '20 MIN': {full: 30, target: 20, unit: 'MIN', labels: [0, 5, 10, 15, 20, 25], ticks: 20},
  '3 HOURS': {full: 4, target: 3, unit: 'HOURS', labels: [0, 1, 2, 3], ticks: 12},
};

export interface StopwatchGaugeProps {
  target: StopwatchTarget;
  /** Frame (parent timeline) the needle starts moving. */
  start: number;
  /** Frames to reach the target. */
  sweepFrames: number;
  size?: number;
}

const VB = {width: 400, height: 470} as const;
const C = {x: 200, y: 270};

/**
 * Cartoon stopwatch: pink case, white dial, black ticks, red needle. The
 * needle ticks round to its target one step at a time, each step its own
 * little spring (so it overshoots and settles like a real mechanism).
 */
export const StopwatchGauge: React.FC<StopwatchGaugeProps> = ({target, start, sweepFrames, size = 360}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const glowId = useSvgId('stopwatch-glow');
  const dial = DIALS[target];
  const step = dial.target / dial.ticks;
  const interval = sweepFrames / dial.ticks;
  let value = 0;
  for (let k = 0; k < dial.ticks; k++) {
    value += step * spring({frame: frame - start - k * interval, fps, config: {damping: 9, stiffness: 320, mass: 0.6}});
  }
  const done = frame >= start + sweepFrames;
  const angleOf = (v: number) => (v / dial.full) * 360 - 90;
  const needle = angleOf(value);
  const tip = polar(C.x, C.y, 128, needle);
  const tail = polar(C.x, C.y, 26, needle + 180);
  const sweepEnd = polar(C.x, C.y, 140, needle);
  const large = value / dial.full > 0.5 ? 1 : 0;
  const readout = done ? `${dial.target} ${dial.unit}` : `${dial.unit === 'MIN' ? Math.round(value) : value.toFixed(1)} ${dial.unit}`;
  const pulse = done ? 0.5 + 0.5 * Math.sin((frame - start - sweepFrames) * 0.4) : 0;
  const height = (size * VB.height) / VB.width;

  return (
    <svg width={size} height={height} viewBox={`0 0 ${VB.width} ${VB.height}`} overflow="visible" style={{display: 'block'}}>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0.6" stopColor={TONES.gold} stopOpacity={0.9} />
          <stop offset="1" stopColor={TONES.gold} stopOpacity={0} />
        </radialGradient>
      </defs>
      {done ? <circle cx={C.x} cy={C.y} r={215 + pulse * 15} fill={`url(#${glowId})`} opacity={0.6} /> : null}
      {/* Crown and side button. */}
      <rect x={176} y={34} width={48} height={30} rx={8} fill={PALETTE.brainFold} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={160} y={14} width={80} height={26} rx={10} fill={PALETTE.brainPink} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <g transform={`rotate(45 ${C.x} ${C.y})`}>
        <rect x={186} y={48} width={28} height={40} rx={7} fill={PALETTE.brainFold} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      </g>
      <circle cx={C.x} cy={C.y} r={184} fill={PALETTE.brainPink} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <circle cx={C.x} cy={C.y} r={184} fill="none" stroke={TONES.brainLight} strokeWidth={10} strokeDasharray="120 1000" strokeDashoffset={-560} strokeLinecap="round" />
      <circle cx={C.x} cy={C.y} r={152} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      {value > 0.001 ? (
        <path
          d={`M${C.x},${C.y} L${C.x},${C.y - 140} A140,140 0 ${large} 1 ${sweepEnd.x.toFixed(1)},${sweepEnd.y.toFixed(1)} Z`}
          fill={dial.unit === 'MIN' ? TONES.alarmRed : TONES.mint}
          opacity={0.22}
        />
      ) : null}
      {Array.from({length: 60}, (_, i) => {
        const a = (i / 60) * 360 - 90;
        const majorEvery = (60 / dial.full) * (dial.labels[1] - dial.labels[0]);
        const isMajor = i % majorEvery === 0;
        const p0 = polar(C.x, C.y, isMajor ? 120 : 132, a);
        const p1 = polar(C.x, C.y, 144, a);
        return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={PALETTE.ink} strokeWidth={isMajor ? 6 : 2.5} strokeLinecap="round" />;
      })}
      {dial.labels.map((v) => {
        const p = polar(C.x, C.y, 96, angleOf(v));
        return (
          <text key={v} x={p.x} y={p.y + 11} textAnchor="middle" fontFamily={FONTS.body} fontWeight={900} fontSize={30} fill={v === dial.target ? TONES.alarmRed : PALETTE.ink}>
            {v}
          </text>
        );
      })}
      {(() => {
        const p = polar(C.x, C.y, 166, angleOf(dial.target));
        return (
          <path
            d={`M${p.x},${p.y - 16} L${p.x + 5},${p.y - 5} L${p.x + 16},${p.y} L${p.x + 5},${p.y + 5} L${p.x},${p.y + 16} L${p.x - 5},${p.y + 5} L${p.x - 16},${p.y} L${p.x - 5},${p.y - 5} Z`}
            fill={TONES.gold}
            stroke={PALETTE.ink}
            strokeWidth={3}
          />
        );
      })()}
      <rect x={C.x - 92} y={C.y + 38} width={184} height={50} rx={14} fill={PALETTE.ink} />
      <text x={C.x} y={C.y + 75} textAnchor="middle" fontFamily={FONTS.body} fontWeight={900} fontSize={done ? 32 : 30} fill={done ? TONES.gold : TONES.mint} letterSpacing={1}>
        {readout}
      </text>
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={PALETTE.ink} strokeWidth={13} strokeLinecap="round" />
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={PALETTE.heartRed} strokeWidth={7} strokeLinecap="round" />
      <circle cx={C.x} cy={C.y} r={15} fill={PALETTE.heartRed} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <circle cx={C.x - 4} cy={C.y - 4} r={4} fill={PALETTE.white} opacity={0.8} />
      <path d="M90,160 A150,150 0 0 1 170,112" fill="none" stroke={PALETTE.white} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
};
