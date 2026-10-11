import React from 'react';
import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Eye} from '../components/characters/parts/Eye';
import {FACE_RIGS} from '../components/characters/parts/expressions';
import {Mouth} from '../components/characters/parts/Mouth';
import {PizzaSliceArt} from '../components/characters/PizzaSlice';
import type {CharacterBaseProps, MouthShape, Point} from '../types/characters';
import {clamp, springBlink} from '../utils/animation';
import {smoothClosedPath} from '../utils/geometry';
import {useSvgId} from '../utils/useSvgId';
import {StickArm, StickLeg, SweatDrop} from './parts';
import {R} from './remakeTheme';

export const REMAKE_STOMACH_VIEWBOX = {width: 560, height: 760} as const;

/** Where the gate (the ring of muscle between food pipe and stomach) sits, in puppet units. */
export const GATE = {x: 196, y: 42} as const;

export interface RemakeStomachProps extends CharacterBaseProps {
  leftHand?: Point;
  rightHand?: Point;
  leftBend?: number;
  rightBend?: number;
  /** A slice of pizza inside the see-through belly; `sliceMouth` makes it talk. */
  slice?: boolean;
  sliceMouth?: MouthShape;
  /** Padlock on the gate: pops in (0..1), shackle snaps shut (0..1). */
  lockShow?: number;
  lockClosed?: number;
  /** Knocking shake on the gate, 0..1. */
  gateShake?: number;
  /** Gold highlight ring around the gate, 0..1. */
  gateGlow?: number;
  /** 0..1: a swallowed bulge travelling down the neck. */
  gulp?: number;
  /** Sweat drop, 0..1. */
  sweat?: number;
}

// Traced from the reference frame (480p outline, mapped to puppet units).
const BODY = smoothClosedPath([
  {x: 170, y: 40},
  {x: 168, y: 159},
  {x: 173, y: 192},
  {x: 182, y: 238},
  {x: 190, y: 274},
  {x: 206, y: 311},
  {x: 219, y: 349},
  {x: 226, y: 393},
  {x: 222, y: 427},
  {x: 210, y: 455},
  {x: 194, y: 484},
  {x: 168, y: 504},
  {x: 124, y: 524},
  {x: 92, y: 548},
  {x: 78, y: 576},
  {x: 92, y: 596},
  {x: 124, y: 590},
  {x: 158, y: 568},
  {x: 196, y: 552},
  {x: 240, y: 564},
  {x: 295, y: 569},
  {x: 347, y: 562},
  {x: 382, y: 540},
  {x: 406, y: 520},
  {x: 424, y: 500},
  {x: 445, y: 463},
  {x: 458, y: 425},
  {x: 464, y: 368},
  {x: 462, y: 330},
  {x: 456, y: 292},
  {x: 443, y: 254},
  {x: 420, y: 216},
  {x: 392, y: 190},
  {x: 356, y: 172},
  {x: 310, y: 164},
  {x: 266, y: 168},
  {x: 234, y: 182},
  {x: 223, y: 158},
  {x: 222, y: 40},
]);

const EYES = [
  {x: 287, y: 298, side: -1 as const},
  {x: 364, y: 294, side: 1 as const},
];
const MOUTH = {x: 322, y: 408};
const ACID_TOP = 536;

const Mustache: React.FC<{wiggle: number}> = ({wiggle}) => {
  const lobe = 'M0,0 C10,-12 34,-14 48,-6 C58,0 66,-4 68,-14 C78,-2 70,16 50,14 C32,12 14,12 0,8 Z';
  return (
    <g transform="translate(322 384) scale(0.74)">
      {[-1, 1].map((s) => (
        <path key={s} d={lobe} transform={`scale(${s} 1) rotate(${wiggle * -s})`} fill={R.mustache} stroke={R.ink} strokeWidth={R.line * 0.7} strokeLinejoin="round" />
      ))}
    </g>
  );
};

const Nightcap: React.FC<{clipId: string; sway: number}> = ({clipId, sway}) => {
  const cone = `M-96,-6 C-84,-80 -20,-130 ${54 + sway},-142 C${70 + sway},-138 ${80 + sway},-120 ${74 + sway * 0.6},-100 C60,-60 70,-30 96,-14 Z`;
  return (
    <g transform="translate(330 214) rotate(-8) scale(0.88)">
      <defs>
        <clipPath id={clipId}>
          <path d={cone} />
        </clipPath>
      </defs>
      <path d={cone} fill={R.capWhite} />
      <g clipPath={`url(#${clipId})`}>
        {[-80, -44, -8, 28, 64].map((x) => (
          <rect key={x} x={x} y={-160} width={20} height={170} fill={R.capBlue} transform={`rotate(14 ${x} -60)`} />
        ))}
      </g>
      <path d={cone} fill="none" stroke={R.ink} strokeWidth={R.line} strokeLinejoin="round" />
      <rect x={-104} y={-20} width={208} height={34} rx={14} fill={R.capWhite} stroke={R.ink} strokeWidth={R.line} />
      <circle cx={66 + sway * 0.8} cy={-138} r={18} fill={R.capWhite} stroke={R.ink} strokeWidth={R.line} />
    </g>
  );
};

