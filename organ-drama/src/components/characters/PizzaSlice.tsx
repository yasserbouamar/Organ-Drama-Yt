import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import type {CharacterBaseProps, MouthShape} from '../../types/characters';
import {springBlink} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';
import {Eye} from './parts/Eye';
import {Limb} from './parts/Limb';
import {Mouth} from './parts/Mouth';

export const PIZZA_VIEWBOX = {width: 240, height: 280} as const;

export interface PizzaSliceArtProps {
  /** Show the face (sunglasses or eyes, and a mouth). */
  face?: boolean;
  glasses?: boolean;
  mouth?: MouthShape;
  look?: {x: number; y: number};
  blink?: number;
  /** Little stick arms; 0..1 waves the right one. */
  arms?: boolean;
  wave?: number;
  /** 0..1: how much of the tip has been bitten off. */
  bite?: number;
  frame?: number;
}

const CHEESE = 'M30,66 L210,66 L120,266 Z';
const CRUST = 'M14,68 C8,30 232,30 226,68 C226,84 212,86 198,79 C150,66 90,66 42,79 C28,86 14,84 14,68 Z';
const PEPPERONI = [
  {x: 62, y: 96, r: 12},
  {x: 178, y: 94, r: 11},
  {x: 122, y: 214, r: 15},
  {x: 86, y: 176, r: 9},
  {x: 156, y: 168, r: 10},
];

/**
 * The slice as raw SVG in a 240×280 box (tip pointing down), so it can be
 * drawn inside other puppets: the stomach window, the pizza box, a hand.
 */
export const PizzaSliceArt: React.FC<PizzaSliceArtProps> = ({
  face = true,
  glasses = true,
  mouth = 'grin',
  look = {x: 0, y: 0},
  blink = 0,
  arms = false,
  wave = 0,
  bite = 0,
  frame = 0,
}) => {
  const cheeseGrad = useSvgId('pizza-cheese');
  const crustGrad = useSvgId('pizza-crust');
  const biteMask = useSvgId('pizza-bite');
  const biteY = 266 - bite * 90;
  const waveAngle = 150 + Math.sin(frame * 0.6) * 25 * wave;

  return (
    <g>
      <defs>
        <linearGradient id={cheeseGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.6" stopColor={TONES.cheese} />
          <stop offset="1" stopColor={TONES.cheeseShade} />
        </linearGradient>
        <linearGradient id={crustGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor={TONES.crust} />
        </linearGradient>
        {bite > 0 ? (
          <mask id={biteMask}>
            <rect x={-20} y={-20} width={280} height={320} fill={PALETTE.white} />
            {[-34, -12, 12, 34].map((dx, i) => (
              <circle key={dx} cx={120 + dx} cy={biteY + 26 + (i % 2) * 6} r={22} fill="black" />
            ))}
          </mask>
        ) : null}
      </defs>
      {arms ? (
        <>
          <Limb from={{x: 44, y: 110}} length={46} side={-1} angle={40} bend={-20} width={8} color={TONES.crust} endSize={11} />
          <Limb from={{x: 196, y: 110}} length={46} side={1} angle={wave > 0 ? waveAngle : 40} bend={20} width={8} color={TONES.crust} endSize={11} />
        </>
      ) : null}
      <g mask={bite > 0 ? `url(#${biteMask})` : undefined}>
        <path d={CHEESE} fill={`url(#${cheeseGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <ellipse cx={100} cy={140} rx={14} ry={8} fill="#FEF3C7" opacity={0.8} />
        <ellipse cx={140} cy={236} rx={8} ry={5} fill="#FEF3C7" opacity={0.8} />
        {PEPPERONI.map((p) => (
          <g key={`${p.x}-${p.y}`}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={TONES.pepperoni} stroke={PALETTE.ink} strokeWidth={INK.fine} />
            <circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.2} r={p.r * 0.2} fill={TONES.pepperoniDark} />
            <circle cx={p.x + p.r * 0.35} cy={p.y + p.r * 0.3} r={p.r * 0.15} fill={TONES.pepperoniDark} />
          </g>
        ))}
      </g>
      <path d={CRUST} fill={`url(#${crustGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
      {[52, 92, 134, 176].map((x, i) => (
        <ellipse key={x} cx={x} cy={52 + (i % 2) * 6} rx={6} ry={3} fill={TONES.crust} opacity={0.7} />
      ))}
      {face ? (
        <>
          {glasses ? (
            <g>
              <path d="M44,112 L60,110 M196,112 L180,110" stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinecap="round" />
              <path d="M58,108 L114,108 L110,134 Q86,146 62,134 Z" fill={TONES.shades} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
              <path d="M126,108 L182,108 L178,134 Q154,146 130,134 Z" fill={TONES.shades} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
              <path d="M112,113 Q120,106 128,113" fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} />
              <path d="M70,114 L84,114 L72,130 Z M138,114 L152,114 L140,130 Z" fill={PALETTE.white} opacity={0.75} />
            </g>
          ) : (
            [
              {x: 90, side: -1 as const},
              {x: 150, side: 1 as const},
            ].map((e) => <Eye key={e.x} cx={e.x} cy={124} r={20} side={e.side} look={look} lid={blink} lidColor={TONES.cheese} pupil={0.5} />)
          )}
          <Mouth shape={mouth} x={120} y={172} scale={0.62} />
        </>
      ) : null}
    </g>
  );
};

export interface PizzaSliceProps extends Omit<CharacterBaseProps, 'expression'> {
  glasses?: boolean;
  arms?: boolean;
  wave?: number;
  bite?: number;
}

/** "Pizza Slice": golden, pepperoni-studded, and far too cool for its sunglasses. */
export const PizzaSlice: React.FC<PizzaSliceProps> = ({size = 200, mouth = 'grin', look, blink, style, glasses = true, arms = true, wave = 0, bite = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const height = (size * PIZZA_VIEWBOX.height) / PIZZA_VIEWBOX.width;
  return (
    <div style={{position: 'relative', width: size, height, ...style}}>
      <svg width={size} height={height} viewBox={`0 0 ${PIZZA_VIEWBOX.width} ${PIZZA_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <PizzaSliceArt
          glasses={glasses}
          mouth={mouth}
          look={look}
          blink={blink ?? springBlink(frame, fps, 'pizza')}
          arms={arms}
          wave={wave}
          bite={bite}
          frame={frame}
        />
      </svg>
    </div>
  );
};
