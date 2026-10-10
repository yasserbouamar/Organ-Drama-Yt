import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {INK, PALETTE, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

const W = 1920;
const H = 1080;

export interface GutBackgroundProps {
  /** 0..1 red alarm wash (heartburn). */
  alarm?: number;
  /** Peristalsis speed multiplier. */
  pace?: number;
}

/** A wavy muscular wall band hugging the left (side -1) or right (side 1) edge. */
const wallPath = (side: -1 | 1, inset: number, amp: number, frame: number, phase: number, pace: number): string => {
  const pts: string[] = [];
  for (let y = -40; y <= H + 40; y += 30) {
    const wave = Math.sin(y * 0.009 + frame * 0.06 * pace + phase) * amp + Math.sin(y * 0.021 - frame * 0.04 * pace + phase * 2) * amp * 0.35;
    const x = side < 0 ? inset + wave : W - inset - wave;
    pts.push(`${x.toFixed(1)},${y}`);
  }
  const edge = side < 0 ? -10 : W + 10;
  return `M${edge},-40 L${pts.join(' L')} L${edge},${H + 40} Z`;
};

/**
 * Inside the gut: a fleshy deep-pink cavity with layered muscular walls that
 * ripple in slow peristaltic waves, drifting cells and soft highlights.
 */
export const GutBackground: React.FC<GutBackgroundProps> = ({alarm = 0, pace = 1}) => {
  const frame = useCurrentFrame();
  const baseGrad = useSvgId('gut-base');
  const vignette = useSvgId('gut-vignette');
  const layers = [
    {inset: 330, amp: 26, color: PALETTE.gutPinkDeep, phase: 0.6, opacity: 0.75},
    {inset: 210, amp: 34, color: PALETTE.gutPink, phase: 1.7, opacity: 1},
    {inset: 95, amp: 40, color: TONES.gutWall, phase: 2.9, opacity: 1},
  ];
  const cells = Array.from({length: 16}, (_, i) => {
    const speed = 0.15 + random(`cell-s-${i}`) * 0.35;
    const x = 380 + random(`cell-x-${i}`) * 1160 + Math.sin(frame * 0.02 + i) * 20;
    const y = ((random(`cell-y-${i}`) * (H + 200) - frame * speed) % (H + 200) + H + 200) % (H + 200) - 100;
    const r = 14 + random(`cell-r-${i}`) * 36;
    return {x, y, r};
  });

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <radialGradient id={baseGrad} cx="50%" cy="48%" r="70%">
            <stop offset="0" stopColor="#D61F69" />
            <stop offset="0.55" stopColor={PALETTE.gutPink} />
            <stop offset="1" stopColor={PALETTE.gutPinkDeep} />
          </radialGradient>
          <radialGradient id={vignette} cx="50%" cy="50%" r="75%">
            <stop offset="0.55" stopColor="#4A0420" stopOpacity={0} />
            <stop offset="1" stopColor="#4A0420" stopOpacity={0.55} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${baseGrad})`} />
        {/* Ribbed back wall: faint horizontal folds (rugae) that breathe. */}
        {Array.from({length: 9}, (_, i) => {
          const y = 80 + i * 120 + Math.sin(frame * 0.05 * pace + i) * 6;
          return (
            <path
              key={i}
              d={`M300,${y} Q700,${y - 40 + Math.sin(frame * 0.04 + i) * 10} 960,${y} T1620,${y}`}
              fill="none"
              stroke={TONES.gutHighlight}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.16}
            />
          );
        })}
        {cells.map((c, i) => (
          <g key={i} opacity={0.35}>
            <circle cx={c.x} cy={c.y} r={c.r} fill={TONES.gutHighlight} opacity={0.35} />
            <circle cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.3} r={c.r * 0.25} fill={PALETTE.white} opacity={0.5} />
          </g>
        ))}
        {([-1, 1] as const).map((side) =>
          layers.map((l, i) => (
            <g key={`${side}-${i}`} opacity={l.opacity}>
              <path d={wallPath(side, l.inset, l.amp, frame, l.phase + (side > 0 ? 1.3 : 0), pace)} fill={l.color} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
              {i === layers.length - 1
                ? Array.from({length: 7}, (_, k) => {
                    const y = 70 + k * 150 + Math.sin(frame * 0.06 * pace + k) * 10;
                    const x = side < 0 ? 30 : W - 30;
                    return (
                      <path
                        key={k}
                        d={`M${x},${y} q${side * -50},${-14} ${side * -78},${8}`}
                        fill="none"
                        stroke={TONES.gutHighlight}
                        strokeWidth={8}
                        strokeLinecap="round"
                        opacity={0.6}
                      />
                    );
                  })
                : null}
            </g>
          )),
        )}
        <rect width={W} height={H} fill={`url(#${vignette})`} />
        {alarm > 0 ? <rect width={W} height={H} fill={TONES.alarmRed} opacity={alarm * 0.35} /> : null}
      </svg>
    </AbsoluteFill>
  );
};
