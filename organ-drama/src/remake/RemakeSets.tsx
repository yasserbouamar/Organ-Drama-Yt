import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {useSvgId} from '../utils/useSvgId';
import {R} from './remakeTheme';

const W = 1920;
const H = 1080;
const line = {stroke: R.ink, strokeWidth: 5, strokeLinejoin: 'round' as const};

const Star: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <path d={`M${x},${y - r} L${x + r * 0.32},${y - r * 0.3} L${x + r},${y} L${x + r * 0.32},${y + r * 0.3} L${x},${y + r} L${x - r * 0.32},${y + r * 0.3} L${x - r},${y} L${x - r * 0.32},${y - r * 0.3} Z`} fill={R.star} />
);

/** A crescent moon built from two circles. */
const Moon: React.FC<{x: number; y: number; r: number; maskId: string}> = ({x, y, r, maskId}) => (
  <>
    <defs>
      <mask id={maskId}>
        <circle cx={x} cy={y} r={r} fill="#FFFFFF" />
        <circle cx={x + r * 0.45} cy={y - r * 0.3} r={r * 0.85} fill="#000000" />
      </mask>
    </defs>
    <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={R.moon} mask={`url(#${maskId})`} />
  </>
);

/** Night-sky picture in a wooden frame. */
const NightPicture: React.FC<{x: number; y: number; w: number; h: number; maskId: string}> = ({x, y, w, h, maskId}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={R.frame} {...line} />
    <rect x={x + 24} y={y + 24} width={w - 48} height={h - 48} fill={R.nightSky} stroke={R.ink} strokeWidth={3} />
    <Moon x={x + w * 0.38} y={y + h * 0.42} r={Math.min(w, h) * 0.22} maskId={maskId} />
    <Star x={x + w * 0.72} y={y + h * 0.3} r={11} />
    <Star x={x + w * 0.62} y={y + h * 0.72} r={9} />
    <Star x={x + w * 0.25} y={y + h * 0.75} r={7} />
  </g>
);

/** Polka-dot quilt between a top edge and the bottom of the frame. */
const Blanket: React.FC<{x0: number; x1: number; top: number; bottom: number; clipId: string}> = ({x0, x1, top, bottom, clipId}) => {
  const d = `M${x0},${top + 8} Q${(x0 + x1) / 2},${top - 22} ${x1},${top + 8} L${x1 + 26},${bottom} L${x0 - 26},${bottom} Z`;
  const dots: React.ReactNode[] = [];
  for (let row = 0; row * 64 < bottom - top + 40; row++) {
    for (let col = 0; col * 76 < x1 - x0 + 120; col++) {
      dots.push(<circle key={`${row}-${col}`} cx={x0 - 40 + col * 76 + (row % 2) * 38} cy={top + 34 + row * 64} r={13} fill={R.blanketDot} />);
    }
  }
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={R.blanket} />
      <g clipPath={`url(#${clipId})`}>
        <path d={`M${x0 - 40},${top + 18} Q${(x0 + x1) / 2},${top - 14} ${x1 + 40},${top + 18} L${x1 + 40},${top + 40} Q${(x0 + x1) / 2},${top + 8} ${x0 - 40},${top + 40} Z`} fill={R.blanketLight} />
        {dots}
      </g>
      <path d={d} fill="none" {...line} />
    </g>
  );
};

/** Analog alarm clock with twin bells, showing midnight. */
const AlarmClock: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g>
    {[-1, 1].map((s) => (
      <g key={s}>
        <path d={`M${x + s * r * 0.55},${y - r * 0.8} A${r * 0.42},${r * 0.42} 0 0 ${s > 0 ? 1 : 0} ${x + s * r * 1.05},${y - r * 0.32} Z`} fill={R.clockRim} {...line} />
      </g>
    ))}
    <circle cx={x} cy={y} r={r} fill={R.clockRim} {...line} />
    <circle cx={x} cy={y} r={r * 0.8} fill={R.clockFace} stroke={R.ink} strokeWidth={3} />
    {Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={x + Math.sin(a) * r * 0.66} y1={y - Math.cos(a) * r * 0.66} x2={x + Math.sin(a) * r * 0.74} y2={y - Math.cos(a) * r * 0.74} stroke={R.ink} strokeWidth={i % 3 === 0 ? 4 : 2} />;
    })}
    <line x1={x} y1={y} x2={x} y2={y - r * 0.6} stroke={R.ink} strokeWidth={5} strokeLinecap="round" />
    <line x1={x} y1={y} x2={x + 2} y2={y - r * 0.42} stroke={R.ink} strokeWidth={7} strokeLinecap="round" />
    <circle cx={x} cy={y} r={6} fill={R.ink} />
  </g>
);

