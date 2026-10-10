import React from 'react';
import {useCurrentFrame} from 'remotion';
import {INK, PALETTE} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';
import {Sticker} from '../comic/Sticker';

export interface IronCoreProps {
  /** Diameter of the sphere in px. */
  size?: number;
  /** Glow intensity 0..1. */
  heat?: number;
}

/** Earth's inner core: a white-hot metallic sphere with heat shimmer. */
export const IronCore: React.FC<IronCoreProps> = ({size = 560, heat = 1}) => {
  const frame = useCurrentFrame();
  const body = useSvgId('core-body');
  const glow = useSvgId('core-glow');
  const rim = useSvgId('core-rim');
  const V = 600;
  const c = V / 2;
  const r = 200;
  const throb = 1 + 0.03 * Math.sin(frame * 0.3);

  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <svg width={size} height={size} viewBox={`0 0 ${V} ${V}`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id={glow}>
            <stop offset="0.3" stopColor={PALETTE.white} stopOpacity={0.9} />
            <stop offset="0.5" stopColor={PALETTE.hazardYellow} stopOpacity={0.6} />
            <stop offset="1" stopColor={PALETTE.solarOrange} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={c} cy={c} r={r * 2.1 * throb} fill={`url(#${glow})`} opacity={0.95 * heat} />
        {[0, 1, 2].map((i) => {
          const t = ((frame / 36 + i / 3) % 1 + 1) % 1;
          return <circle key={i} cx={c} cy={c} r={r * (1.05 + t * 0.7)} fill="none" stroke={PALETTE.hazardYellow} strokeWidth={10 * (1 - t)} opacity={(1 - t) * heat} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <Sticker bleed={0.05} shadow={false}>
          <svg width={size} height={size} viewBox={`0 0 ${V} ${V}`} style={{display: 'block'}}>
            <defs>
              <radialGradient id={body} cx="0.38" cy="0.34" r="0.7">
                <stop offset="0" stopColor={PALETTE.white} />
                <stop offset="0.38" stopColor="#FFFBE0" />
                <stop offset="0.66" stopColor="#FFE34A" />
                <stop offset="0.88" stopColor="#FF8A00" />
                <stop offset="1" stopColor="#E2470C" />
              </radialGradient>
              <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={PALETTE.white} stopOpacity={0} />
                <stop offset="1" stopColor={PALETTE.solarOrange} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <circle cx={c} cy={c} r={r} fill={`url(#${body})`} />
            {/* Molten-metal sheen */}
            {[-60, 40].map((dy, i) => {
              const rx = Math.sqrt(r * r - dy * dy);
              return <ellipse key={i} cx={c} cy={c + dy} rx={rx * 0.9} ry={rx * 0.12} fill="none" stroke={PALETTE.white} strokeWidth={5} opacity={0.35} />;
            })}
            <circle cx={c} cy={c} r={r} fill={`url(#${rim})`} opacity={0.6} />
            <circle cx={c} cy={c} r={r - 10} fill="none" stroke={PALETTE.white} strokeWidth={6} opacity={0.45} />
            <ellipse cx={c - 70} cy={c - 80} rx={60} ry={30} fill={PALETTE.white} opacity={0.85} transform={`rotate(-35 ${c - 70} ${c - 80})`} />
            <circle cx={c - 22} cy={c - 120} r={9} fill={PALETTE.white} />
            <circle cx={c} cy={c} r={r} fill="none" stroke={PALETTE.ink} strokeWidth={INK.bold + 2} />
          </svg>
        </Sticker>
      </div>
    </div>
  );
};
