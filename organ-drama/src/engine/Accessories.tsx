import React from 'react';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import type {Point} from '../types/characters';
import type {Accessory, HatType} from './types';

const ink = {stroke: PALETTE.ink, strokeWidth: INK.medium, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

/**
 * Hats are drawn 200 units wide with their brim centred on (0, 0), then
 * scaled to the head. `sway` wobbles soft hats.
 */
const Hat: React.FC<{type: HatType; color?: string; sway: number}> = ({type, color, sway}) => {
  switch (type) {
    case 'nightcap': {
      const c = color ?? TONES.capBlue;
      const cone = `M-92,-4 C-80,-80 -16,-130 ${58 + sway},-142 C${74 + sway},-138 ${84 + sway},-120 ${78 + sway * 0.6},-100 C64,-60 72,-30 94,-12 Z`;
      return (
        <g>
          <path d={cone} fill={TONES.capWhite} {...ink} strokeWidth={INK.bold} />
          {[-70, -34, 2, 38].map((x) => (
            <path key={x} d={`M${x},-6 C${x + 8},-50 ${x + 30},-96 ${x + 48 + sway * 0.4},-128`} stroke={c} strokeWidth={18} fill="none" opacity={0.95} />
          ))}
          <path d={cone} fill="none" {...ink} strokeWidth={INK.bold} />
          <rect x={-100} y={-24} width={200} height={34} rx={16} fill={TONES.capWhite} {...ink} strokeWidth={INK.bold} />
          <circle cx={70 + sway * 0.8} cy={-140} r={20} fill={TONES.capWhite} {...ink} strokeWidth={INK.bold} />
        </g>
      );
    }
    case 'tophat': {
      const band = color ?? PALETTE.brainPink;
      return (
        <g>
          <ellipse cx={0} cy={-6} rx={96} ry={16} fill={TONES.hatBlack} {...ink} strokeWidth={INK.bold} />
          <path d="M-58,-10 L-52,-130 C-52,-138 52,-138 52,-130 L58,-10 Z" fill={TONES.hatBlack} {...ink} strokeWidth={INK.bold} />
          <path d="M-57,-36 L57,-36 L58,-14 L-58,-14 Z" fill={band} stroke={PALETTE.ink} strokeWidth={INK.fine} />
          <path d="M-36,-122 L-34,-50" stroke="#4B5563" strokeWidth={8} strokeLinecap="round" />
        </g>
      );
    }
    case 'cap': {
      const c = color ?? '#EF4444';
      return (
        <g>
          <path d="M-84,-8 C-84,-96 84,-96 84,-8 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M40,-14 C90,-26 136,-18 150,-2 C120,8 70,6 40,-2 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M0,-86 L0,-12" stroke={PALETTE.ink} strokeWidth={INK.fine} opacity={0.5} />
          <circle cx={0} cy={-88} r={9} fill={c} {...ink} />
        </g>
      );
    }
    case 'crown': {
      const c = color ?? TONES.gold;
      return (
        <g>
          <path d="M-80,0 L-90,-96 L-46,-56 L0,-116 L46,-56 L90,-96 L80,0 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          {[-46, 0, 46].map((x, i) => (
            <circle key={x} cx={x} cy={-26} r={11} fill={['#EF4444', '#3B82F6', '#22C55E'][i]} {...ink} strokeWidth={INK.fine} />
          ))}
        </g>
      );
    }
    case 'beanie': {
      const c = color ?? '#F97316';
      return (
        <g>
          <path d="M-88,-10 C-88,-120 88,-120 88,-10 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <rect x={-94} y={-30} width={188} height={34} rx={12} fill={c} {...ink} strokeWidth={INK.bold} />
          {[-60, -30, 0, 30, 60].map((x) => (
            <path key={x} d={`M${x},-26 L${x},0`} stroke={PALETTE.ink} strokeWidth={INK.fine} opacity={0.4} />
          ))}
          <circle cx={sway * 0.5} cy={-112} r={22} fill={PALETTE.white} {...ink} strokeWidth={INK.bold} />
        </g>
      );
    }
    case 'chefHat':
      return (
        <g>
          <path d="M-60,-24 C-110,-40 -96,-120 -40,-110 C-30,-150 30,-150 40,-110 C96,-120 110,-40 60,-24 Z" fill={PALETTE.white} {...ink} strokeWidth={INK.bold} />
          <rect x={-64} y={-34} width={128} height={36} rx={8} fill={PALETTE.white} {...ink} strokeWidth={INK.bold} />
        </g>
      );
    case 'partyHat': {
      const c = color ?? '#A855F7';
      return (
        <g transform="rotate(8)">
          <path d="M-56,0 L0,-150 L56,0 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M-38,-48 L30,-80 M-20,-100 L18,-118 M-50,-14 L48,-40" stroke={TONES.gold} strokeWidth={10} />
          <path d="M-56,0 L0,-150 L56,0 Z" fill="none" {...ink} strokeWidth={INK.bold} />
          <circle cx={0} cy={-154} r={14} fill={TONES.gold} {...ink} />
        </g>
      );
    }
    case 'headband': {
      const c = color ?? '#EF4444';
      return (
        <g transform="translate(0 40)">
          <rect x={-98} y={-18} width={196} height={30} rx={10} fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M-60,-12 L-60,8 M60,-12 L60,8" stroke={PALETTE.white} strokeWidth={6} />
        </g>
      );
    }
    case 'bow': {
      const c = color ?? '#F472B6';
      return (
        <g transform="translate(46 -10) rotate(14)">
          <path d="M0,0 C-60,-50 -80,30 0,0 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M0,0 C60,-50 80,30 0,0 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <circle r={14} fill={c} {...ink} strokeWidth={INK.bold} />
        </g>
      );
    }
    case 'gradCap': {
      const c = color ?? TONES.hatBlack;
      return (
        <g>
          <path d="M-60,-6 L-60,-46 C-30,-58 30,-58 60,-46 L60,-6 C30,6 -30,6 -60,-6 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M0,-96 L120,-60 L0,-28 L-120,-60 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <path d={`M0,-62 L84,-56 L${90 + sway * 0.3},-10`} fill="none" stroke={TONES.gold} strokeWidth={6} />
          <rect x={82 + sway * 0.3} y={-14} width={16} height={26} rx={4} fill={TONES.gold} {...ink} strokeWidth={INK.fine} />
        </g>
      );
    }
    case 'hardhat': {
      const c = color ?? '#FACC15';
      return (
        <g>
          <path d="M-80,-8 C-84,-100 84,-100 80,-8 Z" fill={c} {...ink} strokeWidth={INK.bold} />
          <rect x={-104} y={-18} width={208} height={22} rx={10} fill={c} {...ink} strokeWidth={INK.bold} />
          <path d="M-20,-86 L-16,-14 M20,-86 L16,-14" stroke={PALETTE.ink} strokeWidth={INK.fine} opacity={0.5} />
        </g>
      );
    }
  }
};

