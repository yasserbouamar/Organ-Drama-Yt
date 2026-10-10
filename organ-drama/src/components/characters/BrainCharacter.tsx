import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, LimbPose} from '../../types/characters';
import {springBlink} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';
import {Eye} from './parts/Eye';
import {FACE_RIGS} from './parts/expressions';
import {Limb} from './parts/Limb';
import {Mouth} from './parts/Mouth';
import {Tears} from './parts/Tears';

export const BRAIN_VIEWBOX = {width: 400, height: 420} as const;

export interface BrainCharacterProps extends CharacterBaseProps {
  /** Chewing cheek bulge 0..1 (animated automatically for `chewing`). */
  cheeks?: number;
  leftArm?: LimbPose;
  rightArm?: LimbPose;
  /** Hide legs and tie (e.g. peeking out from under a blanket). */
  torso?: boolean;
  /** SVG drawn in the right (screen-right) hand. */
  holding?: React.ReactNode;
}

const C = {x: 200, y: 166};
const RX = 166;
const RY = 126;
const EYES = [
  {x: 150, y: 192, side: -1 as const},
  {x: 250, y: 192, side: 1 as const},
];
const MOUTH = {x: 200, y: 250};

/** The cerebrum: an ellipse with a scalloped, cauliflower edge (flatter underneath). */
const brainPath = (): string => {
  const n = 18;
  const pts = Array.from({length: n}, (_, i) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    const flatten = Math.sin(t) > 0 ? 0.86 : 1;
    return {x: C.x + Math.cos(t) * RX, y: C.y + Math.sin(t) * RY * flatten, t};
  });
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const tm = p.t + Math.PI / n;
    // Normal of the ellipse at the midpoint, pushed out by a bump that shrinks underneath.
    const nx = Math.cos(tm) / RX;
    const ny = Math.sin(tm) / RY;
    const len = Math.hypot(nx, ny);
    const bump = Math.sin(tm) > 0.55 ? 9 : 20;
    const cx = (p.x + q.x) / 2 + (nx / len) * bump * 2;
    const cy = (p.y + q.y) / 2 + (ny / len) * bump * 2;
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  }
  return `${d} Z`;
};

const BODY = brainPath();

const FOLDS = [
  'M200,46 C194,70 206,92 199,124',
  'M62,150 C72,122 100,132 106,108 S136,84 152,96',
  'M92,72 C110,88 132,62 156,76',
  'M246,76 C266,62 290,88 308,72',
  'M248,96 C264,84 296,108 300,128 S330,130 340,152',
  'M128,140 C140,126 160,138 170,126',
  'M232,128 C244,140 262,126 272,140',
  'M44,198 C54,182 46,166 60,156',
  'M356,198 C346,182 354,166 340,156',
  'M150,40 C160,52 178,46 182,60',
];

