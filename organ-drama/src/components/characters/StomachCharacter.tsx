import React from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, LimbPose, MouthShape, Point} from '../../types/characters';
import {clamp, springBlink} from '../../utils/animation';
import {smoothClosedPath} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Eye} from './parts/Eye';
import {FACE_RIGS} from './parts/expressions';
import {Limb} from './parts/Limb';
import {Mouth} from './parts/Mouth';
import {Tears} from './parts/Tears';
import {PizzaSliceArt} from './PizzaSlice';

export const STOMACH_VIEWBOX = {width: 560, height: 620} as const;

/** Key points in the puppet's own units, for scenes that attach things to it. */
export const STOMACH_ANCHORS = {
  /** Centre of the valve ring (the lower esophageal sphincter). */
  valve: {x: 214, y: 108},
  /** Top of the esophagus stub: where a scene's long esophagus tube connects. */
  stubTop: {x: 190, y: 12},
  window: {x: 285, y: 410, r: 88},
  centre: {x: 285, y: 330},
} as const;

export interface StomachCharacterProps extends CharacterBaseProps {
  /** 0..1 overfull: the body swells and strains. */
  bloat?: number;
  /** Pizza slices in the belly. A fraction means the next one is falling in (2.4 = two settled, one 40% down). */
  slices?: number;
  /** Acid height in the belly window, 0..1. */
  acidLevel?: number;
  /** 0..1 sloshing waves on the acid. */
  slosh?: number;
  /** The rotation (deg, clockwise) the scene applies to the puppet. The belly contents counter-rotate so the acid stays level. */
  tilt?: number;
  /** 0 = valve shut tight, 1 = wide open. */
  valveOpen?: number;
  /** Padlock: pops in (0..1), snaps shut (0..1), or bursts open and dangles (0..1). */
  lockShow?: number;
  lockClosed?: number;
  lockBroken?: number;
  /** Knocking shake on the valve, 0..1. */
  valveShake?: number;
  /** Highlight pulse on the valve (for callouts), 0..1. */
  valveGlow?: number;
  leftArm?: LimbPose;
  rightArm?: LimbPose;
  /** SVG drawn in the screen-right hand. */
  holding?: React.ReactNode;
  /** Tear fountains, 0..1 (on by default for `crying`). */
  tears?: number;
  /** Nightcap jump when startled, 0..1. */
  capLift?: number;
  /** Bring the newest settled slice to life (it waves and talks). */
  sliceFace?: {mouth: MouthShape; wave: number};
  /** Arms folded across the chest (overrides arm poses). */
  armsCrossed?: boolean;
  /** Draw the esophagus stub on top (hide it when no esophagus connects). */
  stub?: boolean;
}

const BODY = smoothClosedPath([
  {x: 196, y: 126},
  {x: 250, y: 96},
  {x: 330, y: 92},
  {x: 398, y: 116},
  {x: 432, y: 170},
  {x: 424, y: 236},
  {x: 446, y: 300},
  {x: 482, y: 352},
  {x: 474, y: 424},
  {x: 424, y: 492},
  {x: 340, y: 530},
  {x: 250, y: 532},
  {x: 160, y: 500},
  {x: 100, y: 430},
  {x: 82, y: 340},
  {x: 96, y: 250},
  {x: 138, y: 172},
]);

const EYES = [
  {x: 294, y: 212, side: -1 as const},
  {x: 374, y: 206, side: 1 as const},
];
const MOUTH = {x: 336, y: 300};
const WIN = STOMACH_ANCHORS.window;
const VALVE = STOMACH_ANCHORS.valve;
const RING_ANGLE = -29;

const SLICE_SPOTS = [
  {dx: -36, rot: -22},
  {dx: 30, rot: 24},
  {dx: -4, rot: -6},
  {dx: 40, rot: 38},
  {dx: -44, rot: 14},
];

