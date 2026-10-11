import type {BabbleVoice, VoicePersona} from '../types/audio';
import type {Episode, VoiceSpec} from './types';

const signed = (n: number, unit: string) => `${n >= 0 ? '+' : ''}${Math.round(n)}${unit}`;

/** A babble voice in the right register (used live until a line is voiced). */
export const babbleVoice = (v: VoiceSpec | undefined): BabbleVoice => {
  const female = v?.voice[1] === 'f';
  return {pitch: (female ? 210 : 120) * 2 ** ((v?.semitones ?? 0) / 12), range: 5, vibrato: 0, formant: female ? 1.15 : 0.95, breath: 0.12};
};

/**
 * A full cast-sheet entry from an episode's Kokoro voice spec, with sensible
 * stand-ins for the other providers (so `npm run audio` can still fall back).
 */
export const personaFor = (speaker: string, v: VoiceSpec): VoicePersona => {
  const female = v.voice[1] === 'f';
  const british = v.voice[0] === 'b';
  const speed = v.speed ?? 1.05;
  const semitones = v.semitones ?? 0;
  return {
    speaker,
    direction: v.direction ?? '',
    elevenlabs: {
      voiceName: female ? 'Rachel' : 'George',
      voiceId: female ? '21m00Tcm4TlvDq8ikWAM' : 'JBFqnCBsd6RMkjVDRZzb',
      settings: {stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: Math.min(1.2, Math.max(0.7, speed))},
    },
    edge: {
      voice: british ? (female ? 'en-GB-SoniaNeural' : 'en-GB-RyanNeural') : female ? 'en-US-JennyNeural' : 'en-US-GuyNeural',
      rate: signed((speed - 1) * 100, '%'),
      pitch: signed(semitones * 6, 'Hz'),
    },
    kokoro: {voice: v.voice, lang: british ? 'en-gb' : 'en-us', speed, semitones, effects: v.effects},
    babble: babbleVoice(v),
  };
};

/** Cast sheet for every speaker in an episode, narrator included. */
export const episodeCast = (episode: Episode): Record<string, VoicePersona> => {
  const out: Record<string, VoicePersona> = {};
  if (episode.narrator) {
    out.NARRATOR = personaFor('NARRATOR', episode.narrator);
  }
  for (const [id, member] of Object.entries(episode.cast)) {
    out[id] = personaFor(id, member.voice);
  }
  return out;
};
