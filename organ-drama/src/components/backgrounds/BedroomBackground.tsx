import React from 'react';
import {interpolateColors, random, useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

/** 0 = midnight, 1 = bright morning. */
const mixTone = (morning: number, night: string, day: string): string => interpolateColors(morning, [0, 1], [night, day]);

const W = 1920;
const H = 1080;

export const BEDROOM_LAYOUT = {
  window: {x: 170, y: 110, w: 470, h: 430},
  floorY: 860,
  bed: {x: 880, y: 430, w: 700},
  /** Top edge of the blanket, where a sleeper's head pokes out. */
  blanketTop: 640,
  nightstand: {x: 640, y: 664, w: 220, h: 196},
  clock: {x: 660, y: 584},
} as const;

export interface BedroomProps {
  morning?: number;
}

/** Wall, window (stars and moon, or morning sky and sun), curtains and floor. */
export const BedroomRoom: React.FC<BedroomProps> = ({morning = 0}) => {
  const frame = useCurrentFrame();
  const wallGrad = useSvgId('bedroom-wall');
  const skyGrad = useSvgId('bedroom-sky');
  const glowGrad = useSvgId('bedroom-glow');
  const moonMask = useSvgId('bedroom-moon');
  const winClip = useSvgId('bedroom-window');
  const {window: win, floorY} = BEDROOM_LAYOUT;
  const wall = mixTone(morning, TONES.nightWall, TONES.morningWall);
  const wallDark = mixTone(morning, TONES.nightWallDark, TONES.morningWallDark);
  const curtain = mixTone(morning, TONES.curtain, TONES.curtainMorning);
  const stars = Array.from({length: 26}, (_, i) => ({
    x: win.x + 20 + random(`star-x-${i}`) * (win.w - 40),
    y: win.y + 20 + random(`star-y-${i}`) * (win.h * 0.75),
    r: 2 + random(`star-r-${i}`) * 3.5,
    twinkle: 0.5 + 0.5 * Math.sin(frame * (0.08 + random(`star-s-${i}`) * 0.1) + i),
  }));
  const sunY = win.y + win.h * (1.1 - morning * 0.75);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={wallGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallDark} />
          <stop offset="0.7" stopColor={wall} />
        </linearGradient>
        <linearGradient id={skyGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixTone(morning, TONES.nightSky, TONES.morningSky)} />
          <stop offset="1" stopColor={mixTone(morning, TONES.nightSkyLow, TONES.morningSkyLow)} />
        </linearGradient>
        <radialGradient id={glowGrad}>
          <stop offset="0" stopColor={mixTone(morning, '#A5B4FC', '#FDE68A')} stopOpacity={0.45} />
          <stop offset="1" stopColor={mixTone(morning, '#A5B4FC', '#FDE68A')} stopOpacity={0} />
        </radialGradient>
        <mask id={moonMask}>
          <circle cx={win.x + win.w - 120} cy={win.y + 110} r={52} fill={PALETTE.white} />
          <circle cx={win.x + win.w - 98} cy={win.y + 92} r={46} fill="black" />
        </mask>
        <clipPath id={winClip}>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={`url(#${wallGrad})`} />
      {/* Wallpaper: faint polka dots. */}
      {Array.from({length: 14}, (_, row) =>
        Array.from({length: 22}, (_, col) => (
          <circle key={`${row}-${col}`} cx={col * 90 + (row % 2) * 45} cy={row * 70} r={5} fill={PALETTE.white} opacity={0.05 + morning * 0.04} />
        )),
      )}
      <ellipse cx={win.x + win.w / 2} cy={win.y + win.h / 2} rx={460} ry={380} fill={`url(#${glowGrad})`} />

      {/* Window */}
      <g clipPath={`url(#${winClip})`}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={`url(#${skyGrad})`} />
        {stars.map((s, i) => (
          <path
            key={i}
            d={`M${s.x},${s.y - s.r * 2} L${s.x + s.r * 0.5},${s.y - s.r * 0.5} L${s.x + s.r * 2},${s.y} L${s.x + s.r * 0.5},${s.y + s.r * 0.5} L${s.x},${s.y + s.r * 2} L${s.x - s.r * 0.5},${s.y + s.r * 0.5} L${s.x - s.r * 2},${s.y} L${s.x - s.r * 0.5},${s.y - s.r * 0.5} Z`}
            fill={TONES.star}
            opacity={(0.4 + 0.6 * s.twinkle) * (1 - morning)}
          />
        ))}
        <g opacity={1 - morning}>
          <circle cx={win.x + win.w - 120} cy={win.y + 110} r={70} fill={TONES.moon} opacity={0.18} />
          <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={TONES.moon} mask={`url(#${moonMask})`} />
        </g>
        {morning > 0 ? (
          <g opacity={morning}>
            <circle cx={win.x + win.w * 0.62} cy={sunY} r={95} fill={TONES.sun} opacity={0.35} />
            <circle cx={win.x + win.w * 0.62} cy={sunY} r={62} fill={TONES.sun} stroke="#F59E0B" strokeWidth={INK.medium} />
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={win.x + 90 + i * 150 + Math.sin(frame * 0.01 + i) * 20} cy={win.y + 300 + i * 30} rx={70} ry={24} fill={PALETTE.white} opacity={0.85} />
            ))}
          </g>
        ) : null}
        <path d={`M${win.x},${win.y + win.h - 60} Q${win.x + 120},${win.y + win.h - 110} ${win.x + 240},${win.y + win.h - 70} T${win.x + win.w},${win.y + win.h - 80} L${win.x + win.w},${win.y + win.h} L${win.x},${win.y + win.h} Z`} fill={mixTone(morning, '#141047', '#86EFAC')} />
      </g>
      <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" stroke={mixTone(morning, '#3730A3', '#FFFFFF')} strokeWidth={24} />
      <rect x={win.x - 12} y={win.y - 12} width={win.w + 24} height={win.h + 24} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={win.x + 12} y={win.y + 12} width={win.w - 24} height={win.h - 24} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <path d={`M${win.x + win.w / 2},${win.y} L${win.x + win.w / 2},${win.y + win.h} M${win.x},${win.y + win.h / 2} L${win.x + win.w},${win.y + win.h / 2}`} stroke={mixTone(morning, '#3730A3', '#FFFFFF')} strokeWidth={14} />
      <rect x={win.x - 30} y={win.y + win.h + 10} width={win.w + 60} height={22} rx={6} fill={mixTone(morning, '#3730A3', '#FFFFFF')} stroke={PALETTE.ink} strokeWidth={INK.medium} />

      {/* Curtains */}
      <rect x={win.x - 70} y={win.y - 44} width={win.w + 140} height={14} rx={7} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      {[-1, 1].map((side) => {
        const x0 = side < 0 ? win.x - 70 : win.x + win.w + 70;
        const inner = side < 0 ? win.x + 40 : win.x + win.w - 40;
        const sway = Math.sin(frame * 0.03 + side) * 6;
        const d = `M${x0},${win.y - 36} L${inner},${win.y - 36} Q${inner - side * 30 + sway},${win.y + 220} ${inner - side * 70},${win.y + 300} Q${inner - side * 20 + sway},${win.y + 420} ${inner - side * 10},${win.y + win.h + 120} L${x0},${win.y + win.h + 120} Z`;
        return (
          <g key={side}>
            <path d={d} fill={curtain} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
            {[1, 2].map((k) => (
              <path
                key={k}
                d={`M${x0 + (inner - x0) * (k / 3)},${win.y - 30} Q${x0 + (inner - x0) * (k / 3) + sway},${win.y + 250} ${x0 + (inner - x0) * (k / 3) - side * 10},${win.y + win.h + 110}`}
                fill="none"
                stroke={PALETTE.ink}
                strokeWidth={INK.fine}
                opacity={0.35}
              />
            ))}
            <path d={`M${inner - side * 70},${win.y + 300} q${-side * 30},10 ${-side * 60},-6`} fill="none" stroke={TONES.gold} strokeWidth={10} strokeLinecap="round" />
          </g>
        );
      })}

      {/* Floor */}
      <rect x={0} y={floorY} width={W} height={H - floorY} fill={mixTone(morning, TONES.floorNight, TONES.floorMorning)} />
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={i * 240 + 60} y1={floorY} x2={i * 240 - 40} y2={H} stroke={PALETTE.ink} strokeWidth={INK.fine} opacity={0.25} />
      ))}
      <line x1={0} y1={floorY} x2={W} y2={floorY} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={0} y={floorY - 26} width={W} height={26} fill={mixTone(morning, '#3B3486', '#FFFFFF')} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <ellipse cx={1240} cy={980} rx={520} ry={60} fill={mixTone(morning, '#4338CA', '#F9A8D4')} opacity={0.6} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    </svg>
  );
};

