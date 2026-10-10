import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, Expression, Point} from '../../types/characters';
import {autoBlink, clamp} from '../../utils/animation';
import {smoothClosedPath} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';
import {Mouth} from './parts/Mouth';
import {NoodleArm} from './parts/NoodleArm';

export const GRAVITY_VIEWBOX = {width: 520, height: 480} as const;
const C = {x: 260, y: 260};
const R = 175;
export const GRAVITY_SHOULDERS = {left: {x: 120, y: 270}, right: {x: 400, y: 270}} as const;

export interface GravityCharacterProps extends CharacterBaseProps {
  /** Hand targets in the blob's local units (may reach far outside the viewBox). */
  arms?: {left?: Point; right?: Point};
  /** Vertical stretch of the blob, e.g. 1.15 while hanging on. */
  stretch?: number;
  /** Eye glow strength 0..1. */
  glow?: number;
}

interface CatEyeRig {
  lid: number;
  pupil: number;
  tilt: number;
}

const EXPRESSIONS: Record<Expression, CatEyeRig> = {
  neutral: {lid: 0.15, pupil: 1, tilt: 8},
  confused: {lid: 0.25, pupil: 0.8, tilt: 2},
  happy: {lid: 0.3, pupil: 1.2, tilt: 12},
  confident: {lid: 0.32, pupil: 1, tilt: 12},
  smug: {lid: 0.45, pupil: 0.9, tilt: 12},
  scared: {lid: 0, pupil: 1.6, tilt: 0},
  panic: {lid: 0, pupil: 1.8, tilt: -4},
  grumpy: {lid: 0.42, pupil: 0.7, tilt: 16},
  crying: {lid: 0.3, pupil: 1.4, tilt: -2},
  awe: {lid: 0, pupil: 2, tilt: 6},
  calm: {lid: 0.38, pupil: 1, tilt: 10},
};

