import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Eye} from '../components/characters/parts/Eye';
import {FACE_RIGS} from '../components/characters/parts/expressions';
import {Mouth} from '../components/characters/parts/Mouth';
import type {CharacterBaseProps, Point} from '../types/characters';
import {springBlink} from '../utils/animation';
import {useSvgId} from '../utils/useSvgId';
import {StickArm, StickLeg} from './parts';
import {R} from './remakeTheme';

export const REMAKE_BRAIN_VIEWBOX = {width: 420, height: 480} as const;

export interface RemakeBrainProps extends CharacterBaseProps {
  /** Hand targets in puppet units (defaults: hanging by the sides). */
  leftHand?: Point;
  rightHand?: Point;
  leftBend?: number;
  rightBend?: number;
  /** Drawn in the screen-right hand. */
  holding?: React.ReactNode;
  /** 0..1 walk cycle (legs stride). */
  walk?: number;
  /** Hide tie and legs (tucked under a blanket). */
  torso?: boolean;
}

const C = {x: 200, y: 172};
const RX = 172;
const RY = 138;
const EYES = [
  {x: 150, y: 206, side: -1 as const},
  {x: 236, y: 201, side: 1 as const},
];
const MOUTH = {x: 188, y: 274};

/** Soft cauliflower outline: an ellipse with gentle scallops, flatter underneath. */
const cerebrum = (): string => {
  const n = 14;
  const pts = Array.from({length: n}, (_, i) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    const flat = Math.sin(t) > 0 ? 0.84 : 1;
    return {x: C.x + Math.cos(t) * RX, y: C.y + Math.sin(t) * RY * flat, t};
  });
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const tm = p.t + Math.PI / n;
    const nx = Math.cos(tm) / RX;
    const ny = Math.sin(tm) / RY;
    const len = Math.hypot(nx, ny);
    const bump = Math.sin(tm) > 0.5 ? 5 : 12;
    d += ` Q${((p.x + q.x) / 2 + (nx / len) * bump * 2).toFixed(1)},${((p.y + q.y) / 2 + (ny / len) * bump * 2).toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  }
  return `${d} Z`;
};

const BODY = cerebrum();
const CEREBELLUM = 'M282,258 C330,236 392,246 400,280 C407,310 362,326 312,318 C292,314 280,300 282,258 Z';
const FOLDS = [
  'M206,46 C224,68 196,90 214,116',
  'M102,86 C124,78 142,98 162,90',
  'M262,62 C285,56 300,76 322,72',
  'M302,104 C320,124 300,146 326,160',
  'M252,124 C270,144 256,164 278,176',
  'M334,192 C352,204 346,226 366,234',
  'M68,150 C78,128 98,138 110,124',
  'M138,52 C148,68 170,64 176,80',
  'M286,206 C300,214 296,232 312,238',
];

/** The Brain, drawn in the reference clip's style: salmon, finely folded, thin limbs, blue tie. */
export const RemakeBrain: React.FC<RemakeBrainProps> = ({
  size = 600,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  leftHand,
  rightHand,
  leftBend = 0.18,
  rightBend = -0.18,
  holding,
  walk = 0,
  torso = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const grad = useSvgId('rbrain-grad');
  const clip = useSvgId('rbrain-clip');
  const tieClip = useSvgId('rbrain-tie');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'remake-brain'));
  const height = (size * REMAKE_BRAIN_VIEWBOX.height) / REMAKE_BRAIN_VIEWBOX.width;
  const stride = Math.sin(frame * 0.55) * walk;
  const eyeR = 41 * rig.eyeScale;

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${REMAKE_BRAIN_VIEWBOX.width} ${REMAKE_BRAIN_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <linearGradient id={grad} x1="0.2" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={R.brainLight} />
            <stop offset="0.55" stopColor={R.brain} />
            <stop offset="1" stopColor={R.brainShade} />
          </linearGradient>
          <clipPath id={clip}>
            <path d={BODY} />
          </clipPath>
          <clipPath id={tieClip}>
            <path d="M200,316 L220,316 L232,388 L210,410 L188,388 Z" />
          </clipPath>
        </defs>

        {torso ? (
          <>
            <StickLeg from={{x: 184, y: 300}} to={{x: 176 - stride * 30, y: 455 - Math.max(0, stride) * 14}} side={-1} />
            <StickLeg from={{x: 232, y: 300}} to={{x: 244 + stride * 30, y: 455 - Math.max(0, -stride) * 14}} side={1} />
          </>
        ) : null}

        {/* Cerebellum peeks out behind, lower right. */}
        <path d={CEREBELLUM} fill={R.brainShade} stroke={R.ink} strokeWidth={R.line} strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${300 + i * 4},${270 + i * 14} C${330},${262 + i * 14} ${365},${266 + i * 14} ${392 - i * 6},${280 + i * 12}`} fill="none" stroke={R.brainFold} strokeWidth={3} strokeLinecap="round" />
        ))}

        <StickArm from={{x: 74, y: 248}} to={leftHand ?? {x: 52, y: 336}} bend={leftBend} hand={R.brain} />

        <path d={BODY} fill={`url(#${grad})`} />
        <g clipPath={`url(#${clip})`}>
          {FOLDS.map((d) => (
            <path key={d} d={d} fill="none" stroke={R.brainFold} strokeWidth={3.5} strokeLinecap="round" />
          ))}
          <ellipse cx={120} cy={70} rx={50} ry={18} fill="#FFFFFF" opacity={0.25} transform="rotate(-20 120 70)" />
        </g>
        <path d={BODY} fill="none" stroke={R.ink} strokeWidth={R.line} strokeLinejoin="round" />

        {torso ? (
          <g>
            <path d="M200,316 L220,316 L232,388 L210,410 L188,388 Z" fill={R.tie} />
            <g clipPath={`url(#${tieClip})`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1={170} y1={300 + i * 20} x2={250} y2={340 + i * 20} stroke={R.tieStripe} strokeWidth={6} />
              ))}
            </g>
            <path d="M200,316 L220,316 L232,388 L210,410 L188,388 Z" fill="none" stroke={R.ink} strokeWidth={R.line * 0.85} strokeLinejoin="round" />
            <path d="M197,298 L223,298 L219,318 L201,318 Z" fill={R.tie} stroke={R.ink} strokeWidth={R.line * 0.85} strokeLinejoin="round" />
          </g>
        ) : null}

        {/* Face */}
        {rig.brow
          ? EYES.map((e) => {
              const inner = e.x - e.side * 12;
              const outer = e.x + e.side * 30;
              const by = e.y - eyeR - 13;
              return (
                <path
                  key={`brow-${e.side}`}
                  d={`M${inner},${by + rig.brow![0] * 0.8} Q${(inner + outer) / 2},${by + ((rig.brow![0] + rig.brow![1]) / 2) * 0.8 - 6} ${outer},${by + rig.brow![1] * 0.8}`}
                  fill="none"
                  stroke={R.ink}
                  strokeWidth={R.line * 0.9}
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
            pupil={rig.pupil * 0.82}
            lid={lid}
            lower={rig.lower}
            lidTilt={rig.tilt}
            lidColor={R.brain}
            style={rig.style}
            sparkle={rig.sparkle}
            ink={R.ink}
            inkWidth={R.line}
          />
        ))}
        <Mouth shape={mouth} x={MOUTH.x} y={MOUTH.y} scale={0.72} strokeWidth={R.line} ink={R.ink} phase={frame * 0.6} />

        <StickArm from={{x: 326, y: 248}} to={rightHand ?? {x: 352, y: 334}} bend={rightBend} hand={R.brain} holding={holding} />
      </svg>
    </div>
  );
};
