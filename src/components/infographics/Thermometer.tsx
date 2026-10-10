import React from 'react';
import {interpolateColors, useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {clamp} from '../../utils/animation';
import {Sticker} from '../comic/Sticker';

export interface ThermometerProps {
  /** Mercury level 0..1. */
  value: number;
  /** Temperature shown in the readout (°F). */
  reading: number;
  /** Height in px. */
  height?: number;
}

const W = 200;
const H = 560;

/** Comic thermometer with a counting °F readout. */
export const Thermometer: React.FC<ThermometerProps> = ({value, reading, height = 560}) => {
  const frame = useCurrentFrame();
  const v = clamp(value);
  const scale = height / H;
  const tubeTop = 40;
  const tubeBottom = 430;
  const level = tubeBottom - v * (tubeBottom - tubeTop - 10);
  const hot = interpolateColors(v, [0, 0.7, 1], [TONES.stampRed, PALETTE.solarOrange, PALETTE.hazardYellow]);
  const boil = v > 0.95 ? Math.sin(frame * 0.8) * 3 : 0;

  return (
    <div style={{position: 'relative', width: W * scale, height}}>
      <Sticker bleed={0.2}>
        <svg width={W * scale} height={height} viewBox={`0 0 ${W} ${H}`} style={{display: 'block'}}>
          <rect x={64} y={tubeTop - 20} width={72} height={tubeBottom - tubeTop + 60} rx={36} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} />
          <circle cx={100} cy={480} r={62} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={INK.bold} />
          <rect x={82} y={level + boil} width={36} height={tubeBottom - level + 40} rx={18} fill={hot} />
          <circle cx={100} cy={480} r={46} fill={hot} />
          <rect x={64} y={tubeTop - 20} width={72} height={tubeBottom - tubeTop + 60} rx={36} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold} />
          <circle cx={84} cy={464} r={12} fill={PALETTE.white} opacity={0.7} />
          {Array.from({length: 9}, (_, i) => {
            const y = tubeTop + 10 + i * ((tubeBottom - tubeTop - 10) / 8);
            return <path key={i} d={`M136,${y} L${i % 2 === 0 ? 166 : 154},${y}`} stroke={PALETTE.ink} strokeWidth={5} strokeLinecap="round" />;
          })}
          <path d="M90,60 L90,400" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
        </svg>
      </Sticker>
      <div
        style={{
          position: 'absolute',
          left: 150 * scale,
          top: Math.max(0, (level - 30) * scale),
          background: PALETTE.ink,
          color: PALETTE.hazardYellow,
          border: `5px solid ${PALETTE.white}`,
          borderRadius: 14,
          padding: '6px 16px 2px',
          fontFamily: FONTS.body,
          fontWeight: 900,
          fontSize: 50 * scale,
          whiteSpace: 'nowrap',
          boxShadow: `7px 8px 0 ${PALETTE.ink}`,
        }}
      >
        {Math.round(reading).toLocaleString('en-US')}°F
      </div>
    </div>
  );
};
