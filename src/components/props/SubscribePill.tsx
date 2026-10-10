import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, PALETTE, TONES} from '../../theme';
import {pop} from '../../utils/animation';

export interface SubscribePillProps {
  x: number;
  y: number;
  /** Frame (parent timeline) it pops in. */
  start: number;
}

/** Red "SUBSCRIBE" pill with a ringing bell. */
export const SubscribePill: React.FC<SubscribePillProps> = ({x, y, start}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = pop(frame, fps, start);
  if (frame < start) {
    return null;
  }
  const ring = Math.sin((frame - start) * 0.9) * 18 * Math.exp(-(frame - start) * 0.04);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${-4 + (1 - s) * 20}deg)`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: TONES.stampRed,
        border: `5px solid ${PALETTE.ink}`,
        boxShadow: `0 0 0 8px ${PALETTE.white}, 9px 11px 0 8px ${PALETTE.ink}`,
        borderRadius: 999,
        padding: '10px 30px 6px 18px',
        zIndex: 55,
      }}
    >
      <svg width={52} height={52} viewBox="0 0 52 52" style={{transform: `rotate(${ring}deg)`, transformOrigin: '50% 10%'}}>
        <path d="M26,6 C36,6 40,14 40,24 L40,34 L46,40 L6,40 L12,34 L12,24 C12,14 16,6 26,6 Z" fill={PALETTE.hazardYellow} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={26} cy={44} r={5} fill={PALETTE.hazardYellow} stroke={PALETTE.ink} strokeWidth={3.5} />
      </svg>
      <span style={{fontFamily: FONTS.display, fontSize: 56, letterSpacing: 3, color: PALETTE.white, lineHeight: 1}}>SUBSCRIBE</span>
    </div>
  );
};
