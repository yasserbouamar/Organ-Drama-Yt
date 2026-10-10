import React from 'react';
import {FONTS, INK, PALETTE, TONES} from '../../theme';

export const CAGE_SIZE = {width: 440, height: 460} as const;
/** Cable anchor points on the cage roof, in the cage's local px (at size 440). */
export const CAGE_CABLES = [
  {x: 140, y: 18},
  {x: 300, y: 18},
] as const;

export interface ElevatorCageProps {
  /** Width in px. */
  size?: number;
  /** Cables drawn upward from the roof, in local px. 0 hides them. */
  cableLength?: number;
  /** Lamp glow colour inside the cage. */
  lamp?: string;
  /** Riders, laid out in the cage's local px (0..440 × 0..460). */
  children?: React.ReactNode;
}

/** Industrial elevator cage: riders are drawn between the back wall and the front bars. */
export const ElevatorCage: React.FC<ElevatorCageProps> = ({size = 440, cableLength = 0, lamp = PALETTE.hazardYellow, children}) => {
  const s = size / CAGE_SIZE.width;
  const {width: W, height: H} = CAGE_SIZE;
  return (
    <div style={{position: 'relative', width: size, height: H * s}}>
      <svg width={size} height={H * s} viewBox={`0 0 ${W} ${H}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
        {cableLength > 0
          ? CAGE_CABLES.map((c) => (
              <g key={c.x}>
                <path d={`M${c.x},${c.y} L${c.x},${c.y - cableLength}`} stroke={PALETTE.ink} strokeWidth={14} />
                <path d={`M${c.x},${c.y} L${c.x},${c.y - cableLength}`} stroke={TONES.steel} strokeWidth={6} strokeDasharray="10 6" />
              </g>
            ))
          : null}
        <rect x={20} y={40} width={400} height={380} rx={10} fill="#1B1638" stroke={PALETTE.ink} strokeWidth={INK.bold} />
        {Array.from({length: 7}, (_, i) => (
          <path key={i} d={`M${20 + i * 66},44 L${20 + i * 66},416`} stroke="#2A2356" strokeWidth={6} />
        ))}
        <ellipse cx={220} cy={90} rx={160} ry={60} fill={lamp} opacity={0.18} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0'}}>{children}</div>
      <svg width={size} height={H * s} viewBox={`0 0 ${W} ${H}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
        {/* Front bars */}
        {Array.from({length: 9}, (_, i) => {
          const x = 46 + i * 43.5;
          return (
            <g key={i}>
              <path d={`M${x},52 L${x},404`} stroke={PALETTE.ink} strokeWidth={11} />
              <path d={`M${x},52 L${x},404`} stroke={TONES.steel} strokeWidth={4.5} />
            </g>
          );
        })}
        <rect x={6} y={18} width={428} height={40} rx={8} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        {CAGE_CABLES.map((c) => (
          <circle key={c.x} cx={c.x} cy={c.y + 4} r={11} fill={TONES.steelDark} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        ))}
        <rect x={0} y={400} width={440} height={44} rx={8} fill={TONES.steelDark} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <path d="M20,422 L420,422" stroke={TONES.steel} strokeWidth={4} strokeDasharray="18 10" />
        <rect x={6} y={18} width={22} height={420} rx={6} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <rect x={412} y={18} width={22} height={420} rx={6} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <rect x={168} y={-6} width={104} height={30} rx={6} fill={PALETTE.ink} />
        <text x={220} y={17} textAnchor="middle" fontFamily={FONTS.display} fontSize={22} fill={PALETTE.hazardYellow} letterSpacing={2}>
          ▼ DOWN
        </text>
      </svg>
    </div>
  );
};
