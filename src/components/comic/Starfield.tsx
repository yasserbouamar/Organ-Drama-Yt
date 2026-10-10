import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../theme';

export interface StarfieldProps {
  count?: number;
  seed?: string;
  /** Screen-space drift in px per frame (parallax). */
  drift?: {x: number; y: number};
  opacity?: number;
}

const sparkle = (x: number, y: number, r: number): string =>
  `M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r} Z`;

/** Twinkling dots plus a few four-point comic sparkles. */
export const Starfield: React.FC<StarfieldProps> = ({
  count = 140,
  seed = 'stars',
  drift = {x: 0, y: 0},
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const stars = Array.from({length: count}, (_, i) => {
    const x = (((random(`${seed}-x-${i}`) * width + drift.x * frame) % width) + width) % width;
    const y = (((random(`${seed}-y-${i}`) * height + drift.y * frame) % height) + height) % height;
    const size = 1.2 + random(`${seed}-s-${i}`) ** 3 * 4;
    const twinkle = 0.55 + 0.45 * Math.sin(frame * (0.05 + random(`${seed}-t-${i}`) * 0.12) + i);
    const isSparkle = random(`${seed}-k-${i}`) > 0.92;
    const color = random(`${seed}-c-${i}`) > 0.8 ? PALETTE.electricCyan : PALETTE.white;
    return isSparkle ? (
      <path key={i} d={sparkle(x, y, size * 3.2 * (0.7 + twinkle * 0.5))} fill={PALETTE.hazardYellow} opacity={twinkle} />
    ) : (
      <circle key={i} cx={x} cy={y} r={size} fill={color} opacity={twinkle} />
    );
  });
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={width} height={height}>
        {stars}
      </svg>
    </AbsoluteFill>
  );
};
