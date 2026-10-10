import React from 'react';
import {interpolateColors, useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, Expression} from '../../types/characters';
import {autoBlink, clamp, noise1D} from '../../utils/animation';
import {dropPath} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';
import {Mouth} from './parts/Mouth';
import {type GloveShape, NoodleArm} from './parts/NoodleArm';

export const ROCKET_VIEWBOX = {width: 260, height: 470} as const;

export interface ArmPose {
  /** 0 = hanging down, 90 = straight out sideways, 180 = straight up. */
  angle: number;
  length?: number;
  bend?: number;
  glove?: GloveShape;
}

export interface RocketCharacterProps extends CharacterBaseProps {
  /** Exhaust: 0 = off, 1 = idle hover, 2 = full booster burst. */
  thrust?: number;
  /** Chest puff 0..1 (widens the fuselage). */
  puff?: number;
  /** Extra eyeball bulge 0..1 on top of the expression. */
  bulge?: number;
  /** Sweat drops and panic lines, 0..1. */
  sweat?: number;
  sunglasses?: boolean;
  /** Hull tan 0..1. */
  tan?: number;
  leftArm?: ArmPose;
  rightArm?: ArmPose;
}

interface EyeRig {
  upper: number;
  lower: number;
  pupil: number;
  bulge: number;
  /** Brow end offsets (left, right) and centre arch, in px (negative = up). */
  brow: readonly [number, number, number];
}

const EXPRESSIONS: Record<Expression, EyeRig> = {
  neutral: {upper: 0.12, lower: 0, pupil: 1, bulge: 1, brow: [0, 0, -6]},
  confused: {upper: 0.28, lower: 0.06, pupil: 0.8, bulge: 1, brow: [10, -16, -4]},
  happy: {upper: 0.04, lower: 0.36, pupil: 1.05, bulge: 1, brow: [-6, -6, -12]},
  confident: {upper: 0.16, lower: 0.18, pupil: 1, bulge: 1, brow: [-2, -10, -6]},
  smug: {upper: 0.5, lower: 0.12, pupil: 0.95, bulge: 1, brow: [6, 0, -2]},
  scared: {upper: 0, lower: 0, pupil: 0.62, bulge: 1.08, brow: [-10, -10, -16]},
  panic: {upper: 0, lower: 0, pupil: 0.42, bulge: 1.22, brow: [-18, -18, -22]},
  grumpy: {upper: 0.38, lower: 0.05, pupil: 0.9, bulge: 1, brow: [-4, -4, 12]},
  crying: {upper: 0.3, lower: 0.22, pupil: 0.85, bulge: 1, brow: [-6, -6, -16]},
  awe: {upper: 0, lower: 0, pupil: 1.3, bulge: 1.06, brow: [-16, -16, -14]},
  calm: {upper: 0.4, lower: 0.05, pupil: 1, bulge: 1, brow: [2, 2, -4]},
};

const CX = 130;
const EYE = {x: 130, y: 210, ring: 58, white: 45};
const BODY =
  'M130,12 C186,40 214,110 213,178 L207,352 Q205,380 177,384 L83,384 Q55,380 53,352 L47,178 C46,110 74,40 130,12 Z';
const SHOULDER_L = {x: 52, y: 262};
const SHOULDER_R = {x: 208, y: 262};

const flamePath = (len: number, w: number, tipShift: number, top = 408): string =>
  `M${CX - w / 2},${top} C${CX - w * 0.66},${top + len * 0.38} ${CX - w * 0.26 + tipShift * 0.5},${top + len * 0.78} ${
    CX + tipShift
  },${top + len} C${CX + w * 0.26 + tipShift * 0.5},${top + len * 0.78} ${CX + w * 0.66},${top + len * 0.38} ${CX + w / 2},${top} Z`;

const armEnd = (shoulder: {x: number; y: number}, pose: ArmPose, dir: -1 | 1) => {
  const len = pose.length ?? 92;
  const a = (pose.angle * Math.PI) / 180;
  return {x: shoulder.x + dir * Math.sin(a) * len, y: shoulder.y + Math.cos(a) * len};
};

