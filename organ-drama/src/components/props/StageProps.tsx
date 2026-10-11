import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {pop} from '../../utils/animation';

export interface MailboxProps {
  size?: number;
  /** Door swing 0..1. */
  open?: number;
  /** The little flag up (mail waiting) 0..1. */
  flag?: number;
}

/** Brain's mailbox: where the "I'M FULL" letter should arrive. */
export const Mailbox: React.FC<MailboxProps> = ({size = 200, open = 0, flag = 0}) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 200 240" overflow="visible" style={{display: 'block'}}>
    <rect x={88} y={120} width={24} height={120} fill="#7C3AED" stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <path d="M30,130 L30,60 Q30,20 100,20 Q170,20 170,60 L170,130 Z" fill={TONES.sky} stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinejoin="round" />
    <path d="M44,120 L44,66 Q44,36 100,36 Q156,36 156,66 L156,120 Z" fill="#0F172A" />
    <g transform={`rotate(${open * 100} 44 126)`}>
      <path d="M44,126 L44,66 Q44,36 100,36 Q156,36 156,66 L156,126 Z" fill="#7DD3FC" stroke={PALETTE.ink} strokeWidth={INK.medium} strokeLinejoin="round" opacity={1 - open * 0.15} />
      <text x={100} y={96} textAnchor="middle" fontFamily={FONTS.display} fontSize={30} fill={PALETTE.ink}>
        MAIL
      </text>
    </g>
    <g transform={`rotate(${-90 + flag * 90} 172 96)`}>
      <rect x={168} y={40} width={8} height={58} fill={PALETTE.ink} />
      <rect x={168} y={40} width={30} height={20} fill={TONES.alarmRed} stroke={PALETTE.ink} strokeWidth={INK.fine} />
    </g>
  </svg>
);

export interface CalloutProps {
  /** Label box centre (px). */
  x: number;
  y: number;
  /** Arrow tip (px). */
  toX: number;
  toY: number;
  label: string;
  sub?: string;
  start: number;
  color?: string;
}

/** A pop-in label with a hand-drawn arrow pointing at something. */
export const Callout: React.FC<CalloutProps> = ({x, y, toX, toY, label, sub, start, color = TONES.gold}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start) {
    return null;
  }
  const s = pop(frame, fps, start);
  const draw = interpolate(frame, [start + 4, start + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mx = (x + toX) / 2 + (toY - y) * 0.2;
  const my = (y + toY) / 2 - (toX - x) * 0.2;
  const ang = Math.atan2(toY - my, toX - mx);
  const head = (a: number) => `${toX - Math.cos(ang + a) * 30},${toY - Math.sin(ang + a) * 30}`;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, zIndex: 45}} overflow="visible">
        <path d={`M${x},${y} Q${mx},${my} ${toX},${toY}`} fill="none" stroke={PALETTE.ink} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
        <path d={`M${x},${y} Q${mx},${my} ${toX},${toY}`} fill="none" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
        {draw >= 1 ? <path d={`M${head(0.45)} L${toX},${toY} L${head(-0.45)}`} fill="none" stroke={PALETTE.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${s}) rotate(-3deg)`,
          background: color,
          border: `5px solid ${PALETTE.ink}`,
          boxShadow: `0 0 0 7px ${PALETTE.white}, 8px 10px 0 7px ${PALETTE.ink}`,
          borderRadius: 18,
          padding: '8px 22px 4px',
          textAlign: 'center',
          zIndex: 46,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{fontFamily: FONTS.display, fontSize: 44, letterSpacing: 2, color: PALETTE.ink, lineHeight: 1.05}}>{label}</div>
        {sub ? <div style={{fontFamily: FONTS.body, fontWeight: 800, fontSize: 22, color: PALETTE.ink, marginBottom: 4}}>{sub}</div> : null}
      </div>
    </>
  );
};