const Mustache: React.FC<{wiggle: number}> = ({wiggle}) => {
  const lobe = 'M0,-2 C16,-16 46,-12 58,-4 C70,4 80,-6 74,-16 C88,-4 78,20 58,16 C38,12 18,16 0,10 Z';
  return (
    <g transform="translate(336 274)">
      {[-1, 1].map((s) => (
        <path
          key={s}
          d={lobe}
          transform={`scale(${s} 1) rotate(${wiggle * s * -1})`}
          fill={TONES.mustache}
          stroke={PALETTE.ink}
          strokeWidth={INK.medium}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
};

const Nightcap: React.FC<{frame: number; lift: number; clipId: string}> = ({frame, lift, clipId}) => {
  const sway = Math.sin(frame * 0.07) * 8;
  const tip = {x: 150 + sway, y: -36 - lift * 70 + Math.cos(frame * 0.07) * 4};
  const cone = `M-70,-10 C-62,-118 66,-146 ${tip.x},${tip.y} C96,-84 72,-46 70,-10 Z`;
  return (
    <g transform={`translate(372 ${118 - lift * 40}) rotate(${18 - lift * 10})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={cone} />
        </clipPath>
      </defs>
      <path d={cone} fill={TONES.capBlue} />
      <g clipPath={`url(#${clipId})`}>
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={-120 + i * 38} y1={40} x2={-20 + i * 38} y2={-160} stroke={TONES.capWhite} strokeWidth={15} />
        ))}
      </g>
      <path d={cone} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      <rect x={-80} y={-20} width={160} height={34} rx={17} fill={TONES.capWhite} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <g transform={`translate(${tip.x} ${tip.y})`}>
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 15} cy={Math.sin(a) * 15} r={11} fill={TONES.capWhite} stroke={PALETTE.ink} strokeWidth={INK.medium} />;
        })}
        <circle r={17} fill={TONES.capWhite} />
      </g>
    </g>
  );
};

/** Padlock hanging off the valve ring, in ring-local units (ring centre at 0,0). */
const Padlock: React.FC<{show: number; closed: number; broken: number; frame: number}> = ({show, closed, broken, frame}) => {
  if (show <= 0.01) {
    return null;
  }
  const swing = broken * (Math.sin(frame * 0.35) * 22 + 26);
  const shackleUp = (1 - closed) * 16 + broken * 22;
  const shackleOpen = broken * 35;
  return (
    <g transform={`translate(0 14) rotate(${swing}) scale(${show})`}>
      <g transform={`translate(0 ${-shackleUp})`}>
        <path
          d="M-12,22 L-12,4 C-12,-14 12,-14 12,4 L12,22"
          transform={`rotate(${-shackleOpen} 12 22)`}
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth={11}
          strokeLinecap="round"
        />
        <path
          d="M-12,22 L-12,4 C-12,-14 12,-14 12,4 L12,22"
          transform={`rotate(${-shackleOpen} 12 22)`}
          fill="none"
          stroke="#CBD5E1"
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>
      <rect x={-22} y={20} width={44} height={36} rx={7} fill="#64748B" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <rect x={-16} y={24} width={10} height={26} rx={4} fill="#94A3B8" opacity={0.8} />
      <circle cx={0} cy={34} r={5} fill={PALETTE.ink} />
      <path d="M-2,36 L2,36 L3,46 L-3,46 Z" fill={PALETTE.ink} />
    </g>
  );
};

/**
 * The Stomach: a mustard bean in a striped nightcap with a handlebar
 * mustache. A porthole in its belly shows the acid and every slice it has
 * been fed; the valve on top (the lower esophageal sphincter) can be
 * padlocked, knocked on, forced open and broken.
 */
