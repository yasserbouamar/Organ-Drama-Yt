import type {Speaker} from '../types/characters';
import {PALETTE, TONES} from '../theme';

export interface SpeakerStyle {
  /** Text shown in the badge, e.g. "[LIL SAT]". */
  badge: string;
  /** Badge fill. */
  color: string;
  /** Badge text colour (chosen for contrast against `color`). */
  textColor: string;
  /** Colour for emphasised caption words while this speaker talks. */
  accent: string;
}

export const SPEAKER_STYLES: Record<Speaker, SpeakerStyle> = {
  HOST: {
    badge: '[HOST]',
    color: PALETTE.electricCyan,
    textColor: PALETTE.ink,
    accent: PALETTE.electricCyan,
  },
  ROCKET: {
    badge: '[ROCKET]',
    color: PALETTE.vividMagenta,
    textColor: PALETTE.white,
    accent: '#FF5FA8',
  },
  LIL_SAT: {
    badge: '[LIL SAT]',
    color: PALETTE.hazardYellow,
    textColor: PALETTE.ink,
    accent: PALETTE.hazardYellow,
  },
  SUN: {
    badge: '[SUN]',
    color: PALETTE.solarOrange,
    textColor: PALETTE.white,
    accent: PALETTE.solarOrange,
  },
  GRAVITY: {
    badge: '[GRAVITY]',
    color: TONES.gravityPurple,
    textColor: PALETTE.white,
    accent: '#B98CFF',
  },
};
