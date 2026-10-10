import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export interface HalftoneAccent {
  color: string;
  /** Distance between dot centres in px. */
  spacing: number;
  radius: number;
  opacity: number;
  /** Where the coarse dots fade out (0..1 of the frame). Dots grow toward the edges. */
  focus?: {x: number; y: number};
}

export interface HalftoneBackgroundProps {
  /** Any CSS background (colour or gradient) painted under the dots. */
  background?: string;
  dotColor?: string;
  /** Dot pitch of the fine Ben-Day layer (px). */
  spacing?: number;
  dotRadius?: number;
  opacity?: number;
  /** A coarse halftone layer that fades in toward the edges for a printed-comic vignette. */
  accent?: HalftoneAccent | false;
  /** Pattern drift in px per frame. */
  drift?: {x: number; y: number};
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Flat comic background with an SVG Ben-Day dot matrix laid over it
 * (4px pitch at 25% opacity by default) plus an optional coarse halftone
 * vignette.
 */
export const HalftoneBackground: React.FC<HalftoneBackgroundProps> = ({
  background = `radial-gradient(circle at 50% 45%, #251E57 0%, ${PALETTE.comicNavy} 70%)`,
  dotColor = PALETTE.ink,
  spacing = 4,
  dotRadius,
  opacity = 0.25,
  accent = false,
  drift = {x: 0, y: 0},
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const fineId = useSvgId('halftone-fine');
  const coarseId = useSvgId('halftone-coarse');
  const maskId = useSvgId('halftone-mask');
  const gradId = useSvgId('halftone-grad');
  const r = dotRadius ?? spacing * 0.32;
  const dx = (drift.x * frame) % spacing;
  const dy = (drift.y * frame) % spacing;

  return (
    <AbsoluteFill style={{background, ...style}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern
            id={fineId}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${dx} ${dy})`}
          >
            <circle cx={spacing / 2} cy={spacing / 2} r={r} fill={dotColor} />
          </pattern>
          {accent ? (
            <>
              <pattern
                id={coarseId}
                width={accent.spacing}
                height={accent.spacing}
                patternUnits="userSpaceOnUse"
                patternTransform={`rotate(45) translate(${(drift.x * frame) % accent.spacing} 0)`}
              >
                <circle cx={accent.spacing / 2} cy={accent.spacing / 2} r={accent.radius} fill={accent.color} />
              </pattern>
              <radialGradient
                id={gradId}
                cx={accent.focus?.x ?? 0.5}
                cy={accent.focus?.y ?? 0.45}
                r={0.75}
              >
                <stop offset="0.35" stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </radialGradient>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill={`url(#${gradId})`} />
              </mask>
            </>
          ) : null}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${fineId})`} opacity={opacity} />
        {accent ? (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${coarseId})`}
            opacity={accent.opacity}
            mask={`url(#${maskId})`}
          />
        ) : null}
      </svg>
      {children}
    </AbsoluteFill>
  );
};
