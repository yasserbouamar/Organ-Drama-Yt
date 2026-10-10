import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PALETTE, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export interface AuroraCurtainsProps {
  width: number;
  height: number;
  intensity?: number;
}

/** Rippling green aurora ribbons ("the green lights"). */
export const AuroraCurtains: React.FC<AuroraCurtainsProps> = ({width, height, intensity = 1}) => {
  const frame = useCurrentFrame();
  const grad = useSvgId('aurora');
  const fadeX = useSvgId('aurora-fade-x');
  const fadeMask = useSvgId('aurora-mask');
  const ribbons = [0, 1, 2, 3];
  return (
    <svg width={width} height={height} overflow="visible" style={{display: 'block', mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={TONES.shieldGreen} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={PALETTE.electricCyan} stopOpacity={0.5} />
          <stop offset="1" stopColor={PALETTE.vividMagenta} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={fadeX} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.25" stopColor="#fff" />
          <stop offset="0.75" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={fadeMask}>
          <rect x={0} y={-height} width={width} height={height * 3} fill={`url(#${fadeX})`} />
        </mask>
      </defs>
      <g mask={`url(#${fadeMask})`}>
      {ribbons.map((i) => {
        const steps = 24;
        const base = height * (0.7 + i * 0.07);
        const top = height * (0.12 + i * 0.08);
        const bottomPts: string[] = [];
        const topPts: string[] = [];
        for (let k = 0; k <= steps; k++) {
          const x = (width * k) / steps;
          const wave = Math.sin(k * 0.55 + frame * 0.08 + i * 1.3) * 26 + Math.sin(k * 0.21 - frame * 0.05 + i) * 18;
          bottomPts.push(`${x.toFixed(1)},${(base + wave).toFixed(1)}`);
          topPts.push(`${x.toFixed(1)},${(top + wave * 1.6 + Math.sin(k * 0.9 + frame * 0.12) * 30).toFixed(1)}`);
        }
        const d = `M${bottomPts.join(' L')} L${topPts.reverse().join(' L')} Z`;
        return <path key={i} d={d} fill={`url(#${grad})`} opacity={intensity * (0.55 - i * 0.08)} />;
      })}
      </g>
    </svg>
  );
};
