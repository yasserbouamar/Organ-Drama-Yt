import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {pop} from '../../utils/animation';
import {useSvgId} from '../../utils/useSvgId';

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

export interface EKGLineProps {
  y: number;
  /** 0..1 how much of the line has been drawn in. */
  reveal?: number;
  /** Beats per minute of the travelling pulse. */
  bpm?: number;
  color?: string;
}

/** An animated EKG trace across the frame: a glowing line with heartbeat spikes that scroll by. */
export const EKGLine: React.FC<EKGLineProps> = ({y, reveal = 1, bpm = 100, color = TONES.mint}) => {
  const frame = useCurrentFrame();
  const {width, fps} = useVideoConfig();
  const clipId = useSvgId('ekg-reveal');
  const period = 360;
  const shift = ((frame * period * bpm) / (60 * fps)) % period;
  const pts: string[] = [];
  for (let x = -period; x <= width + period; x += 6) {
    const u = (((x + shift) % period) + period) % period;
    let v = 0;
    if (u > 140 && u < 160) {
      v = -16 * Math.sin(((u - 140) / 20) * Math.PI);
    } else if (u >= 170 && u < 178) {
      v = ((u - 170) / 8) * 30;
    } else if (u >= 178 && u < 190) {
      v = 30 - ((u - 178) / 12) * 150;
    } else if (u >= 190 && u < 202) {
      v = -120 + ((u - 190) / 12) * 150;
    } else if (u >= 202 && u < 210) {
      v = 30 - ((u - 202) / 8) * 30;
    } else if (u > 240 && u < 280) {
      v = -24 * Math.sin(((u - 240) / 40) * Math.PI);
    }
    pts.push(`${x},${(y + v).toFixed(1)}`);
  }
  const d = `M${pts.join(' L')}`;
  return (
    <svg width={width} height={1080} viewBox={`0 0 ${width} 1080`} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={width * reveal} height={1080} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill="none" stroke={PALETTE.ink} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill="none" stroke={PALETTE.white} strokeWidth={3} strokeLinejoin="round" opacity={0.7} />
      </g>
    </svg>
  );
};

/** Height of the EKG trace (relative to its baseline) at a screen x, for bouncing characters on it. */
export const ekgOffsetAt = (x: number, frame: number, fps: number, bpm = 100): number => {
  const period = 360;
  const shift = ((frame * period * bpm) / (60 * fps)) % period;
  const u = (((x + shift) % period) + period) % period;
  if (u >= 178 && u < 202) {
    return -Math.max(0, 120 - Math.abs(u - 190) * 10);
  }
  return 0;
};

export interface SubscribeButtonProps {
  x: number;
  y: number;
  /** Frame (parent timeline) it pops in. */
  start: number;
  /** Frame a cursor clicks it and it flips to "SUBSCRIBED". */
  clickAt: number;
}

/** A big red SUBSCRIBE button with a ringing bell; a cartoon cursor clicks it. */
export const SubscribeButton: React.FC<SubscribeButtonProps> = ({x, y, start, clickAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start) {
    return null;
  }
  const s = pop(frame, fps, start);
  const clicked = frame >= clickAt;
  // A quick press-in on the click, then back out.
  const press = clicked ? 1 - 0.12 * Math.max(0, 1 - (frame - clickAt) / 5) : 1;
  const ring = Math.sin((frame - start) * 0.9) * 18 * Math.exp(-Math.max(0, frame - (clicked ? clickAt : start)) * 0.05);
  const cursorX = interpolate(frame, [start + 4, clickAt], [260, 120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cursorY = interpolate(frame, [start + 4, clickAt], [150, 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s * press}) rotate(${-3 + (1 - s) * 20}deg)`, zIndex: 55}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: clicked ? '#64748B' : TONES.alarmRed,
          border: `6px solid ${PALETTE.ink}`,
          boxShadow: `0 0 0 9px ${PALETTE.white}, 10px 12px 0 9px ${PALETTE.ink}`,
          borderRadius: 999,
          padding: '12px 36px 8px 22px',
        }}
      >
        <svg width={60} height={60} viewBox="0 0 52 52" style={{transform: `rotate(${ring}deg)`, transformOrigin: '50% 10%'}}>
          <path d="M26,6 C36,6 40,14 40,24 L40,34 L46,40 L6,40 L12,34 L12,24 C12,14 16,6 26,6 Z" fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={26} cy={44} r={5} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={3.5} />
        </svg>
        <span style={{fontFamily: FONTS.display, fontSize: 66, letterSpacing: 3, color: PALETTE.white, lineHeight: 1}}>{clicked ? 'SUBSCRIBED!' : 'SUBSCRIBE'}</span>
      </div>
      {frame < clickAt + 20 ? (
        <svg width={70} height={80} viewBox="0 0 70 80" style={{position: 'absolute', left: cursorX, top: cursorY}}>
          <path d="M6,4 L6,62 L22,48 L34,74 L46,68 L34,42 L56,42 Z" fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={5} strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
};

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