/**
 * Retro rocket: cream fuselage, red nosecone, one giant porthole eye with a
 * movable pupil, swappable mouths and flickering exhaust.
 */
export const RocketCharacter: React.FC<RocketCharacterProps> = ({
  size = 260,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  sticker = true,
  style,
  thrust = 1,
  puff = 0,
  bulge = 0,
  sweat = 0,
  sunglasses = false,
  tan = 0,
  leftArm = {angle: 18},
  rightArm = {angle: 18},
}) => {
  const frame = useCurrentFrame();
  const bodyClip = useSvgId('rocket-body');
  const eyeClip = useSvgId('rocket-eye');
  const shadeId = useSvgId('rocket-dots');
  const glassClip = useSvgId('rocket-glass');
  const rig = EXPRESSIONS[expression];
  const lid = blink ?? autoBlink(frame, 'rocket');
  const upper = clamp(Math.max(rig.upper, lid));
  const lower = rig.lower * (1 - lid);
  const eyeScale = rig.bulge + bulge * 0.35;
  const irisR = 22 * (0.7 + 0.3 * rig.pupil);
  const pupilR = 13 * rig.pupil;
  const travel = EYE.white - irisR - 4;
  const px = EYE.x + clamp(look.x, -1, 1) * travel;
  const py = EYE.y + clamp(look.y, -1, 1) * travel;
  const hull = interpolateColors(tan, [0, 1], [TONES.hullCream, '#E7AE78']);
  const hullShade = interpolateColors(tan, [0, 1], [TONES.hullShade, '#B9784A']);
  const height = (size * ROCKET_VIEWBOX.height) / ROCKET_VIEWBOX.width;
  const [bl, br, arch] = rig.brow;
  const browY = 140;

  // Exhaust flicker.
  const flicker = 1 + 0.2 * noise1D('rocket-flame', frame * 0.7);
  const flameLen = thrust <= 0 ? 0 : (60 + 95 * thrust) * flicker;
  const flameW = 60 + 12 * Math.min(thrust, 2);
  const tipShift = noise1D('rocket-tip', frame * 0.5) * 10;

  const lHand = armEnd(SHOULDER_L, leftArm, -1);
  const rHand = armEnd(SHOULDER_R, rightArm, 1);

  const art = (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${ROCKET_VIEWBOX.width} ${ROCKET_VIEWBOX.height}`}
      overflow="visible"
      style={{display: 'block'}}
    >
      <defs>
        <clipPath id={bodyClip}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={eyeClip}>
          <circle cx={EYE.x} cy={EYE.y} r={EYE.white} />
        </clipPath>
        <pattern id={shadeId} width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={4.5} cy={4.5} r={2.2} fill={PALETTE.ink} />
        </pattern>
        <clipPath id={glassClip}>
          <path d="M60,184 Q130,172 200,184 L194,228 Q166,252 130,246 Q94,252 66,228 Z" />
        </clipPath>
      </defs>

      {/* Arms sit behind the fuselage. */}
      <NoodleArm from={SHOULDER_L} to={lHand} bend={leftArm.bend ?? -0.2} color={hull} thickness={11} glove={leftArm.glove} />
      <NoodleArm from={SHOULDER_R} to={rHand} bend={rightArm.bend ?? 0.2} color={hull} thickness={11} glove={rightArm.glove} />

      {/* Side fins */}
      <path d="M58,262 C24,288 8,338 10,404 Q12,420 28,414 L60,384 Z" fill={TONES.rocketRed} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      <path d="M202,262 C236,288 252,338 250,404 Q248,420 232,414 L200,384 Z" fill={TONES.rocketRed} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      <path d="M40,300 C26,330 20,360 20,396" fill="none" stroke={TONES.rocketRedDark} strokeWidth={6} strokeLinecap="round" />
      <path d="M220,300 C234,330 240,360 240,396" fill="none" stroke={TONES.rocketRedDark} strokeWidth={6} strokeLinecap="round" />

      {/* Nozzle */}
      <path d="M92,380 L168,380 L180,414 L80,414 Z" fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      <path d="M88,394 L172,394" stroke={TONES.steelDark} strokeWidth={4} />

      {/* Fuselage (puffs out sideways around the centre line) */}
      <g transform={`translate(${CX} 240) scale(${1 + 0.14 * puff} ${1 + 0.02 * puff}) translate(${-CX} -240)`}>
        <path d={BODY} fill={hull} />
        <g clipPath={`url(#${bodyClip})`}>
          <ellipse cx={252} cy={235} rx={92} ry={270} fill={hullShade} />
          <ellipse cx={252} cy={235} rx={92} ry={270} fill={`url(#${shadeId})`} opacity={0.18} />
          {/* Nosecone */}
          <path d="M0,0 L260,0 L260,116 Q130,142 0,116 Z" fill={TONES.rocketRed} />
          <path d="M260,0 L260,116 Q215,128 190,131 C200,80 190,40 170,0 Z" fill={TONES.rocketRedDark} opacity={0.55} />
          <path d="M0,116 Q130,142 260,116" fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
          {/* Racing stripe */}
          <path d="M0,326 Q130,344 260,326 L260,350 Q130,368 0,350 Z" fill={PALETTE.electricCyan} stroke={PALETTE.ink} strokeWidth={INK.medium} />
          {/* Gloss */}
          <path d="M70,160 Q63,250 72,330" fill="none" stroke={PALETTE.white} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
          <path d="M98,52 Q86,66 80,86" fill="none" stroke={PALETTE.white} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        </g>
        <path d={BODY} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      </g>

      {/* Front fin */}
      <path d="M121,346 L139,346 L142,424 Q130,434 118,424 Z" fill={TONES.rocketRed} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />

      {/* Brow */}
      {!sunglasses ? (
        <path
          d={`M84,${browY + bl} Q${CX},${browY + arch - 8} 176,${browY + br}`}
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth={11}
          strokeLinecap="round"
        />
      ) : null}

      {/* Porthole eye */}
      <g transform={`translate(${EYE.x} ${EYE.y}) scale(${eyeScale}) translate(${-EYE.x} ${-EYE.y})`}>
        <circle cx={EYE.x} cy={EYE.y} r={EYE.ring} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={EYE.x + Math.cos(a) * 52} cy={EYE.y + Math.sin(a) * 52} r={3} fill={TONES.steelDark} />;
        })}
        <circle cx={EYE.x} cy={EYE.y} r={EYE.white} fill={PALETTE.white} />
        <g clipPath={`url(#${eyeClip})`}>
          {expression === 'panic' ? (
            <g stroke={TONES.rocketRed} strokeWidth={2.5} fill="none" strokeLinecap="round">
              <path d={`M${EYE.x - 44},${EYE.y + 6} q10,-4 16,4 t14,-2`} />
              <path d={`M${EYE.x + 44},${EYE.y - 8} q-10,4 -16,-2 t-14,4`} />
              <path d={`M${EYE.x - 20},${EYE.y + 42} q4,-10 12,-12`} />
            </g>
          ) : null}
          <circle cx={px} cy={py} r={irisR} fill="#25B8FF" stroke={PALETTE.ink} strokeWidth={3.5} />
          <circle cx={px} cy={py} r={pupilR} fill={PALETTE.ink} />
          <circle cx={px - irisR * 0.35} cy={py - irisR * 0.38} r={5.5} fill={PALETTE.white} />
          <circle cx={px + irisR * 0.3} cy={py + irisR * 0.3} r={2.6} fill={PALETTE.white} />
          {/* Upper lid */}
          <path
            d={`M${EYE.x - 60},${EYE.y - 60} L${EYE.x + 60},${EYE.y - 60} L${EYE.x + 60},${EYE.y - EYE.white + upper * 2 * EYE.white} Q${EYE.x},${
              EYE.y - EYE.white + upper * 2 * EYE.white + 12
            } ${EYE.x - 60},${EYE.y - EYE.white + upper * 2 * EYE.white} Z`}
            fill={hull}
            stroke={PALETTE.ink}
            strokeWidth={INK.medium}
            opacity={upper > 0.01 ? 1 : 0}
          />
          {/* Lower lid */}
          <path
            d={`M${EYE.x - 60},${EYE.y + 60} L${EYE.x + 60},${EYE.y + 60} L${EYE.x + 60},${EYE.y + EYE.white - lower * 2 * EYE.white} Q${EYE.x},${
              EYE.y + EYE.white - lower * 2 * EYE.white - 14
            } ${EYE.x - 60},${EYE.y + EYE.white - lower * 2 * EYE.white} Z`}
            fill={hull}
            stroke={PALETTE.ink}
            strokeWidth={INK.medium}
            opacity={lower > 0.01 ? 1 : 0}
          />
        </g>
        <circle cx={EYE.x} cy={EYE.y} r={EYE.white} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      </g>

      {/* Sunglasses */}
      {sunglasses ? (
        <g>
          <path d="M60,190 L40,198 M200,190 L220,198" stroke={PALETTE.ink} strokeWidth={7} strokeLinecap="round" />
          <path d="M60,184 Q130,172 200,184 L194,228 Q166,252 130,246 Q94,252 66,228 Z" fill={PALETTE.ink} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
          <g clipPath={`url(#${glassClip})`}>
            <path d="M84,170 L108,170 L82,260 L58,260 Z" fill={PALETTE.white} opacity={0.85} />
            <path d="M118,170 L128,170 L102,260 L92,260 Z" fill={PALETTE.white} opacity={0.6} />
            <path d="M60,184 Q130,172 200,184 L200,196 Q130,186 60,196 Z" fill={PALETTE.vividMagenta} opacity={0.5} />
          </g>
        </g>
      ) : null}

      <Mouth shape={mouth} x={CX} y={300} scale={0.95} flip />

      {/* Sweat & panic lines */}
      {sweat > 0 ? (
        <g opacity={clamp(sweat * 1.5)}>
          {[0, 1, 2, 3].map((i) => {
            const phase = ((frame + i * 6) % 22) / 22;
            const side = i % 2 === 0 ? -1 : 1;
            const x = CX + side * (70 + phase * 60);
            const y = 120 - 30 * Math.sin(phase * Math.PI) + phase * 40 + i * 6;
            return (
              <path
                key={i}
                d={dropPath(x, y, 16 * sweat)}
                fill="#9BEFFF"
                stroke={PALETTE.ink}
                strokeWidth={3}
                opacity={1 - phase * 0.6}
              />
            );
          })}
          {[-60, -35, 35, 60].map((a, i) => {
            const r0 = 175 + (frame % 6) * 2;
            const rad = ((a - 90) * Math.PI) / 180;
            return (
              <path
                key={`l${i}`}
                d={`M${CX + Math.cos(rad) * r0},${190 + Math.sin(rad) * r0} L${CX + Math.cos(rad) * (r0 + 36)},${190 + Math.sin(rad) * (r0 + 36)}`}
                stroke={PALETTE.ink}
                strokeWidth={7}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      {/* Exhaust flames render behind the stickered body. */}
      {flameLen > 0 ? (
        <svg
          width={size}
          height={height}
          viewBox={`0 0 ${ROCKET_VIEWBOX.width} ${ROCKET_VIEWBOX.height}`}
          overflow="visible"
          style={{position: 'absolute', left: 0, top: 0}}
        >
          <path d={flamePath(flameLen, flameW, tipShift)} fill={PALETTE.solarOrange} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          <path d={flamePath(flameLen * 0.72, flameW * 0.7, tipShift * 0.7)} fill={PALETTE.hazardYellow} />
          <path d={flamePath(flameLen * 0.42, flameW * 0.38, tipShift * 0.4)} fill={PALETTE.white} />
          {thrust > 1.2
            ? [0, 1, 2, 3, 4].map((i) => {
                const t = ((frame * 0.08 + i * 0.2) % 1 + 1) % 1;
                const x = CX + noise1D(`spark-${i}`, frame * 0.3) * 50;
                const y = 408 + flameLen * (0.6 + t * 0.7);
                return <circle key={i} cx={x} cy={y} r={6 * (1 - t)} fill={PALETTE.hazardYellow} stroke={PALETTE.ink} strokeWidth={2} />;
              })
            : null}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0}}>
        {sticker ? <Sticker bleed={0.45}>{art}</Sticker> : art}
      </div>
    </div>
  );
};