/**
 * The Stomach, drawn in the reference clip's style: a mustard J-shaped body
 * whose neck rises into the food pipe, a pink ring "gate" (with a padlock),
 * a see-through belly of acid, a nightcap and a mustache.
 */
export const RemakeStomach: React.FC<RemakeStomachProps> = ({
  size = 800,
  expression = 'sleepy',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  leftHand,
  rightHand,
  leftBend = 0.2,
  rightBend = -0.2,
  slice = false,
  sliceMouth = 'grin',
  lockShow = 0,
  lockClosed = 0,
  gateShake = 0,
  gateGlow = 0,
  gulp = 0,
  sweat = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const grad = useSvgId('rstomach-grad');
  const clip = useSvgId('rstomach-clip');
  const capClip = useSvgId('rstomach-cap');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'remake-stomach'));
  const height = (size * REMAKE_STOMACH_VIEWBOX.height) / REMAKE_STOMACH_VIEWBOX.width;
  const eyeR = 46 * rig.eyeScale;
  const shake = gateShake * Math.sin(frame * 2.9) * 6;
  const glowPulse = 1 + Math.sin(frame * 0.25) * 0.05;

  const bubbles = Array.from({length: 8}, (_, i) => {
    const t = ((frame * (0.006 + random(`rs-b-${i}`) * 0.006) + random(`rs-o-${i}`)) % 1 + 1) % 1;
    return {x: 200 + random(`rs-x-${i}`) * 230, y: 562 - t * 34, r: 5 + random(`rs-r-${i}`) * 7, o: Math.sin(t * Math.PI)};
  });
  // Acid pools in the bowl only; the duodenum "tail" stays orange.
  const surface = `M196,${ACID_TOP} ${Array.from({length: 12}, (_, i) => {
    const x = 196 + i * 28;
    return `L${x},${(ACID_TOP + Math.sin(x * 0.04 + frame * 0.12) * 4).toFixed(1)}`;
  }).join(' ')} L520,700 L204,700 Z`;

  // The neck is part of the body; the food pipe continues straight up off-frame.
  const gulpY = 50 + clamp(gulp) * 110;

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${REMAKE_STOMACH_VIEWBOX.width} ${REMAKE_STOMACH_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0" stopColor={R.stomachShade} />
            <stop offset="0.35" stopColor={R.stomach} />
            <stop offset="0.75" stopColor={R.stomachLight} />
            <stop offset="1" stopColor={R.stomach} />
          </linearGradient>
          <clipPath id={clip}>
            <path d={BODY} />
          </clipPath>
        </defs>

        {/* Food pipe, rising off the top of the frame. */}
        <g transform={`translate(${shake} 0)`}>
          <rect x={166} y={-1400} width={60} height={1440} fill={R.esophagus} />
          <rect x={177} y={-1400} width={10} height={1440} fill={R.esophagusLight} opacity={0.7} />
          <line x1={166} y1={-1400} x2={166} y2={40} stroke={R.ink} strokeWidth={R.line} />
          <line x1={226} y1={-1400} x2={226} y2={40} stroke={R.ink} strokeWidth={R.line} />
        </g>

        <StickLeg from={{x: 264, y: 562}} to={{x: 258, y: 716}} side={-1} />
        <StickLeg from={{x: 350, y: 558}} to={{x: 356, y: 716}} side={1} />
        <StickArm from={{x: 196, y: 330}} to={leftHand ?? {x: 150, y: 430}} bend={leftBend} hand={R.stomach} handSize={13} />

        <path d={BODY} fill={`url(#${grad})`} />
        <g clipPath={`url(#${clip})`}>
          {/* See-through belly: acid, bubbles and whatever was swallowed. */}
          {slice ? (
            <g transform="translate(320 478) rotate(-4) scale(0.53) translate(-120 -140)">
              <PizzaSliceArt mouth={sliceMouth} frame={frame} />
            </g>
          ) : null}
          <path d={surface} fill={R.acid} opacity={0.88} />
          <path d={surface} fill="none" stroke={R.acidLight} strokeWidth={4} opacity={0.8} />
          {bubbles.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="none" stroke={R.bubble} strokeWidth={2.5} opacity={b.o} />
          ))}
          {/* Swallow bulge travelling down the neck. */}
          {gulp > 0 && gulp < 1 ? <ellipse cx={196} cy={gulpY} rx={36} ry={24} fill={R.stomachLight} stroke={R.ink} strokeWidth={R.line * 0.8} /> : null}
          <ellipse cx={420} cy={330} rx={26} ry={60} fill="#FFFFFF" opacity={0.18} transform="rotate(-20 420 330)" />
        </g>
        <path d={BODY} fill="none" stroke={R.ink} strokeWidth={R.line} strokeLinejoin="round" />
        <ellipse cx={80} cy={588} rx={22} ry={13} fill={R.shoe} stroke={R.ink} strokeWidth={R.line * 0.8} transform="rotate(-25 80 588)" />

        {/* The gate: a ring of muscle at the top, with its padlock and highlight. */}
        <g transform={`translate(${GATE.x + shake} ${GATE.y})`}>
          <ellipse rx={44} ry={20} fill={R.gate} stroke={R.ink} strokeWidth={R.line} />
          <path d="M-34,-6 Q0,-16 34,-6" fill="none" stroke={R.gateLight} strokeWidth={6} strokeLinecap="round" />
          <ellipse cx={0} cy={-14} rx={40} ry={14} fill={R.gate} stroke={R.ink} strokeWidth={R.line} />
          <path d="M-30,-18 Q0,-26 30,-18" fill="none" stroke={R.gateLight} strokeWidth={5} strokeLinecap="round" />
          {lockShow > 0.01 ? (
            <g transform={`translate(38 6) scale(${lockShow}) rotate(${gateShake * Math.sin(frame * 1.7) * 14})`}>
              <path
                d={`M-10,${10 - (1 - lockClosed) * 12} L-10,-4 C-10,-22 14,-22 14,-4 L14,${10 - (1 - lockClosed) * 12}`}
                fill="none"
                stroke={R.ink}
                strokeWidth={10}
                strokeLinecap="round"
              />
              <path
                d={`M-10,${10 - (1 - lockClosed) * 12} L-10,-4 C-10,-22 14,-22 14,-4 L14,${10 - (1 - lockClosed) * 12}`}
                fill="none"
                stroke={R.lockShackle}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <rect x={-16} y={8} width={36} height={32} rx={6} fill={R.lockBody} stroke={R.ink} strokeWidth={R.line * 0.8} />
              <circle cx={2} cy={21} r={4} fill={R.ink} />
              <path d="M0,22 L4,22 L5,31 L-1,31 Z" fill={R.ink} />
            </g>
          ) : null}
          {gateGlow > 0.01 ? <circle r={68 * glowPulse} fill="none" stroke={R.highlight} strokeWidth={6} opacity={gateGlow} /> : null}
        </g>

        {/* Cap first so the brows sit on top of its band, like the reference. */}
        <Nightcap clipId={capClip} sway={Math.sin(frame * 0.06) * 6} />

        {/* Face */}
        {rig.brow
          ? EYES.map((e) => {
              const inner = e.x - e.side * 12;
              const outer = e.x + e.side * 28;
              const by = e.y - eyeR - 10;
              return (
                <path
                  key={`brow-${e.side}`}
                  d={`M${inner},${by + rig.brow![0] * 0.9} Q${(inner + outer) / 2},${by + ((rig.brow![0] + rig.brow![1]) / 2) * 0.9 - 6} ${outer},${by + rig.brow![1] * 0.9}`}
                  fill="none"
                  stroke={R.ink}
                  strokeWidth={R.line}
                  strokeLinecap="round"
                />
              );
            })
          : null}
        {EYES.map((e) => (
          <Eye
            key={e.side}
            cx={e.x}
            cy={e.y}
            r={eyeR}
            side={e.side}
            look={look}
            pupil={rig.pupil * 0.7}
            lid={lid}
            lower={Math.max(rig.lower, expression === 'sleepy' ? 0.1 : 0)}
            lidTilt={rig.tilt}
            lidColor={R.stomach}
            style={rig.style}
            ink={R.ink}
            inkWidth={R.line}
          />
        ))}
        <Mouth shape={mouth} x={MOUTH.x} y={MOUTH.y} scale={0.56} strokeWidth={R.line} ink={R.ink} phase={frame * 0.5} />
        <Mustache wiggle={mouth === 'idle' ? 0 : 6 + Math.sin(frame * 0.9) * 3} />
        {sweat > 0 ? <SweatDrop x={404} y={250} size={18} opacity={sweat} /> : null}

        <StickArm from={{x: 456, y: 342}} to={rightHand ?? {x: 500, y: 440}} bend={rightBend} hand={R.stomach} handSize={13} />
      </svg>
    </div>
  );
};