export interface FaceGeometry {
  eyes: readonly [Point, Point];
  eyeR: number;
  mouth: Point;
}

const FaceWear: React.FC<{acc: Accessory; face: FaceGeometry}> = ({acc, face}) => {
  const [a, b] = face.eyes;
  const r = face.eyeR;
  switch (acc.type) {
    case 'glasses':
      return (
        <g fill="none" stroke={acc.color ?? PALETTE.ink} strokeWidth={INK.bold}>
          <circle cx={a.x} cy={a.y} r={r * 1.18} />
          <circle cx={b.x} cy={b.y} r={r * 1.18} />
          <path d={`M${a.x + r * 1.18},${a.y - 4} Q${(a.x + b.x) / 2},${a.y - r * 0.5} ${b.x - r * 1.18},${b.y - 4}`} />
        </g>
      );
    case 'shades': {
      const lens = (p: Point) => `M${p.x - r * 1.25},${p.y - r * 0.55} L${p.x + r * 1.2},${p.y - r * 0.55} C${p.x + r * 1.2},${p.y + r * 0.9} ${p.x - r * 1.2},${p.y + r * 0.9} ${p.x - r * 1.25},${p.y - r * 0.55} Z`;
      return (
        <g>
          <path d={`M${a.x + r},${a.y - r * 0.45} L${b.x - r},${b.y - r * 0.45}`} stroke={PALETTE.ink} strokeWidth={INK.bold} />
          {[a, b].map((p) => (
            <g key={p.x}>
              <path d={lens(p)} fill={acc.color ?? TONES.shades} {...ink} strokeWidth={INK.bold} />
              <path d={`M${p.x - r * 0.8},${p.y - r * 0.25} L${p.x - r * 0.3},${p.y - r * 0.25}`} stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
            </g>
          ))}
        </g>
      );
    }
    case 'monocle':
      return (
        <g fill="none" stroke={acc.color ?? TONES.gold} strokeWidth={INK.bold}>
          <circle cx={b.x} cy={b.y} r={r * 1.2} />
          <path d={`M${b.x + r * 1.1},${b.y + r * 0.5} C${b.x + r * 1.6},${b.y + r * 2} ${b.x + r * 0.6},${b.y + r * 2.6} ${b.x + r * 1.4},${b.y + r * 3.4}`} strokeWidth={3} />
        </g>
      );
    case 'mustache': {
      const y = face.mouth.y - r * 0.55;
      const x = face.mouth.x;
      const w = r * 1.3;
      const lobe = (s: 1 | -1) => `M${x},${y} C${x + s * w * 0.3},${y - 16} ${x + s * w * 0.8},${y - 14} ${x + s * w},${y - 4} C${x + s * w * 1.15},${y + 2} ${x + s * w * 1.25},${y - 8} ${x + s * w * 1.2},${y - 20} C${x + s * w * 1.45},${y + 6} ${x + s * w * 1.1},${y + 22} ${x + s * w * 0.7},${y + 16} C${x + s * w * 0.4},${y + 12} ${x + s * w * 0.15},${y + 12} ${x},${y + 8} Z`;
      return (
        <g>
          {([-1, 1] as const).map((s) => (
            <path key={s} d={lobe(s)} fill={acc.color ?? TONES.mustache} {...ink} />
          ))}
        </g>
      );
    }
    default:
      return null;
  }
};

