import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, LimbPose} from '../../types/characters';
import {springBlink} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';
import {Eye} from './parts/Eye';
import {FACE_RIGS} from './parts/expressions';
import {Limb} from './parts/Limb';
import {Mouth} from './parts/Mouth';

export const LETTER_VIEWBOX = {width: 300, height: 340} as const;

export interface LetterCharacterProps extends CharacterBaseProps {
  /** Running cycle intensity, 0..1 (legs scissor, body bobs). */
  run?: number;
  leftArm?: LimbPose;
  rightArm?: LimbPose;
  /** SVG drawn in the screen-right hand. */
  holding?: React.ReactNode;
}

const EYES = [
  {x: 98, y: 92, side: -1 as const},
  {x: 202, y: 92, side: 1 as const},
];

/** A heart-shaped wax seal centred on (x, y). */
const sealPath = (x: number, y: number, s: number): string =>
  `M${x},${y + s * 0.9} C${x - s * 1.4},${y} ${x - s * 0.9},${y - s * 1.1} ${x},${y - s * 0.45} C${x + s * 0.9},${y - s * 1.1} ${x + s * 1.4},${y} ${x},${y + s * 0.9} Z`;

/**
 * The Letter: the stomach's "I'M FULL" message, an envelope with a red
 * heart seal, stick legs in blue sneakers and big worried eyes.
 */
export const LetterCharacter: React.FC<LetterCharacterProps> = ({
  size = 260,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  run = 0,
  leftArm = {angle: 35, bend: 15},
  rightArm = {angle: 35, bend: 15},
  holding,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const paperGrad = useSvgId('letter-paper');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'letter'));
  const height = (size * LETTER_VIEWBOX.height) / LETTER_VIEWBOX.width;
  const stride = Math.sin(frame * 0.75) * 38 * run;
  const bob = Math.abs(Math.sin(frame * 0.75)) * -8 * run;
  const eyeR = 27 * rig.eyeScale;

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${LETTER_VIEWBOX.width} ${LETTER_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <linearGradient id={paperGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TONES.envelope} />
            <stop offset="1" stopColor={TONES.envelopeShade} />
          </linearGradient>
        </defs>
        <Limb from={{x: 120, y: 212}} length={84} side={-1} angle={6 + stride} bend={-10} width={9} color={TONES.legRed} end="shoe" endColor={TONES.sneakerBlue} endSize={17} />
        <Limb from={{x: 180, y: 212}} length={84} side={1} angle={6 - stride} bend={-10} width={9} color={TONES.legRed} end="shoe" endColor={TONES.sneakerBlue} endSize={17} />
        <g transform={`translate(0 ${bob})`}>
          <Limb from={{x: 34, y: 140}} length={60} side={-1} {...leftArm} width={8} color={TONES.legRed} endSize={13} />
          <rect x={30} y={44} width={240} height={172} rx={14} fill={`url(#${paperGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} />
          <path d="M36,52 L150,140 L264,52" fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          <path d="M36,208 L118,150 M264,208 L182,150" stroke="#CBD5E1" strokeWidth={INK.fine} strokeLinecap="round" />
          <path d={sealPath(150, 134, 26)} fill={TONES.waxRed} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          <path d={sealPath(150, 134, 15)} fill="none" stroke={TONES.waxDark} strokeWidth={2.5} />
          <ellipse cx={141} cy={124} rx={5} ry={3} fill={PALETTE.white} opacity={0.6} />
          <text
            x={150}
            y={203}
            textAnchor="middle"
            fontFamily={FONTS.display}
            fontSize={36}
            letterSpacing={2}
            fill={TONES.waxRed}
            stroke={PALETTE.white}
            strokeWidth={5}
            paintOrder="stroke fill"
          >
            I&apos;M FULL
          </text>
          {rig.brow
            ? EYES.map((e) => {
                const inner = e.x - e.side * 10;
                const outer = e.x + e.side * 22;
                const by = e.y - eyeR - 10;
                return (
                  <path
                    key={`brow-${e.side}`}
                    d={`M${inner},${by + rig.brow![0] * 0.7} L${outer},${by + rig.brow![1] * 0.7}`}
                    stroke={PALETTE.ink}
                    strokeWidth={6}
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
              lidColor={TONES.envelope}
              style={rig.style}
              sparkle={rig.sparkle}
            />
          ))}
          <ellipse cx={70} cy={130} rx={14} ry={8} fill={TONES.blush} opacity={0.35} />
          <ellipse cx={230} cy={130} rx={14} ry={8} fill={TONES.blush} opacity={0.35} />
          <Mouth shape={mouth} x={150} y={168} scale={0.55} />
          <Limb from={{x: 266, y: 140}} length={60} side={1} {...rightArm} width={8} color={TONES.legRed} endSize={13} holding={holding} />
        </g>
      </svg>
    </div>
  );
};