/** Pizza box with a glowing pie, as on the nightstand (`open` = lid standing up behind). */
const PizzaBox: React.FC<{x: number; y: number; w: number; glow: number; open?: boolean; missingSlice?: boolean; glowId: string}> = ({x, y, w, glow, open = false, missingSlice = false, glowId}) => {
  const h = w * 0.34;
  return (
    <g>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#FFE9A8" stopOpacity={0.9} />
          <stop offset="0.5" stopColor="#F8C860" stopOpacity={0.35} />
          <stop offset="1" stopColor="#F8C860" stopOpacity={0} />
        </radialGradient>
      </defs>
      {glow > 0 ? <ellipse cx={x + w / 2} cy={y + h * 0.3} rx={w * 0.95} ry={w * 0.6} fill={`url(#${glowId})`} opacity={glow} /> : null}
      {open ? <rect x={x + w * 0.04} y={y - w * 0.62} width={w * 0.92} height={w * 0.66} rx={8} fill={R.box} {...line} /> : null}
      <path d={`M${x + w * 0.06},${y} L${x + w * 0.94},${y} L${x + w},${y + h * 0.45} L${x},${y + h * 0.45} Z`} fill={R.boxShade} {...line} />
      <ellipse cx={x + w / 2} cy={y + h * 0.2} rx={w * 0.36} ry={h * 0.26} fill={R.crust} stroke={R.ink} strokeWidth={3} />
      <ellipse cx={x + w / 2} cy={y + h * 0.2} rx={w * 0.31} ry={h * 0.2} fill={R.pizza} />
      {missingSlice ? <path d={`M${x + w / 2},${y + h * 0.2} L${x + w * 0.83},${y + h * 0.14} L${x + w * 0.8},${y + h * 0.36} Z`} fill={R.boxShade} /> : null}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={x + w / 2 - Math.cos((i * Math.PI) / 4) * w * 0.3} y1={y + h * 0.2 - Math.sin((i * Math.PI) / 4) * h * 0.18} x2={x + w / 2 + Math.cos((i * Math.PI) / 4) * w * 0.3} y2={y + h * 0.2 + Math.sin((i * Math.PI) / 4) * h * 0.18} stroke={R.pizzaLight} strokeWidth={3} />
      ))}
      <rect x={x} y={y + h * 0.45} width={w} height={h * 0.55} rx={6} fill={R.box} {...line} />
      <rect x={x + w * 0.42} y={y + h * 0.62} width={w * 0.16} height={h * 0.12} rx={3} fill={R.boxShade} />
    </g>
  );
};

export interface RemakeBedroomProps {
  /** `wide`: the opening shot. `bed`: closer on the bed, the box brought along. */
  layout: 'wide' | 'bed';
  /** Drawn between the headboard/pillow and the blanket (the Brain in bed). */
  sleeper?: React.ReactNode;
  /** Drawn in front of the bed but behind the nightstand (the Brain walking in). */
  walker?: React.ReactNode;
}

