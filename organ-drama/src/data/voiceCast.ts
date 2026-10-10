import type {VoicePersona} from '../types/audio';
import type {SpeakerId} from '../types/dialogue';

/**
 * Who voices whom, for every provider `scripts/generate-audio.ts` can use.
 * ElevenLabs voice IDs are premade library voices; override any of them with
 * `ELEVENLABS_VOICE_<SPEAKER>` (see `.env.example`). The `babble` voice is
 * the procedural fallback, also synthesized live in the browser when a clip
 * is missing.
 */
export const VOICE_CAST: Record<SpeakerId, VoicePersona> = {
  NARRATOR: {
    speaker: 'NARRATOR',
    direction: 'Neutral, warm explainer. Clear and brisk, a smile in the voice.',
    elevenlabs: {
      voiceName: 'George',
      voiceId: 'JBFqnCBsd6RMkjVDRZzb',
      settings: {stability: 0.55, similarity_boost: 0.8, style: 0.2, speed: 1.1},
    },
    edge: {voice: 'en-US-AndrewNeural', rate: '+10%', pitch: '+0Hz'},
    kokoro: {voice: 'af_heart', lang: 'en-us', speed: 1.12, semitones: 0},
    babble: {pitch: 170, range: 4, vibrato: 0, formant: 1, breath: 0.15},
  },
  BRAIN: {
    speaker: 'BRAIN',
    direction: 'Energetic schemer: fast, bright, a little too pleased with itself.',
    elevenlabs: {
      voiceName: 'Jeremy',
      voiceId: 'bVMeCyTHy58xNoL34h3p',
      settings: {stability: 0.3, similarity_boost: 0.75, style: 0.6, speed: 1.15},
    },
    edge: {voice: 'en-US-GuyNeural', rate: '+14%', pitch: '+25Hz'},
    kokoro: {voice: 'am_puck', lang: 'en-us', speed: 1.15, semitones: 3, effects: 'treble=g=2'},
    babble: {pitch: 235, range: 7, vibrato: 0, formant: 1.12, breath: 0.1},
  },
  STOMACH: {
    speaker: 'STOMACH',
    direction: 'Deep, drowsy grump with a mustache. Slow until it panics.',
    elevenlabs: {
      voiceName: 'Clyde',
      voiceId: '2EiwWnXFnvU5JabPnv8n',
      settings: {stability: 0.55, similarity_boost: 0.8, style: 0.35, speed: 0.95},
    },
    edge: {voice: 'en-GB-RyanNeural', rate: '-2%', pitch: '-18Hz'},
    kokoro: {voice: 'am_onyx', lang: 'en-us', speed: 1.0, semitones: -2.5, effects: 'bass=g=4'},
    babble: {pitch: 92, range: 3, vibrato: 0, formant: 0.82, breath: 0.25},
  },
  LETTER: {
    speaker: 'LETTER',
    direction: 'High-pitched, cute and breathless: a tiny courier on a mission.',
    elevenlabs: {
      voiceName: 'Gigi',
      voiceId: 'jBpfuIE2acCO8z3wKNLl',
      settings: {stability: 0.35, similarity_boost: 0.75, style: 0.5, speed: 1.15},
    },
    edge: {voice: 'en-US-AnaNeural', rate: '+12%', pitch: '+12Hz'},
    kokoro: {voice: 'af_sky', lang: 'en-us', speed: 1.15, semitones: 4},
    babble: {pitch: 400, range: 6, vibrato: 0, formant: 1.3, breath: 0.12},
  },
  HEART: {
    speaker: 'HEART',
    direction: 'Theatrical diva in a top hat: big, wobbly, outraged.',
    elevenlabs: {
      voiceName: 'Callum',
      voiceId: 'N2lVS1w4EtoT3dr4eOWO',
      settings: {stability: 0.3, similarity_boost: 0.75, style: 0.7, speed: 1.05},
    },
    edge: {voice: 'en-GB-ThomasNeural', rate: '+6%', pitch: '+6Hz'},
    kokoro: {voice: 'bm_fable', lang: 'en-gb', speed: 1.08, semitones: 1, effects: 'vibrato=f=5.5:d=0.1'},
    babble: {pitch: 180, range: 6, vibrato: 0.6, formant: 1.05, breath: 0.1},
  },
  PIZZA: {
    speaker: 'PIZZA',
    direction: 'Laid-back cool guy in sunglasses.',
    elevenlabs: {
      voiceName: 'Charlie',
      voiceId: 'IKne3meq5aSn9XLyUdCD',
      settings: {stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 1.0},
    },
    edge: {voice: 'en-US-BrianNeural', rate: '+0%', pitch: '-6Hz'},
    kokoro: {voice: 'am_liam', lang: 'en-us', speed: 1.0, semitones: -1},
    babble: {pitch: 120, range: 4, vibrato: 0, formant: 0.95, breath: 0.2},
  },
};
