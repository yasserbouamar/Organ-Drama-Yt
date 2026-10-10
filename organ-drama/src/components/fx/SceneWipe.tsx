import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE, TONES} from '../../theme';
import {SunburstRays} from './SunburstRays';

export interface SceneWipeProps {
  /** Absolute frame of the cut: the screen is fully covered on `at - 1` and `at`. */
  at: number;
  /** `drop`: bands fall down (swallowing). `slide`: slanted bands sweep across. `sunburst`: rays burst open (morning). */
  kind?: 'drop' | 'slide' | 'sunburst';
  colors?: readonly string[];
}

const ease = (frame: number, range: [number, number], out: [number, number], easing: (t: number) => number) =>
  interpolate(frame, range, out, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Comic transitions that hide a hard cut between scenes. */
export const SceneWipe: React.FC<SceneWipeProps> = ({at, kind = 'slide', colors = [TONES.gold, PALETTE.brainPink, TONES.sky, PALETTE.acidGreen]}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (frame < at - 16 || frame > at + 16) {
    return null;
  }

  if (kind === 'sunburst') {
    const grow = ease(frame, [at - 14, at], [0, 1], Easing.out(Easing.cubic));
    const fade = ease(frame, [at + 2, at + 14], [1, 0], Easing.in(Easing.quad));
    return (
      <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none', opacity: fade}}>
        <SunburstRays colors={[TONES.gold, '#FDE68A']} reach={grow} speed={1.2} rays={24} />
      </AbsoluteFill>
    );
  }

  const bands = kind === 'drop' ? 7 : 6;
  return (
    <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        {Array.from({length: bands}, (_, i) => {
          const color = colors[i % colors.length];
          if (kind === 'drop') {
            const bw = width / bands;
            const inY = ease(frame, [at - 14 + i * 0.8, at - 1], [-height - 200, 0], Easing.out(Easing.cubic));
            const outY = ease(frame, [at + 1 + i * 0.7, at + 12 + i * 0.7], [0, height + 200], Easing.in(Easing.cubic));
            const y = frame <= at ? inY : outY;
            const d = `M${i * bw - 4},${y - 60} Q${i * bw + bw / 2},${y - 120} ${(i + 1) * bw + 4},${y - 60} L${(i + 1) * bw + 4},${y + height + 60} L${i * bw - 4},${y + height + 60} Z`;
            return <path key={i} d={d} fill={color} stroke={PALETTE.ink} strokeWidth={10} strokeLinejoin="round" />;
          }
          const bandH = height / bands;
          const travel = width + 600;
          const inX = ease(frame, [at - 13 + i, at - 1], [-travel, 0], Easing.out(Easing.cubic));
          const outX = ease(frame, [at + 1 + i * 0.6, at + 10 + i * 0.6], [0, travel], Easing.in(Easing.cubic));
          const x = frame <= at ? inX : outX;
          const y = i * bandH;
          const skew = 160;
          const d = `M${-300 + x},${y - 4} L${width + 300 + x},${y - 4} L${width + 300 - skew + x},${y + bandH + 4} L${-300 - skew + x},${y + bandH + 4} Z`;
          return <path key={i} d={d} fill={color} stroke={PALETTE.ink} strokeWidth={10} strokeLinejoin="round" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
