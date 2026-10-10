import React from 'react';
import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, PALETTE} from '../../theme';
import {popInOut} from '../../utils/animation';
import {burstPath} from '../../utils/geometry';

export interface ComicBurstProps {
  text: string;
  x: number;
  y: number;
  /** Frame (in the parent's timeline) when the burst pops in. */
  start: number;
  duration?: number;
  /** Outer radius in px. */
  size?: number;
  rotation?: number;
  fill?: string;
  textColor?: string;
  fontSize?: number;
}

/** Sound-effect burst ("BAM!", "SLAM!") that pops in and out. */
export const ComicBurst: React.FC<ComicBurstProps> = ({
  text,
  x,
  y,
  start,
  duration = 24,
  size = 150,
  rotation = -8,
  fill = PALETTE.hazardYellow,
  textColor = PALETTE.vividMagenta,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= start + duration) {
    return null;
  }
  const s = popInOut(frame, fps, start, start + duration, 6);
  const pad = 30;
  const box = size * 2 + pad * 2;
  const c = box / 2;
  const d = burstPath(c, c, size, size * 0.62, 12, (i) => 0.82 + random(`${text}-${i}`) * 0.3);
  const fs = fontSize ?? size * 0.62;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: box,
        height: box,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rotation}deg)`,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      <svg width={box} height={box} overflow="visible">
        <path d={d} fill={PALETTE.ink} transform="translate(8 10)" />
        <path d={d} fill={fill} stroke={PALETTE.ink} strokeWidth={7} strokeLinejoin="round" />
        <text
          x={c}
          y={c + fs * 0.34}
          textAnchor="middle"
          fontFamily={FONTS.display}
          fontSize={fs}
          letterSpacing={2}
          fill={textColor}
          stroke={PALETTE.ink}
          strokeWidth={7}
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          {text}
        </text>
      </svg>
    </div>
  );
};
