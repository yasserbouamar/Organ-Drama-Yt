import React from 'react';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {Sticker} from '../comic/Sticker';

export interface StreetSignProps {
  street: string;
  plaque?: string;
  /** Width in px. */
  size?: number;
}

/** Green street sign on a pole, with an optional plaque underneath. */
export const StreetSign: React.FC<StreetSignProps> = ({street, plaque, size = 420}) => {
  const s = size / 420;
  return (
    <Sticker bleed={0.2}>
      <svg width={size} height={330 * s} viewBox="0 0 420 330" style={{display: 'block'}}>
        <rect x={196} y={60} width={28} height={270} rx={6} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <rect x={10} y={10} width={400} height={90} rx={12} fill="#0E8A47" stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <rect x={22} y={22} width={376} height={66} rx={7} fill="none" stroke={PALETTE.white} strokeWidth={5} />
        <text x={210} y={73} textAnchor="middle" fontFamily={FONTS.display} fontSize={48} fill={PALETTE.white} letterSpacing={3}>
          {street}
        </text>
        {plaque ? (
          <g transform="rotate(-4 210 150)">
            <rect x={90} y={122} width={240} height={56} rx={8} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.medium} />
            <text x={210} y={160} textAnchor="middle" fontFamily={FONTS.body} fontWeight={900} fontSize={24} fill={TONES.stampRed} letterSpacing={2}>
              {plaque}
            </text>
          </g>
        ) : null}
      </svg>
    </Sticker>
  );
};
