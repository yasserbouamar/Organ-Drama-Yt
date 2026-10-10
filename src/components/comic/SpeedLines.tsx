import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../theme';
import {polar} from '../../utils/geometry';

export interface SpeedLinesProps {
  /** `radial` = focus lines toward a point; `horizontal`/`vertical` = streaks flying past. */
  variant: 'radial' | 'horizontal' | 'vertical';
  color?: string;
  count?: number;
  opacity?: number;
  seed?: string;
  /** Radial focus point in px. */
  center?: {x: number; y: number};
  /** Clear area around the focus point (radial only), in px. */
  innerRadius?: number;
  /** Max stroke thickness in px. */
  thickness?: number;
  /** Streak speed in px per frame (linear variants). Negative reverses direction. */
  speed?: number;
  style?: React.CSSProperties;
}

/** Comic action lines: flickering radial focus lines or streaks moving across the frame. */
export const SpeedLines: React.FC<SpeedLinesProps> = ({
  variant,
  color = PALETTE.white,
  count = 48,
  opacity = 0.9,
  seed = 'speed',
  center,
  innerRadius = 320,
  thickness = 14,
  speed = 60,
  style,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  if (variant === 'radial') {
    const cx = center?.x ?? width / 2;
    const cy = center?.y ?? height / 2;
    const outer = Math.hypot(width, height);
    // Re-roll the line lengths every 2 frames for the classic comic flicker.
    const tick = Math.floor(frame / 2);
    const paths = Array.from({length: count}, (_, i) => {
      const a = (i / count) * 360 + random(`${seed}-a-${i}`) * (360 / count);
      const inner = innerRadius * (0.85 + random(`${seed}-r-${i}-${tick}`) * 0.6);
      const half = (thickness / 2) * (0.4 + random(`${seed}-w-${i}`) * 0.8);
      const halfDeg = (Math.atan2(half, outer) * 180) / Math.PI;
      const tip = polar(cx, cy, inner, a);
      const e0 = polar(cx, cy, outer, a - halfDeg);
      const e1 = polar(cx, cy, outer, a + halfDeg);
      return `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${e0.x.toFixed(1)},${e0.y.toFixed(1)} L${e1.x.toFixed(
        1,
      )},${e1.y.toFixed(1)} Z`;
    });
    return (
      <AbsoluteFill style={{opacity, pointerEvents: 'none', ...style}}>
        <svg width={width} height={height}>
          <path d={paths.join(' ')} fill={color} />
        </svg>
      </AbsoluteFill>
    );
  }

  const horizontal = variant === 'horizontal';
  const span = horizontal ? width : height;
  const cross = horizontal ? height : width;
  const streaks = Array.from({length: count}, (_, i) => {
    const len = 160 + random(`${seed}-len-${i}`) * 520;
    const pos = random(`${seed}-pos-${i}`) * cross;
    const v = speed * (0.6 + random(`${seed}-v-${i}`) * 0.9);
    const start = random(`${seed}-start-${i}`) * (span + len);
    const travel = (((start + frame * v) % (span + len)) + span + len) % (span + len);
    const along = travel - len;
    const w = Math.max(2, thickness * (0.25 + random(`${seed}-th-${i}`) * 0.75));
    const o = 0.35 + random(`${seed}-o-${i}`) * 0.65;
    return horizontal ? (
      <rect key={i} x={along} y={pos} width={len} height={w} rx={w / 2} fill={color} opacity={o} />
    ) : (
      <rect key={i} x={pos} y={along} width={w} height={len} rx={w / 2} fill={color} opacity={o} />
    );
  });

  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none', ...style}}>
      <svg width={width} height={height}>
        {streaks}
      </svg>
    </AbsoluteFill>
  );
};
