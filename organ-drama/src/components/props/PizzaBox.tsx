import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export const PIZZA_BOX_VIEWBOX = {width: 360, height: 300} as const;

export interface PizzaBoxProps {
  size?: number;
  /** Lid opening, 0..1. */
  open?: number;
  /** Golden glow + sparkles, 0..1. */
  glow?: number;
  /** Slices still in the box (of 8). */
  slicesLeft?: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A cardboard pizza box whose lid swings open on a golden, steaming pie. */
export const PizzaBox: React.FC<PizzaBoxProps> = ({size = 360, open = 0, glow = 0, slicesLeft = 8}) => {
  const frame = useCurrentFrame();
  const glowGrad = useSvgId('pizzabox-glow');
  const cheeseGrad = useSvgId('pizzabox-cheese');
  const height = (size * PIZZA_BOX_VIEWBOX.height) / PIZZA_BOX_VIEWBOX.width;
  // The lid hinges on the back edge (y = 160); its front edge swings from the front lip up and back.
  const fy = lerp(200, -10, open);
  const fxL = lerp(20, 52, open);
  const fxR = lerp(340, 308, open);
  const showingInside = open > 0.5;
  const pizzaC = {x: 180, y: 182};

  return (
    <div style={{position: 'relative', width: size, height}}>
      <svg width={size} height={height} viewBox={`0 0 ${PIZZA_BOX_VIEWBOX.width} ${PIZZA_BOX_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <radialGradient id={glowGrad}>
            <stop offset="0" stopColor="#FEF3C7" stopOpacity={0.95} />
            <stop offset="0.4" stopColor={TONES.gold} stopOpacity={0.55} />
            <stop offset="1" stopColor={TONES.gold} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={cheeseGrad}>
            <stop offset="0" stopColor="#FEF3C7" />
            <stop offset="1" stopColor={TONES.cheese} />
          </radialGradient>
        </defs>
        {glow > 0 ? <ellipse cx={180} cy={150} rx={260} ry={200} fill={`url(#${glowGrad})`} opacity={glow} /> : null}

        {/* Lid (behind the box when open). */}
        {showingInside ? (
          <path d={`M40,160 L320,160 L${fxR},${fy} L${fxL},${fy} Z`} fill="#F5E6C8" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        ) : null}

        {/* Base: inside floor and front wall. */}
        <path d="M40,160 L320,160 L340,200 L20,200 Z" fill="#E8C99A" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        {open > 0.05 ? (
          <g>
            <ellipse cx={pizzaC.x} cy={pizzaC.y} rx={142} ry={20} fill={TONES.crust} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <ellipse cx={pizzaC.x} cy={pizzaC.y - 1} rx={126} ry={15} fill={`url(#${cheeseGrad})`} />
            {Array.from({length: 8}, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const x = pizzaC.x + Math.cos(a) * 80;
              const y = pizzaC.y + Math.sin(a) * 9;
              return i < slicesLeft ? <ellipse key={i} cx={x} cy={y} rx={12} ry={4} fill={TONES.pepperoni} stroke={PALETTE.ink} strokeWidth={1.5} /> : null;
            })}
            {Array.from({length: 8 - Math.max(0, Math.min(8, slicesLeft))}, (_, i) => {
              const a0 = (i / 8) * Math.PI * 2 - Math.PI / 2;
              const a1 = a0 + Math.PI / 4;
              return (
                <path
                  key={`gone-${i}`}
                  d={`M${pizzaC.x},${pizzaC.y} L${pizzaC.x + Math.cos(a0) * 130},${pizzaC.y + Math.sin(a0) * 16} L${pizzaC.x + Math.cos(a1) * 130},${pizzaC.y + Math.sin(a1) * 16} Z`}
                  fill="#E8C99A"
                />
              );
            })}
          </g>
        ) : null}
        <path d="M20,200 L340,200 L340,252 Q180,262 20,252 Z" fill="#D6A76A" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
        <text x={180} y={240} textAnchor="middle" fontFamily={FONTS.display} fontSize={34} letterSpacing={3} fill={TONES.pepperoni} stroke={PALETTE.white} strokeWidth={5} paintOrder="stroke fill">
          HOT PIZZA
        </text>

        {/* Lid in front while it's still mostly closed. */}
        {!showingInside ? (
          <g>
            <path d={`M40,160 L320,160 L${fxR},${fy} L${fxL},${fy} Z`} fill="#E3B877" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
            {open < 0.25 ? (
              <ellipse cx={180} cy={(160 + fy) / 2} rx={70} ry={Math.max(2, (fy - 160) * 0.3)} fill="none" stroke={TONES.pepperoni} strokeWidth={INK.medium} />
            ) : null}
          </g>
        ) : null}

        {/* Steam and sparkles. */}
        {open > 0.3
          ? [0, 1, 2].map((i) => {
              const t = ((frame * 0.02 + i / 3) % 1 + 1) % 1;
              const x = 120 + i * 60 + Math.sin(frame * 0.1 + i) * 8;
              const y = 150 - t * 140;
              return (
                <path
                  key={`steam-${i}`}
                  d={`M${x},${y + 50} q-14,-12 0,-25 q14,-12 0,-25`}
                  fill="none"
                  stroke={PALETTE.white}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={interpolate(t, [0, 0.2, 1], [0, 0.75, 0]) * open}
                />
              );
            })
          : null}
        {glow > 0
          ? Array.from({length: 10}, (_, i) => {
              const t = ((frame * 0.03 + random(`spark-o-${i}`)) % 1 + 1) % 1;
              const x = 40 + random(`spark-x-${i}`) * 280;
              const y = 170 - t * 180;
              const r = 6 + random(`spark-r-${i}`) * 8;
              return (
                <path
                  key={`spark-${i}`}
                  d={`M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3} Z`}
                  fill="#FEF9C3"
                  opacity={glow * Math.sin(t * Math.PI)}
                />
              );
            })
          : null}
      </svg>
    </div>
  );
};
