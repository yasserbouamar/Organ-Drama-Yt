import React from 'react';
import {interpolateColors, random, useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, Expression} from '../../types/characters';
import {autoBlink, clamp, noise1D} from '../../utils/animation';
import {dropPath} from '../../utils/geometry';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';

export const EARTH_VIEWBOX = {width: 600, height: 600} as const;
const C = {x: 300, y: 300};
const R = 230;

/** Door centre in Earth's local units (where notices get nailed). */
export const EARTH_DOOR = {x: 300, y: 405} as const;

export interface EarthCharacterProps extends CharacterBaseProps {
  /** 0 = shut, 1 = swung open. */
  doorOpen?: number;
  /** Eviction notice on the door: 0 = absent, 1 = nailed up (pops in between). */
  notice?: number;
  /** Rattle of the notice after a hammer hit, 0..1. */
  noticeShake?: number;
  /** Oceans boiled away, 0..1. */
  dryness?: number;
  /** Boiling bubbles on the oceans, 0..1. */
  boil?: number;
  /** Steam rising off the planet, 0..1. */
  steam?: number;
  /** Cutaway wedge showing crust, mantle and the glowing core, 0..1. */
  cutaway?: number;
  /** Continent drift speed multiplier. */
  spin?: number;
  /** Expanding atmosphere ripples. */
  ripples?: boolean;
}

interface WindowRig {
  pupil: number;
  blind: number;
  /** Awning tilt in degrees (positive = inner ends up = worried) and lift in px. */
  awning: number;
  lift: number;
  cheeks: boolean;
  sweat: boolean;
}

const EXPRESSIONS: Record<Expression, WindowRig> = {
  neutral: {pupil: 15, blind: 0.12, awning: 0, lift: 0, cheeks: false, sweat: false},
  confused: {pupil: 13, blind: 0.25, awning: 8, lift: 0, cheeks: false, sweat: false},
  happy: {pupil: 16, blind: 0.2, awning: -4, lift: -8, cheeks: true, sweat: false},
  confident: {pupil: 15, blind: 0.25, awning: -8, lift: 0, cheeks: false, sweat: false},
  smug: {pupil: 14, blind: 0.45, awning: -6, lift: 2, cheeks: false, sweat: false},
  scared: {pupil: 8, blind: 0, awning: 14, lift: -12, cheeks: false, sweat: true},
  panic: {pupil: 6, blind: 0, awning: 18, lift: -16, cheeks: false, sweat: true},
  grumpy: {pupil: 13, blind: 0.4, awning: -14, lift: 4, cheeks: false, sweat: false},
  crying: {pupil: 12, blind: 0.3, awning: 14, lift: -6, cheeks: false, sweat: true},
  awe: {pupil: 18, blind: 0, awning: 6, lift: -14, cheeks: true, sweat: false},
  calm: {pupil: 15, blind: 0.4, awning: 0, lift: 0, cheeks: false, sweat: false},
};

const CONTINENTS = [
  'M60,140 C110,100 170,120 180,170 C190,220 150,240 160,290 C170,340 210,360 190,420 C175,465 140,470 130,430 C120,390 100,350 80,310 C60,270 30,230 40,190 C45,165 50,150 60,140 Z',
  'M300,110 C360,80 470,90 520,130 C560,160 540,200 490,210 C450,218 430,250 390,240 C350,230 330,200 300,190 C270,180 270,130 300,110 Z',
  'M330,260 C380,250 420,280 410,330 C400,380 380,430 350,450 C330,462 315,430 312,390 C308,350 290,320 300,290 C305,272 315,262 330,260 Z',
  'M470,360 C510,350 545,370 540,400 C535,425 500,430 475,420 C455,410 450,370 470,360 Z',
  'M230,470 C260,460 290,480 280,500 C270,515 240,512 228,498 C220,488 220,476 230,470 Z',
];

const CRACKS = [
  'M110,330 L140,350 L130,380 L160,400',
  'M420,180 L450,220 L440,250',
  'M200,120 L230,150 L260,140',
  'M480,300 L460,330 L490,350 L480,380',
  'M90,250 L120,260 L110,290',
];

const WINDOWS = [
  {x: 222, y: 218, side: -1},
  {x: 378, y: 218, side: 1},
] as const;
const WIN = {w: 74, h: 84};

