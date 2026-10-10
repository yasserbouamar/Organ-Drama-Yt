import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../theme';

export interface PanelWipeProps {
  /** Absolute frame of the cut. The screen is fully covered on `at - 1` and `at`. */
  at: number;
  colors?: readonly string[];
  bands?: number;
}

/**
 * Comic transition: slanted ink-edged bands slide in to hide a hard cut,
 * then slide away to reveal the next panel.
 */
export const PanelWipe: React.FC<PanelWipeProps> = ({
  at,
  colors = [PALETTE.hazardYellow, PALETTE.vividMagenta, PALETTE.electricCyan],
  bands = 6,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (frame < at - 14 || frame > at + 14) {
    return null;
  }
  const bandH = height / bands;
  const travel = width + 600;
  return (
    <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        {Array.from({length: bands}, (_, i) => {
          const inX = interpolate(frame, [at - 13 + i, at - 1], [-travel, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const outX = interpolate(frame, [at + 1 + i * 0.6, at + 10 + i * 0.6], [0, travel], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.in(Easing.cubic),
          });
          const x = frame <= at ? inX : outX;
          const y = i * bandH;
          const skew = 160;
          const d = `M${-300 + x},${y - 4} L${width + 300 + x},${y - 4} L${width + 300 - skew + x},${y + bandH + 4} L${
            -300 - skew + x
          },${y + bandH + 4} Z`;
          return (
            <path key={i} d={d} fill={colors[i % colors.length]} stroke={PALETTE.ink} strokeWidth={10} strokeLinejoin="round" />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
