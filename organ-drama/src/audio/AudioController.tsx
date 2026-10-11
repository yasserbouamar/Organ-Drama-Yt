import React, {useMemo} from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {DIALOGUE, FPS, TOTAL_FRAMES} from '../data/scriptData';
import {VOICE_CAST} from '../data/voiceCast';
import type {AudioTrack} from '../types/audio';
import type {DialogueLine} from '../types/dialogue';
import {getLineTrack, type LipSync, PILOT_LIP_SYNC} from '../utils/lipSync';
import {firstPublicFile} from '../utils/staticFiles';
import {BGM_LOOP_SECONDS, synthesizeBgmLoop} from './proceduralMusic';
import {synthesizeBabble} from './proceduralVoice';
import {LIVE_SAMPLE_RATE, synthesizedDataUrl} from './ProceduralSFX';
import {SFXPlayer} from './SFXPlayer';

/** Music levels from the mix notes: tucked under dialogue, swelling in the gaps. */
export const BGM_LEVELS = {dialogue: 0.15, transition: 0.35} as const;

/** Silences shorter than this stay ducked, so the music doesn't pump between lines. */
const MIN_SWELL_FRAMES = 18;
/** Start ducking this many frames before a voice comes in. */
const LOOKAHEAD_FRAMES = 5;
const FADE_IN_FRAMES = 10;
const FADE_OUT_FRAMES = 30;

/** Put your own score at `public/audio/bgm/bgm.<ext>` to replace the procedural loop. */
const BGM_FILES = ['audio/bgm/bgm.mp3', 'audio/bgm/bgm.wav', 'audio/bgm/bgm.ogg'] as const;

export interface DuckOptions {
  dialogue: readonly DialogueLine[];
  /** Line → its audible length (for the pilot, the shared lip-sync tracks). */
  lineFrames: (line: DialogueLine) => number;
  totalFrames: number;
  levels?: {dialogue: number; transition: number};
  /** Frame ranges `[from, to]` where the music cuts out completely (a gag, a hard cut). */
  mutes?: readonly (readonly [number, number])[];
}

/**
 * The music gain for every frame: low while a voice is sounding, higher in
 * real gaps and transitions. Ducking is fast (and anticipates the next
 * line), swelling back up is slow. Mutes stop the music dead and let it
 * fade back in afterwards.
 */
export const buildDuckCurve = ({dialogue, lineFrames, totalFrames, levels = BGM_LEVELS, mutes = []}: DuckOptions): Float32Array => {
  const voiced = new Uint8Array(totalFrames);
  for (const line of dialogue) {
    const end = Math.min(line.endFrame, line.startFrame + lineFrames(line));
    for (let f = line.startFrame; f <= end && f < totalFrames; f++) {
      voiced[f] = 1;
    }
  }
  const target = new Float32Array(totalFrames).fill(levels.dialogue);
  let f = 0;
  while (f < totalFrames) {
    if (voiced[f]) {
      f++;
      continue;
    }
    let g = f;
    while (g < totalFrames && !voiced[g]) {
      g++;
    }
    if (g - f >= MIN_SWELL_FRAMES || g === totalFrames) {
      const until = g === totalFrames ? g : g - LOOKAHEAD_FRAMES;
      for (let i = f; i < until; i++) {
        target[i] = levels.transition;
      }
    }
    f = g;
  }
  const curve = new Float32Array(totalFrames);
  let level = target[0];
  for (let i = 0; i < totalFrames; i++) {
    const rate = target[i] < level ? 0.3 : 0.07;
    level += (target[i] - level) * rate;
    const fade = Math.min(1, i / FADE_IN_FRAMES, (totalFrames - 1 - i) / FADE_OUT_FRAMES);
    curve[i] = level * Math.max(0, fade);
  }
  for (const [from, to] of mutes) {
    for (let i = Math.max(0, from - 2); i < totalFrames; i++) {
      // Two-frame cut out, then a 20-frame fade back in after the mute.
      const k = i < from ? (from - i) / 3 : i <= to ? 0 : Math.min(1, (i - to) / 20);
      if (i > to + 20) {
        break;
      }
      curve[i] *= k;
    }
  }
  return curve;
};

let duckCurve: Float32Array | null = null;

export const bgmVolumeAt = (frame: number): number => {
  duckCurve ??= buildDuckCurve({dialogue: DIALOGUE, lineFrames: (line) => getLineTrack(line).durationInFrames, totalFrames: TOTAL_FRAMES});
  return duckCurve[Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)))];
};

/** The audio track for one line: its recorded clip, or the babble voice synthesized live. */
export const voiceTrackFor = (line: DialogueLine, sync: LipSync = PILOT_LIP_SYNC, totalFrames = TOTAL_FRAMES): AudioTrack => {
  const clip = sync.recordedClip(line);
  const track = sync.getLineTrack(line);
  const durationInFrames = Math.min(track.durationInFrames, totalFrames - line.startFrame);
  if (clip) {
    return {id: line.id, kind: 'vo', src: staticFile(clip.file), startFrame: line.startFrame, durationInFrames, volume: 1};
  }
  const seconds = track.durationInFrames / FPS;
  const src = synthesizedDataUrl(`vo-${line.id}`, LIVE_SAMPLE_RATE, () => {
    const voices = line.speakers.map((speaker) =>
      synthesizeBabble(track.syllables ?? [], seconds, VOICE_CAST[speaker].babble, line.delivery, /\?\W*$/.test(line.text), LIVE_SAMPLE_RATE, `${line.id}-${speaker}`),
    );
    const mixed = new Float32Array(voices[0].length);
    voices.forEach((v) => v.forEach((s, i) => (mixed[i] += s / Math.sqrt(voices.length))));
    return [mixed];
  });
  return {id: line.id, kind: 'vo', src, startFrame: line.startFrame, durationInFrames, volume: 0.9};
};

