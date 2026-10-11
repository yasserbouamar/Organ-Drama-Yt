import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Eye} from '../components/characters/parts/Eye';
import {FACE_RIGS} from '../components/characters/parts/expressions';
import {Limb} from '../components/characters/parts/Limb';
import {Mouth} from '../components/characters/parts/Mouth';
import {Tears} from '../components/characters/parts/Tears';
import {INK, PALETTE, TONES} from '../theme';
import type {CharacterBaseProps, LimbPose} from '../types/characters';
import {springBlink} from '../utils/animation';
import {useSvgId} from '../utils/useSvgId';
import {Accessories} from './Accessories';
import {bodyTones} from './color';
import type {ShapeDef} from './shapes';
import type {Accessory, ShapeStroke} from './types';

export interface OrganPuppetProps extends CharacterBaseProps {
  shape: ShapeDef;
  color?: string;
  limbColor?: string;
  shoeColor?: string;
  accessories?: readonly Accessory[];
  /** false = a faceless object. */
  face?: boolean;
  leftArm?: LimbPose;
  rightArm?: LimbPose;
  crossed?: boolean;
  /** One hand to the chin (thinking) or over the eyes (facepalm). */
  reach?: {side: 'left' | 'right'; to: 'chin' | 'eyes'};
  /** Drawn in the screen-right hand. */
  holding?: React.ReactNode;
  /** Walk cycle strength 0..1 (legs swing). */
  walk?: number;
  /** Hat hop, 0..1. */
  hatLift?: number;
  /** Seed for blinking, so puppets don't blink in unison. */
  seed?: string;
  /** Render as a bare <svg> at this position (in the parent SVG's units), e.g. a prop held in a hand. */
  asSvg?: {x: number; y: number};
}

/**
 * Any body from the shape library, drawn in the house style: radial
 * gradient, a soft shadow crescent and a gloss highlight, a bold ink outline,
 * big cartoon eyes with brows, a lip-synced mouth, rubber-hose arms in white
 * gloves and legs in sneakers, plus hats, glasses and ties.
 */