/** The Brain: a folded pink cerebrum in a striped necktie. Big glossy eyes, noodle limbs. */
export const BrainCharacter: React.FC<BrainCharacterProps> = ({
  size = 360,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  cheeks,
  leftArm = {angle: 18, bend: 10},
  rightArm = {angle: 18, bend: 10},
  torso = true,
  holding,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bodyClip = useSvgId('brain-body');
  const bodyGrad = useSvgId('brain-grad');
  const tieClip = useSvgId('brain-tie');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'brain'));
  const height = (size * BRAIN_VIEWBOX.height) / BRAIN_VIEWBOX.width;
  const chew = cheeks ?? (expression === 'chewing' ? 0.65 + 0.35 * Math.sin(frame * 0.7) : 0);
  const mouthShape = expression === 'chewing' && mouth === 'idle' ? 'chew' : mouth;
  const eyeR = 40 * rig.eyeScale;

  const tie = (
    <g>
      <defs>
        <clipPath id={tieClip}>
          <path d="M190,306 L210,306 L222,370 L200,394 L178,370 Z" />
        </clipPath>
      </defs>
      <path d="M200,296 L168,282 L176,306 Z" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
      <path d="M200,296 L232,282 L224,306 Z" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
      <path d="M190,306 L210,306 L222,370 L200,394 L178,370 Z" fill={TONES.tieBlue} />
      <g clipPath={`url(#${tieClip})`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={160} y1={300 + i * 18} x2={240} y2={340 + i * 18} stroke={PALETTE.white} strokeWidth={7} />
        ))}
      </g>
      <path d="M190,306 L210,306 L222,370 L200,394 L178,370 Z" fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
      <path d="M187,290 L213,290 L209,308 L191,308 Z" fill={TONES.tieBlueDark} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
    </g>
  );

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${BRAIN_VIEWBOX.width} ${BRAIN_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TONES.brainLight} />
            <stop offset="0.65" stopColor={PALETTE.brainPink} />
            <stop offset="1" stopColor="#EC5FA8" />
          </linearGradient>
          <clipPath id={bodyClip}>
            <path d={BODY} />
          </clipPath>
        </defs>

        {torso ? (
          <>
            <Limb from={{x: 168, y: 284}} length={92} side={-1} angle={4} bend={-8} width={16} color={PALETTE.brainFold} end="shoe" endColor="#312E81" endSize={16} />
            <Limb from={{x: 232, y: 284}} length={92} side={1} angle={4} bend={-8} width={16} color={PALETTE.brainFold} end="shoe" endColor="#312E81" endSize={16} />
          </>
        ) : null}
        <Limb from={{x: 54, y: 232}} length={96} side={-1} {...leftArm} width={16} color={PALETTE.brainFold} />

        <path d={BODY} fill={`url(#${bodyGrad})`} />
        <g clipPath={`url(#${bodyClip})`}>
          {FOLDS.map((d) => (
            <path key={d} d={d} fill="none" stroke={PALETTE.brainFold} strokeWidth={7} strokeLinecap="round" />
          ))}
          <ellipse cx={128} cy={76} rx={52} ry={20} fill={PALETTE.white} opacity={0.35} transform="rotate(-18 128 76)" />
          <ellipse cx={200} cy={300} rx={170} ry={40} fill="#DB2777" opacity={0.18} />
        </g>
        <path d={BODY} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />

        {torso ? tie : null}

        {/* Face */}
        <ellipse cx={102} cy={238} rx={20} ry={11} fill={TONES.blush} opacity={0.45} />
        <ellipse cx={298} cy={238} rx={20} ry={11} fill={TONES.blush} opacity={0.45} />
        {chew > 0.01
          ? [-1, 1].map((s) => (
              <circle key={s} cx={MOUTH.x + s * 44} cy={MOUTH.y - 2} r={10 + 18 * chew} fill={PALETTE.brainPink} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            ))
          : null}
        {rig.brow
          ? EYES.map((e) => {
              const inner = e.x - e.side * 14;
              const outer = e.x + e.side * 30;
              const by = e.y - eyeR - 16;
              return (
                <path
                  key={`brow-${e.side}`}
                  d={`M${inner},${by + rig.brow![0]} Q${(inner + outer) / 2},${by + (rig.brow![0] + rig.brow![1]) / 2 - 7} ${outer},${by + rig.brow![1]}`}
                  fill="none"
                  stroke={PALETTE.ink}
                  strokeWidth={9}
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
            pupil={rig.pupil}
            lid={lid}
            lower={rig.lower}
            lidTilt={rig.tilt}
            lidColor={PALETTE.brainPink}
            style={rig.style}
            sparkle={rig.sparkle}
          />
        ))}
        <Mouth shape={mouthShape} x={MOUTH.x} y={MOUTH.y} scale={0.95} phase={frame * 0.7} />
        {rig.tears ? <Tears eyes={EYES} frame={frame} /> : null}

        <Limb from={{x: 346, y: 232}} length={96} side={1} {...rightArm} width={16} color={PALETTE.brainFold} holding={holding} />
      </svg>
    </div>
  );
};
