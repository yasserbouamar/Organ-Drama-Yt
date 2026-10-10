import React from 'react';
import {interpolateColors, useCurrentFrame} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {clamp, noise1D} from '../../utils/animation';
import {polar} from '../../utils/geometry';
import {Sticker} from '../comic/Sticker';

export interface HeatDialGaugeProps {
  /** Needle position 0..1, from TODAY to +1 BILLION YRS. */
  value: number;
  /** Percent shown in the readout at value = 1. */
  maxPercent?: number;
  /** Width in px. */
  size?: number;
  /** "+10% EVERY BILLION YRS" badge scale (feed it a spring). 0 hides it. */
  badge?: number;
  title?: string;
}

const W = 560;
const H = 400;
const PIVOT = {x: 280, y: 300};
const R_OUT = 230;
const R_IN = 168;
const SEGMENTS = 12;

const sector = (r0: number, r1: number, a0: number, a1: number): string => {
  const p0 = polar(PIVOT.x, PIVOT.y, r1, a0);
  const p1 = polar(PIVOT.x, PIVOT.y, r1, a1);
  const p2 = polar(PIVOT.x, PIVOT.y, r0, a1);
  const p3 = polar(PIVOT.x, PIVOT.y, r0, a0);
  return `M${p0.x},${p0.y} A${r1},${r1} 0 0 1 ${p1.x},${p1.y} L${p2.x},${p2.y} A${r0},${r0} 0 0 0 ${p3.x},${p3.y} Z`;
};

/** Semicircular "solar output" gauge with a sweeping needle and a pop-in +10% badge. */
export const HeatDialGauge: React.FC<HeatDialGaugeProps> = ({
  value,
  maxPercent = 10,
  size = 560,
  badge = 0,
  title = 'SOLAR OUTPUT',
}) => {
  const frame = useCurrentFrame();
  const v = clamp(value);
  const jitter = noise1D('dial-needle', frame * 0.6) * 1.6 * (0.3 + v);
  const needleAngle = 180 + v * 180 + jitter;
  const tip = polar(PIVOT.x, PIVOT.y, R_OUT - 14, needleAngle);
  const baseL = polar(PIVOT.x, PIVOT.y, 18, needleAngle - 90);
  const baseR = polar(PIVOT.x, PIVOT.y, 18, needleAngle + 90);
  const tail = polar(PIVOT.x, PIVOT.y, 34, needleAngle + 180);
  const percent = Math.round(v * maxPercent);
  const scale = size / W;

  return (
    <div style={{position: 'relative', width: size, height: H * scale}}>
      <Sticker bleed={0.15}>
        <svg width={size} height={H * scale} viewBox={`0 0 ${W} ${H}`} style={{display: 'block'}}>
          <path
            d={`M${PIVOT.x - 262},${PIVOT.y} A262,262 0 0 1 ${PIVOT.x + 262},${PIVOT.y} L${PIVOT.x + 262},${H - 18} Q${PIVOT.x + 262},${H - 6} ${PIVOT.x + 250},${H - 6} L${PIVOT.x - 250},${H - 6} Q${PIVOT.x - 262},${H - 6} ${PIVOT.x - 262},${H - 18} Z`}
            fill={PALETTE.white}
            stroke={PALETTE.ink}
            strokeWidth={INK.bold}
          />
          {Array.from({length: SEGMENTS}, (_, i) => {
            const a0 = 180 + (i / SEGMENTS) * 180;
            const a1 = 180 + ((i + 1) / SEGMENTS) * 180;
            const lit = (i + 0.5) / SEGMENTS <= v;
            const color = interpolateColors(i / (SEGMENTS - 1), [0, 0.5, 1], [PALETTE.hazardYellow, PALETTE.solarOrange, TONES.stampRed]);
            return (
              <path key={i} d={sector(R_IN, R_OUT, a0 + 0.8, a1 - 0.8)} fill={color} opacity={lit ? 1 : 0.28} stroke={PALETTE.ink} strokeWidth={INK.fine} />
            );
          })}
          {Array.from({length: 11}, (_, i) => {
            const a = 180 + i * 18;
            const p0 = polar(PIVOT.x, PIVOT.y, R_IN - 8, a);
            const p1 = polar(PIVOT.x, PIVOT.y, R_IN - (i % 5 === 0 ? 30 : 20), a);
            return <path key={i} d={`M${p0.x},${p0.y} L${p1.x},${p1.y}`} stroke={PALETTE.ink} strokeWidth={i % 5 === 0 ? 6 : 4} strokeLinecap="round" />;
          })}
          <text x={56} y={PIVOT.y + 40} fontFamily={FONTS.display} fontSize={30} fill={PALETTE.ink} letterSpacing={1}>
            TODAY
          </text>
          <text x={W - 56} y={PIVOT.y + 40} textAnchor="end" fontFamily={FONTS.display} fontSize={30} fill={PALETTE.ink} letterSpacing={1}>
            +1B YRS
          </text>
          <text x={PIVOT.x} y={PIVOT.y - 98} textAnchor="middle" fontFamily={FONTS.body} fontWeight={900} fontSize={22} letterSpacing={3} fill={PALETTE.ink}>
            {title}
          </text>
          {/* Needle */}
          <path d={`M${tip.x},${tip.y} L${baseL.x},${baseL.y} L${tail.x},${tail.y} L${baseR.x},${baseR.y} Z`} fill={PALETTE.vividMagenta} stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" />
          <circle cx={PIVOT.x} cy={PIVOT.y} r={22} fill={PALETTE.ink} />
          <circle cx={PIVOT.x - 6} cy={PIVOT.y - 6} r={6} fill={PALETTE.white} opacity={0.7} />
          {/* Readout */}
          <rect x={PIVOT.x - 86} y={PIVOT.y + 30} width={172} height={58} rx={12} fill={PALETTE.ink} />
          <text x={PIVOT.x} y={PIVOT.y + 76} textAnchor="middle" fontFamily={FONTS.body} fontWeight={900} fontSize={44} fill={PALETTE.hazardYellow}>
            +{percent}%
          </text>
        </svg>
      </Sticker>
      {badge > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            right: -70 * scale,
            top: -46 * scale,
            transform: `scale(${badge}) rotate(${8 - (1 - Math.min(1, badge)) * 30}deg)`,
            transformOrigin: '30% 70%',
            background: PALETTE.vividMagenta,
            color: PALETTE.white,
            border: `5px solid ${PALETTE.ink}`,
            boxShadow: `0 0 0 8px ${PALETTE.white}, 9px 11px 0 8px ${PALETTE.ink}`,
            borderRadius: 18,
            padding: `${10 * scale}px ${22 * scale}px ${6 * scale}px`,
            fontFamily: FONTS.display,
            fontSize: 46 * scale,
            lineHeight: 1,
            letterSpacing: 2,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{fontSize: 74 * scale, color: PALETTE.hazardYellow, WebkitTextStroke: `${3 * scale}px ${PALETTE.ink}`, paintOrder: 'stroke fill'}}>+10%</div>
          EVERY BILLION YRS
        </div>
      ) : null}
    </div>
  );
};