/** Earth: a globe with window eyes, a "HOME" front door and planet-scale moods. */
export const EarthCharacter: React.FC<EarthCharacterProps> = ({
  size = 520,
  expression = 'neutral',
  look = {x: 0, y: 0},
  blink,
  sticker = true,
  style,
  doorOpen = 0,
  notice = 0,
  noticeShake = 0,
  dryness = 0,
  boil = 0,
  steam = 0,
  cutaway = 0,
  spin = 1,
  ripples = true,
}) => {
  const frame = useCurrentFrame();
  const globeClip = useSvgId('earth-globe');
  const oceanGrad = useSvgId('earth-ocean');
  const shadeMask = useSvgId('earth-shade');
  const dots = useSvgId('earth-dots');
  const glassClipL = useSvgId('earth-glass-l');
  const glassClipR = useSvgId('earth-glass-r');
  const coreGrad = useSvgId('earth-core');
  const atmoGrad = useSvgId('earth-atmo');
  const rig = EXPRESSIONS[expression];
  const lid = blink ?? autoBlink(frame, 'earth');

  const ocean = interpolateColors(dryness, [0, 1], [TONES.oceanBlue, TONES.desertTan]);
  const oceanDeep = interpolateColors(dryness, [0, 1], [TONES.oceanDeep, TONES.desertShade]);
  const land = interpolateColors(dryness, [0, 1], [TONES.landGreen, '#A39234']);
  const landShade = interpolateColors(dryness, [0, 1], [TONES.landShade, '#6E5F1C']);
  const drift = (((frame * 0.6 * spin) % 600) + 600) % 600;

  const continents = (dx: number) => (
    <g transform={`translate(${dx} 0)`}>
      {CONTINENTS.map((d, i) => (
        <g key={i}>
          <path d={d} fill={landShade} transform="translate(6 6)" />
          <path d={d} fill={land} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );

  const cloud = (cx: number, cy: number, s: number, key: string) => {
    const circles = [
      [0, 0, 22],
      [24, -8, 18],
      [44, 2, 16],
      [20, 8, 18],
    ];
    return (
      <g key={key} transform={`translate(${cx} ${cy}) scale(${s})`}>
        {circles.map(([x, y, r], i) => (
          <circle key={`o${i}`} cx={x} cy={y} r={r + 3.5} fill={PALETTE.ink} />
        ))}
        {circles.map(([x, y, r], i) => (
          <circle key={`i${i}`} cx={x} cy={y} r={r} fill={PALETTE.white} />
        ))}
      </g>
    );
  };

  // Cutaway wedge (lower-right quadrant) revealing the layers.
  const wedge = (r: number) => {
    const a0 = (-20 * Math.PI) / 180;
    const a1 = (70 * Math.PI) / 180;
    return `M${C.x},${C.y} L${C.x + Math.cos(a0) * r},${C.y + Math.sin(a0) * r} A${r},${r} 0 0 1 ${C.x + Math.cos(a1) * r},${C.y + Math.sin(a1) * r} Z`;
  };

  const art = (
    <svg width={size} height={size} viewBox={`0 0 ${EARTH_VIEWBOX.width} ${EARTH_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
      <defs>
        <clipPath id={globeClip}>
          <circle cx={C.x} cy={C.y} r={R} />
        </clipPath>
        <radialGradient id={oceanGrad} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={ocean} />
          <stop offset="1" stopColor={oceanDeep} />
        </radialGradient>
        <mask id={shadeMask}>
          <circle cx={C.x} cy={C.y} r={R} fill="#fff" />
          <circle cx={C.x - 46} cy={C.y - 56} r={R} fill="#000" />
        </mask>
        <pattern id={dots} width={13} height={13} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx={6.5} cy={6.5} r={3.2} fill={PALETTE.comicNavy} />
        </pattern>
        <radialGradient id={coreGrad}>
          <stop offset="0" stopColor={PALETTE.white} />
          <stop offset="0.5" stopColor={TONES.innerCore} />
          <stop offset="1" stopColor={PALETTE.hazardYellow} />
        </radialGradient>
        {WINDOWS.map((w) => (
          <clipPath key={w.side} id={w.side < 0 ? glassClipL : glassClipR}>
            <rect x={w.x - WIN.w / 2 + 8} y={w.y - WIN.h / 2 + 8} width={WIN.w - 16} height={WIN.h - 16} rx={6} />
          </clipPath>
        ))}
      </defs>

      {/* Globe */}
      <circle cx={C.x} cy={C.y} r={R} fill={`url(#${oceanGrad})`} />
      <g clipPath={`url(#${globeClip})`}>
        {continents(-drift)}
        {continents(600 - drift)}
        {dryness > 0
          ? CRACKS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#6B3E14" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={dryness} />
            ))
          : null}
        {[0, 1, 2].map((i) => {
          const speed = 1.1 + i * 0.3;
          const x = ((((random(`cloud-x-${i}`) * 700 - frame * speed * spin) % 760) + 760) % 760) - 80;
          return cloud(x, 110 + i * 150 + random(`cloud-y-${i}`) * 40, 0.9 + random(`cloud-s-${i}`) * 0.4, `c${i}`);
        })}
        {boil > 0
          ? Array.from({length: 22}, (_, i) => {
              if (random(`bubble-on-${i}`) > boil) {
                return null;
              }
              const life = 22;
              const t = (frame + Math.floor(random(`bubble-t-${i}`) * life)) % life;
              const bx = C.x + (random(`bubble-x-${i}`) - 0.5) * 400;
              const by = C.y + (random(`bubble-y-${i}`) - 0.5) * 400;
              if (t < 16) {
                const r = 4 + (t / 16) * 13;
                return (
                  <g key={i}>
                    <circle cx={bx} cy={by} r={r} fill="#BFF6FF" stroke={PALETTE.ink} strokeWidth={3} />
                    <circle cx={bx - r * 0.3} cy={by - r * 0.35} r={r * 0.25} fill={PALETTE.white} />
                  </g>
                );
              }
              const p = (t - 16) / 6;
              return <circle key={i} cx={bx} cy={by} r={17 + p * 14} fill="none" stroke={PALETTE.white} strokeWidth={5 * (1 - p)} />;
            })
          : null}
      </g>
      <g mask={`url(#${shadeMask})`}>
        <rect width={600} height={600} fill={PALETTE.comicNavy} opacity={0.22} />
        <rect width={600} height={600} fill={`url(#${dots})`} opacity={0.45} />
      </g>
      <ellipse cx={205} cy={150} rx={62} ry={30} fill={PALETTE.white} opacity={0.35} transform="rotate(-35 205 150)" />

      {cutaway > 0 ? (
        <g opacity={clamp(cutaway * 2)} transform={`translate(${C.x} ${C.y}) scale(${0.6 + 0.4 * clamp(cutaway)}) translate(${-C.x} ${-C.y})`}>
          <path d={wedge(R)} fill={TONES.crust} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
          <path d={wedge(R * 0.88)} fill={TONES.mantle} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          <path d={wedge(R * 0.55)} fill={TONES.outerCore} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          {[0, 1, 2].map((i) => {
            const a = frame * 0.06 + i * 2.1;
            const r = R * (0.32 + 0.07 * i);
            return (
              <path
                key={i}
                d={`M${C.x + Math.cos(a) * r},${C.y + Math.sin(a) * r} A${r},${r} 0 0 1 ${C.x + Math.cos(a + 0.9) * r},${C.y + Math.sin(a + 0.9) * r}`}
                fill="none"
                stroke={PALETTE.hazardYellow}
                strokeWidth={5}
                strokeLinecap="round"
                clipPath={`url(#${globeClip})`}
                opacity={0.9}
              />
            );
          })}
          <circle cx={C.x} cy={C.y} r={R * 0.22} fill={`url(#${coreGrad})`} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        </g>
      ) : null}

      <circle cx={C.x} cy={C.y} r={R} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold + 1} />

      {/* Window eyes with blind lids and awning brows */}
      {WINDOWS.map((w) => {
        const x0 = w.x - WIN.w / 2;
        const y0 = w.y - WIN.h / 2;
        const glassH = WIN.h - 16;
        const blind = clamp(Math.max(rig.blind, lid));
        const travelX = (WIN.w - 16) / 2 - rig.pupil - 3;
        const travelY = glassH / 2 - rig.pupil - 3;
        const px = w.x + clamp(look.x, -1, 1) * travelX;
        const py = w.y + clamp(look.y, -1, 1) * travelY + 4;
        const tilt = -w.side * rig.awning;
        return (
          <g key={w.side}>
            <rect x={x0} y={y0} width={WIN.w} height={WIN.h} rx={12} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} />
            <rect x={x0 + 8} y={y0 + 8} width={WIN.w - 16} height={glassH} rx={6} fill="#D8F8FF" stroke={PALETTE.ink} strokeWidth={3} />
            <g clipPath={`url(#${w.side < 0 ? glassClipL : glassClipR})`}>
              <circle cx={px} cy={py} r={rig.pupil} fill={PALETTE.ink} />
              <circle cx={px - rig.pupil * 0.35} cy={py - rig.pupil * 0.4} r={rig.pupil * 0.35} fill={PALETTE.white} />
              {blind > 0.02 ? (
                <g>
                  <rect x={x0} y={y0} width={WIN.w} height={8 + blind * glassH} fill={PALETTE.hazardYellow} />
                  {Array.from({length: 6}, (_, i) => (
                    <rect key={i} x={x0} y={y0 + 8 + i * 14} width={WIN.w} height={6} fill={PALETTE.solarOrange} opacity={i * 14 < blind * glassH ? 0.55 : 0} />
                  ))}
                  <path d={`M${x0},${y0 + 8 + blind * glassH} L${x0 + WIN.w},${y0 + 8 + blind * glassH}`} stroke={PALETTE.ink} strokeWidth={INK.medium} />
                </g>
              ) : null}
            </g>
            <rect x={x0 - 6} y={y0 + WIN.h - 4} width={WIN.w + 12} height={13} rx={4} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            {/* Awning */}
            <g transform={`translate(0 ${rig.lift}) rotate(${tilt} ${w.x} ${y0 - 16})`}>
              <path
                d={`M${x0 - 4},${y0 - 30} L${x0 + WIN.w + 4},${y0 - 30} L${x0 + WIN.w + 12},${y0 - 6} Q${x0 + WIN.w - 3},${y0 + 4} ${x0 + WIN.w - 18},${y0 - 6} Q${w.x + 7},${y0 + 4} ${w.x},${y0 - 6} Q${w.x - 7},${y0 + 4} ${x0 + 18},${y0 - 6} Q${x0 + 3},${y0 + 4} ${x0 - 12},${y0 - 6} Z`}
                fill={PALETTE.vividMagenta}
                stroke={PALETTE.ink}
                strokeWidth={INK.medium}
                strokeLinejoin="round"
              />
              <path d={`M${x0 + 18},${y0 - 30} L${x0 + 18},${y0 - 7} M${w.x},${y0 - 30} L${w.x},${y0 - 7} M${x0 + WIN.w - 18},${y0 - 30} L${x0 + WIN.w - 18},${y0 - 7}`} stroke={PALETTE.white} strokeWidth={7} />
            </g>
          </g>
        );
      })}

      {rig.cheeks ? (
        <>
          <ellipse cx={192} cy={318} rx={24} ry={12} fill={PALETTE.vividMagenta} opacity={0.5} />
          <ellipse cx={408} cy={318} rx={24} ry={12} fill={PALETTE.vividMagenta} opacity={0.5} />
        </>
      ) : null}

      {/* Front door */}
      <rect x={244} y={300} width={112} height={34} rx={8} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <text x={300} y={327} textAnchor="middle" fontFamily={FONTS.display} fontSize={30} letterSpacing={3} fill={PALETTE.ink}>
        HOME
      </text>
      <path d="M248,466 L248,384 Q248,338 300,338 Q352,338 352,384 L352,466 Z" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      <path d="M258,462 L258,386 Q258,348 300,348 Q342,348 342,386 L342,462 Z" fill={doorOpen > 0 ? '#2A1A0A' : PALETTE.ink} />
      {doorOpen > 0 ? <path d="M268,462 L268,390 Q268,358 300,358 Q332,358 332,390 L332,462 Z" fill={PALETTE.hazardYellow} opacity={0.35 + 0.3 * doorOpen} /> : null}
      <g transform={`translate(258 0) scale(${1 - 0.86 * clamp(doorOpen)} 1) translate(-258 0)`}>
        <path d="M258,462 L258,386 Q258,348 300,348 Q342,348 342,386 L342,462 Z" fill={TONES.rocketRed} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
        <rect x={270} y={372} width={60} height={34} rx={5} fill="none" stroke={TONES.rocketRedDark} strokeWidth={4} />
        <rect x={270} y={416} width={60} height={36} rx={5} fill="none" stroke={TONES.rocketRedDark} strokeWidth={4} />
        <circle cx={330} cy={414} r={7} fill="#FFC94A" stroke={PALETTE.ink} strokeWidth={3} />
      </g>
      <rect x={236} y={462} width={128} height={16} rx={5} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} />

      {/* Eviction notice */}
      {notice > 0 ? (
        <g
          transform={`translate(${EARTH_DOOR.x} ${EARTH_DOOR.y}) scale(${notice}) rotate(${-5 + noticeShake * noise1D('notice', frame * 1.5) * 12})`}
        >
          <rect x={-40} y={-44} width={80} height={96} rx={4} fill="#FFF8E1" stroke={PALETTE.ink} strokeWidth={4} />
          <text x={0} y={-14} textAnchor="middle" fontFamily={FONTS.display} fontSize={18} fill={TONES.stampRed} letterSpacing={1}>
            EVICTION
          </text>
          <text x={0} y={6} textAnchor="middle" fontFamily={FONTS.display} fontSize={14} fill={PALETTE.ink} letterSpacing={1}>
            NOTICE
          </text>
          {[18, 28, 38].map((y) => (
            <path key={y} d={`M-26,${y} L26,${y}`} stroke={PALETTE.ink} strokeWidth={3} opacity={0.4} />
          ))}
          <circle cx={0} cy={-34} r={5} fill={TONES.steelDark} stroke={PALETTE.ink} strokeWidth={2} />
        </g>
      ) : null}

      {rig.sweat ? <path d={dropPath(488, 150 + (frame % 30), 22)} fill="#9BEFFF" stroke={PALETTE.ink} strokeWidth={4} /> : null}

      {/* Steam */}
      {steam > 0
        ? Array.from({length: Math.max(1, Math.round(7 * steam))}, (_, i) => {
            const phase = (frame * 0.022 + i / 7) % 1;
            const x = C.x + (random(`steam-x-${i}`) - 0.5) * 340 + Math.sin(phase * 6 + i) * 18;
            const y = 150 - phase * 260;
            const r = 22 + phase * 34;
            // Fade only at the ends: half-transparent white over dark space reads as grey smoke.
            const o = Math.min(1, steam * 3) * Math.min(1, phase * 6) * Math.min(1, (1 - phase) * 3);
            const puff = [
              [0, 0, 1],
              [r * 0.8, r * 0.2, 0.75],
              [-r * 0.75, r * 0.25, 0.7],
            ];
            return (
              <g key={i} opacity={o}>
                {puff.map(([dx, dy, s], j) => (
                  <circle key={`o${j}`} cx={x + dx} cy={y + dy} r={r * s + 4} fill={PALETTE.ink} />
                ))}
                {puff.map(([dx, dy, s], j) => (
                  <circle key={`i${j}`} cx={x + dx} cy={y + dy} r={r * s} fill={PALETTE.white} />
                ))}
              </g>
            );
          })
        : null}
    </svg>
  );

  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      {ripples ? (
        <svg width={size} height={size} viewBox={`0 0 ${EARTH_VIEWBOX.width} ${EARTH_VIEWBOX.height}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <radialGradient id={atmoGrad}>
              <stop offset="0.78" stopColor={PALETTE.electricCyan} stopOpacity={0.45} />
              <stop offset="1" stopColor={PALETTE.electricCyan} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={C.x} cy={C.y} r={R * 1.22} fill={`url(#${atmoGrad})`} />
          {[0, 1, 2].map((i) => {
            const t = ((frame / 50 + i / 3) % 1 + 1) % 1;
            return <circle key={i} cx={C.x} cy={C.y} r={R + 12 + t * 70} fill="none" stroke={PALETTE.electricCyan} strokeWidth={6 * (1 - t)} opacity={0.8 * (1 - t)} />;
          })}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0}}>{sticker ? <Sticker bleed={0.32}>{art}</Sticker> : art}</div>
    </div>
  );
};