export interface BedProps extends BedroomProps {
  layer: 'back' | 'front';
  /** 0..1: a mound in the blanket where someone is hiding underneath. */
  lump?: number;
  /** x of the mound, in world px. */
  lumpX?: number;
}

/** The bed, split into layers so a puppet can sit between mattress and blanket. */
export const Bed: React.FC<BedProps> = ({layer, morning = 0, lump = 0, lumpX = 1180}) => {
  const frame = useCurrentFrame();
  const {bed, blanketTop} = BEDROOM_LAYOUT;
  const wood = mixTone(morning, TONES.woodNight, TONES.woodMorning);
  const blanket = mixTone(morning, TONES.blanket, TONES.blanketMorning);

  if (layer === 'back') {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <path
          d={`M${bed.x + 20},${bed.y + 290} L${bed.x + 20},${bed.y + 60} Q${bed.x + 20},${bed.y} ${bed.x + 90},${bed.y} L${bed.x + bed.w - 90},${bed.y} Q${bed.x + bed.w - 20},${bed.y} ${bed.x + bed.w - 20},${bed.y + 60} L${bed.x + bed.w - 20},${bed.y + 290} Z`}
          fill={wood}
          stroke={PALETTE.ink}
          strokeWidth={INK.bold}
        />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={bed.x + 80 + i * 150} y={bed.y + 50} width={100} height={150} rx={18} fill={PALETTE.ink} opacity={0.15} />
        ))}
        <rect x={bed.x - 20} y={blanketTop - 10} width={bed.w + 40} height={150} rx={22} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <ellipse cx={bed.x + 110} cy={blanketTop - 26} rx={110} ry={46} fill={TONES.pillow} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <path d={`M${bed.x + 40},${blanketTop - 30} q70,-20 140,0`} fill="none" stroke={PALETTE.ink} strokeWidth={INK.fine} opacity={0.4} />
      </svg>
    );
  }

  // Blanket: a quilt draped over the mattress whose top edge mounds up over a hidden sleeper.
  const top = (x: number) => {
    const bump = Math.exp(-(((x - lumpX) / 150) ** 2));
    return blanketTop - 6 - bump * (8 + lump * 62) + Math.sin(x * 0.02 + frame * 0.05) * 3;
  };
  const xs = Array.from({length: 40}, (_, i) => bed.x + 140 + (i / 39) * (bed.w - 120));
  const edge = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${top(x).toFixed(1)}`).join(' ');
  const d = `${edge} L${bed.x + bed.w + 30},${blanketTop + 40} L${bed.x + bed.w + 30},${blanketTop + 170} Q${bed.x + bed.w / 2},${blanketTop + 200} ${bed.x + 110},${blanketTop + 170} L${bed.x + 140},${top(bed.x + 140)} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={d} fill={blanket} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      {[1, 2, 3, 4, 5].map((i) => (
        <line key={`v${i}`} x1={bed.x + 140 + i * 120} y1={top(bed.x + 140 + i * 120) + 10} x2={bed.x + 120 + i * 122} y2={blanketTop + 182} stroke={PALETTE.white} strokeWidth={3} strokeDasharray="10 9" opacity={0.6} />
      ))}
      <path d={`M${bed.x + 140},${blanketTop + 70} Q${bed.x + bed.w / 2},${blanketTop + 90} ${bed.x + bed.w + 30},${blanketTop + 80}`} fill="none" stroke={PALETTE.white} strokeWidth={3} strokeDasharray="10 9" opacity={0.6} />
      <path d={edge} fill="none" stroke={PALETTE.white} strokeWidth={10} opacity={0.35} transform="translate(0 12)" />
      <rect x={bed.x + 20} y={blanketTop + 170} width={24} height={60} fill={wood} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <rect x={bed.x + bed.w - 30} y={blanketTop + 170} width={24} height={60} fill={wood} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    </svg>
  );
};

