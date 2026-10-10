import React from 'react';
import {INK, PALETTE, TONES} from '../../../theme';
import {dropPath} from '../../../utils/geometry';

export interface TearsProps {
  eyes: readonly {x: number; y: number; side: -1 | 1}[];
  frame: number;
  /** 0..1 */
  amount?: number;
  scale?: number;
}

/** Cartoon crying: two arcing tear fountains and falling drops. */
export const Tears: React.FC<TearsProps> = ({eyes, frame, amount = 1, scale = 1}) => (
  <g opacity={amount}>
    {eyes.map((e) =>
      [0, 1, 2, 3].map((i) => {
        const phase = (frame * 0.06 + i / 4) % 1;
        const x = e.x + e.side * (18 + phase * 90) * scale;
        const y = e.y + (10 + phase * phase * 110 - phase * 26) * scale;
        return (
          <path
            key={`${e.side}-${i}`}
            d={dropPath(x, y, 14 * scale * (1 - phase * 0.4))}
            fill={TONES.tear}
            stroke={PALETTE.ink}
            strokeWidth={INK.fine}
            transform={`rotate(${e.side * 50 * (1 - phase)} ${x} ${y})`}
          />
        );
      }),
    )}
    {eyes.map((e) => (
      <path
        key={`stream-${e.side}`}
        d={`M${e.x + e.side * 16 * scale},${e.y + 8 * scale} Q${e.x + e.side * 44 * scale},${e.y - 12 * scale} ${e.x + e.side * 62 * scale},${e.y + 14 * scale}`}
        fill="none"
        stroke={TONES.tear}
        strokeWidth={9 * scale}
        strokeLinecap="round"
      />
    ))}
  </g>
);