const VoiceLine: React.FC<{line: DialogueLine; gain: number; sync: LipSync; totalFrames: number}> = ({line, gain, sync, totalFrames}) => {
  const track = useMemo(() => voiceTrackFor(line, sync, totalFrames), [line, sync, totalFrames]);
  const base = typeof track.volume === 'number' ? track.volume : 1;
  return (
    <Sequence from={track.startFrame} durationInFrames={track.durationInFrames} layout="none" name={`VO ${line.speakers.join('+')}: ${line.id}`}>
      <Audio src={track.src} volume={base * gain} />
    </Sequence>
  );
};

export interface VoiceLinesProps {
  dialogue: readonly DialogueLine[];
  sync: LipSync;
  totalFrames: number;
  gain?: number;
}

/** Every line of a script on its start frame: recorded clips, or live babble where a clip is missing. */
export const VoiceLines: React.FC<VoiceLinesProps> = ({dialogue, sync, totalFrames, gain = 1}) => (
  <>
    {dialogue.map((line) => (
      <VoiceLine key={line.id} line={line} gain={gain} sync={sync} totalFrames={totalFrames} />
    ))}
  </>
);

export interface LoopedMusicProps {
  /** Files to try in `public/`, first match wins (your own score goes first). */
  files: readonly string[];
  /** Live fallback when no file exists: renders one loop (mono is fine). */
  synth: (sampleRate: number) => Float32Array[];
  cacheKey: string;
  loopSeconds: number;
  totalFrames: number;
  /** Gain per frame of the timeline (usually a ducking curve). */
  volumeAt: (frame: number) => number;
}

/** A music loop tiled across the timeline: a file from `public/` if present, else synthesized live. */
export const LoopedMusic: React.FC<LoopedMusicProps> = ({files, synth, cacheKey, loopSeconds, totalFrames, volumeAt}) => {
  const file = useMemo(() => firstPublicFile(files), [files]);
  if (file) {
    return <Audio src={staticFile(file)} loop loopVolumeCurveBehavior="extend" volume={(f) => volumeAt(f)} />;
  }
  return <SynthesizedLoop synth={synth} cacheKey={cacheKey} loopSeconds={loopSeconds} totalFrames={totalFrames} volumeAt={volumeAt} />;
};

const SynthesizedLoop: React.FC<Omit<LoopedMusicProps, 'files'>> = ({synth, cacheKey, loopSeconds, totalFrames, volumeAt}) => {
  const src = useMemo(() => synthesizedDataUrl(cacheKey, LIVE_SAMPLE_RATE, () => synth(LIVE_SAMPLE_RATE)), [cacheKey, synth]);
  const loopFrames = Math.round(loopSeconds * FPS);
  const loops = Math.ceil(totalFrames / loopFrames);
  return (
    <>
      {Array.from({length: loops}, (_, i) => {
        const from = i * loopFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.min(loopFrames, totalFrames - from)} layout="none" name={`Music loop ${i + 1}`}>
            <Audio src={src} volume={(f) => volumeAt(from + f)} />
          </Sequence>
        );
      })}
    </>
  );
};

/** The pilot's lighter in-browser fallback: the pizzicato loop in mono. */
const synthPilotLoop = (sr: number) => synthesizeBgmLoop(sr, false);

const Music: React.FC<{gain: number}> = ({gain}) => (
  <LoopedMusic
    files={BGM_FILES}
    synth={synthPilotLoop}
    cacheKey="bgm-loop"
    loopSeconds={BGM_LOOP_SECONDS}
    totalFrames={TOTAL_FRAMES}
    volumeAt={(f) => bgmVolumeAt(f) * gain}
  />
);

export interface AudioControllerProps {
  voiceVolume?: number;
  /** Multiplier on the ducking curve (1 = the 0.15 / 0.35 mix). */
  musicVolume?: number;
  sfxVolume?: number;
  music?: boolean;
}

/**
 * Everything you hear: voiceover clips sequenced on their script frames,
 * the ducked pizzicato score, and the sound effects. Any missing file falls
 * back to procedural audio, so the pilot always renders with sound.
 */
export const AudioController: React.FC<AudioControllerProps> = ({voiceVolume = 1, musicVolume = 1, sfxVolume = 1, music = true}) => (
  <>
    <VoiceLines dialogue={DIALOGUE} sync={PILOT_LIP_SYNC} totalFrames={TOTAL_FRAMES} gain={voiceVolume} />
    {music ? <Music gain={musicVolume} /> : null}
    <SFXPlayer volume={sfxVolume} />
  </>
);
