import React from 'react';
import {PALETTE} from '../../theme';
import {useSvgId} from '../../utils/useSvgId';

export interface StickerProps {
  /** Extra ink thickness added around the art's silhouette (px). */
  ink?: number;
  /** Width of the white sticker border outside the ink (px). */
  white?: number;
  /** Hairline of ink around the white border so it reads on light backgrounds. */
  outline?: number;
  /** Hard comic drop shadow offset (px). `false` to disable. */
  shadow?: {x: number; y: number; opacity: number} | false;
  /** Filter region bleed as a fraction of the element's box. */
  bleed?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Die-cut sticker border for any art: thickens the ink silhouette, wraps it
 * in a white border, then drops a hard offset shadow. Built from SVG
 * `feMorphology` so it follows the real outline of the art (CSS
 * `drop-shadow` has no spread radius).
 */
export const Sticker: React.FC<StickerProps> = ({
  ink = 3,
  white = 8,
  outline = 2.5,
  shadow = {x: 7, y: 9, opacity: 0.45},
  bleed = 0.25,
  style,
  children,
}) => {
  const id = useSvgId('sticker');
  const rInk = ink;
  const rWhite = ink + white;
  const rOutline = rWhite + outline;
  return (
    <>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <defs>
          <filter
            id={id}
            x={`${-bleed * 100}%`}
            y={`${-bleed * 100}%`}
            width={`${100 + bleed * 200}%`}
            height={`${100 + bleed * 200}%`}
            colorInterpolationFilters="sRGB"
          >
            <feMorphology in="SourceAlpha" operator="dilate" radius={rInk} result="inkMask" />
            <feFlood floodColor={PALETTE.ink} result="inkColor" />
            <feComposite in="inkColor" in2="inkMask" operator="in" result="inkRing" />
            <feMorphology in="SourceAlpha" operator="dilate" radius={rWhite} result="whiteMask" />
            <feFlood floodColor={PALETTE.white} result="whiteColor" />
            <feComposite in="whiteColor" in2="whiteMask" operator="in" result="whiteRing" />
            <feMorphology in="SourceAlpha" operator="dilate" radius={rOutline} result="outlineMask" />
            <feComposite in="inkColor" in2="outlineMask" operator="in" result="outlineRing" />
            {shadow ? (
              <>
                <feOffset in="outlineMask" dx={shadow.x} dy={shadow.y} result="shadowMask" />
                <feFlood floodColor={PALETTE.ink} floodOpacity={shadow.opacity} result="shadowColor" />
                <feComposite in="shadowColor" in2="shadowMask" operator="in" result="shadowShape" />
              </>
            ) : null}
            <feMerge>
              {shadow ? <feMergeNode in="shadowShape" /> : null}
              <feMergeNode in="outlineRing" />
              <feMergeNode in="whiteRing" />
              <feMergeNode in="inkRing" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div style={{filter: `url(#${id})`, ...style}}>{children}</div>
    </>
  );
};
