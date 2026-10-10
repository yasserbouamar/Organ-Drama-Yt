import React from 'react';
import {INK, PALETTE} from '../../theme';

/** Pluto, recognisable by its big pale heart (Tombaugh Regio). */
export const Pluto: React.FC<{size?: number}> = ({size = 140}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{display: 'block'}}>
    <circle cx={100} cy={100} r={92} fill="#C9A27E" />
    <path d="M30,70 Q60,50 80,80 Q60,100 40,96 Z" fill="#8C5E3C" opacity={0.7} />
    <path d="M150,150 Q170,120 186,130 Q176,170 150,176 Z" fill="#8C5E3C" opacity={0.6} />
    <path d="M110,150 C70,124 70,92 92,90 C104,89 110,100 110,104 C112,96 122,86 136,92 C156,102 146,132 110,150 Z" fill="#F4E6D2" />
    <circle cx={100} cy={100} r={92} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold + 2} />
    <ellipse cx={66} cy={56} rx={22} ry={11} fill={PALETTE.white} opacity={0.5} transform="rotate(-35 66 56)" />
  </svg>
);