/** The bedroom at midnight, in the reference's indigo-and-mauve palette. */
export const RemakeBedroom: React.FC<RemakeBedroomProps> = ({layout, sleeper, walker}) => {
  const frame = useCurrentFrame();
  const wallGrad = useSvgId('rb-wall');
  const lampGlow = useSvgId('rb-glow');
  const vignette = useSvgId('rb-vig');
  const moon1 = useSvgId('rb-moon1');
  const moon2 = useSvgId('rb-moon2');
  const blanketClip = useSvgId('rb-blanket');
  const boxGlow = useSvgId('rb-boxglow');
  const glow = 0.75 + Math.sin(frame * 0.12) * 0.12;
  const wide = layout === 'wide';

  const windowBox = wide ? {x: -40, y: -20, w: 300, h: 540} : {x: -30, y: -20, w: 330, h: 690};
  const curtain = wide ? {x: 230, w: 140, h: 640} : {x: 262, w: 120, h: 800};
  const headboard = wide ? {x: 214, y: 46, w: 1046, h: 700} : {x: 372, y: 158, w: 1180, h: 760};
  const pillow = wide ? {cx: 742, cy: 412, rx: 434, ry: 106} : {cx: 968, cy: 585, rx: 495, ry: 135};
  const picture = wide ? {x: 1114, y: -30, w: 304, h: 318} : {x: 1384, y: 22, w: 350, h: 394};

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={wallGrad} x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stopColor={R.wallDeep} />
            <stop offset="0.55" stopColor={R.wall} />
            <stop offset="1" stopColor={R.wallWarm} />
          </linearGradient>
          <radialGradient id={lampGlow}>
            <stop offset="0" stopColor={R.wallGlow} stopOpacity={0.7} />
            <stop offset="1" stopColor={R.wallGlow} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={vignette} cx="50%" cy="50%" r="72%">
            <stop offset="0.6" stopColor="#120C30" stopOpacity={0} />
            <stop offset="1" stopColor="#120C30" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${wallGrad})`} />
        <ellipse cx={wide ? 1700 : 1650} cy={wide ? 470 : 520} rx={760} ry={620} fill={`url(#${lampGlow})`} />

        {/* Window with the moon, and its curtain. */}
        <rect x={windowBox.x} y={windowBox.y} width={windowBox.w} height={windowBox.h} fill={R.windowSky} {...line} />
        <Moon x={windowBox.x + windowBox.w * 0.42} y={windowBox.y + windowBox.h * 0.22} r={wide ? 54 : 76} maskId={moon1} />
        {[0.3, 0.75, 0.55, 0.85].map((fx, i) => (
          <Star key={i} x={windowBox.x + windowBox.w * fx} y={windowBox.y + windowBox.h * (0.12 + i * 0.17)} r={8 + (i % 2) * 4} />
        ))}
        <line x1={windowBox.x} y1={windowBox.y + windowBox.h * 0.48} x2={windowBox.x + windowBox.w} y2={windowBox.y + windowBox.h * 0.48} stroke="#3F3B9C" strokeWidth={14} />
        <rect x={windowBox.x} y={windowBox.y} width={windowBox.w} height={windowBox.h} fill="none" stroke="#3F3B9C" strokeWidth={14} />
        <path d={`M${curtain.x},-10 L${curtain.x + curtain.w},-10 Q${curtain.x + curtain.w * 0.7},${curtain.h * 0.5} ${curtain.x + curtain.w * 0.9},${curtain.h} L${curtain.x},${curtain.h} Z`} fill={R.curtain} {...line} />
        <path d={`M${curtain.x + curtain.w * 0.4},0 Q${curtain.x + curtain.w * 0.3},${curtain.h * 0.5} ${curtain.x + curtain.w * 0.45},${curtain.h - 10}`} fill="none" stroke={R.curtainShade} strokeWidth={8} />

        <NightPicture {...picture} maskId={moon2} />

        {/* Bed */}
        <rect x={headboard.x} y={headboard.y} width={headboard.w} height={headboard.h} rx={90} fill={R.headboard} {...line} />
        <rect x={headboard.x + 72} y={headboard.y + 70} width={headboard.w - 144} height={headboard.h - 140} rx={60} fill={R.headboardInner} />
        <ellipse cx={pillow.cx} cy={pillow.cy} rx={pillow.rx} ry={pillow.ry} fill={R.pillow} {...line} />
      </svg>
      {sleeper}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {wide ? (
          <Blanket x0={168} x1={1306} top={688} bottom={1014} clipId={blanketClip} />
        ) : (
          <Blanket x0={330} x1={1610} top={866} bottom={1120} clipId={blanketClip} />
        )}
        {wide ? <rect x={150} y={1010} width={1180} height={80} fill={R.bedBase} {...line} /> : null}

        {/* Floor */}
        {wide ? (
          <>
            <rect x={-10} y={1012} width={170} height={80} fill={R.floor} />
            <rect x={1320} y={1012} width={620} height={80} fill={R.floor} />
          </>
        ) : null}
      </svg>
      {walker}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {/* Nightstand with the clock, the lamp, a plant and (in the wide shot) the glowing pizza. */}
        {wide ? (
          <g>
            <g opacity={0.95}>
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d={`M1790,700 Q${1720 + i * 40},${560 - i * 25} ${1650 + i * 60},${420 + (i % 2) * 40}`}
                  fill="none"
                  stroke={i % 2 ? R.plantLight : R.plant}
                  strokeWidth={34}
                  strokeLinecap="round"
                />
              ))}
            </g>
            <line x1={1782} y1={518} x2={1782} y2={692} stroke={R.ink} strokeWidth={8} />
            <path d="M1690,520 L1876,520 L1840,362 L1724,362 Z" fill={R.lampShade} {...line} />
            <rect x={1744} y={684} width={78} height={20} rx={6} fill={R.lampBase} {...line} />
            <AlarmClock x={1568} y={552} r={100} />
            <rect x={1452} y={700} width={392} height={360} rx={14} fill={R.nightstand} {...line} />
            <rect x={1480} y={740} width={336} height={128} rx={10} fill={R.drawer} stroke={R.ink} strokeWidth={3} />
            <rect x={1480} y={890} width={336} height={128} rx={10} fill={R.drawer} stroke={R.ink} strokeWidth={3} />
            <rect x={1612} y={790} width={72} height={16} rx={8} fill={R.handle} />
            <rect x={1612} y={940} width={72} height={16} rx={8} fill={R.handle} />
            <PizzaBox x={1402} y={612} w={344} glow={glow} glowId={boxGlow} />
          </g>
        ) : (
          <g>
            <AlarmClock x={1860} y={742} r={112} />
            <rect x={1730} y={856} width={260} height={260} rx={14} fill={R.nightstand} {...line} />
          </g>
        )}
        <rect width={W} height={H} fill={`url(#${vignette})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** The pizza box the Brain has taken to bed: lid up, one slice gone. Drawn in front of the blanket. */
export const BedPizzaBox: React.FC = () => {
  const glowId = useSvgId('rb-bedbox');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <PizzaBox x={430} y={954} w={390} glow={0.4} open missingSlice glowId={glowId} />
    </svg>
  );
};

/** Inside the gut: a raspberry back wall with soft wavy lines and a pink "stage" floor. */
export const RemakeGut: React.FC = () => {
  const frame = useCurrentFrame();
  const wallGrad = useSvgId('rg-wall');
  const floorGrad = useSvgId('rg-floor');
  const vignette = useSvgId('rg-vig');
  const floorTop = 876;
  const specks = Array.from({length: 26}, (_, i) => ({
    x: random(`rg-sx-${i}`) * W,
    y: floorTop + 30 + random(`rg-sy-${i}`) * 180,
    rx: 14 + random(`rg-sr-${i}`) * 26,
  }));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <radialGradient id={wallGrad} cx="50%" cy="40%" r="75%">
            <stop offset="0" stopColor={R.gutWallLight} />
            <stop offset="0.6" stopColor={R.gutWall} />
            <stop offset="1" stopColor={R.gutWallDark} />
          </radialGradient>
          <linearGradient id={floorGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={R.gutFloor} />
            <stop offset="1" stopColor={R.gutFloorDark} />
          </linearGradient>
          <radialGradient id={vignette} cx="50%" cy="45%" r="75%">
            <stop offset="0.55" stopColor="#3A0B22" stopOpacity={0} />
            <stop offset="1" stopColor="#3A0B22" stopOpacity={0.5} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${wallGrad})`} />
        {[0, 1, 2, 3].map((i) => {
          const y0 = 110 + i * 210;
          const pts = Array.from({length: 26}, (_, k) => {
            const x = -40 + k * 80;
            return `${x},${(y0 + Math.sin(x * 0.006 + i * 1.7 + frame * 0.02) * 46).toFixed(1)}`;
          });
          return <polyline key={i} points={pts.join(' ')} fill="none" stroke={R.gutLine} strokeWidth={5} opacity={0.45} strokeLinecap="round" />;
        })}
        <path d={`M-20,${floorTop + 18} Q${W / 2},${floorTop - 26} ${W + 20},${floorTop + 18} L${W + 20},${H + 20} L-20,${H + 20} Z`} fill={`url(#${floorGrad})`} />
        <path d={`M-20,${floorTop + 18} Q${W / 2},${floorTop - 26} ${W + 20},${floorTop + 18}`} fill="none" stroke={R.gutFloorRim} strokeWidth={6} />
        {specks.map((s, i) => (
          <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.rx * 0.28} fill={R.speck} opacity={0.6} />
        ))}
        <rect width={W} height={H} fill={`url(#${vignette})`} />
      </svg>
    </AbsoluteFill>
  );
};
