import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, PALETTE} from '../../theme';
import {settle, tween} from '../../utils/animation';

export interface ChapterTagProps {
  label: string;
  title: string;
  /** Frames the tag stays on screen. */
  durationInFrames?: number;
}

/** Top-left chapter sticker ("PART 2 · THE 10% HEAT LIMIT") that slides in at the start of a scene. */
export const ChapterTag: React.FC<ChapterTagProps> = ({label, title, durationInFrames = 75}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame >= durationInFrames) {
    return null;
  }
  const enter = settle(frame, fps, 4, 14);
  const exit = tween(frame, [durationInFrames - 10, durationInFrames], [0, 1]);
  const x = -520 + 580 * enter - 600 * exit;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 48,
        display: 'flex',
        alignItems: 'stretch',
        transform: 'rotate(-2deg)',
        zIndex: 60,
        border: `5px solid ${PALETTE.ink}`,
        boxShadow: `0 0 0 7px ${PALETTE.white}, 8px 10px 0 7px ${PALETTE.ink}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: PALETTE.vividMagenta,
          color: PALETTE.white,
          fontFamily: FONTS.display,
          fontSize: 34,
          letterSpacing: 2,
          padding: '6px 16px 2px',
          borderRight: `5px solid ${PALETTE.ink}`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: PALETTE.white,
          color: PALETTE.ink,
          fontFamily: FONTS.body,
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: 1,
          padding: '10px 18px 6px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
    </div>
  );
};