export const StomachCharacter: React.FC<StomachCharacterProps> = ({
  size = 420,
  expression = 'neutral',
  mouth = 'idle',
  look = {x: 0, y: 0},
  blink,
  style,
  bloat = 0,
  slices = 0,
  acidLevel = 0.34,
  slosh = 0,
  tilt = 0,
  valveOpen = 0,
  lockShow = 0,
  lockClosed = 0,
  lockBroken = 0,
  valveShake = 0,
  valveGlow = 0,
  leftArm = {angle: 22, bend: 12},
  rightArm = {angle: 22, bend: 12},
  holding,
  tears,
  capLift = 0,
  sliceFace,
  armsCrossed = false,
  stub: showStub = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bodyGrad = useSvgId('stomach-grad');
  const bodyClip = useSvgId('stomach-body');
  const winClip = useSvgId('stomach-window');
  const acidGrad = useSvgId('stomach-acid');
  const capClip = useSvgId('stomach-cap');
  const rig = FACE_RIGS[expression];
  const lid = Math.max(rig.lid, blink ?? springBlink(frame, fps, 'stomach'));
  const height = (size * STOMACH_VIEWBOX.height) / STOMACH_VIEWBOX.width;
  const tearAmount = tears ?? (rig.tears ? 1 : 0);
  const eyeR = 36 * rig.eyeScale;

  const sx = 1 + 0.14 * bloat;
  const sy = 1 + 0.07 * bloat;
  const strain = bloat * Math.sin(frame * 1.3) * 1.5;
  const shake = valveShake * Math.sin(frame * 3.1) * 5;

  // ── Belly window contents (kept level with the world) ──
  const surface = WIN.y + WIN.r - clamp(acidLevel) * 2 * WIN.r;
  const waveAmp = 3 + slosh * 16;
  const surfaceTilt = slosh * 16 * Math.sin(frame * 0.22);
  const waveD = (() => {
    const pts: string[] = [];
    for (let x = WIN.x - WIN.r - 80; x <= WIN.x + WIN.r + 80; x += 12) {
      const y = surface + Math.sin(x * 0.05 + frame * 0.25) * waveAmp * 0.5 + Math.sin(x * 0.11 - frame * 0.17) * waveAmp * 0.3;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M${pts.join(' L')} L${WIN.x + WIN.r + 80},${WIN.y + WIN.r + 120} L${WIN.x - WIN.r - 80},${WIN.y + WIN.r + 120} Z`;
  })();
  const settled = Math.floor(slices + 1e-6);
  const falling = slices - settled;

  const sliceAt = (k: number, progress: number): React.ReactNode => {
    const spot = SLICE_SPOTS[k % SLICE_SPOTS.length];
    const restY = surface - 26 - k * 14;
    const startY = WIN.y - WIN.r - 110;
    const y = progress >= 1 ? restY + Math.sin(frame * 0.12 + k) * 3 : interpolate(progress, [0, 1], [startY, restY], {easing: Easing.in(Easing.quad)});
    const x = WIN.x + spot.dx;
    const rot = spot.rot + (progress >= 1 ? Math.sin(frame * 0.1 + k * 2) * 6 : (1 - progress) * 90);
    const alive = sliceFace && progress >= 1 && k === settled - 1;
    return (
      <g key={k} transform={`translate(${x} ${y}) rotate(${alive ? rot * 0.3 : rot}) scale(0.34) translate(-120 -150)`}>
        <PizzaSliceArt mouth={alive ? sliceFace.mouth : 'grin'} arms={Boolean(alive)} wave={alive ? sliceFace.wave : 0} frame={frame} />
      </g>
    );
  };

  const bubbles = Array.from({length: 9}, (_, i) => {
    const speed = 0.8 + random(`stomach-bubble-s-${i}`) * 1.2;
    const span = WIN.y + WIN.r - surface + 10;
    const t = ((frame * speed + random(`stomach-bubble-o-${i}`) * 200) % Math.max(10, span)) / Math.max(10, span);
    const x = WIN.x - 60 + random(`stomach-bubble-x-${i}`) * 120 + Math.sin(frame * 0.2 + i) * 4;
    const y = WIN.y + WIN.r + 4 - t * span;
    const r = 3 + random(`stomach-bubble-r-${i}`) * 6;
    return <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={TONES.acidGlow} strokeWidth={2.5} opacity={0.85 * (1 - t * 0.4)} />;
  });

  const bellyWindow = (
    <g>
      <defs>
        <clipPath id={winClip}>
          <circle cx={WIN.x} cy={WIN.y} r={WIN.r} />
        </clipPath>
        <linearGradient id={acidGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TONES.acidLight} />
          <stop offset="0.35" stopColor={PALETTE.acidGreen} />
          <stop offset="1" stopColor={TONES.acidDark} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${winClip})`}>
        <circle cx={WIN.x} cy={WIN.y} r={WIN.r} fill="#FBCFE8" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${WIN.x - 100},${WIN.y - 60 + i * 34} q25,-14 50,0 t50,0 t50,0 t50,0`}
            fill="none"
            stroke="#F472B6"
            strokeWidth={4}
            opacity={0.6}
          />
        ))}
        <g transform={`rotate(${-tilt} ${WIN.x} ${WIN.y})`}>
          {Array.from({length: settled}, (_, k) => sliceAt(k, 1))}
          {falling > 0.001 ? sliceAt(settled, falling) : null}
          <g transform={`rotate(${surfaceTilt} ${WIN.x} ${surface})`}>
            <path d={waveD} fill={`url(#${acidGrad})`} opacity={0.88} />
            <path d={waveD} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
            {bubbles}
          </g>
        </g>
        <circle cx={WIN.x} cy={WIN.y} r={WIN.r} fill={PALETTE.white} opacity={0.1} />
        <path d={`M${WIN.x - 62},${WIN.y - 30} A70,70 0 0 1 ${WIN.x - 20},${WIN.y - 66}`} fill="none" stroke={PALETTE.white} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
        <path d={`M${WIN.x - 68},${WIN.y - 8} A72,72 0 0 1 ${WIN.x - 66},${WIN.y - 18}`} fill="none" stroke={PALETTE.white} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
      </g>
      <circle cx={WIN.x} cy={WIN.y} r={WIN.r + 6} fill="none" stroke={PALETTE.stomachShade} strokeWidth={13} />
      <circle cx={WIN.x} cy={WIN.y} r={WIN.r + 13} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <circle cx={WIN.x} cy={WIN.y} r={WIN.r} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return <circle key={i} cx={WIN.x + Math.cos(a) * (WIN.r + 6)} cy={WIN.y + Math.sin(a) * (WIN.r + 6)} r={3.5} fill={TONES.stomachLight} stroke={PALETTE.ink} strokeWidth={1.5} />;
      })}
    </g>
  );

  // ── Valve ring + esophagus stub ──
  const open = clamp(valveOpen);
  const glow = clamp(valveGlow) * (0.6 + 0.4 * Math.sin(frame * 0.3));
  const stubD = `M${VALVE.x},${VALVE.y} Q192,66 ${STOMACH_ANCHORS.stubTop.x},${STOMACH_ANCHORS.stubTop.y}`;
  const stub = (
    <g>
      <path d={stubD} fill="none" stroke={PALETTE.ink} strokeWidth={70} strokeLinecap="butt" />
      <path d={stubD} fill="none" stroke={TONES.gutHighlight} strokeWidth={58} strokeLinecap="butt" />
      <path d="M176,90 Q170,54 172,16" fill="none" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
    </g>
  );
  const valve = (
    <g>
      <g transform={`translate(${VALVE.x + shake} ${VALVE.y}) rotate(${RING_ANGLE})`}>
        {glow > 0.01 ? <ellipse rx={64} ry={32} fill={TONES.valveGoldLight} opacity={glow * 0.7} /> : null}
        <ellipse rx={44} ry={17} fill={TONES.valveGold} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <ellipse rx={36} ry={11} fill="none" stroke={TONES.valveGoldLight} strokeWidth={4} opacity={0.9} />
        <ellipse rx={4 + open * 26} ry={2 + open * 8} fill={TONES.mouthDark} stroke={PALETTE.ink} strokeWidth={INK.fine} />
        {open < 0.3
          ? [-1, 1].map((s) => <path key={s} d={`M${s * 6},0 Q${s * 14},${-3} ${s * 22},0`} fill="none" stroke={PALETTE.ink} strokeWidth={2.5} strokeLinecap="round" />)
          : null}
        <Padlock show={lockShow} closed={lockClosed} broken={lockBroken} frame={frame} />
      </g>
    </g>
  );

  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${STOMACH_VIEWBOX.width} ${STOMACH_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <radialGradient id={bodyGrad} cx="42%" cy="34%" r="70%">
            <stop offset="0" stopColor={TONES.stomachLight} />
            <stop offset="0.55" stopColor={PALETTE.stomachOchre} />
            <stop offset="1" stopColor={PALETTE.stomachShade} />
          </radialGradient>
          <clipPath id={bodyClip}>
            <path d={BODY} />
          </clipPath>
        </defs>

        <Limb from={{x: 236, y: 520}} length={74} side={-1} angle={6} bend={-6} width={20} color={PALETTE.stomachShade} end="shoe" endColor="#7C3AED" endSize={18} />
        <Limb from={{x: 340, y: 522}} length={74} side={1} angle={6} bend={-6} width={20} color={PALETTE.stomachShade} end="shoe" endColor="#7C3AED" endSize={18} />
        {!armsCrossed ? <Limb from={{x: 108, y: 360}} length={112} side={-1} {...leftArm} width={20} color={PALETTE.stomachShade} /> : null}

        <g transform={`translate(${STOMACH_ANCHORS.centre.x} ${STOMACH_ANCHORS.centre.y}) scale(${sx + strain * 0.004} ${sy}) translate(${-STOMACH_ANCHORS.centre.x} ${-STOMACH_ANCHORS.centre.y})`}>
          {showStub ? stub : null}
          <path d={BODY} fill={`url(#${bodyGrad})`} />
          <g clipPath={`url(#${bodyClip})`}>
            <path d="M110,430 C160,520 330,560 450,470 L520,620 L60,620 Z" fill={PALETTE.stomachShade} opacity={0.35} />
            <ellipse cx={210} cy={170} rx={70} ry={26} fill={PALETTE.white} opacity={0.35} transform="rotate(-24 210 170)" />
            {bloat > 0.2
              ? [0, 1, 2].map((i) => (
                  <path key={i} d={`M${120 + i * 14},${300 + i * 22} q-10,10 0,20`} fill="none" stroke={PALETTE.stomachShade} strokeWidth={4} strokeLinecap="round" opacity={bloat} />
                ))
              : null}
          </g>
          <path d={BODY} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
          {bellyWindow}
          {valve}

          {/* Face */}
          <ellipse cx={262} cy={262} rx={20} ry={11} fill="#F97316" opacity={0.35} />
          <ellipse cx={412} cy={252} rx={18} ry={10} fill="#F97316" opacity={0.35} />
          {rig.brow
            ? EYES.map((e) => {
                const inner = e.x - e.side * 12;
                const outer = e.x + e.side * 28;
                const by = e.y - eyeR - 14;
                return (
                  <path
                    key={`brow-${e.side}`}
                    d={`M${inner},${by + rig.brow![0]} Q${(inner + outer) / 2},${by + (rig.brow![0] + rig.brow![1]) / 2 - 6} ${outer},${by + rig.brow![1]}`}
                    fill="none"
                    stroke={TONES.mustache}
                    strokeWidth={10}
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
              lidColor={PALETTE.stomachOchre}
              style={rig.style}
              sparkle={rig.sparkle}
            />
          ))}
          <Mouth shape={mouth} x={MOUTH.x} y={MOUTH.y + 4} scale={0.9} phase={frame * 0.5} />
          <Mustache wiggle={mouth === 'idle' || mouth === 'frown' ? 0 : 8 + Math.sin(frame * 0.9) * 4} />
          <ellipse cx={336} cy={256} rx={17} ry={13} fill={PALETTE.stomachShade} stroke={PALETTE.ink} strokeWidth={INK.medium} />
          <ellipse cx={331} cy={251} rx={5} ry={3.5} fill={PALETTE.white} opacity={0.6} />
          {tearAmount > 0 ? <Tears eyes={EYES} frame={frame} amount={tearAmount} /> : null}
          <Nightcap frame={frame} lift={capLift} clipId={capClip} />
        </g>

        {armsCrossed ? (
          <g>
            {[
              'M104,350 C170,410 330,400 420,330',
              'M456,322 C380,420 200,420 140,360',
            ].map((d) => (
              <g key={d}>
                <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={28} strokeLinecap="round" />
                <path d={d} fill="none" stroke={PALETTE.stomachShade} strokeWidth={20} strokeLinecap="round" />
              </g>
            ))}
            <circle cx={420} cy={330} r={22} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <circle cx={140} cy={360} r={22} fill={TONES.glove} stroke={PALETTE.ink} strokeWidth={INK.medium} />
          </g>
        ) : (
          <Limb from={{x: 452, y: 318}} length={112} side={1} {...rightArm} width={20} color={PALETTE.stomachShade} holding={holding} />
        )}
      </svg>
    </div>
  );
};

/** Where a point of the puppet lands in a scene, given where the puppet is placed (`Place` centre anchor). */
export const stomachPointToWorld = (placed: {x: number; y: number; size: number; rotation?: number}, p: Point): Point => {
  const s = placed.size / STOMACH_VIEWBOX.width;
  const lx = (p.x - STOMACH_VIEWBOX.width / 2) * s;
  const ly = (p.y - STOMACH_VIEWBOX.height / 2) * s;
  const a = ((placed.rotation ?? 0) * Math.PI) / 180;
  return {x: placed.x + lx * Math.cos(a) - ly * Math.sin(a), y: placed.y + lx * Math.sin(a) + ly * Math.cos(a)};
};
