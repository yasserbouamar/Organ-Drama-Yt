import React, {useMemo} from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SFX_CUES} from '../data/scriptData';
import type {SFXTrigger} from '../types/audio';
import {firstPublicFile} from '../utils/staticFiles';
import {sfxDataUrl} from './ProceduralSFX';

/** Cues are mounted this many frames early so the Studio has the media ready. */
const PRELOAD_FRAMES = 60;

/** Drop a real recording at `public/audio/sfx/<id>.<ext>` to replace a synthesized effect. */
const EXTENSIONS = ['mp3', 'wav', 'ogg'] as const;

export interface ResolvedSfx {
  src: string;
  source: 'file' | 'procedural';
}

/** A file from `public/audio/sfx/` if one exists, else the procedural recipe rendered live. */
export const resolveSfx = (cue: SFXTrigger, fps: number): ResolvedSfx => {
  const file = firstPublicFile(EXTENSIONS.map((ext) => `audio/sfx/${cue.id}.${ext}`));
  if (file) {
    return {src: staticFile(file), source: 'file'};
  }
  return {src: sfxDataUrl(cue.id, cue.durationInFrames / fps), source: 'procedural'};
};

const SfxCue: React.FC<{cue: SFXTrigger; gain: number}> = ({cue, gain}) => {
  const {fps} = useVideoConfig();
  const {src} = useMemo(() => resolveSfx(cue, fps), [cue, fps]);
  return <Audio src={src} volume={cue.volume * gain} />;
};

export interface SFXPlayerProps {
  /** Master gain for every effect. */
  volume?: number;
  cues?: readonly SFXTrigger[];
}

/**
 * Fires the script's sound effects. It reads `useCurrentFrame()` and only
 * mounts cues that are playing or about to, each in a `<Sequence>` starting
 * on its cue frame, so the timeline never juggles more audio than it needs.
 */
export const SFXPlayer: React.FC<SFXPlayerProps> = ({volume = 1, cues = SFX_CUES}) => {
  const frame = useCurrentFrame();
  const live = cues.filter((cue) => frame >= cue.frame - PRELOAD_FRAMES && frame < cue.frame + cue.durationInFrames);
  return (
    <>
      {live.map((cue) => (
        <Sequence
          key={`${cue.id}-${cue.frame}`}
          from={cue.frame}
          durationInFrames={cue.durationInFrames}
          layout="none"
          name={`SFX ${cue.id} @${cue.frame}`}
        >
          <SfxCue cue={cue} gain={volume} />
        </Sequence>
      ))}
    </>
  );
};
