import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {clamp} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';

export interface AcidRefluxMeterProps {
  /** Acid height in the tube, 0..1. */
  level: number;
  /** 0..1: neon chevrons pulse upward and the tube glows (stomach tipped over). */
  active?: number;
  height?: number;
}

const VB = {width: 260, height: 620} as const;
const TUBE = {x: 70, y: 70, w: 120, h: 470} as const;

/**
 * A section of esophagus as a gauge: translucent pink walls, green acid that
 * climbs with `level`, and neon chevrons pointing UP while reflux is on.
 */
export const AcidRefluxMeter: React.FC<AcidRefluxMeterProps> = ({level, active = 0, height = 560}) => {
  const frame = useCurrentFrame();
  const tubeClip = useSvgId('reflux-tube');
  const acidGrad = useSvgId('reflux-acid');
  const neon = useSvgId('reflux-neon');
  const width = (height * VB.width) / VB.height;
  const lv = clamp(level);
  const surface = TUBE.y + TUBE.h - lv * TUBE.h;
  const wave = (x: number) => surface + Math.sin(x * 0.12 + frame * 0.35) * 5 * (0.3 + active);
  const waveD = `M${TUBE.x - 10},${wave(TUBE.x - 10)} ${Array.from({length: 15}, (_, i) => {
    const x = TUBE.x - 10 + i * 10;
    return `L${x},${wave(x).toFixed(1)}`;
  }).join(' ')} L${TUBE.x + TUBE.w + 10},${TUBE.y + TUBE.h + 20} L${TUBE.x - 10},${TUBE.y + TUBE.h + 20} Z`;
  const danger = lv > 0.75;
  const flash = danger ? (Math.floor(frame / 6) % 2 === 0 ? 1 : 0.55) : 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${VB.width} ${VB.height}`} overflow="visible" style={{display: 'block'}}>
      <defs>
        <clipPath id={tubeClip}>
          <rect x={TUBE.x} y={TUBE.y} width={TUBE.w} height={TUBE.h} rx={TUBE.w / 2} />
        </clipPath>
        <linearGradient id={acidGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={TONES.acidDark} />
          <stop offset="0.45" stopColor={PALETTE.acidGreen} />
          <stop offset="1" stopColor={TONES.acidLight} />
        </linearGradient>
        <filter id={neon} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text x={VB.width / 2} y={44} textAnchor="middle" fontFamily={FONTS.display} fontSize={40} letterSpacing={2} fill={danger ? TONES.alarmRed : PALETTE.white} stroke={PALETTE.ink} strokeWidth={8} paintOrder="stroke fill" opacity={flash}>
        {danger ? 'HEARTBURN!' : 'ACID LEVEL'}
      </text>
      {active > 0 ? <rect x={TUBE.x - 16} y={TUBE.y - 16} width={TUBE.w + 32} height={TUBE.h + 32} rx={TUBE.w / 2 + 16} fill={PALETTE.acidGreen} opacity={0.25 * active * (0.6 + 0.4 * Math.sin(frame * 0.3))} /> : null}
      <rect x={TUBE.x} y={TUBE.y} width={TUBE.w} height={TUBE.h} rx={TUBE.w / 2} fill={TONES.gutHighlight} opacity={0.45} />
      <g clipPath={`url(#${tubeClip})`}>
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${TUBE.x},${TUBE.y + 30 + i * 52} q${TUBE.w / 2},18 ${TUBE.w},0`} fill="none" stroke="#F472B6" strokeWidth={5} opacity={0.55} />
        ))}
        <path d={waveD} fill={`url(#${acidGrad})`} />
        <path d={waveD} fill="none" stroke={PALETTE.ink} strokeWidth={INK.fine} />
        {Array.from({length: 8}, (_, i) => {
          const span = TUBE.y + TUBE.h - surface;
          if (span < 20) {
            return null;
          }
          const t = ((frame * (1.5 + random(`rb-s-${i}`)) + random(`rb-o-${i}`) * 300) % span) / span;
          return <circle key={i} cx={TUBE.x + 20 + random(`rb-x-${i}`) * (TUBE.w - 40)} cy={TUBE.y + TUBE.h - t * span} r={4 + random(`rb-r-${i}`) * 5} fill="none" stroke={TONES.acidGlow} strokeWidth={2.5} />;
        })}
        <rect x={TUBE.x + 16} y={TUBE.y + 30} width={14} height={TUBE.h - 60} rx={7} fill={PALETTE.white} opacity={0.45} />
      </g>
      <rect x={TUBE.x} y={TUBE.y} width={TUBE.w} height={TUBE.h} rx={TUBE.w / 2} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
      {/* Scale on the right. */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => {
        const y = TUBE.y + TUBE.h - v * TUBE.h;
        return <line key={v} x1={TUBE.x + TUBE.w + 8} y1={y} x2={TUBE.x + TUBE.w + (v % 0.5 === 0 ? 34 : 22)} y2={y} stroke={PALETTE.ink} strokeWidth={5} strokeLinecap="round" />;
      })}
      <text x={TUBE.x + TUBE.w + 12} y={TUBE.y - 6} fontFamily={FONTS.body} fontWeight={900} fontSize={20} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={5} paintOrder="stroke fill">
        THROAT
      </text>
      <text x={TUBE.x + TUBE.w + 12} y={TUBE.y + TUBE.h + 30} fontFamily={FONTS.body} fontWeight={900} fontSize={20} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={5} paintOrder="stroke fill">
        STOMACH
      </text>
      {/* Neon chevrons pointing up. */}
      {active > 0 ? (
        <g filter={`url(#${neon})`}>
          {[0, 1, 2, 3].map((i) => {
            const t = ((frame * 0.035 + i / 4) % 1 + 1) % 1;
            const y = TUBE.y + TUBE.h - 40 - t * (TUBE.h - 80);
            const cx = TUBE.x + TUBE.w / 2;
            return (
              <path
                key={i}
                d={`M${cx - 34},${y + 22} L${cx},${y - 10} L${cx + 34},${y + 22}`}
                fill="none"
                stroke="#D9F99D"
                strokeWidth={11}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={active * Math.sin(t * Math.PI)}
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );
};
