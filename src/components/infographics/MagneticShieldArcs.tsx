import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE, TONES} from '../../theme';
import type {Point} from '../../types/characters';
import {clamp} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';

export interface MagneticShieldArcsProps {
  /** Earth centre and radius in the parent's px. */
  earth: {x: number; y: number; r: number};
  /** Field lines draw on from 0 to 1. */
  progress: number;
  /** How strongly the solar wind is pushed around Earth, 0..1. */
  deflection: number;
  /** Solar wind opacity, 0 hides it. */
  wind?: number;
  /** Where the wind enters from (sun side x) and leaves (far side x), in px. */
  windFrom?: number;
  windTo?: number;
  width?: number;
  height?: number;
}

/** L-shells (in Earth radii) of the drawn dipole field lines. */
const SHELLS = [1.45, 1.9, 2.5, 3.2];
const SUNWARD_SQUASH = 0.7;

/**
 * One dipole field line r = L·sin²θ, squashed on the sunward (left) side and
 * stretched into a tail on the night side, like a real magnetosphere.
 */
const fieldLine = (earth: Point & {r: number}, L: number, side: -1 | 1): Point[] => {
  const th0 = Math.asin(Math.sqrt(1 / L));
  const pts: Point[] = [];
  const steps = 48;
  const squash = side < 0 ? SUNWARD_SQUASH : 1 + 0.22 * L;
  for (let i = 0; i <= steps; i++) {
    const th = th0 + ((Math.PI - 2 * th0) * i) / steps;
    const r = L * Math.sin(th) ** 2;
    pts.push({
      x: earth.x + side * r * Math.sin(th) * earth.r * squash,
      y: earth.y - r * Math.cos(th) * earth.r,
    });
  }
  return pts;
};

const toPath = (pts: readonly Point[]): string => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

const pathLength = (pts: readonly Point[]): number => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
};

/**
 * Pulsing neon-green magnetosphere with yellow solar-wind streamlines that
 * bend around it as `deflection` rises.
 */
export const MagneticShieldArcs: React.FC<MagneticShieldArcsProps> = ({
  earth,
  progress,
  deflection,
  wind = 1,
  windFrom = 0,
  windTo = 1920,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const glowId = useSvgId('shield-glow');
  const p = clamp(progress);
  const d = clamp(deflection);

  // Magnetopause: the shield's nose sits just outside the outermost sunward field line.
  const nose = earth.x - earth.r * SHELLS[SHELLS.length - 1] * SUNWARD_SQUASH - earth.r * 0.55;
  const halfWidth = earth.r * 3.1;

  const windY = (x: number, y0: number): number => {
    // Smooth step that turns on as the flow reaches the magnetopause nose.
    const s = 1 / (1 + Math.exp(-(x - nose + earth.r * 0.4) / (earth.r * 0.28)));
    const flare = 1 + 0.08 * Math.max(0, (x - earth.x) / earth.r);
    const D = halfWidth * d * flare;
    return earth.y + Math.sign(y0) * Math.sqrt(y0 * y0 + D * D * s);
  };

  const offsets = [-4.2, -3.4, -2.6, -1.8, -1.05, -0.4, 0.4, 1.05, 1.8, 2.6, 3.4, 4.2].map((k) => k * earth.r);
  const pulse = 0.75 + 0.25 * Math.sin(frame * 0.15);

  const lines = SHELLS.flatMap((L) => [fieldLine(earth, L, -1), fieldLine(earth, L, 1)]);

  return (
    <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>

      {/* Solar wind */}
      {wind > 0
        ? offsets.map((y0, i) => {
            const pts: Point[] = [];
            for (let x = windFrom; x <= windTo; x += 16) {
              pts.push({x, y: windY(x, y0)});
            }
            const dpath = toPath(pts);
            const speed = 9 + random(`wind-speed-${i}`) * 5;
            return (
              <g key={i} opacity={wind}>
                <path d={dpath} fill="none" stroke={PALETTE.ink} strokeWidth={11} strokeLinecap="round" strokeDasharray="70 46" strokeDashoffset={-frame * speed - i * 37} />
                <path d={dpath} fill="none" stroke={TONES.windYellow} strokeWidth={5} strokeLinecap="round" strokeDasharray="70 46" strokeDashoffset={-frame * speed - i * 37} />
              </g>
            );
          })
        : null}
      {wind > 0
        ? offsets.flatMap((y0, i) =>
            [0, 1].map((k) => {
              const span = windTo - windFrom;
              const x = windFrom + ((frame * (12 + i % 3 * 3) + random(`wind-p-${i}-${k}`) * span) % span);
              return <circle key={`${i}-${k}`} cx={x} cy={windY(x, y0)} r={7} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={3} opacity={wind} />;
            }),
          )
        : null}

      {/* Magnetopause shell */}
      {p > 0 ? (
        <path
          d={`M${nose + earth.r * 3.6},${earth.y - halfWidth * 1.15} Q${nose - earth.r * 0.25},${earth.y - halfWidth * 0.95} ${nose},${earth.y} Q${nose - earth.r * 0.25},${earth.y + halfWidth * 0.95} ${nose + earth.r * 3.6},${earth.y + halfWidth * 1.15}`}
          fill="none"
          stroke={TONES.shieldGreen}
          strokeWidth={16}
          opacity={0.3 * p * pulse}
          filter={`url(#${glowId})`}
        />
      ) : null}

      {/* Field lines: blurred glow, ink outline, neon core, travelling sparks */}
      {lines.map((pts, i) => {
        const len = pathLength(pts);
        const dpath = toPath(pts);
        const drawn = {strokeDasharray: len, strokeDashoffset: len * (1 - p)};
        return (
          <g key={i}>
            <path d={dpath} fill="none" stroke={TONES.shieldGreen} strokeWidth={20} opacity={0.55 * pulse} filter={`url(#${glowId})`} {...drawn} />
            <path d={dpath} fill="none" stroke={PALETTE.ink} strokeWidth={12} strokeLinecap="round" {...drawn} />
            <path d={dpath} fill="none" stroke={TONES.shieldGreen} strokeWidth={7} strokeLinecap="round" {...drawn} />
            <path d={dpath} fill="none" stroke={PALETTE.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} {...drawn} />
            {p >= 1 ? (
              <path d={dpath} fill="none" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 60" strokeDashoffset={-frame * 3 - i * 11} />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
