import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../../theme';
import {polar} from '../../utils/geometry';

export interface SunburstRaysProps {
  /** [background, ray] colours. */
  colors?: readonly [string, string];
  rays?: number;
  /** Degrees per frame. */
  speed?: number;
  /** Burst centre in px (defaults to frame centre). */
  center?: {x: number; y: number};
  opacity?: number;
  /** Starting rotation in degrees. */
  angle?: number;
  style?: React.CSSProperties;
}

/** Rotating comic sunburst: alternating wedges radiating from a point. */
export const SunburstRays: React.FC<SunburstRaysProps> = ({
  colors = [PALETTE.hazardYellow, '#FFC400'],
  rays = 22,
  speed = 0.25,
  center,
  opacity = 1,
  angle = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cx = center?.x ?? width / 2;
  const cy = center?.y ?? height / 2;
  const radius = Math.hypot(width, height) * 1.2;
  const rotation = angle + frame * speed;
  const wedge = 360 / rays;

  const wedges = Array.from({length: rays}, (_, i) => {
    const a0 = rotation + i * wedge;
    const p0 = polar(cx, cy, radius, a0);
    const p1 = polar(cx, cy, radius, a0 + wedge / 2);
    return `M${cx},${cy} L${p0.x.toFixed(1)},${p0.y.toFixed(1)} L${p1.x.toFixed(1)},${p1.y.toFixed(1)} Z`;
  });

  return (
    <AbsoluteFill style={{opacity, ...style}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill={colors[0]} />
        <path d={wedges.join(' ')} fill={colors[1]} />
      </svg>
    </AbsoluteFill>
  );
};
