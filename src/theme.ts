/**
 * Visual tokens for the comic-pop look. Every component pulls colours, ink
 * weights and fonts from here so the whole pilot can be re-themed in one place.
 */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1800,
} as const;

/** Core palette from the style guide. */
export const PALETTE = {
  hazardYellow: '#FFE600',
  electricCyan: '#00F0FF',
  vividMagenta: '#FF007A',
  comicNavy: '#0F0C20',
  solarOrange: '#FF5500',
  white: '#FFFFFF',
  ink: '#111118',
} as const;

/** Supporting tones derived from the core palette (shading, props, scenery). */
export const TONES = {
  navyLight: '#1D1840',
  navyMid: '#2A2360',
  rocketRed: '#FF2B45',
  rocketRedDark: '#C3102A',
  hullCream: '#F7F3E8',
  hullShade: '#D9D2C0',
  steel: '#9AA6B8',
  steelDark: '#5D6778',
  yellowShade: '#E0B400',
  orangeShade: '#D13F00',
  sunCore: '#FFF27A',
  gravityPurple: '#7B2CFF',
  gravityDeep: '#3E0F99',
  gravityGlow: '#C9FF3D',
  oceanBlue: '#1F7BFF',
  oceanDeep: '#0D4FC2',
  landGreen: '#2BD66B',
  landShade: '#139447',
  desertTan: '#D9A15B',
  desertShade: '#A86A2E',
  shieldGreen: '#39FF88',
  windYellow: '#FFE600',
  crust: '#8A5A3C',
  crustDark: '#5E3A24',
  mantle: '#E0482A',
  mantleDark: '#9C2416',
  outerCore: '#FF9A1F',
  innerCore: '#FFF4D6',
  wood: '#C9803E',
  woodDark: '#8C4F1D',
  stampRed: '#E8112D',
} as const;

/** Ink line weights (in the drawing's own units, ~px at scale 1). */
export const INK = {
  bold: 6,
  medium: 4,
  fine: 2.5,
} as const;

export const FONTS = {
  /** Comic display face: badges, stamps, sound effects, titles. */
  display: '"Bangers", "Impact", sans-serif',
  /** Heavy sans for kinetic subtitles and infographic readouts. */
  body: '"Montserrat", "Arial Black", sans-serif',
} as const;

/** Spring used for every pop-in (badges, stamps, stickers). */
export const POP_SPRING = {damping: 12, stiffness: 200, mass: 1} as const;
