import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, PALETTE, TONES} from '../../theme';
import {pop, tween} from '../../utils/animation';
import {Camera} from '../fx/Camera';

export interface InsetPanelProps {
  /** Top-left corner on screen (px) and width; height follows 16:9. */
  x: number;
  y: number;
  width: number;
  /** Caption box text ("MEANWHILE, UPSTAIRS…"). */
  label?: string;
  /** Frames (parent timeline) the panel pops in and out. */
  enter: number;
  exit: number;
  /** What the panel's camera frames inside its own 1920×1080 world. */
  camera: {x: number; y: number; zoom: number};
  rotation?: number;
  children: React.ReactNode;
}

/** A comic cut-away panel: a second 1920×1080 world, framed by its own camera, popped over the scene. */
export const InsetPanel: React.FC<InsetPanelProps> = ({x, y, width, label, enter, exit, camera, rotation = -2, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < enter || frame >= exit) {
    return null;
  }
  const s = Math.min(pop(frame, fps, enter, {damping: 13, stiffness: 190}), tween(frame, [exit - 8, exit], [1, 0]));
  const height = (width * 9) / 16;
  const k = width / 1920;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: `scale(${s}) rotate(${rotation}deg)`,
        transformOrigin: '0% 0%',
        zIndex: 30,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: 18,
          border: `8px solid ${PALETTE.ink}`,
          boxShadow: `0 0 0 9px ${PALETTE.white}, 12px 14px 0 9px ${PALETTE.ink}`,
          background: PALETTE.midnight,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: '0 0'}}>
          <Camera x={camera.x} y={camera.y} zoom={camera.zoom}>
            {children}
          </Camera>
        </div>
      </div>
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: -14,
            top: -24,
            background: TONES.gold,
            border: `5px solid ${PALETTE.ink}`,
            padding: '4px 16px 0',
            fontFamily: FONTS.display,
            fontSize: 34,
            letterSpacing: 2,
            color: PALETTE.ink,
            transform: 'rotate(-3deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
