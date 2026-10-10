import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export const TAXI_VIEWBOX = {width: 320, height: 240} as const;

export interface RedBloodCellTaxiProps {
  size?: number;
  /** 0..1 speed: wobble, exhaust puffs and speed lines. */
  speed?: number;
  /** Headlights and roof sign flash (horn). */
  honk?: number;
  /** Which way the speed lines trail: behind a sideways drive, or below a climb. */
  trail?: 'left' | 'down';
}

/** A red blood cell moonlighting as a taxi: a biconcave red disc with a checkered band and a roof sign. */
export const RedBloodCellTaxi: React.FC<RedBloodCellTaxiProps> = ({size = 320, speed = 0, honk = 0, trail = 'left'}) => {
  const frame = useCurrentFrame();
  const cellGrad = useSvgId('rbc-grad');
  const height = (size * TAXI_VIEWBOX.height) / TAXI_VIEWBOX.width;
  const wobble = Math.sin(frame * 0.5) * 3 * (0.3 + speed);
  const flash = honk * (Math.floor(frame / 3) % 2 === 0 ? 1 : 0.4);
  return (
    <div style={{position: 'relative', width: size, height}}>
      <svg width={size} height={height} viewBox={`0 0 ${TAXI_VIEWBOX.width} ${TAXI_VIEWBOX.height}`} overflow="visible" style={{display: 'block'}}>
        <defs>
          <radialGradient id={cellGrad} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#991B1B" />
            <stop offset="0.45" stopColor="#B91C1C" />
            <stop offset="0.7" stopColor={TONES.bloodRed} />
            <stop offset="1" stopColor="#F87171" />
          </radialGradient>
        </defs>
        {speed > 0.05
          ? [0, 1, 2].map((i) =>
              trail === 'left' ? (
                <line key={i} x1={-20 - i * 30} y1={150 + i * 24} x2={-120 - i * 50} y2={150 + i * 24} stroke={PALETTE.white} strokeWidth={8} strokeLinecap="round" opacity={speed * 0.8} />
              ) : (
                <line key={i} x1={90 + i * 70} y1={250 + (i % 2) * 30} x2={90 + i * 70} y2={380 + (i % 2) * 60} stroke={PALETTE.white} strokeWidth={8} strokeLinecap="round" opacity={speed * 0.8} />
              ),
            )
          : null}
        <g transform={`translate(0 ${wobble}) rotate(${wobble * 0.6} 160 160)`}>
          <ellipse cx={160} cy={164} rx={150} ry={62} fill={`url(#${cellGrad})`} stroke={PALETTE.ink} strokeWidth={INK.bold} />
          <ellipse cx={160} cy={156} rx={84} ry={26} fill="#7F1D1D" opacity={0.55} />
          <ellipse cx={110} cy={138} rx={40} ry={9} fill={PALETTE.white} opacity={0.35} />
          {/* Checkered taxi band. */}
          {Array.from({length: 16}, (_, i) => (
            <rect key={i} x={40 + i * 15} y={190 + (i % 2) * 7} width={15} height={7} fill={i % 2 === 0 ? PALETTE.ink : TONES.taxiYellow} />
          ))}
          <ellipse cx={296} cy={168} rx={10} ry={8} fill={honk > 0 ? '#FEF9C3' : '#FDE68A'} stroke={PALETTE.ink} strokeWidth={INK.fine} />
          {flash > 0 ? <path d="M306,168 L360,148 L360,188 Z" fill="#FEF9C3" opacity={0.6 * flash} /> : null}
          {/* Roof sign. */}
          <g transform="translate(160 100)">
            <rect x={-56} y={-30} width={112} height={40} rx={10} fill={TONES.taxiYellow} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <text x={0} y={2} textAnchor="middle" fontFamily={FONTS.display} fontSize={34} letterSpacing={3} fill={PALETTE.ink}>
              TAXI
            </text>
            {flash > 0 ? <rect x={-56} y={-30} width={112} height={40} rx={10} fill={PALETTE.white} opacity={0.35 * flash} /> : null}
          </g>
        </g>
        {speed > 0.05
          ? [0, 1].map((i) => {
              const t = ((frame * 0.08 + i * 0.5) % 1 + 1) % 1;
              return <circle key={`puff-${i}`} cx={10 - t * 70} cy={186 - t * 20} r={10 + t * 16} fill={PALETTE.white} opacity={(1 - t) * 0.6 * speed} />;
            })
          : null}
      </svg>
    </div>
  );
};

export interface BloodVesselProps {
  /** Vessel centreline, from bottom to top (world px). */
  path: string;
  width?: number;
  opacity?: number;
}

/** A blood vessel: a dark-red tube with plasma flowing upward. */
export const BloodVessel: React.FC<BloodVesselProps> = ({path, width = 190, opacity = 1}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" overflow="visible" style={{position: 'absolute', left: 0, top: 0, opacity}}>
      <path d={path} fill="none" stroke={PALETTE.ink} strokeWidth={width + 12} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#7F1D1D" strokeWidth={width} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#B91C1C" strokeWidth={width * 0.7} strokeLinecap="round" opacity={0.6} />
      <path d={path} fill="none" stroke="#FCA5A5" strokeWidth={10} strokeLinecap="round" strokeDasharray="30 60" strokeDashoffset={frame * 6} opacity={0.6} />
    </svg>
  );
};