/** Gravity: a calm, wobbling purple blob with glowing cat eyes and rubber arms. */
export const GravityCharacter: React.FC<GravityCharacterProps> = ({
  size = 420,
  expression = 'calm',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  sticker = true,
  style,
  arms,
  stretch = 1,
  glow = 1,
}) => {
  const frame = useCurrentFrame();
  const bodyGrad = useSvgId('grav-body');
  const bodyClip = useSvgId('grav-clip');
  const glowFilter = useSvgId('grav-glow');
  const eyeClipL = useSvgId('grav-eye-l');
  const eyeClipR = useSvgId('grav-eye-r');
  const rig = EXPRESSIONS[expression];
  const lid = blink ?? autoBlink(frame, 'gravity');
  const height = (size * GRAVITY_VIEWBOX.height) / GRAVITY_VIEWBOX.width;
  const t = frame;

  const points = Array.from({length: 12}, (_, i) => {
    const th = (i / 12) * Math.PI * 2;
    const r =
      R *
      (1 +
        0.06 * Math.sin(3 * th + t * 0.09) +
        0.045 * Math.sin(5 * th - t * 0.13) +
        0.03 * Math.sin(2 * th + t * 0.05));
    const y = Math.sin(th) * r * 0.9 * (Math.sin(th) > 0 ? 0.92 : stretch);
    return {x: C.x + Math.cos(th) * r * (1 / Math.sqrt(stretch)), y: C.y + y};
  });
  const body = smoothClosedPath(points);

  const eyes = [
    {x: 202, y: 228, side: -1 as const, clip: eyeClipL},
    {x: 318, y: 228, side: 1 as const, clip: eyeClipR},
  ];
  const almond = (x: number, y: number, side: -1 | 1) => {
    const w = 78;
    const inner = {x: x - (side * w) / 2, y: y + 6};
    const outer = {x: x + (side * w) / 2, y: y - rig.tilt};
    return `M${inner.x},${inner.y} Q${x - side * 4},${y - 52} ${outer.x},${outer.y} Q${x + side * 6},${y + 42} ${inner.x},${inner.y} Z`;
  };

  const armBend = 0.32 + 0.1 * Math.sin(frame * 0.11);

  const art = (
    <svg width={size} height={height} viewBox={`0 0 ${GRAVITY_VIEWBOX.width} ${GRAVITY_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
      <defs>
        <radialGradient id={bodyGrad} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#B57BFF" />
          <stop offset="0.5" stopColor={TONES.gravityPurple} />
          <stop offset="1" stopColor={TONES.gravityDeep} />
        </radialGradient>
        <clipPath id={bodyClip}>
          <path d={body} />
        </clipPath>
        <filter id={glowFilter} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        {eyes.map((e) => (
          <clipPath key={e.clip} id={e.clip}>
            <path d={almond(e.x, e.y, e.side)} />
          </clipPath>
        ))}
      </defs>

      <path d={body} fill={`url(#${bodyGrad})`} />
      <g clipPath={`url(#${bodyClip})`}>
        {Array.from({length: 16}, (_, i) => {
          const x = C.x + (random(`grav-star-x-${i}`) - 0.5) * 300;
          const y = C.y + (random(`grav-star-y-${i}`) - 0.5) * 280;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.07 + i * 1.7));
          return <circle key={i} cx={x} cy={y} r={1.5 + random(`grav-star-r-${i}`) * 3} fill={PALETTE.white} opacity={tw * 0.8} />;
        })}
        <ellipse cx={C.x + 120} cy={C.y + 120} rx={210} ry={170} fill={TONES.gravityDeep} opacity={0.35} />
      </g>
      <ellipse cx={185} cy={150} rx={52} ry={24} fill={PALETTE.white} opacity={0.4} transform="rotate(-30 185 150)" />
      <path d={body} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />

      {/* Glowing cat eyes */}
      {eyes.map((e) => {
        const close = clamp(lid);
        const px = e.x + clamp(look.x, -1, 1) * 16;
        const py = e.y + clamp(look.y, -1, 1) * 7;
        const lidY = e.y - 40 + (rig.lid + (1 - rig.lid) * close) * 70;
        return (
          <g key={e.x}>
            <path d={almond(e.x, e.y, e.side)} fill={TONES.gravityGlow} filter={`url(#${glowFilter})`} opacity={0.85 * glow} />
            <path d={almond(e.x, e.y, e.side)} fill={TONES.gravityGlow} />
            <g clipPath={`url(#${e.clip})`}>
              <ellipse cx={px} cy={py} rx={6 * rig.pupil} ry={19} fill={PALETTE.ink} />
              <circle cx={px - 10} cy={py - 10} r={4} fill={PALETTE.white} />
              <path d={`M${e.x - 60},${e.y - 60} L${e.x + 60},${e.y - 60} L${e.x + 60},${lidY - e.side * 6} L${e.x - 60},${lidY + e.side * 6} Z`} fill="#5B1FC4" stroke={PALETTE.ink} strokeWidth={INK.medium} />
            </g>
            <path d={almond(e.x, e.y, e.side)} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          </g>
        );
      })}

      <Mouth shape={mouth} x={C.x} y={318} scale={0.9} />
    </svg>
  );

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      {arms ? (
        <svg width={size} height={height} viewBox={`0 0 ${GRAVITY_VIEWBOX.width} ${GRAVITY_VIEWBOX.height}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
          {arms.left ? (
            <NoodleArm from={GRAVITY_SHOULDERS.left} to={arms.left} bend={-armBend} color={TONES.gravityPurple} thickness={24} glove="mitten" gloveColor="#9B5BFF" gloveSize={30} />
          ) : null}
          {arms.right ? (
            <NoodleArm from={GRAVITY_SHOULDERS.right} to={arms.right} bend={armBend} color={TONES.gravityPurple} thickness={24} glove="mitten" gloveColor="#9B5BFF" gloveSize={30} />
          ) : null}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0}}>{sticker ? <Sticker bleed={0.3}>{art}</Sticker> : art}</div>
    </div>
  );
};
