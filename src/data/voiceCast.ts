import type {Speaker} from '../types/characters';
import type {VoicePersona} from '../types/dialogue';

/**
 * ElevenLabs casting. The IDs are ElevenLabs' public library voices; if your
 * account doesn't have one, set ELEVENLABS_VOICE_<SPEAKER> (e.g.
 * ELEVENLABS_VOICE_LIL_SAT) to any voice ID you own.
 */
export const VOICE_CAST: Record<Speaker, VoicePersona> = {
  HOST: {
    speaker: 'HOST',
    voiceName: 'George',
    alternateVoiceName: 'Adam',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    direction: 'Clear, enthusiastic, mid-tempo explainer.',
    settings: {stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 1.08},
  },
  ROCKET: {
    speaker: 'ROCKET',
    voiceName: 'Callum',
    alternateVoiceName: 'Fin',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    direction: 'High-energy, brash, fast-talking, slightly impatient.',
    settings: {stability: 0.3, similarity_boost: 0.75, style: 0.6, speed: 1.15},
  },
  LIL_SAT: {
    speaker: 'LIL_SAT',
    voiceName: 'Freya',
    alternateVoiceName: 'Gigi',
    voiceId: 'jsCqWAovK2LkecY7zXl4',
    direction: 'High-pitched, cute, curious, innocent.',
    settings: {stability: 0.35, similarity_boost: 0.75, style: 0.55, speed: 1.1},
  },
  SUN: {
    speaker: 'SUN',
    voiceName: 'Bill',
    alternateVoiceName: 'Marcus',
    voiceId: 'pqHfZKP75CvOlQylNhV4',
    direction: 'Gruff, monotone, annoyed landlord baritone.',
    settings: {stability: 0.7, similarity_boost: 0.8, style: 0.15, speed: 0.95},
  },
  GRAVITY: {
    speaker: 'GRAVITY',
    voiceName: 'Antoni',
    alternateVoiceName: 'Adam',
    voiceId: 'ErXwobaYiR22dJMGI6xS',
    direction: 'Deep, smooth, calm cosmic bass.',
    settings: {stability: 0.75, similarity_boost: 0.8, style: 0.2, speed: 0.9},
  },
};
