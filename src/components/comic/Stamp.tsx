import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {FONTS, TONES} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export interface StampProps {
  text: string;
  subtext?: string;
  x: number;
  y: number;
  /** Frame (parent timeline) the stamp starts falling; it lands 6 frames later. */
  start: number;
  width?: number;
  rotation?: number;
  color?: string;
}

/** Frames between `start` and the stamp hitting the page. */
export const STAMP_LAND_FRAMES = 6;

/** Rubber "warning" stamp that slams down from above the page, with ink grunge. */
export const Stamp: React.FC<StampProps> = ({
  text,
  subtext,
  x,
  y,
  start,
  width = 560,
  rotation = -12,
  color = TONES.stampRed,
}) => {
  const frame = useCurrentFrame();
  const maskId = useSvgId('stamp-grunge');
  if (frame < start) {
    return null;
  }
  const t = frame - start;
  const scale =
    t < STAMP_LAND_FRAMES
      ? interpolate(t, [0, STAMP_LAND_FRAMES], [2.8, 1], {easing: Easing.in(Easing.quad)})
      : 1 + Math.sin((t - STAMP_LAND_FRAMES) * 0.9) * 0.04 * Math.exp(-(t - STAMP_LAND_FRAMES) * 0.25);
  const opacity = interpolate(t, [0, 3], [0, 0.94], {extrapolateRight: 'clamp'});
  const height = subtext ? width * 0.36 : width * 0.27;
  const fs = width * 0.15;

  const holes = Array.from({length: 70}, (_, i) => (
    <circle
      key={i}
      cx={random(`${text}-hx-${i}`) * width}
      cy={random(`${text}-hy-${i}`) * height}
      r={1 + random(`${text}-hr-${i}`) * 5}
      fill="#000"
    />
  ));

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        zIndex: 45,
        pointerEvents: 'none',
      }}
    >
      <svg width={width} height={height} overflow="visible">
        <defs>
          <mask id={maskId}>
            <rect width={width} height={height} fill="#fff" />
            {holes}
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <rect x={6} y={6} width={width - 12} height={height - 12} rx={18} fill="rgba(255,255,255,0.88)" stroke={color} strokeWidth={12} />
          <rect x={22} y={22} width={width - 44} height={height - 44} rx={8} fill="none" stroke={color} strokeWidth={4} />
          <text
            x={width / 2}
            y={subtext ? height * 0.52 : height / 2 + fs * 0.36}
            textAnchor="middle"
            fontFamily={FONTS.display}
            fontSize={fs}
            letterSpacing={4}
            fill={color}
          >
            {text}
          </text>
          {subtext ? (
            <text
              x={width / 2}
              y={height * 0.78}
              textAnchor="middle"
              fontFamily={FONTS.body}
              fontWeight={900}
              fontSize={fs * 0.32}
              letterSpacing={3}
              fill={color}
            >
              {subtext}
            </text>
          ) : null}
        </g>
      </svg>
    </div>
  );
};
