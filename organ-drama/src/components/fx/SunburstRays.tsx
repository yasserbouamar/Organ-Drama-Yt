import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {polar} from '../../utils/geometry';

export interface SunburstRaysProps {
  /** [background, ray] colours. */
  colors: readonly [string, string];
  rays?: number;
  /** Degrees per frame. */
  speed?: number;
  center?: {x: number; y: number};
  /** 0..1: how far the rays reach (animate it for a burst-open transition). */
  reach?: number;
  opacity?: number;
}

/** Rotating comic sunburst: alternating wedges radiating from a point. */
export const SunburstRays: React.FC<SunburstRaysProps> = ({colors, rays = 20, speed = 0.3, center, reach = 1, opacity = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cx = center?.x ?? width / 2;
  const cy = center?.y ?? height / 2;
  const radius = Math.hypot(width, height) * 1.2 * reach;
  const rotation = frame * speed;
  const wedge = 360 / rays;
  const wedges = Array.from({length: rays}, (_, i) => {
    const a0 = rotation + i * wedge;
    const p0 = polar(cx, cy, radius, a0);
    const p1 = polar(cx, cy, radius, a0 + wedge / 2);
    return `M${cx},${cy} L${p0.x.toFixed(1)},${p0.y.toFixed(1)} L${p1.x.toFixed(1)},${p1.y.toFixed(1)} Z`;
  });
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={width} height={height}>
        <circle cx={cx} cy={cy} r={radius} fill={colors[0]} />
        <path d={wedges.join(' ')} fill={colors[1]} />
      </svg>
    </AbsoluteFill>
  );
};
