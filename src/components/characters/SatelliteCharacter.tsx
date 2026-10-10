import React from 'react';
import {useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, Expression} from '../../types/characters';
import {autoBlink, clamp, noise1D} from '../../utils/animation';
import {dropPath} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';
import {Mouth} from './parts/Mouth';

export const SATELLITE_VIEWBOX = {width: 560, height: 330} as const;

export interface SatelliteCharacterProps extends CharacterBaseProps {
  /** Both wings, degrees around their hinges. Positive raises them. */
  wingAngle?: number;
  leftWingAngle?: number;
  rightWingAngle?: number;
  /** Nervous jitter of body and panels, 0..1. */
  tremble?: number;
  /** Glowing aura behind the body, 0..1. */
  aura?: number;
  /** Tear streams, 0..1 (on by default for `crying`). */
  tears?: number;
}

interface SatEyeRig {
  r: number;
  pupil: number;
  upper: number;
  /** Brow offsets [inner, outer] in px, negative = up. */
  brow: readonly [number, number] | null;
  style: 'open' | 'arc' | 'squeeze';
  shake: number;
}

const EXPRESSIONS: Record<Expression, SatEyeRig> = {
  neutral: {r: 25, pupil: 13, upper: 0.05, brow: null, style: 'open', shake: 0},
  confused: {r: 25, pupil: 11, upper: 0.2, brow: [4, -6], style: 'open', shake: 0},
  happy: {r: 25, pupil: 13, upper: 0, brow: [-4, -4], style: 'arc', shake: 0},
  confident: {r: 25, pupil: 13, upper: 0.18, brow: [2, -4], style: 'open', shake: 0},
  smug: {r: 25, pupil: 12, upper: 0.45, brow: [2, 0], style: 'open', shake: 0},
  scared: {r: 31, pupil: 7, upper: 0, brow: [-12, 2], style: 'open', shake: 2.2},
  panic: {r: 32, pupil: 6, upper: 0, brow: [-14, 0], style: 'open', shake: 3.5},
  grumpy: {r: 24, pupil: 12, upper: 0.35, brow: [8, -4], style: 'open', shake: 0},
  crying: {r: 25, pupil: 12, upper: 0, brow: [-10, 2], style: 'squeeze', shake: 1.2},
  awe: {r: 29, pupil: 17, upper: 0, brow: [-8, -8], style: 'open', shake: 0},
  calm: {r: 25, pupil: 13, upper: 0.35, brow: null, style: 'open', shake: 0},
};

const FACE = {x: 280, y: 180};
const EYES = [
  {x: 248, y: 170, side: -1},
  {x: 312, y: 170, side: 1},
] as const;
const PIVOT_L = {x: 142, y: 180};
const PIVOT_R = {x: 424, y: 168};

const Wing: React.FC<{pivot: {x: number; y: number}; side: -1 | 1; angle: number}> = ({pivot, side, angle}) => {
  const w = 150;
  const h = 108;
  const x0 = side < 0 ? pivot.x - w - 6 : pivot.x + 6;
  const y0 = pivot.y - h / 2;
  // Positive angle lifts the wing tip on either side.
  const rot = side < 0 ? angle : -angle;
  return (
    <g transform={`rotate(${rot} ${pivot.x} ${pivot.y})`}>
      <rect x={x0} y={y0} width={w} height={h} rx={8} fill="#1B2A6B" stroke={PALETTE.ink} strokeWidth={INK.bold} />
      {[1, 2, 3].map((i) => (
        <line key={`v${i}`} x1={x0 + (w / 4) * i} y1={y0 + 4} x2={x0 + (w / 4) * i} y2={y0 + h - 4} stroke={PALETTE.electricCyan} strokeWidth={3} opacity={0.75} />
      ))}
      {[1, 2].map((i) => (
        <line key={`h${i}`} x1={x0 + 4} y1={y0 + (h / 3) * i} x2={x0 + w - 4} y2={y0 + (h / 3) * i} stroke={PALETTE.electricCyan} strokeWidth={3} opacity={0.75} />
      ))}
      <path d={`M${x0 + 18},${y0 + 8} L${x0 + 46},${y0 + 8} L${x0 + 18},${y0 + 52} Z`} fill={PALETTE.white} opacity={0.35} />
      <rect x={x0} y={y0} width={w} height={h} rx={8} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <circle cx={pivot.x} cy={pivot.y} r={11} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    </g>
  );
};

