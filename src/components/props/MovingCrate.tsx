import React from 'react';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {Sticker} from '../comic/Sticker';

export interface MovingCrateProps {
  /** Width in px. */
  size?: number;
  /** 0 = shut, 1 = lid flung open. */
  lidOpen?: number;
  label?: string;
  sticker?: boolean;
}

const W = 300;
const H = 250;

/** Wooden moving crate with a hinged lid and stencilled labels. */
export const MovingCrate: React.FC<MovingCrateProps> = ({size = 300, lidOpen = 0, label = 'HOME STUFF', sticker = true}) => {
  const s = size / W;
  const art = (
    <svg width={size} height={H * s} viewBox={`0 0 ${W} ${H}`} overflow="visible" style={{display: 'block'}}>
      {/* Box */}
      <rect x={14} y={64} width={272} height={176} rx={8} fill={TONES.wood} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      {[108, 152, 196].map((y) => (
        <path key={y} d={`M18,${y} L282,${y}`} stroke={TONES.woodDark} strokeWidth={4} />
      ))}
      <rect x={14} y={64} width={34} height={176} fill={TONES.woodDark} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <rect x={252} y={64} width={34} height={176} fill={TONES.woodDark} stroke={PALETTE.ink} strokeWidth={INK.medium} />
      <text x={150} y={142} textAnchor="middle" fontFamily={FONTS.display} fontSize={34} fill={PALETTE.ink} letterSpacing={2}>
        {label}
      </text>
      <g transform="rotate(-8 150 196)">
        <rect x={86} y={176} width={128} height={38} rx={6} fill="none" stroke={TONES.stampRed} strokeWidth={5} />
        <text x={150} y={205} textAnchor="middle" fontFamily={FONTS.display} fontSize={28} fill={TONES.stampRed} letterSpacing={3}>
          FRAGILE
        </text>
      </g>
      {/* Lid hinged on the back-left corner */}
      <g transform={`rotate(${-118 * lidOpen} 10 64)`}>
        <rect x={6} y={44} width={288} height={30} rx={6} fill="#DB9450" stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <path d="M30,58 L270,58" stroke={TONES.woodDark} strokeWidth={4} />
      </g>
    </svg>
  );
  return sticker ? <Sticker bleed={0.4}>{art}</Sticker> : art;
};
