import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, PALETTE, TONES} from '../../theme';
import {tween} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';

export interface TitleCardProps {
  text: string;
  sub?: string;
  /** How long the card stays up; it springs out over the last frames. */
  durationInFrames: number;
  /** `banner`: ribbon for time jumps. `logo`: the show's title treatment. */
  variant?: 'banner' | 'logo';
  color?: string;
  x?: number;
  y?: number;
  rotation?: number;
}

/**
 * Comic pop-up banner ("20 MIN LATER", "NEXT MORNING"): springs in with an
 * overshoot, breathes while it holds, and snaps back out. Frame 0 is the
 * moment it enters, so mount it inside a `<Sequence>`.
 */
export const TitleCard: React.FC<TitleCardProps> = ({text, sub, durationInFrames, variant = 'banner', color = TONES.gold, x = 960, y = 300, rotation = -4}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fillGrad = useSvgId('title-fill');
  const enter = spring({frame, fps, config: {damping: 9, stiffness: 180, mass: 0.9}});
  const exit = tween(frame, [durationInFrames - 8, durationInFrames], [1, 0]);
  const s = Math.min(enter, exit);
  if (s <= 0.001) {
    return null;
  }
  const breathe = 1 + Math.sin(frame * 0.15) * 0.015;
  const rot = rotation + (1 - enter) * -18 + Math.sin(frame * 0.1) * 1.2;

  if (variant === 'logo') {
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s * breathe}) rotate(${rot}deg)`, zIndex: 60, textAlign: 'center'}}>
        <svg width={1200} height={330} viewBox="0 0 1200 330" overflow="visible">
          <defs>
            <linearGradient id={fillGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={TONES.brainLight} />
              <stop offset="0.5" stopColor={PALETTE.brainPink} />
              <stop offset="1" stopColor={PALETTE.heartRed} />
            </linearGradient>
          </defs>
          {[24, 16].map((sw, i) => (
            <text
              key={sw}
              x={600}
              y={200}
              textAnchor="middle"
              fontFamily={FONTS.display}
              fontSize={210}
              letterSpacing={8}
              fill={i === 0 ? PALETTE.ink : `url(#${fillGrad})`}
              stroke={i === 0 ? PALETTE.ink : PALETTE.white}
              strokeWidth={sw}
              strokeLinejoin="round"
              paintOrder="stroke fill"
              transform={i === 0 ? 'translate(12 14)' : undefined}
            >
              {text}
            </text>
          ))}
          <text x={600} y={200} textAnchor="middle" fontFamily={FONTS.display} fontSize={210} letterSpacing={8} fill="none" stroke={PALETTE.ink} strokeWidth={6}>
            {text}
          </text>
        </svg>
        {sub ? (
          <div
            style={{
              display: 'inline-block',
              marginTop: -30,
              background: color,
              border: `6px solid ${PALETTE.ink}`,
              boxShadow: `0 0 0 8px ${PALETTE.white}, 10px 12px 0 8px ${PALETTE.ink}`,
              borderRadius: 16,
              padding: '6px 34px 0',
              fontFamily: FONTS.display,
              fontSize: 76,
              letterSpacing: 5,
              color: PALETTE.ink,
              transform: `rotate(${3 - rotation}deg) scale(${spring({frame: frame - 8, fps, config: {damping: 10, stiffness: 200}})})`,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    );
  }

  const w = Math.max(560, text.length * 52 + 180);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s * breathe}) rotate(${rot}deg)`, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <svg width={w + 160} height={190} viewBox={`0 0 ${w + 160} 190`} overflow="visible">
        {/* Folded ribbon tails behind the banner. */}
        {[-1, 1].map((side) => {
          const x0 = side < 0 ? 0 : w + 160;
          const x1 = side < 0 ? 110 : w + 50;
          return (
            <g key={side}>
              <path d={`M${x1},60 L${x0},60 L${x0 + side * -40},110 L${x0},160 L${x1},160 Z`} fill={PALETTE.brainFold} stroke={PALETTE.ink} strokeWidth={7} strokeLinejoin="round" />
              <path d={`M${x1},160 L${side < 0 ? x1 + 30 : x1 - 30},140 L${side < 0 ? x1 + 30 : x1 - 30},170 Z`} fill={PALETTE.ink} />
            </g>
          );
        })}
        <path d={`M80,20 L${w + 80},20 L${w + 80},140 L80,140 Z`} fill={PALETTE.ink} transform="translate(10 12)" />
        <path d={`M80,20 L${w + 80},20 L${w + 80},140 L80,140 Z`} fill={color} stroke={PALETTE.ink} strokeWidth={8} strokeLinejoin="round" />
        <text x={(w + 160) / 2} y={112} textAnchor="middle" fontFamily={FONTS.display} fontSize={104} letterSpacing={6} fill={PALETTE.ink}>
          {text}
        </text>
      </svg>
      {sub ? (
        <div
          style={{
            marginTop: 4,
            background: PALETTE.white,
            border: `5px solid ${PALETTE.ink}`,
            borderRadius: 999,
            padding: '6px 28px 4px',
            fontFamily: FONTS.body,
            fontWeight: 900,
            fontSize: 34,
            color: PALETTE.ink,
            transform: `scale(${spring({frame: frame - 6, fps, config: {damping: 11, stiffness: 200}})})`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