/** "Lil Sat": a yellow cube satellite with hinged solar-panel wings. */
export const SatelliteCharacter: React.FC<SatelliteCharacterProps> = ({
  size = 380,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  sticker = true,
  style,
  wingAngle = 0,
  leftWingAngle,
  rightWingAngle,
  tremble = 0,
  aura = 0,
  tears,
}) => {
  const frame = useCurrentFrame();
  const auraId = useSvgId('sat-aura');
  const eyeClipL = useSvgId('sat-eye-l');
  const eyeClipR = useSvgId('sat-eye-r');
  const rig = EXPRESSIONS[expression];
  const lid = blink ?? autoBlink(frame, 'lil-sat');
  const height = (size * SATELLITE_VIEWBOX.height) / SATELLITE_VIEWBOX.width;
  const tearAmount = tears ?? (expression === 'crying' ? 1 : 0);

  const jx = tremble * noise1D('sat-jx', frame * 1.7) * 5;
  const jy = tremble * noise1D('sat-jy', frame * 1.9) * 4;
  const wingJitter = tremble * noise1D('sat-wing', frame * 2.2) * 9;
  const lAngle = (leftWingAngle ?? wingAngle) + wingJitter;
  const rAngle = (rightWingAngle ?? wingAngle) - wingJitter;
  const shake = rig.shake;
  const ex = shake * Math.sin(frame * 2.7);
  const ey = shake * Math.cos(frame * 3.1) * 0.6;
  const antennaSway = noise1D('sat-antenna', frame * 0.15) * 6 + jx;
  const tip = {x: 306 + antennaSway, y: 26};
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.25);

  const eye = (e: (typeof EYES)[number]) => {
    const cx = e.x + ex;
    const cy = e.y + ey;
    if (rig.style === 'arc' || (lid > 0.85 && rig.style === 'open')) {
      return (
        <path
          key={e.x}
          d={rig.style === 'arc' ? `M${cx - 18},${cy + 6} Q${cx},${cy - 18} ${cx + 18},${cy + 6}` : `M${cx - 18},${cy} Q${cx},${cy + 8} ${cx + 18},${cy}`}
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth={7}
          strokeLinecap="round"
        />
      );
    }
    if (rig.style === 'squeeze') {
      const d = e.side < 0 ? `M${cx - 16},${cy - 12} L${cx + 12},${cy} L${cx - 16},${cy + 12}` : `M${cx + 16},${cy - 12} L${cx - 12},${cy} L${cx + 16},${cy + 12}`;
      return <path key={e.x} d={d} fill="none" stroke={PALETTE.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
    }
    const travel = rig.r - rig.pupil - 3;
    const px = cx + clamp(look.x, -1, 1) * travel;
    const py = cy + clamp(look.y, -1, 1) * travel;
    const upper = clamp(Math.max(rig.upper, lid));
    const lidY = cy - rig.r + upper * 2 * rig.r;
    const clipId = e.side < 0 ? eyeClipL : eyeClipR;
    return (
      <g key={e.x}>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={rig.r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={rig.r} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <circle cx={px} cy={py} r={rig.pupil} fill={PALETTE.ink} />
        {expression === 'awe' ? (
          <path d={`M${px - 4},${py - 12} l3,6 6,1 -5,4 1,6 -5,-3 -5,3 1,-6 -5,-4 6,-1 Z`} fill={PALETTE.white} />
        ) : (
          <circle cx={px - rig.pupil * 0.35} cy={py - rig.pupil * 0.4} r={Math.max(2.5, rig.pupil * 0.36)} fill={PALETTE.white} />
        )}
        {upper > 0.02 ? (
          <path
            d={`M${cx - rig.r - 2},${cy - rig.r - 2} L${cx + rig.r + 2},${cy - rig.r - 2} L${cx + rig.r + 2},${lidY} Q${cx},${lidY + 8} ${cx - rig.r - 2},${lidY} Z`}
            fill={PALETTE.hazardYellow}
            stroke={PALETTE.ink}
            strokeWidth={INK.medium}
            clipPath={`url(#${clipId})`}
          />
        ) : null}
        {upper > 0.02 ? <circle cx={cx} cy={cy} r={rig.r} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} /> : null}
      </g>
    );
  };

  const art = (
    <svg width={size} height={height} viewBox={`0 0 ${SATELLITE_VIEWBOX.width} ${SATELLITE_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
      <g transform={`translate(${jx} ${jy})`}>
        {/* Struts */}
        <path d={`M205,180 L${PIVOT_L.x},${PIVOT_L.y}`} stroke={PALETTE.ink} strokeWidth={18} strokeLinecap="round" />
        <path d={`M205,180 L${PIVOT_L.x},${PIVOT_L.y}`} stroke={TONES.steel} strokeWidth={8} strokeLinecap="round" />
        <path d={`M370,170 L${PIVOT_R.x},${PIVOT_R.y}`} stroke={PALETTE.ink} strokeWidth={18} strokeLinecap="round" />
        <path d={`M370,170 L${PIVOT_R.x},${PIVOT_R.y}`} stroke={TONES.steel} strokeWidth={8} strokeLinecap="round" />
        <Wing pivot={PIVOT_L} side={-1} angle={lAngle} />
        <Wing pivot={PIVOT_R} side={1} angle={rAngle} />

        {/* Antenna */}
        <path d={`M294,98 Q${300 + antennaSway * 0.3},60 ${tip.x},${tip.y}`} fill="none" stroke={PALETTE.ink} strokeWidth={12} strokeLinecap="round" />
        <path d={`M294,98 Q${300 + antennaSway * 0.3},60 ${tip.x},${tip.y}`} fill="none" stroke={TONES.steel} strokeWidth={5} strokeLinecap="round" />
        <circle cx={tip.x} cy={tip.y} r={13 + glow * 3} fill={PALETTE.vividMagenta} opacity={0.35 * glow} />
        <circle cx={tip.x} cy={tip.y} r={11} fill={PALETTE.vividMagenta} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <circle cx={tip.x - 3} cy={tip.y - 4} r={3.5} fill={PALETTE.white} />

        {/* Cube body */}
        <path d="M355,112 L382,86 L382,226 L355,252 Z" fill={TONES.yellowShade} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <path d="M205,112 L232,86 L382,86 L355,112 Z" fill="#FFF27A" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <rect x={205} y={112} width={150} height={140} rx={12} fill={PALETTE.hazardYellow} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <path d="M216,124 L216,200" stroke={PALETTE.white} strokeWidth={7} strokeLinecap="round" opacity={0.7} />
        {[
          [218, 125],
          [342, 125],
          [218, 239],
          [342, 239],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill={TONES.yellowShade} stroke={PALETTE.ink} strokeWidth={2} />
        ))}

        {/* Face */}
        <ellipse cx={226} cy={206} rx={13} ry={7} fill={PALETTE.vividMagenta} opacity={0.45} />
        <ellipse cx={334} cy={206} rx={13} ry={7} fill={PALETTE.vividMagenta} opacity={0.45} />
        {rig.brow
          ? EYES.map((e) => {
              const inner = e.x - e.side * 12;
              const outer = e.x + e.side * 16;
              const by = e.y - rig.r - 12 + ey;
              return (
                <path
                  key={`b${e.x}`}
                  d={`M${inner + ex},${by + rig.brow![0]} L${outer + ex},${by + rig.brow![1]}`}
                  stroke={PALETTE.ink}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              );
            })
          : null}
        {EYES.map(eye)}
        <Mouth shape={mouth} x={FACE.x + ex * 0.5} y={222} scale={0.55} />

        {/* Tears */}
        {tearAmount > 0 ? (
          <g opacity={tearAmount}>
            {EYES.map((e) =>
              [0, 1, 2, 3, 4].map((i) => {
                const phase = (frame * 0.07 + i / 5) % 1;
                const x = e.x + e.side * (16 + phase * 120);
                const y = e.y + 8 + phase * phase * 130 - phase * 30;
                return (
                  <path key={`${e.x}-${i}`} d={dropPath(x, y, 15 * (1 - phase * 0.5))} fill="#7FE7FF" stroke={PALETTE.ink} strokeWidth={3} transform={`rotate(${e.side * 60 * (1 - phase)} ${x} ${y})`} />
                );
              }),
            )}
            {EYES.map((e) => (
              <path
                key={`stream-${e.x}`}
                d={`M${e.x + e.side * 14},${e.y + 6} Q${e.x + e.side * 46},${e.y - 14} ${e.x + e.side * 66},${e.y + 14}`}
                fill="none"
                stroke="#7FE7FF"
                strokeWidth={9}
                strokeLinecap="round"
              />
            ))}
          </g>
        ) : null}
      </g>
    </svg>
  );

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      {aura > 0 ? (
        <svg width={size} height={height} viewBox={`0 0 ${SATELLITE_VIEWBOX.width} ${SATELLITE_VIEWBOX.height}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <radialGradient id={auraId}>
              <stop offset="0" stopColor={TONES.shieldGreen} stopOpacity={0.9} />
              <stop offset="0.55" stopColor={PALETTE.electricCyan} stopOpacity={0.35} />
              <stop offset="1" stopColor={PALETTE.electricCyan} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={FACE.x} cy={FACE.y} r={300 + 14 * Math.sin(frame * 0.2)} fill={`url(#${auraId})`} opacity={aura} />
          {[0, 1, 2].map((i) => {
            const t = ((frame / 40 + i / 3) % 1 + 1) % 1;
            return <circle key={i} cx={FACE.x} cy={FACE.y} r={120 + t * 260} fill="none" stroke={TONES.shieldGreen} strokeWidth={8 * (1 - t)} opacity={aura * (1 - t)} />;
          })}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0}}>{sticker ? <Sticker bleed={0.35}>{art}</Sticker> : art}</div>
    </div>
  );
};