const NeckWear: React.FC<{acc: Accessory; at: Point; scale: number}> = ({acc, at, scale}) => {
  const t = `translate(${at.x} ${at.y}) scale(${scale})`;
  switch (acc.type) {
    case 'tie': {
      const c = acc.color ?? TONES.tieBlue;
      return (
        <g transform={t}>
          <path d="M-14,0 L14,0 L10,18 L-10,18 Z" fill={c} {...ink} />
          <path d="M-10,18 L10,18 L20,84 L0,104 L-20,84 Z" fill={c} {...ink} />
          <path d="M-12,40 L14,32 M-16,64 L18,56" stroke={TONES.tieBlueDark} strokeWidth={6} />
        </g>
      );
    }
    case 'bowtie': {
      const c = acc.color ?? '#EF4444';
      return (
        <g transform={t}>
          <path d="M0,0 L-40,-22 L-40,22 Z" fill={c} {...ink} />
          <path d="M0,0 L40,-22 L40,22 Z" fill={c} {...ink} />
          <circle r={10} fill={c} {...ink} />
        </g>
      );
    }
    case 'scarf': {
      const c = acc.color ?? '#22C55E';
      return (
        <g transform={t}>
          <path d="M-70,-14 C-30,6 30,6 70,-14 L74,12 C30,32 -30,32 -74,12 Z" fill={c} {...ink} />
          <path d="M30,16 L50,90 L24,94 L10,20 Z" fill={c} {...ink} />
          <path d="M-40,8 L-36,24 M0,14 L0,30 M40,8 L36,24" stroke={PALETTE.white} strokeWidth={5} opacity={0.6} />
        </g>
      );
    }
    case 'badge': {
      const c = acc.color ?? TONES.gold;
      return (
        <g transform={`${t} translate(-46 -6)`}>
          <circle r={30} fill={c} {...ink} />
          <text y={9} textAnchor="middle" fontFamily={FONTS.display} fontSize={(acc.label ?? '').length > 3 ? 18 : 26} fill={PALETTE.ink}>
            {acc.label ?? '★'}
          </text>
        </g>
      );
    }
    default:
      return null;
  }
};

const HATS: readonly string[] = ['nightcap', 'tophat', 'cap', 'crown', 'beanie', 'chefHat', 'partyHat', 'headband', 'bow', 'gradCap', 'hardhat'];
const FACE: readonly string[] = ['glasses', 'shades', 'mustache', 'monocle'];

export interface AccessoriesProps {
  items: readonly Accessory[];
  head: {x: number; y: number; width: number; tilt?: number};
  face: FaceGeometry;
  neck?: Point;
  /** Hat bounce on a startle/jump, in units. */
  lift?: number;
  sway?: number;
}

/** Neckwear, then facewear, then the hat on top. */
export const Accessories: React.FC<AccessoriesProps> = ({items, head, face, neck, lift = 0, sway = 0}) => {
  const scale = (Math.min(head.width, 220) / 200) * 0.9;
  return (
    <>
      {neck ? items.filter((a) => !HATS.includes(a.type) && !FACE.includes(a.type)).map((a) => <NeckWear key={a.type} acc={a} at={neck} scale={head.width / 200} />) : null}
      {items.filter((a) => FACE.includes(a.type)).map((a) => <FaceWear key={a.type} acc={a} face={face} />)}
      {items
        .filter((a) => HATS.includes(a.type))
        .map((a) => (
          <g key={a.type} transform={`translate(${head.x} ${head.y - lift}) rotate(${head.tilt ?? -6}) scale(${scale})`}>
            <Hat type={a.type as HatType} color={a.color} sway={sway} />
          </g>
        ))}
    </>
  );
};
