import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, Expression, Point} from '../../types/characters';
import {noise1D} from '../../utils/animation';
import {polar} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';
import {Mouth} from './parts/Mouth';
import {NoodleArm} from './parts/NoodleArm';

export const SUN_VIEWBOX = {width: 760, height: 760} as const;
const C = {x: 380, y: 380};
const R = 230;

/** Shoulder of the hammer arm, in the Sun's local units. */
export const SUN_SHOULDER: Point = {x: 560, y: 430};

export interface SunCharacterProps extends CharacterBaseProps {
  /** Brightness 0..1: hotter core, longer rays, bigger glow. */
  heat?: number;
  /** Lowers the sunglasses to glare over them, 0..1. */
  glassesDrop?: number;
  /** Hammer arm: hand position (local units) and hammer rotation (deg, 0 = head up). */
  hammer?: {hand: Point; angle: number} | null;
  /** Extra key-ring jingle (e.g. after a hammer hit), 0..1. */
  jingle?: number;
}

/** Brow [inner, outer] offsets: positive inner = angry V. */
const BROWS: Record<Expression, readonly [number, number]> = {
  neutral: [0, 0],
  confused: [-10, 8],
  happy: [-14, -6],
  confident: [6, -6],
  smug: [4, -12],
  scared: [-22, -4],
  panic: [-26, -6],
  grumpy: [26, -10],
  crying: [-18, 0],
  awe: [-20, -14],
  calm: [4, 4],
};

const LENS_L = 'M196,286 L346,282 L338,346 Q330,380 296,382 L238,380 Q204,374 200,340 Z';
const LENS_R = 'M564,286 L414,282 L422,346 Q430,380 464,382 L522,380 Q556,374 560,340 Z';

const Hammer: React.FC<{angle: number}> = ({angle}) => (
  <g transform={`rotate(${angle})`}>
    <rect x={-8} y={-118} width={16} height={146} rx={6} fill={TONES.wood} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <rect x={-44} y={-152} width={88} height={44} rx={8} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.bold} />
    <rect x={30} y={-152} width={14} height={44} rx={4} fill={TONES.steelDark} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <path d="M-34,-144 L18,-144" stroke={PALETTE.white} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
  </g>
);

