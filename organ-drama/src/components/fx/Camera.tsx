import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';

export interface CameraProps {
  /** World point (px in the 1920×1080 layout) to centre on screen. */
  x: number;
  y: number;
  zoom: number;
  /** Degrees. */
  rotation?: number;
  /** Screen-space offset added on top (e.g. from `shake()`). */
  offset?: {x: number; y: number; r?: number};
  children: React.ReactNode;
}

/**
 * A 2D camera over a 1920×1080 "world". Children are laid out in world
 * coordinates; the camera pans, zooms and rotates them as one.
 */
export const Camera: React.FC<CameraProps> = ({x, y, zoom, rotation = 0, offset, children}) => {
  const {width, height} = useVideoConfig();
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  const or = offset?.r ?? 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: '0 0',
          transform: `translate(${width / 2 + ox}px, ${height / 2 + oy}px) rotate(${rotation + or}deg) scale(${zoom}) translate(${-x}px, ${-y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
