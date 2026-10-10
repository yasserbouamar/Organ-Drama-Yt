import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLine, lineWindow} from '../../data/script60s';
import {SPEAKER_STYLES} from '../../data/speakers';
import {FONTS, PALETTE} from '../../theme';
import type {Speaker} from '../../types/characters';
import {popInOut, wobble} from '../../utils/animation';

export interface SpeakerBadgeProps {
  speaker: Speaker;
  /** Anchor point in px: the badge's tail tip sits here. */
  x: number;
  y: number;
  /** When set, the badge pops back out at the end of this many frames. */
  durationInFrames?: number;
  /** Show the speech-tail pointing down at the speaker. */
  tail?: boolean;
  rotation?: number;
  scale?: number;
}

/**
 * Bouncy pill tag ("[ROCKET]") that pops in with the house spring
 * (damping 12, stiffness 200). Frame 0 is the moment it enters, so mount it
 * inside a `<Sequence>` — or use `LineBadge`, which does that for you.
 */
export const SpeakerBadge: React.FC<SpeakerBadgeProps> = ({
  speaker,
  x,
  y,
  durationInFrames,
  tail = true,
  rotation = -4,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const style = SPEAKER_STYLES[speaker];
  const end = durationInFrames ?? Number.POSITIVE_INFINITY;
  const s = popInOut(frame, fps, 0, end, 7);
  if (s <= 0.001) {
    return null;
  }
  const rot = rotation + wobble(frame, 0.18, 1.6) + (1 - Math.min(1, s)) * -14;

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.min(1720, Math.max(200, x)),
        top: Math.min(1000, Math.max(120, y)),
        transform: `translate(-50%, -100%) scale(${s * scale}) rotate(${rot}deg)`,
        transformOrigin: '50% 100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '6px 28px 2px',
          borderRadius: 999,
          background: style.color,
          border: `5px solid ${PALETTE.ink}`,
          boxShadow: `0 0 0 8px ${PALETTE.white}, 9px 11px 0 8px ${PALETTE.ink}`,
          fontFamily: FONTS.display,
          fontSize: 50,
          letterSpacing: 3,
          lineHeight: 1.05,
          color: style.textColor,
          whiteSpace: 'nowrap',
        }}
      >
        {style.badge}
      </div>
      {tail ? (
        <div
          style={{
            width: 30,
            height: 30,
            marginTop: -20,
            background: style.color,
            border: `5px solid ${PALETTE.ink}`,
            boxShadow: `0 0 0 8px ${PALETTE.white}`,
            transform: 'rotate(45deg)',
            zIndex: 1,
          }}
        />
      ) : null}
    </div>
  );
};

export interface LineBadgeProps extends Omit<SpeakerBadgeProps, 'speaker' | 'durationInFrames'> {
  lineId: string;
}

/**
 * Speaker badge that lives exactly as long as a dialogue line. Must be
 * rendered inside the line's scene (it uses scene-local frame windows).
 */
export const LineBadge: React.FC<LineBadgeProps> = ({lineId, ...rest}) => {
  const line = getLine(lineId);
  const w = lineWindow(lineId);
  return (
    <Sequence from={w.from} durationInFrames={w.duration} layout="none" name={`Badge ${lineId}`}>
      <SpeakerBadge speaker={line.speaker} durationInFrames={w.duration} {...rest} />
    </Sequence>
  );
};
