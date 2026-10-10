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

export const HEART_VIEWBOX = {width: 380, height: 430} as const;

export interface HeartCharacterProps extends CharacterBaseProps {
  /** 0..1: arms up, waving frantically. */
  panic?: number;
  /** Beats per minute of the lub-dub pulse (0 = still). */
  bpm?: number;
  leftArm?: LimbPose;
  rightArm?: LimbPose;
  /** Arms crossed over the chest (overrides arm poses). */
  armsCrossed?: boolean;
}

const BODY =
  'M190,372 C120,322 40,264 40,182 C40,122 84,84 134,84 C164,84 182,102 190,120 C198,102 216,84 246,84 C296,84 340,122 340,182 C340,264 260,322 190,372 Z';
const EYES = [
  {x: 148, y: 208, side: -1 as const},
  {x: 234, y: 208, side: 1 as const},
];

/** A beat envelope: a strong "lub" then a softer "dub". */
const beatAt = (frame: number, fps: number, bpm: number): number => {
  if (bpm <= 0) {
    return 0;
  }
  const period = (60 / bpm) * fps;
  const t = frame % period;
  const pulse = (at: number, width: number) => Math.exp(-(((t - at) / width) ** 2));
  return pulse(2, 2.2) + 0.55 * pulse(8, 2.2);
};

/**
 * The Heart: a dramatic ruby heart in a tiny black top hat with a pink
 * flower, aorta and vein stubs on top, and very expressive eyebrows.
 */
