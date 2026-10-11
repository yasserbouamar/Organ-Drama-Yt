/**
 * Visual tokens for "Organ Drama". Every component pulls colours, ink weights
 * and fonts from here, so the whole pilot can be re-themed in one place.
 */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1680,
} as const;

/** The style guide's core palette. */
export const PALETTE = {
  midnight: '#1E1B4B',
  gutPink: '#BE185D',
  gutPinkDeep: '#9D174D',
  brainPink: '#F472B6',
  brainFold: '#DB2777',
  stomachOchre: '#FBBF24',
  stomachShade: '#D97706',
  acidGreen: '#84CC16',
  heartRed: '#EF4444',
  ink: '#1E1B4B',
  white: '#FFFFFF',
} as const;

/** Supporting tones derived from the palette (shading, props, scenery). */
export const TONES = {
  // Characters
  brainLight: '#F9A8D4',
  blush: '#EC4899',
  tieBlue: '#3B82F6',
  tieBlueDark: '#1D4ED8',
  stomachLight: '#FDE68A',
  mustache: '#92400E',
  capBlue: '#2563EB',
  capWhite: '#EFF6FF',
  valveGold: '#F59E0B',
  valveGoldLight: '#FDE68A',
  acidLight: '#BEF264',
  acidDark: '#4D7C0F',
  acidGlow: '#D9F99D',
  envelope: '#FFFFFF',
  envelopeShade: '#E5E7EB',
  waxRed: '#DC2626',
  waxDark: '#991B1B',
  legRed: '#EF4444',
  sneakerBlue: '#2563EB',
  heartLight: '#FCA5A5',
  heartDark: '#B91C1C',
  veinBlue: '#60A5FA',
  hatBlack: '#111827',
  flowerPink: '#F9A8D4',
  flowerCenter: '#FDE047',
  crust: '#D97706',
  crustLight: '#F59E0B',
  cheese: '#FCD34D',
  cheeseShade: '#FBBF24',
  pepperoni: '#DC2626',
  pepperoniDark: '#991B1B',
  shades: '#111827',
  glove: '#FFFFFF',
  tongue: '#FB7185',
  mouthDark: '#4C0519',
  tear: '#7DD3FC',
  bloodRed: '#DC2626',
  taxiYellow: '#FACC15',
  // Bedroom
  nightWall: '#272361',
  nightWallDark: '#1E1B4B',
  morningWall: '#FDE9C9',
  morningWallDark: '#F9C9A0',
  nightSky: '#0F1A4D',
  nightSkyLow: '#1E3A8A',
  morningSky: '#7DD3FC',
  morningSkyLow: '#FEF3C7',
  moon: '#FEF9C3',
  star: '#FDE68A',
  curtain: '#5B21B6',
  curtainMorning: '#F472B6',
  floorNight: '#2E2A6B',
  floorMorning: '#E8B98A',
  woodNight: '#3B3486',
  woodMorning: '#C98B5A',
  blanket: '#6366F1',
  blanketMorning: '#818CF8',
  pillow: '#E0E7FF',
  ledRed: '#FF4D6D',
  sun: '#FDE047',
  // Gut
  gutWall: '#DB2777',
  gutWallDark: '#831843',
  gutHighlight: '#F9A8D4',
  // UI
  gold: '#FACC15',
  sky: '#38BDF8',
  mint: '#34D399',
  violet: '#A78BFA',
  alarmRed: '#F43F5E',
} as const;

/** Ink line weights (in the drawing's own units, ~px at scale 1). */
export const INK = {
  bold: 6,
  medium: 4,
  fine: 2.5,
} as const;

export const FONTS = {
  /** Comic display face: title cards, sound effects, bubbles. */
  display: '"Bangers", "Impact", sans-serif',
  /** Heavy sans for kinetic subtitles and infographic readouts. */
  body: '"Montserrat", "Arial Black", sans-serif',
} as const;

/** Spring used for every pop-in (bubbles, title cards, badges). */
export const POP_SPRING = {damping: 12, stiffness: 200, mass: 1} as const;