export const OrganPuppet: React.FC<OrganPuppetProps> = ({
  shape,
  size,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  color,
  limbColor,
  shoeColor,
  accessories = [],
  face = true,
  leftArm = {angle: 22, bend: 14},
  rightArm = {angle: 22, bend: 14},
  crossed = false,
  reach,
  holding,
  walk = 0,
  hatLift = 0,
  seed = 'organ',
  asSvg,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const grad = useSvgId('organ-grad');
  const clip = useSvgId('organ-clip');
  const shadeMask = useSvgId('organ-shade');
  const {width: vw, height: vh} = shape.viewBox;
  const width = size ?? shape.size;
  const height = (width * vh) / vw;
  const tones = bodyTones(color ?? shape.color);
  const limb = limbColor ?? tones.limb;
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, seed));
  const eyeR = shape.face.eyeR * rig.eyeScale;
  const armW = shape.arms?.width ?? 14;
  const legW = shape.legs?.width ?? 14;
  const stride = Math.sin(frame * 0.5) * walk;

  const paint = (s: ShapeStroke, key: string | number, clipped = false) => {
    const fill = s.fill === 'body' ? `url(#${grad})` : s.fill === 'light' ? tones.light : s.fill === 'dark' ? tones.dark : (s.fill ?? 'none');
    const strokeColor = !s.strokeColor || s.strokeColor === 'ink' ? PALETTE.ink : s.strokeColor === 'dark' ? tones.dark : s.strokeColor;
    // A "tube" is a filled stroke: ink first, then the colour inside it.
    if (s.tube) {
      return (
        <g key={key} opacity={s.opacity}>
          <path d={s.d} fill="none" stroke={PALETTE.ink} strokeWidth={(s.stroke ?? 20) + INK.medium * 2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={s.d} fill="none" stroke={fill} strokeWidth={s.stroke ?? 20} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    return (
      <path
        key={key}
        d={s.d}
        fill={fill}
        stroke={s.stroke ? strokeColor : 'none'}
        strokeWidth={s.stroke ?? 0}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={s.opacity ?? (clipped ? 1 : undefined)}
      />
    );
  };

  const eyes = shape.face.eyes;
  const crossedArms = crossed && shape.arms;
  // A hand aimed at the face: solve the limb's angle and length to land on it.
  const aim = (side: 'left' | 'right'): {pose: LimbPose; length: number} | null => {
    if (!shape.arms || !reach || reach.side !== side || !face) {
      return null;
    }
    const s = side === 'left' ? -1 : 1;
    const from = side === 'left' ? shape.arms.left : shape.arms.right;
    const eye = eyes[side === 'left' ? 0 : 1];
    const to =
      reach.to === 'eyes'
        ? {x: eye.x, y: eye.y + eyeR * 0.1}
        : {x: shape.face.mouth.x + s * eyeR * 0.9, y: shape.face.mouth.y + eyeR * 0.55};
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return {pose: {angle: (Math.atan2(s * dx, dy) * 180) / Math.PI, bend: 45}, length: Math.hypot(dx, dy)};
  };
  const leftAim = aim('left');
  const rightAim = aim('right');
  const hl = {x: vw * 0.32, y: vh * 0.24};

  const svgProps = asSvg ? {x: asSvg.x, y: asSvg.y} : {style: {display: 'block'}};
  const drawing = (
      <svg width={width} height={height} viewBox={`0 0 ${vw} ${vh}`} overflow="visible" {...svgProps}>
        <defs>
          <radialGradient id={grad} cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor={tones.light} />
            <stop offset="0.55" stopColor={tones.base} />
            <stop offset="1" stopColor={tones.dark} />
          </radialGradient>
          <clipPath id={clip}>
            <path d={shape.body} />
          </clipPath>
          <mask id={shadeMask}>
            <rect x={-vw} y={-vh} width={vw * 3} height={vh * 3} fill="white" />
            <path d={shape.body} transform={`translate(${-vw * 0.05} ${-vh * 0.06})`} fill="black" />
          </mask>
        </defs>

        {shape.legs
          ? ([-1, 1] as const).map((side) => {
              const from = side === -1 ? shape.legs!.left : shape.legs!.right;
              const swing = side * stride * 26;
              return (
                <Limb
                  key={`leg${side}`}
                  from={from}
                  length={shape.legs!.length}
                  side={side}
                  angle={6 + swing}
                  bend={-6}
                  width={legW}
                  color={limb}
                  end="shoe"
                  endColor={shoeColor ?? TONES.sneakerBlue}
                  endSize={legW * 1.15}
                />
              );
            })
          : null}
        {shape.arms && !crossedArms && !leftAim ? <Limb from={shape.arms.left} length={shape.arms.length} side={-1} {...leftArm} width={armW} color={limb} /> : null}

        {(shape.behind ?? []).map((s, i) => paint(s, `b${i}`))}
        <path d={shape.body} fill={`url(#${grad})`} />
        <g clipPath={`url(#${clip})`}>
          {(shape.details ?? []).map((s, i) => paint(s, `d${i}`, true))}
          <rect x={-vw} y={-vh} width={vw * 3} height={vh * 3} fill={tones.dark} opacity={0.32} mask={`url(#${shadeMask})`} />
          <ellipse cx={hl.x} cy={hl.y} rx={vw * 0.11} ry={vh * 0.05} fill={PALETTE.white} opacity={0.42} transform={`rotate(-32 ${hl.x} ${hl.y})`} />
        </g>
        <path d={shape.body} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        {(shape.front ?? []).map((s, i) => paint(s, `f${i}`))}

        {face ? (
          <>
            {rig.brow
              ? eyes.map((e, i) => {
                  const side = i === 0 ? -1 : 1;
                  const inner = e.x - side * eyeR * 0.2;
                  const outer = e.x + side * eyeR * 0.95;
                  const by = e.y - eyeR - eyeR * 0.42;
                  const k = eyeR / 36;
                  return (
                    <path
                      key={`brow${i}`}
                      d={`M${inner},${by + rig.brow![0] * k} Q${(inner + outer) / 2},${by + ((rig.brow![0] + rig.brow![1]) / 2) * k - 8 * k} ${outer},${by + rig.brow![1] * k}`}
                      fill="none"
                      stroke={PALETTE.ink}
                      strokeWidth={10 * k}
                      strokeLinecap="round"
                    />
                  );
                })
              : null}
            {eyes.map((e, i) => (
              <Eye
                key={i}
                cx={e.x}
                cy={e.y}
                r={eyeR}
                side={i === 0 ? -1 : 1}
                look={look}
                pupil={rig.pupil}
                lid={lid}
                lower={rig.lower}
                lidTilt={rig.tilt}
                lidColor={tones.base}
                style={rig.style}
                sparkle={rig.sparkle}
              />
            ))}
            {shape.face.cheeks !== false
              ? eyes.map((e, i) => (
                  <ellipse key={`cheek${i}`} cx={e.x + (i === 0 ? -1 : 1) * eyeR * 0.55} cy={e.y + eyeR * 1.35} rx={eyeR * 0.45} ry={eyeR * 0.25} fill={tones.blush} opacity={0.55} />
                ))
              : null}
            <Mouth shape={mouth} x={shape.face.mouth.x} y={shape.face.mouth.y} scale={shape.face.mouthScale ?? 0.9} phase={frame * 0.5} />
            {rig.tears ? <Tears eyes={eyes.map((e, i) => ({x: e.x, y: e.y, side: i === 0 ? (-1 as const) : (1 as const)}))} frame={frame} /> : null}
          </>
        ) : null}

        <Accessories
          items={accessories}
          head={shape.head}
          face={{eyes: [eyes[0], eyes[1]], eyeR, mouth: shape.face.mouth}}
          neck={shape.neck}
          lift={hatLift * 40}
          sway={Math.sin(frame * 0.07) * 6}
        />

        {shape.arms && crossedArms ? <CrossedArms arms={shape.arms} color={limb} width={armW} /> : null}
        {shape.arms && leftAim ? <Limb from={shape.arms.left} length={leftAim.length} side={-1} {...leftAim.pose} width={armW} color={limb} /> : null}
        {shape.arms && !crossedArms && !rightAim ? <Limb from={shape.arms.right} length={shape.arms.length} side={1} {...rightArm} width={armW} color={limb} holding={holding} /> : null}
        {shape.arms && rightAim ? <Limb from={shape.arms.right} length={rightAim.length} side={1} {...rightAim.pose} width={armW} color={limb} /> : null}
      </svg>
  );
  if (asSvg) {
    return drawing;
  }
  return <div style={{position: 'relative', width, height, ...style}}>{drawing}</div>;
};

/** Arms folded across the chest, like the Heart's. */
const CrossedArms: React.FC<{arms: NonNullable<ShapeDef['arms']>; color: string; width: number}> = ({arms, color, width}) => {
  const {left: l, right: r} = arms;
  const y = Math.max(l.y, r.y) + arms.length * 0.35;
  const cx = (l.x + r.x) / 2;
  const a = `M${l.x + 4},${l.y + 8} C${l.x + 30},${y + 20} ${cx + 40},${y + 10} ${r.x - 30},${y - 14}`;
  const b = `M${r.x - 4},${r.y + 8} C${r.x - 30},${y + 26} ${cx - 40},${y + 18} ${l.x + 34},${y - 6}`;
  return (
    <g>
      {[a, b].map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={width + INK.medium * 2} strokeLinecap="round" />
          <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={r.x - 30} cy={y - 14} r={width * 1.15} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <circle cx={l.x + 34} cy={y - 6} r={width * 1.15} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    </g>
  );
};