/** Seven-segment layout: which segments (a–g) light up for each digit. */
const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};

const segmentPath = (seg: string, x: number, y: number, w: number, h: number, t: number): string => {
  const hh = h / 2;
  const horiz = (yy: number) => `M${x + t},${yy} L${x + w - t},${yy} L${x + w - t * 1.6},${yy + t * 0.6} L${x + t * 1.6},${yy + t * 0.6} Z`;
  const vert = (xx: number, yy: number) => `M${xx},${yy + t} L${xx + t * 0.6},${yy + t * 1.6} L${xx + t * 0.6},${yy + hh - t * 1.2} L${xx},${yy + hh - t * 0.6} Z`;
  switch (seg) {
    case 'a':
      return horiz(y);
    case 'g':
      return horiz(y + hh - t * 0.3);
    case 'd':
      return horiz(y + h - t * 0.6);
    case 'f':
      return vert(x, y);
    case 'e':
      return vert(x, y + hh);
    case 'b':
      return vert(x + w - t * 0.6, y);
    default:
      return vert(x + w - t * 0.6, y + hh);
  }
};

export interface NightstandProps extends BedroomProps {
  /** "HH:MM" on the alarm clock. */
  time?: string;
}

/** Bedside table with a glowing seven-segment alarm clock. */
export const Nightstand: React.FC<NightstandProps> = ({morning = 0, time = '12:00'}) => {
  const frame = useCurrentFrame();
  const glow = useSvgId('clock-glow');
  const {nightstand: ns, clock} = BEDROOM_LAYOUT;
  const wood = mixTone(morning, TONES.woodNight, TONES.woodMorning);
  const colonOn = Math.floor(frame / 15) % 2 === 0;
  const digits = time.replace(':', '').split('');
  const dw = 28;
  const dh = 46;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <filter id={glow} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={4} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x={ns.x} y={ns.y} width={ns.w} height={ns.h} rx={10} fill={wood} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={ns.x - 12} y={ns.y - 10} width={ns.w + 24} height={24} rx={8} fill={wood} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={ns.x + 22} y={ns.y + 40} width={ns.w - 44} height={60} rx={8} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <circle cx={ns.x + ns.w / 2} cy={ns.y + 70} r={8} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={INK.fine} />
      <rect x={ns.x + 22} y={ns.y + 120} width={ns.w - 44} height={60} rx={8} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <circle cx={ns.x + ns.w / 2} cy={ns.y + 150} r={8} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={INK.fine} />

      <g transform={`translate(${clock.x} ${clock.y})`}>
        <rect x={0} y={0} width={190} height={80} rx={18} fill="#312E81" stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <rect x={14} y={12} width={162} height={56} rx={8} fill="#0B0B1A" stroke={PALETTE.ink} strokeWidth={INK.fine} />
        <g filter={`url(#${glow})`} fill={TONES.ledRed}>
          {digits.map((ch, i) => {
            const x = 24 + i * 38 + (i >= 2 ? 14 : 0);
            return (SEGMENTS[ch] ?? '').split('').map((seg) => <path key={`${i}-${seg}`} d={segmentPath(seg, x, 18, dw, dh - 4, 6)} />);
          })}
          {colonOn ? (
            <>
              <circle cx={95} cy={32} r={3.5} />
              <circle cx={95} cy={52} r={3.5} />
            </>
          ) : null}
        </g>
        <rect x={20} y={80} width={20} height={10} fill="#312E81" stroke={PALETTE.ink} strokeWidth={INK.fine} />
        <rect x={150} y={80} width={20} height={10} fill="#312E81" stroke={PALETTE.ink} strokeWidth={INK.fine} />
      </g>
    </svg>
  );
};
