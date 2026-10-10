import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONTS, PALETTE} from '../../theme';

export interface ZzzProps {
  /** Where the Zs rise from (px in the parent's space). */
  x: number;
  y: number;
  /** Frames (parent timeline) the snoring runs. */
  start: number;
  end: number;
  size?: number;
  color?: string;
}

/** Snoring "Z"s that drift up and fade, one after another. */
export const Zzz: React.FC<ZzzProps> = ({x, y, start, end, size = 56, color = PALETTE.white}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) {
    return null;
  }
  const fadeOut = Math.min(1, (end - frame) / 10);
  return (
    <svg width={1920} height={1080} overflow="visible" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
      {[0, 1, 2].map((i) => {
        const t = (((frame - start) / 36 + i / 3) % 1 + 1) % 1;
        return (
          <text
            key={i}
            x={x + t * 70 + Math.sin(t * 6 + i) * 12}
            y={y - t * 160}
            fontFamily={FONTS.display}
            fontSize={size * (0.6 + t * 0.6)}
            fill={color}
            stroke={PALETTE.ink}
            strokeWidth={6}
            paintOrder="stroke fill"
            opacity={Math.sin(t * Math.PI) * fadeOut}
            transform={`rotate(${-10 + t * 20} ${x + t * 70} ${y - t * 160})`}
          >
            Z
          </text>
        );
      })}
    </svg>
  );
};