const Key: React.FC<{color: string; tag: string; tagColor: string; rotate: number}> = ({color, tag, tagColor, rotate}) => (
  <g transform={`rotate(${rotate})`}>
    <path d="M0,0 L0,24" stroke={PALETTE.ink} strokeWidth={4} />
    <circle cx={0} cy={36} r={13} fill={color} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <circle cx={0} cy={34} r={4} fill={PALETTE.ink} />
    <rect x={-5} y={48} width={10} height={52} fill={color} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <path d="M5,78 L15,78 L15,86 L5,86 M5,92 L13,92 L13,99 L5,99" fill={color} stroke={PALETTE.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <g transform="translate(-14 52) rotate(-80)">
      <rect x={-42} y={-12} width={50} height={22} rx={5} fill={tagColor} stroke={PALETTE.ink} strokeWidth={3.5} />
      <text x={-17} y={5} textAnchor="middle" fontFamily={FONTS.display} fontSize={16} fill={PALETTE.ink} letterSpacing={1}>
        {tag}
      </text>
    </g>
  </g>
);

/** The landlord: a grumpy Sun with sunglasses, an equator belt and a ring of planet keys. */
export const SunCharacter: React.FC<SunCharacterProps> = ({
  size = 600,
  expression = 'grumpy',
  mouth = 'frown',
  sticker = true,
  style,
  heat = 0,
  glassesDrop = 0,
  hammer = null,
  jingle = 0,
}) => {
  const frame = useCurrentFrame();
  const bodyGrad = useSvgId('sun-body');
  const heatGrad = useSvgId('sun-heat');
  const glowGrad = useSvgId('sun-glow');
  const bodyClip = useSvgId('sun-clip');
  const shadeMask = useSvgId('sun-shade');
  const dots = useSvgId('sun-dots');
  const lensGrad = useSvgId('sun-lens');
  const lensClip = useSvgId('sun-lens-clip');
  const glareClipL = useSvgId('sun-glare-l');
  const glareClipR = useSvgId('sun-glare-r');

  const rays = 14;
  const spin = frame * 0.35;
  const pulse = 1 + 0.04 * Math.sin(frame * 0.18) + heat * 0.22;
  const [browIn, browOut] = BROWS[expression];
  const drop = glassesDrop * 58;
  const swing = noise1D('sun-keys', frame * 0.12) * 10 + Math.sin(frame * 0.9) * 24 * jingle;

  // Equator belt: the band between two latitude ellipses, clipped to the disc.
  const lat = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const rx = R * Math.cos(a);
    return {yc: C.y + R * Math.sin(a), rx, ry: rx * 0.22};
  };
  const b1 = lat(26);
  const b2 = lat(38);
  const belt = `M${C.x - b1.rx},${b1.yc} A${b1.rx},${b1.ry} 0 0 0 ${C.x + b1.rx},${b1.yc} L${C.x + b2.rx},${b2.yc} A${b2.rx},${b2.ry} 0 0 1 ${C.x - b2.rx},${b2.yc} Z`;
  const beltMid = lat(32);
  const ringPivot = {x: 470, y: b2.yc + b2.ry * Math.sqrt(1 - ((470 - C.x) / b2.rx) ** 2) - 6};

  const rayPaths = Array.from({length: rays}, (_, i) => {
    const a = spin + (i * 360) / rays;
    const long = i % 2 === 0;
    const outer = (long ? 340 : 300) * pulse;
    const half = long ? 10 : 8;
    const p0 = polar(C.x, C.y, R - 20, a - half);
    const p1 = polar(C.x, C.y, outer, a);
    const p2 = polar(C.x, C.y, R - 20, a + half);
    return {d: `M${p0.x},${p0.y} L${p1.x},${p1.y} L${p2.x},${p2.y} Z`, long};
  });

  const art = (
    <svg width={size} height={size} viewBox={`0 0 ${SUN_VIEWBOX.width} ${SUN_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
      <defs>
        <radialGradient id={bodyGrad} cx="0.4" cy="0.36" r="0.7">
          <stop offset="0" stopColor={TONES.sunCore} />
          <stop offset="0.45" stopColor={PALETTE.hazardYellow} />
          <stop offset="0.85" stopColor="#FFB300" />
          <stop offset="1" stopColor="#FF8A00" />
        </radialGradient>
        <radialGradient id={heatGrad} cx="0.42" cy="0.4" r="0.6">
          <stop offset="0" stopColor={PALETTE.white} stopOpacity={1} />
          <stop offset="1" stopColor={PALETTE.white} stopOpacity={0} />
        </radialGradient>
        <clipPath id={bodyClip}>
          <circle cx={C.x} cy={C.y} r={R} />
        </clipPath>
        <mask id={shadeMask}>
          <circle cx={C.x} cy={C.y} r={R} fill="#fff" />
          <circle cx={C.x - 50} cy={C.y - 60} r={R} fill="#000" />
        </mask>
        <pattern id={dots} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx={7} cy={7} r={3.6} fill={PALETTE.solarOrange} />
        </pattern>
        <linearGradient id={lensGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2350" />
          <stop offset="1" stopColor={PALETTE.ink} />
        </linearGradient>
        <clipPath id={lensClip}>
          <path d={LENS_L} />
          <path d={LENS_R} />
        </clipPath>
      </defs>

      {/* Rays */}
      {rayPaths.map((r, i) => (
        <path key={i} d={r.d} fill={r.long ? PALETTE.solarOrange : '#FFB000'} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      ))}

      {hammer ? (
        <NoodleArm
          from={SUN_SHOULDER}
          to={hammer.hand}
          bend={-0.25}
          color="#FF9A00"
          thickness={18}
          gloveSize={28}
          holding={<Hammer angle={hammer.angle} />}
        />
      ) : null}

      {/* Body */}
      <circle cx={C.x} cy={C.y} r={R} fill={`url(#${bodyGrad})`} />
      <g mask={`url(#${shadeMask})`}>
        <rect width={760} height={760} fill={PALETTE.solarOrange} opacity={0.25} />
        <rect width={760} height={760} fill={`url(#${dots})`} opacity={0.55} />
      </g>
      {heat > 0 ? <circle cx={C.x} cy={C.y} r={R} fill={`url(#${heatGrad})`} opacity={heat * 0.75} /> : null}
      <ellipse cx={290} cy={230} rx={58} ry={30} fill={PALETTE.white} opacity={0.55} transform="rotate(-35 290 230)" />

      {/* Belt with buckle */}
      <g clipPath={`url(#${bodyClip})`}>
        <path d={belt} fill="#5A2E12" stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <path
          d={`M${C.x - beltMid.rx},${beltMid.yc} A${beltMid.rx},${beltMid.ry} 0 0 0 ${C.x + beltMid.rx},${beltMid.yc}`}
          fill="none"
          stroke="#C98B4E"
          strokeWidth={3}
          strokeDasharray="10 8"
        />
      </g>
      <rect x={C.x - 28} y={b1.yc + b1.ry - 8} width={56} height={b2.yc + b2.ry - b1.yc - b1.ry + 16} rx={8} fill="#FFC94A" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <rect x={C.x - 13} y={b1.yc + b1.ry + 4} width={26} height={b2.yc + b2.ry - b1.yc - b1.ry - 8} rx={4} fill="#5A2E12" stroke={PALETTE.ink} strokeWidth={3} />

      <circle cx={C.x} cy={C.y} r={R} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold + 2} />

      {/* Glare eyes (visible when the glasses drop) */}
      {glassesDrop > 0.02
        ? [-1, 1].map((side) => {
            const ex = C.x + side * 110;
            const ey = 316;
            const clip = side < 0 ? glareClipL : glareClipR;
            return (
              <g key={side}>
                <defs>
                  <clipPath id={clip}>
                    <ellipse cx={ex} cy={ey} rx={46} ry={30} />
                  </clipPath>
                </defs>
                <ellipse cx={ex} cy={ey} rx={46} ry={30} fill={PALETTE.white} />
                <g clipPath={`url(#${clip})`}>
                  <circle cx={ex - side * 8} cy={ey + 6} r={12} fill={PALETTE.ink} />
                  <path d={`M${ex - 50},${ey - 34} L${ex + 50},${ey - 34} L${ex + 50},${ey - 6 - side * 14} L${ex - 50},${ey - 6 + side * 14} Z`} fill="#FFC400" stroke={PALETTE.ink} strokeWidth={INK.medium} />
                </g>
                <ellipse cx={ex} cy={ey} rx={46} ry={30} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
              </g>
            );
          })
        : null}

      {/* Angry brows */}
      <path d={`M196,${244 + browOut - drop * 0.3} L338,${262 + browIn - drop * 0.3}`} stroke={PALETTE.ink} strokeWidth={24} strokeLinecap="round" />
      <path d={`M564,${244 + browOut - drop * 0.3} L422,${262 + browIn - drop * 0.3}`} stroke={PALETTE.ink} strokeWidth={24} strokeLinecap="round" />

      {/* Sunglasses */}
      <g transform={`translate(0 ${drop})`}>
        <path d="M190,292 L160,306 M570,292 L600,306" stroke={PALETTE.ink} strokeWidth={10} strokeLinecap="round" />
        <path d="M346,294 Q380,278 414,294" fill="none" stroke={PALETTE.ink} strokeWidth={14} strokeLinecap="round" />
        <path d={LENS_L} fill={`url(#${lensGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <path d={LENS_R} fill={`url(#${lensGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <g clipPath={`url(#${lensClip})`}>
          <path d="M226,270 L262,270 L222,400 L186,400 Z" fill={PALETTE.white} opacity={0.75} />
          <path d="M276,270 L290,270 L250,400 L236,400 Z" fill={PALETTE.white} opacity={0.5} />
          <path d="M446,270 L482,270 L442,400 L406,400 Z" fill={PALETTE.white} opacity={0.75} />
          <path d="M496,270 L510,270 L470,400 L456,400 Z" fill={PALETTE.white} opacity={0.5} />
        </g>
        <path d="M188,288 L572,288" stroke={PALETTE.ink} strokeWidth={14} strokeLinecap="round" />
      </g>

      <Mouth shape={mouth} x={C.x} y={432} scale={1.6} strokeWidth={7} />

      {/* Key ring */}
      <g transform={`rotate(${swing} ${ringPivot.x} ${ringPivot.y})`}>
        <circle cx={ringPivot.x} cy={ringPivot.y + 26} r={22} fill="none" stroke={PALETTE.ink} strokeWidth={14} />
        <circle cx={ringPivot.x} cy={ringPivot.y + 26} r={22} fill="none" stroke="#FFC94A" strokeWidth={6} />
        <g transform={`translate(${ringPivot.x} ${ringPivot.y + 46})`}>
          <Key color="#FFC94A" tag="EARTH" tagColor={PALETTE.electricCyan} rotate={22 + swing * 0.3} />
          <Key color="#D5DCE6" tag="MARS" tagColor={PALETTE.vividMagenta} rotate={-4} />
          <Key color="#FFC94A" tag="VENUS" tagColor={PALETTE.hazardYellow} rotate={-28 - swing * 0.3} />
        </g>
      </g>
    </svg>
  );

  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <svg width={size} height={size} viewBox={`0 0 ${SUN_VIEWBOX.width} ${SUN_VIEWBOX.height}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id={glowGrad}>
            <stop offset="0.45" stopColor={PALETTE.hazardYellow} stopOpacity={0.75} />
            <stop offset="0.7" stopColor={PALETTE.solarOrange} stopOpacity={0.25} />
            <stop offset="1" stopColor={PALETTE.solarOrange} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={C.x} cy={C.y} r={R * (2.0 + heat * 0.8)} fill={`url(#${glowGrad})`} opacity={0.45 + heat * 0.5} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0}}>{sticker ? <Sticker bleed={0.3}>{art}</Sticker> : art}</div>
    </div>
  );
};