export const HeartCharacter: React.FC<HeartCharacterProps> = ({
  size = 300,
  expression = 'irritated',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  panic = 0,
  bpm = 72,
  leftArm = {angle: 25, bend: 15},
  rightArm = {angle: 25, bend: 15},
  armsCrossed = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bodyGrad = useSvgId('heart-grad');
  const bodyClip = useSvgId('heart-body');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'heart'));
  const height = (size * HEART_VIEWBOX.height) / HEART_VIEWBOX.width;
  const beat = beatAt(frame, fps, bpm * (1 + panic * 0.8));
  const pump = 1 + beat * 0.045;
  const eyeR = 33 * rig.eyeScale;

  const wave = (phase: number) => 150 + Math.sin(frame * 0.9 + phase) * 28;
  const left = panic > 0 ? {angle: leftArm.angle + (wave(0) - leftArm.angle) * panic, bend: 25} : leftArm;
  const right = panic > 0 ? {angle: rightArm.angle + (wave(Math.PI) - rightArm.angle) * panic, bend: 25} : rightArm;

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${HEART_VIEWBOX.width} ${HEART_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <radialGradient id={bodyGrad} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor={TONES.heartLight} />
            <stop offset="0.5" stopColor={PALETTE.heartRed} />
            <stop offset="1" stopColor={TONES.heartDark} />
          </radialGradient>
          <clipPath id={bodyClip}>
            <path d={BODY} />
          </clipPath>
        </defs>
        <Limb from={{x: 166, y: 340}} length={72} side={-1} angle={8} bend={-8} width={13} color={TONES.heartDark} end="shoe" endColor={PALETTE.ink} endSize={15} />
        <Limb from={{x: 214, y: 340}} length={72} side={1} angle={8} bend={-8} width={13} color={TONES.heartDark} end="shoe" endColor={PALETTE.ink} endSize={15} />
        {!armsCrossed ? <Limb from={{x: 52, y: 228}} length={98} side={-1} {...left} width={14} color={TONES.heartDark} /> : null}

        <g transform={`translate(190 230) scale(${pump}) translate(-190 -230)`}>
          {/* Aorta and a vein on top of the right lobe. */}
          <path d="M232,104 C226,52 278,34 300,64" fill="none" stroke={PALETTE.ink} strokeWidth={38} strokeLinecap="round" />
          <path d="M232,104 C226,52 278,34 300,64" fill="none" stroke={TONES.heartLight} strokeWidth={26} strokeLinecap="round" />
          <path d="M268,104 C272,78 300,82 316,96" fill="none" stroke={PALETTE.ink} strokeWidth={28} strokeLinecap="round" />
          <path d="M268,104 C272,78 300,82 316,96" fill="none" stroke={TONES.veinBlue} strokeWidth={17} strokeLinecap="round" />
          <path d={BODY} fill={`url(#${bodyGrad})`} />
          <g clipPath={`url(#${bodyClip})`}>
            <path d="M260,120 C330,180 300,300 190,380 L360,400 L380,100 Z" fill={TONES.heartDark} opacity={0.35} />
            <ellipse cx={100} cy={140} rx={40} ry={20} fill={PALETTE.white} opacity={0.4} transform="rotate(-35 100 140)" />
          </g>
          <path d={BODY} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />

          {/* Face */}
          {rig.brow
            ? EYES.map((e) => {
                const inner = e.x - e.side * 6;
                const outer = e.x + e.side * 36;
                const by = e.y - eyeR - 16;
                return (
                  <path
                    key={`brow-${e.side}`}
                    d={`M${inner},${by + rig.brow![0] * 1.2} Q${(inner + outer) / 2},${by + ((rig.brow![0] + rig.brow![1]) / 2) * 1.2 - 10} ${outer},${by + rig.brow![1] * 1.2}`}
                    fill="none"
                    stroke={PALETTE.ink}
                    strokeWidth={13}
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
              lidColor={PALETTE.heartRed}
              style={rig.style}
              sparkle={rig.sparkle}
            />
          ))}
          <ellipse cx={104} cy={256} rx={18} ry={10} fill="#FB7185" opacity={0.6} />
          <ellipse cx={276} cy={256} rx={18} ry={10} fill="#FB7185" opacity={0.6} />
          <Mouth shape={mouth} x={191} y={284} scale={0.95} phase={frame * 0.5} />
          {rig.tears ? <Tears eyes={EYES} frame={frame} /> : null}

          {/* Top hat with a pink flower, perched on the left lobe. */}
          <g transform={`translate(124 92) rotate(${-14 + panic * Math.sin(frame * 0.8) * 6})`}>
            <ellipse cx={0} cy={0} rx={66} ry={13} fill={TONES.hatBlack} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <path d="M-40,-2 L-36,-84 C-36,-90 36,-90 36,-84 L40,-2 Z" fill={TONES.hatBlack} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
            <path d="M-39,-22 L39,-22 L40,-6 L-40,-6 Z" fill={PALETTE.brainPink} stroke={PALETTE.ink} strokeWidth={INK.fine} />
            <path d="M-26,-80 L-24,-30" stroke="#4B5563" strokeWidth={6} strokeLinecap="round" />
            <g transform="translate(30 -18)">
              {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                return <circle key={i} cx={Math.cos(a) * 11} cy={Math.sin(a) * 11} r={9} fill={TONES.flowerPink} stroke={PALETTE.ink} strokeWidth={2.5} />;
              })}
              <circle r={7} fill={TONES.flowerCenter} stroke={PALETTE.ink} strokeWidth={2.5} />
            </g>
          </g>
        </g>

        {armsCrossed ? (
          <g>
            <path d="M60,250 C110,300 250,300 300,262" fill="none" stroke={PALETTE.ink} strokeWidth={22} strokeLinecap="round" />
            <path d="M60,250 C110,300 250,300 300,262" fill="none" stroke={TONES.heartDark} strokeWidth={14} strokeLinecap="round" />
            <path d="M320,250 C270,310 130,306 84,268" fill="none" stroke={PALETTE.ink} strokeWidth={22} strokeLinecap="round" />
            <path d="M320,250 C270,310 130,306 84,268" fill="none" stroke={TONES.heartDark} strokeWidth={14} strokeLinecap="round" />
            <circle cx={300} cy={262} r={15} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <circle cx={84} cy={268} r={15} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
          </g>
        ) : (
          <Limb from={{x: 328, y: 228}} length={98} side={1} {...right} width={14} color={TONES.heartDark} />
        )}
      </svg>
    </div>
  );
};
